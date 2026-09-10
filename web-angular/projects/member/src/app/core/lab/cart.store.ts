import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AppError, appError, isAppError } from '../http/app-error';
import { SessionStore } from '../session/session.store';
import {
  Cart,
  CartDto,
  CartVendor,
  CartVendorDto,
  PlaceOrderInput,
  Slot,
  SlotDto,
  toCart,
  toCartVendor,
  toSlot,
} from './cart';
import {
  OrderValidation,
  OrderValidationDto,
  ValidateOrderInput,
  toOrderValidation,
} from '../domain/cover-check';
import { LabEnvelopeDto } from './lab.dto';
import { LAB_API } from './lab.mapper';
import { LabKind } from './lab.model';

/**
 * One cart and the vendors quoting for it — screens 2 and 3 of the lab
 * journey. Vendors load alongside the cart because the cart screen shows the
 * cheapest quote as a preview.
 */
@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionStore);

  /** Carts the member started but has not ordered yet. */
  private static readonly OPEN = new Set(['ACTIVE', 'CREATED']);

  private readonly _cart = signal<Cart | null>(null);
  private readonly _openCount = signal(0);
  private readonly _vendors = signal<readonly CartVendor[]>([]);
  /**
   * The vendor request failed, as distinct from succeeding with no vendors.
   * Without this the two collapse and the screen tells the member no lab has
   * quoted, which names a cause that did not happen.
   */
  private readonly _vendorsFailed = signal(false);
  private readonly _loading = signal(false);
  private readonly _error = signal<AppError | null>(null);
  private readonly _placing = signal(false);
  private readonly _validating = signal(false);
  private readonly _orderError = signal<string | null>(null);

  private loadedId: string | null = null;
  private inFlight: Promise<void> | null = null;

  readonly cart = this._cart.asReadonly();
  /** Both journeys' open carts, for the home header's cart badge. */
  readonly openCount = this._openCount.asReadonly();
  readonly vendors = this._vendors.asReadonly();
  readonly vendorsFailed = this._vendorsFailed.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly placing = this._placing.asReadonly();
  readonly validating = this._validating.asReadonly();
  readonly orderError = this._orderError.asReadonly();

  /** Cheapest payable total, for the "from ₹X" line on the cart screen. */
  readonly cheapest = computed(() => {
    const vendors = this._vendors();
    if (!vendors.length) return null;
    return vendors.reduce((best, vendor) =>
      vendor.payableTotal.amount < best.payableTotal.amount ? vendor : best,
    );
  });

  // DUMMY / STATIC — the cart badge no longer polls `carts`; it stays at 0.
  // (Lab/diagnostic carts are handled by the static diagnostics journey.)
  async refreshBadge(): Promise<void> {
    this._openCount.set(0);
  }

  /** `cartId` is the business id (CART-…), taken straight from the route. */
  select(cartId: string, kind: LabKind = LabKind.Lab): void {
    if (!cartId || cartId === this.loadedId) return;
    this.loadedId = cartId;
    this.inFlight ??= this.load(cartId, kind).finally(() => {
      this.inFlight = null;
    });
  }

  retry(kind: LabKind = LabKind.Lab): void {
    if (!this.loadedId) return;
    const cartId = this.loadedId;
    this.loadedId = null;
    this.select(cartId, kind);
  }

  /** Matches on either id, since the route carries the business VENDOR-… id. */
  vendorById(vendorId: string): CartVendor | undefined {
    return this._vendors().find(
      (vendor) => vendor.vendorId === vendorId || vendor.id === vendorId,
    );
  }

  /**
   * Slots for a vendor on a given day. Empty on failure — never throws.
   *
   * `pincode` is required: without it the API returns an empty list rather than
   * an error, so every day reads as fully booked. It comes from the cart, which
   * is where sample collection is routed from.
   */
  async slots(vendorId: string, date: string, kind: LabKind = LabKind.Lab): Promise<readonly Slot[]> {
    const pincode = this._cart()?.pincode ?? '';
    try {
      const response = await firstValueFrom(
        this.http.get<LabEnvelopeDto<SlotDto[]>>(LAB_API[kind].vendorSlots(vendorId), {
          params: pincode ? { pincode, date } : { date },
        }),
      );
      if (response.success === false) return [];
      return (response.data ?? []).map(toSlot);
    } catch {
      return [];
    }
  }

  /**
   * Dry run before confirming, as web-member does. Returns what the wallet
   * covers and what the member owes, or null if the check itself failed —
   * which is not the same as the order being invalid, so the caller shows the
   * fallback copy rather than blocking on a network hiccup.
   */
  async validate(
    input: ValidateOrderInput,
    kind: LabKind = LabKind.Lab,
  ): Promise<OrderValidation | null> {
    this._validating.set(true);
    try {
      // This route answers at the top level, not inside `{ success, data }`.
      const response = await firstValueFrom(
        this.http.post<OrderValidationDto>(LAB_API[kind].validateOrder, input),
      );
      return response ? toOrderValidation(response) : null;
    } catch {
      return null;
    } finally {
      this._validating.set(false);
    }
  }

  /**
   * Places the order. Returns the new orderId, or null with `orderError` set.
   */
  async placeOrder(input: PlaceOrderInput, kind: LabKind = LabKind.Lab): Promise<string | null> {
    this._placing.set(true);
    this._orderError.set(null);
    try {
      const response = await firstValueFrom(
        this.http.post<LabEnvelopeDto<{ orderId?: string }>>(LAB_API[kind].placeOrder, input),
      );
      if (response.success === false) throw appError('server', response.error);
      return response.data?.orderId ?? '';
    } catch (error: unknown) {
      this._orderError.set(
        isAppError(error) ? error.message : 'We could not place that order. Please try again.',
      );
      return null;
    } finally {
      this._placing.set(false);
    }
  }

  private async load(cartId: string, kind: LabKind): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    this._vendorsFailed.set(false);
    const api = LAB_API[kind];

    try {
      const [cart, vendors] = await Promise.all([
        firstValueFrom(this.http.get<LabEnvelopeDto<CartDto>>(api.cartById(cartId))),
        // A cart with no vendors quoting is still a viewable cart, so a
        // vendor failure must not blank the screen. It must still be reported:
        // degrading silently let the screen assert that no lab had quoted.
        firstValueFrom(
          this.http.get<LabEnvelopeDto<CartVendorDto[]>>(api.cartVendors(cartId)),
        ).catch(() => null),
      ]);
      if (this.loadedId !== cartId) return;

      if (cart.success === false || !cart.data) throw appError('notFound');
      this._cart.set(toCart(cart.data));
      // `null` is the caught rejection above; a successful response with no rows
      // is a genuine empty. An envelope with `success: false` is also a failure.
      this._vendorsFailed.set(vendors === null || vendors.success === false);
      this._vendors.set((vendors?.data ?? []).map(toCartVendor));
    } catch (error: unknown) {
      if (this.loadedId !== cartId) return;
      this._cart.set(null);
      this._vendors.set([]);
      this._error.set(isAppError(error) ? error : appError('server'));
    } finally {
      if (this.loadedId === cartId) this._loading.set(false);
    }
  }

  private reset(): void {
    this.loadedId = null;
    this.inFlight = null;
    this._cart.set(null);
    this._openCount.set(0);
    this._vendors.set([]);
    this._vendorsFailed.set(false);
    this._error.set(null);
  }
}
