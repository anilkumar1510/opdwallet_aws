import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Money, money } from '../domain/money';
import { SessionStore } from '../session/session.store';
import { PAYMENTS_API } from '../transactions/transaction.mapper';
import { AHC_API, AhcEnvelopeDto } from './ahc';

/** The slice of the created order this journey needs back. */
interface PlacedAhcOrderDto {
  orderId?: string;
  packageName?: string;
  copayAmount?: number;
  finalPayable?: number;
}

/** Just enough of GET member/ahc/orders to tell which legs exist. */
interface AhcOrderSummaryDto {
  orderId?: string;
  status?: string;
  labOrder?: { vendorId?: unknown };
  diagnosticOrder?: { vendorId?: unknown };
}

export interface PlacedAhcOrder {
  readonly orderId: string;
  /** What the member still owes after the wallet, 0 when nothing is left. */
  readonly owed: number;
  readonly packageName: string;
}

/**
 * The in-progress AHC booking: lab leg, then diagnostic leg, then payment.
 *
 * web-member carries this across three screens in sessionStorage. A
 * root-provided store is the Angular equivalent and survives navigation the
 * same way, without serialising through storage.
 */
export interface AhcVendorDto {
  _id?: string;
  vendorId?: string;
  name?: string;
  code?: string;
  homeCollection?: boolean;
  centerVisit?: boolean;
  price?: number;
  totalPrice?: number;
}

export interface AhcVendor {
  readonly id: string;
  readonly name: string;
  readonly offersHomeCollection: boolean;
  readonly offersCenterVisit: boolean;
  readonly price: Money;
}

/** What POST member/ahc/orders requires beyond the two legs. */
export interface PlaceAhcOrderInput {
  readonly packageId: string;
  /**
   * Nested, not top level. `CreateAhcOrderDto` requires **only** `packageId`;
   * the member and address fields belong to `CollectionAddressDto` under
   * `labCollectionAddress`. Sending them flat is rejected with
   * "property fullName should not exist" — the API whitelists.
   */
  readonly collectionAddress: {
    readonly fullName: string;
    readonly phone: string;
    readonly addressLine1: string;
    readonly pincode: string;
    readonly city: string;
    readonly state: string;
  };
}

/**
 * The three entry options of the sheet's AHC flow (Patient Flows, section 8).
 *
 * ROUTE A books the two legs separately, pathology first; ROUTE B books both
 * in one journey. Picking one closes the others.
 */
export type AhcRoute = 'PATHOLOGY' | 'RADIOLOGY' | 'PACKAGE';

/** Which legs of this policy year's AHC order already exist. */
export interface AhcBookedLegs {
  readonly pathology: boolean;
  readonly radiology: boolean;
  readonly orderId: string | null;
}

export interface AhcLeg {
  readonly vendorId: string;
  readonly vendorName: string;
  readonly slotId: string;
  readonly date: string;
  readonly time: string;
  readonly collectionType?: string;
  /** Centre visited for this leg, when the member picked one. */
  readonly centreName?: string;
  readonly price: Money;
}

function toVendor(dto: AhcVendorDto): AhcVendor {
  return {
    id: dto.vendorId ?? dto._id ?? '',
    name: dto.name?.trim() || 'Vendor',
    offersHomeCollection: dto.homeCollection === true,
    offersCenterVisit: dto.centerVisit === true,
    price: money(dto.totalPrice ?? dto.price),
  };
}

@Injectable({ providedIn: 'root' })
export class AhcBookingStore {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionStore);

  private readonly _vendors = signal<readonly AhcVendor[]>([]);
  private readonly _loading = signal(false);
  private readonly _placing = signal(false);
  private readonly _placeError = signal<string | null>(null);
  private readonly _lab = signal<AhcLeg | null>(null);
  private readonly _diagnostic = signal<AhcLeg | null>(null);
  private readonly _route = signal<AhcRoute | null>(null);
  private readonly _addressId = signal('');
  private readonly _booked = signal<AhcBookedLegs>({
    pathology: false,
    radiology: false,
    orderId: null,
  });

  private loadedKey: string | null = null;

  readonly vendors = this._vendors.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly placing = this._placing.asReadonly();
  readonly placeError = this._placeError.asReadonly();
  readonly lab = this._lab.asReadonly();
  readonly diagnostic = this._diagnostic.asReadonly();
  /** Which of the three options the member took. */
  readonly route = this._route.asReadonly();
  /** The address the member picked for home collection; '' when none. */
  readonly addressId = this._addressId.asReadonly();
  readonly booked = this._booked.asReadonly();

  readonly subtotal = computed(() =>
    money((this._lab()?.price.amount ?? 0) + (this._diagnostic()?.price.amount ?? 0)),
  );

  constructor() {
    effect(() => {
      if (!this.session.isAuthenticated()) this.reset();
    });
  }

  /** `leg` picks the endpoint: lab vendors or diagnostic vendors. */
  async loadVendors(leg: 'lab' | 'diagnostic', pincode: string): Promise<void> {
    const key = `${leg}:${pincode}`;
    if (!pincode || key === this.loadedKey) return;
    this.loadedKey = key;
    this._loading.set(true);
    try {
      const url = leg === 'lab' ? AHC_API.labVendors : AHC_API.diagnosticVendors;
      const response = await firstValueFrom(
        this.http.get<AhcEnvelopeDto<AhcVendorDto[]>>(url, {
          params: new HttpParams().set('pincode', pincode),
        }),
      );
      if (this.loadedKey !== key) return;
      // These routes answer 200 with `success:false` and an `error` message
      // (for example "Pincode is required"), so success is checked here.
      this._vendors.set(response.success === false ? [] : (response.data ?? []).map(toVendor));
    } catch {
      if (this.loadedKey === key) this._vendors.set([]);
    } finally {
      if (this.loadedKey === key) this._loading.set(false);
    }
  }

  setRoute(route: AhcRoute): void {
    this._route.set(route);
    this.clearBooking();
  }

  setAddressId(id: string): void {
    this._addressId.set(id);
  }

  /**
   * Reads this policy year's AHC order, if any, to work out which legs are
   * already booked — the sheet greys the remaining options off exactly this.
   *
   * A leg counts as booked when its vendor is set: the order document always
   * carries both `labOrder` and `diagnosticOrder`, empty for the leg that was
   * not booked.
   */
  async loadBookedLegs(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<AhcEnvelopeDto<AhcOrderSummaryDto[]>>(AHC_API.orders),
      );
      const live = (response.data ?? []).filter((order) => order.status !== 'CANCELLED');
      this._booked.set({
        pathology: live.some((order) => Boolean(order.labOrder?.vendorId)),
        radiology: live.some((order) => Boolean(order.diagnosticOrder?.vendorId)),
        orderId: live[0]?.orderId ?? null,
      });
    } catch {
      this._booked.set({ pathology: false, radiology: false, orderId: null });
    }
  }

  setLab(leg: AhcLeg): void {
    this._lab.set(leg);
  }

  setDiagnostic(leg: AhcLeg): void {
    this._diagnostic.set(leg);
  }

  /**
   * Places the order. Booking-first, deliberately.
   *
   * The reference does the opposite - it stashes a `pendingBooking` in
   * sessionStorage and lets the payment screen create the order after payment
   * succeeds. Parity register entry 5 rules that do-not-port: it is the
   * architecture behind the orphaned payments recorded in
   * `audit/05-inherited-api-findings.md`. The ordering here comes from vision,
   * which already conforms.
   *
   * `paymentAlreadyProcessed` is deliberately omitted. The API reads it as
   * "payment was handled by the PaymentProcessor" and, when absent, creates the
   * order `PENDING` and debits no wallet - which is exactly the booking-first
   * state we want.
   *
   * Returns the business `orderId` (`AHC-ORD-…`), which is what
   * `GET member/ahc/orders/:orderId` looks up (`findOne({ orderId })`) - checked
   * before wiring, after the claims precedent where the detail route wanted the
   * Mongo `_id` and got the business id.
   *
   * Also returns what is still owed, because the caller has to create the
   * payment for it - see `createCopayPayment` below.
   */
  async place(input: PlaceAhcOrderInput): Promise<PlacedAhcOrder | null> {
    this._placing.set(true);
    this._placeError.set(null);
    const lab = this._lab();
    const diagnostic = this._diagnostic();
    try {
      const response = await firstValueFrom(
        this.http.post<AhcEnvelopeDto<PlacedAhcOrderDto>>(AHC_API.orders, {
          packageId: input.packageId,
          // Optional fields are omitted when empty rather than sent as ''.
          // The booking screens leave slot and time blank on purpose - the AHC
          // vendor routes expose no slot list - and an empty string is not the
          // same as absent to a validator.
          ...(lab
            ? {
                labVendorId: lab.vendorId,
                labCollectionAddress: input.collectionAddress,
                ...(lab.slotId ? { labSlotId: lab.slotId } : {}),
                ...(lab.date ? { labCollectionDate: lab.date } : {}),
                ...(lab.time ? { labCollectionTime: lab.time } : {}),
                ...(lab.collectionType ? { labCollectionType: lab.collectionType } : {}),
              }
            : {}),
          ...(diagnostic
            ? {
                diagnosticVendorId: diagnostic.vendorId,
                ...(diagnostic.slotId ? { diagnosticSlotId: diagnostic.slotId } : {}),
                ...(diagnostic.date ? { diagnosticAppointmentDate: diagnostic.date } : {}),
                ...(diagnostic.time ? { diagnosticAppointmentTime: diagnostic.time } : {}),
              }
            : {}),
        }),
      );
      const order = response?.data;
      const orderId = order?.orderId ?? null;
      if (!orderId) {
        this._placeError.set('We could not place that booking.');
        return null;
      }
      // finalPayable is the API's own figure; copayAmount is the fallback for a
      // payload that carries only the copay. Both are read rather than
      // recomputed here - the wallet split is the server's to decide.
      const owed = order?.finalPayable ?? order?.copayAmount ?? 0;
      return { orderId, owed: owed > 0 ? owed : 0, packageName: order?.packageName ?? '' };
    } catch (error: unknown) {
      // The API's own words when it has them — "Already booked AHC for this
      // policy year" is the one the radiology-after-pathology route hits, and a
      // generic retry message would send the member round the loop for nothing.
      const message = (error as { error?: { message?: unknown } } | null)?.error?.message;
      this._placeError.set(
        typeof message === 'string' && message.trim()
          ? message
          : 'We could not place that booking. Please try again.',
      );
      return null;
    } finally {
      this._placing.set(false);
    }
  }

  /**
   * Creates the PENDING payment for an AHC copay and returns its `PAY-…` id.
   *
   * **This is the leg that did not exist**, and its absence produced a real
   * unpayable debt: `AHC-ORD-1786182053508-8GHNX7JM9`, PLACED with
   * `copayAmount: 240`, `paymentStatus: PENDING` and `paymentId: undefined`
   * (`audit/14-ahc-commit-contract.md`). Dental and appointments never needed
   * this because their create endpoints make the payment themselves; AHC's does
   * not, and nothing else did either.
   *
   * **Why it is created directly rather than waiting for a bill.** Inherited
   * finding 11 asked whether AHC payment should be bill-gated as vision's is.
   * It cannot be: **there is no bill anywhere in the AHC module** - ops goes
   * collection -> reports -> complete (`ahc-ops.controller.ts`), and the word
   * does not appear in the module at all. There is nothing to gate on.
   *
   * Booking-first is untouched. The order is already committed before this
   * runs, so entry 5 still holds - this creates the obligation the order
   * produced, it does not gate the order on payment the way the reference does.
   */
  async createCopayPayment(order: PlacedAhcOrder, patientId: string): Promise<string | null> {
    if (order.owed <= 0) return null;
    try {
      const response = await firstValueFrom(
        this.http.post<{ success?: boolean; paymentId?: string; data?: { paymentId?: string } }>(
          PAYMENTS_API.create,
          {
            amount: order.owed,
            paymentType: 'COPAY',
            serviceType: 'AHC',
            serviceReferenceId: order.orderId,
            description: order.packageName
              ? `Copay for ${order.packageName}`
              : 'Health checkup copay',
            patientId,
          },
        ),
      );
      const paymentId = response?.paymentId ?? response?.data?.paymentId ?? null;
      // Only a business reference is a usable destination: GET payments/:id
      // resolves via findOne({ paymentId }), so a Mongo _id would 404. Same
      // guard as the appointment and clinic-booking results.
      return paymentId && paymentId.startsWith('PAY-') ? paymentId : null;
    } catch {
      return null;
    }
  }

  /** Clears the in-progress booking, e.g. after it is placed or abandoned. */
  clearBooking(): void {
    this._lab.set(null);
    this._diagnostic.set(null);
  }

  private reset(): void {
    this.loadedKey = null;
    this._vendors.set([]);
    this._route.set(null);
    this._addressId.set('');
    this._booked.set({ pathology: false, radiology: false, orderId: null });
    this.clearBooking();
  }
}
