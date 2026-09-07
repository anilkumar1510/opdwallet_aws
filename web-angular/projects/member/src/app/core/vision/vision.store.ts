import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { isAppError } from '../http/app-error';
import {
  VISION_API,
  VisionCouponDto,
  VisionEnvelopeDto,
  VisionOrder,
  VisionOrderDto,
  VisionPartner,
  VisionPartnerDto,
  VisionPurchaseMode,
  toVisionOrder,
  toVisionPartner,
} from './vision';

/** The upload endpoint's own limits, checked here so the file is named. */
const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
];
const MAX_BYTES = 15 * 1024 * 1024;

export function validatePrescription(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Upload a PDF or a photo (JPG, PNG, GIF or WebP).';
  }
  if (file.size > MAX_BYTES) {
    return 'That file is larger than 15 MB. Try a smaller scan or photo.';
  }
  return null;
}

/**
 * The vision order journey — flow 3 steps 3 and 4.
 *
 * Not session-scoped and not preloaded: only the vision screens need it, so it
 * is fetched when one opens rather than on sign-in like the wallet or family.
 *
 * `error` carries what to say and every method resolves rather than throws.
 * The API refuses several things on purpose — a second open order, submitting
 * without a prescription, a partner that does not do online — and each of those
 * is a message the member needs to read, not a failure to swallow.
 */
@Injectable({ providedIn: 'root' })
export class VisionStore {
  private readonly http = inject(HttpClient);

  private readonly _partners = signal<readonly VisionPartner[]>([]);
  private readonly _order = signal<VisionOrder | null>(null);
  private readonly _busy = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly partners = this._partners.asReadonly();
  /** The member's current order, or null when they have none open. */
  readonly order = this._order.asReadonly();
  readonly busy = this._busy.asReadonly();
  readonly error = this._error.asReadonly();

  clearError(): void {
    this._error.set(null);
  }

  async loadPartners(): Promise<void> {
    if (this._partners().length) return;
    try {
      const response = await firstValueFrom(
        this.http.get<VisionEnvelopeDto<VisionPartnerDto[]>>(VISION_API.partners),
      );
      this._partners.set((response?.data ?? []).map(toVisionPartner));
    } catch {
      this._partners.set([]);
      this._error.set('We could not load the vision partners. Try again in a moment.');
    }
  }

  /**
   * The order in progress, if any.
   *
   * "In progress" means DRAFT or COUPON_ISSUED. CANCELLED and USED are both
   * finished and are skipped, matching the API's own one-open-order rule.
   *
   * Skipping USED matters: treating it as current left the member staring at a
   * spent coupon's screen forever, with no way back to the start even though
   * the API would happily have let them order again.
   */
  async loadOrder(): Promise<void> {
    this._busy.set(true);
    try {
      const response = await firstValueFrom(
        this.http.get<VisionEnvelopeDto<VisionOrderDto[]>>(VISION_API.orders),
      );
      /*
       * DRAFT and COUPON_ISSUED only, matching the API's own rule.
       *
       * REPORTED is settled — cart built, split decided, money moved — so it no
       * longer occupies the journey. Treating it as current left the member on
       * a finished order with no way back to the start, which is the same trap
       * USED had.
       *
       * The settled cart is still reachable at its own URL. It is NOT yet
       * reachable from anywhere in the UI once the order leaves this screen:
       * there is no vision order history. Worth building; not silently papered
       * over here.
       */
      const open = (response?.data ?? []).find(
        (order) => !['CANCELLED', 'USED', 'REPORTED'].includes(order.status ?? ''),
      );
      if (!open?.orderId) {
        this._order.set(null);
        return;
      }

      /*
       * Two calls, because only the DETAIL route carries `storeUrl` — the list
       * returns raw order documents and the partner's URL is joined on per
       * order. Reading the list alone left the coupon screen with nowhere to
       * send the member: the code was shown and the "Go to Lenskart" link
       * silently disappeared.
       *
       * The list is still needed first: it is the only way to discover WHICH
       * order is open, and there is no "my current order" route.
       */
      const detail = await firstValueFrom(
        this.http.get<VisionEnvelopeDto<VisionOrderDto>>(VISION_API.orderById(open.orderId)),
      );
      this._order.set(toVisionOrder(detail?.data ?? open));
    } catch {
      this._order.set(null);
    } finally {
      this._busy.set(false);
    }
  }

  async start(input: {
    patientId: string;
    patientName: string;
    partnerId: string;
    mode: VisionPurchaseMode;
  }): Promise<boolean> {
    return this.run(async () => {
      const response = await firstValueFrom(
        this.http.post<VisionEnvelopeDto<VisionOrderDto>>(VISION_API.orders, input),
      );
      if (!response?.data) return false;
      this._order.set(toVisionOrder(response.data));
      return true;
    }, 'We could not start that order.');
  }

  async uploadPrescription(orderId: string, file: File): Promise<boolean> {
    const problem = validatePrescription(file);
    if (problem) {
      this._error.set(problem);
      return false;
    }
    return this.run(async () => {
      const form = new FormData();
      form.append('file', file);
      const response = await firstValueFrom(
        this.http.post<VisionEnvelopeDto<VisionOrderDto>>(
          VISION_API.prescription(orderId),
          form,
        ),
      );
      if (!response?.data) return false;
      this._order.set(toVisionOrder(response.data));
      return true;
    }, 'We could not upload that prescription.');
  }

  /**
   * Submits and issues the coupon. Reloads the order afterwards rather than
   * patching it from the response: the submit payload is a coupon summary, not
   * a full order, and merging the two shapes by hand is how a screen ends up
   * showing a stale prescription or status beside a fresh coupon.
   */
  async submit(orderId: string): Promise<boolean> {
    const issued = await this.run(async () => {
      const response = await firstValueFrom(
        this.http.post<VisionEnvelopeDto<VisionCouponDto>>(VISION_API.submit(orderId), {}),
      );
      return Boolean(response?.data?.couponCode);
    }, 'We could not submit that request.');

    if (issued) await this.loadOrder();
    return issued;
  }

  /**
   * The member confirms the coupon was spent.
   *
   * Reloads rather than trusting the response, so the screen picks up that
   * cancellation is now off the table in the same round trip.
   */
  /** One order by id, for the cart screen. */
  async orderById(orderId: string): Promise<VisionOrder | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<VisionEnvelopeDto<VisionOrderDto>>(VISION_API.orderById(orderId)),
      );
      return response?.data ? toVisionOrder(response.data) : null;
    } catch {
      return null;
    }
  }

  async markUsed(orderId: string, orderValue?: number): Promise<boolean> {
    const done = await this.run(async () => {
      // Omitted rather than sent as null when the member gives no figure: with
      // no value the API keeps the whole reservation, which is the safe way to
      // be wrong.
      await firstValueFrom(
        this.http.post(
          VISION_API.markUsed(orderId),
          orderValue === undefined ? {} : { orderValue },
        ),
      );
      return true;
    }, 'We could not record that.');

    if (done) await this.loadOrder();
    return done;
  }

  async cancel(orderId: string, reason?: string): Promise<boolean> {
    const cancelled = await this.run(async () => {
      await firstValueFrom(
        this.http.post(VISION_API.cancel(orderId), { reason: reason?.trim() || undefined }),
      );
      return true;
    }, 'We could not cancel that order.');

    if (cancelled) this._order.set(null);
    return cancelled;
  }

  /**
   * Shared busy/error handling. The API's own message is preferred over the
   * fallback wherever it sends one, because its refusals explain what to do —
   * "cancel it before starting another", "upload the eye prescription before
   * submitting" — and a generic message would throw that away.
   */
  private async run(action: () => Promise<boolean>, fallback: string): Promise<boolean> {
    this._busy.set(true);
    this._error.set(null);
    try {
      return await action();
    } catch (error: unknown) {
      this._error.set(isAppError(error) ? error.message : fallback);
      return false;
    } finally {
      this._busy.set(false);
    }
  }
}
