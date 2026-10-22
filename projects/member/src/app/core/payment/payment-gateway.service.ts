import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AppService } from '../http/api.service';

const APPLICATION = 'payment-gateway';
const DEFAULT_CHECKOUT_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';
/** The shared result page every payment comes back to. */
export const PAYMENT_STATUS_PATH = '/member/payment-status';
const CONTEXT_KEY = 'opdPaymentContext';

/** What a feature hands over to take a payment. */
export interface PaymentRequest {
  /** Rupees, as the booking reports them; Razorpay is given paise. */
  amount: number;
  /** The booking's order id, e.g. "OPD-ORD-OPD-2026-00528". */
  orderId: string;
  /** Facility whose gateway takes the money (GET_GATEWAY_DETAILS `facility_id`). */
  gatewayFacilityId: string;
  /** Facility of the service request, sent with the payment. */
  facilityId: string;
  uhId: string;
  serviceRequestIds: string[];
  serviceRequestHandlerId: string;
  /** What is being paid for, shown on the checkout and the result page. */
  description: string;
  /** Where the result page's "back" button leads, e.g. '/member/wellness'. */
  returnTo: string;
  returnLabel: string;
  /** Fallback prefill; the gateway's own patient details win when it sends them. */
  prefill?: { name?: string; email?: string; contact?: string };
}

export type PaymentOutcome =
  /** Razorpay has the payment and is sending the browser on; this page is being left. */
  | { status: 'redirecting' }
  | { status: 'cancelled' }
  | { status: 'failed'; reason: string };

/** Kept across the redirect so the result page knows what was paid for. */
export interface PaymentContext {
  orderId: string;
  /** Razorpay order id (`extra_data.txnId`). */
  txnId: string;
  amount: number;
  description: string;
  returnTo: string;
  returnLabel: string;
  startedAt: number;
}

interface RazorpayInstance {
  open(): void;
  on(event: 'payment.failed', handler: (response: any) => void): void;
}
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

const text = (value: unknown): string => (value === undefined || value === null ? '' : String(value).trim());

/**
 * The gateway's `redirectURL` is usually a path (`/payment-gateway/api/v1/razorpay`).
 * It is resolved against the API base, not the page's origin: loaded as a federated
 * module, this page runs on the host app's origin, whose server does not route
 * `/payment-gateway/api` to the backend.
 */
function absoluteCallback(callback: string): string {
  if (/^https?:\/\//i.test(callback)) return callback;
  const base = (environment.apiBaseUrl ?? '').replace(/\/+$/, '') || window.location.origin;
  return `${base}/${callback.replace(/^\/+/, '')}`;
}

function firstRow(response: unknown): any {
  const parsed = typeof response === 'string' ? JSON.parse(response) : response;
  const resource = (parsed as any)?.resource;
  return Array.isArray(resource) ? resource[0] : resource;
}

/**
 * Razorpay payments, for any feature that has a booking to pay for.
 *
 *   1. GET `payment_gateway_details` (GET_GATEWAY_DETAILS) — the facility's
 *      gateway; `razorpay_details` carries the public `keyId` and the
 *      callback (`redirectURL`).
 *   2. POST `ui_gateway_response` (PROCCED_PAYMENT) — registers the payment;
 *      `extra_data.txnId` is the Razorpay order.
 *   3. Razorpay Checkout in redirect mode: once paid, Razorpay posts to the
 *      gateway's `redirectURL`, which verifies it and sends the browser back to
 *      `source_url` — the shared payment-status page.
 *
 * Only `keyId` is read from the gateway details. The secrets in that response
 * belong to the server and are never used here.
 */
@Injectable({ providedIn: 'root' })
export class PaymentGatewayService {
  private readonly api = inject(AppService);
  private scriptLoading: Promise<void> | null = null;

  async pay(request: PaymentRequest): Promise<PaymentOutcome> {
    try {
      const gateway = firstRow(
        await firstValueFrom(
          this.api.getcall(
            'opd_ahc_booking',
            'habit-opd',
            'queryId=AHC_PAYMENT_GATEWAY_DETAILS&args=dummy:dummy,facility_id:' + request.gatewayFacilityId + '&application=' + APPLICATION,
          ),
        ),
      );
      const razorpay = gateway?.data?.razorpay_details ?? {};
      const gatewayId = text(gateway?.data?.id);
      const keyId = text(razorpay.keyId);
      if (!gatewayId || !keyId || text(gateway?.data?.status).toLowerCase() === 'inactive') {
        return { status: 'failed', reason: 'Online payment is not set up for this facility yet.' };
      }

      const returnUrl = `${window.location.origin}${PAYMENT_STATUS_PATH}?orderId=${encodeURIComponent(request.orderId)}`;
      const proceed = firstRow(
        await firstValueFrom(
          this.api.postCall(
            'ui_gateway_response',
            APPLICATION,
            '',
            {
              amount: request.amount,
              orderId: request.orderId,
              gateway_id: gatewayId,
              uhId: request.uhId,
              serviceRequestIds: request.serviceRequestIds,
              // The gateway base64-decodes this to send the member back once paid.
              source_url: btoa(unescape(encodeURIComponent(returnUrl))),
              request_source: 'WEB',
              service_request_handler_id: request.serviceRequestHandlerId,
              facility_id: request.facilityId,
              tag_data: [],
            },
            'PROCCED_PAYMENT',
          ),
        ),
      );
      const extra = proceed?.extra_data ?? {};
      const txnId = text(extra.txnId);
      if (!txnId) return { status: 'failed', reason: 'The payment could not be started.' };
      const amount = Number(extra.amount) || request.amount;

      this.saveContext({
        orderId: text(extra.orderId) || request.orderId,
        txnId,
        amount,
        description: request.description,
        returnTo: request.returnTo,
        returnLabel: request.returnLabel,
        startedAt: Date.now(),
      });

      await this.loadCheckout(text(razorpay.scriptURL) || DEFAULT_CHECKOUT_SCRIPT);
      const callback = text(razorpay.redirectURL);
      return await this.openCheckout({
        key: keyId,
        order_id: txnId,
        amount: Math.round(amount * 100),
        currency: text(razorpay.currency) || 'INR',
        name: text(gateway?.data?.account_name) || text(razorpay.merchant_name) || 'HCLHealthcare',
        description: request.description || text(razorpay.description),
        prefill: {
          name: text(extra.patient_name) || request.prefill?.name || '',
          email: text(extra.patient_email) || request.prefill?.email || '',
          contact: text(extra.patient_mobile) || request.prefill?.contact || '',
        },
        notes: { orderId: request.orderId },
        theme: { color: text(razorpay.theme_color) || '#1F77E0' },
        // Redirect mode: Razorpay posts the result to the gateway, which verifies it.
        ...(callback
          ? { callback_url: absoluteCallback(callback), redirect: true }
          : {}),
      });
    } catch (error) {
      console.error('Payment could not be started:', error);
      return { status: 'failed', reason: 'The payment could not be started.' };
    }
  }

  /** The payment the member was sent off to make, if this browser started one. */
  readContext(): PaymentContext | null {
    try {
      const raw = sessionStorage.getItem(CONTEXT_KEY);
      return raw ? (JSON.parse(raw) as PaymentContext) : null;
    } catch {
      return null;
    }
  }

  clearContext(): void {
    try {
      sessionStorage.removeItem(CONTEXT_KEY);
    } catch {
      // Storage unavailable: nothing was kept.
    }
  }

  private saveContext(context: PaymentContext): void {
    try {
      sessionStorage.setItem(CONTEXT_KEY, JSON.stringify(context));
    } catch {
      // Private mode: the result page falls back to its query parameters.
    }
  }

  /** Loads checkout.js once per page. */
  private loadCheckout(src: string): Promise<void> {
    if (window.Razorpay) return Promise.resolve();
    this.scriptLoading ??= new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        this.scriptLoading = null;
        reject(new Error('Razorpay checkout did not load'));
      };
      document.body.appendChild(script);
    });
    return this.scriptLoading;
  }

  /**
   * In redirect mode a finished payment navigates away, so this settles only
   * when the member closes the checkout. A failed attempt keeps the checkout
   * open for a retry and counts only if they then close it.
   */
  private openCheckout(options: Record<string, unknown>): Promise<PaymentOutcome> {
    return new Promise<PaymentOutcome>((resolve) => {
      let settled = false;
      let lastFailure: string | null = null;
      const settle = (outcome: PaymentOutcome) => {
        if (settled) return;
        settled = true;
        resolve(outcome);
      };
      const checkout = new window.Razorpay!({
        ...options,
        // Called only when redirect mode is off (no callback configured).
        handler: () => {
          window.location.href = PAYMENT_STATUS_PATH + '?orderId=' + encodeURIComponent(String((options['notes'] as any)?.orderId ?? ''));
          settle({ status: 'redirecting' });
        },
        modal: {
          ondismiss: () => settle(lastFailure ? { status: 'failed', reason: lastFailure } : { status: 'cancelled' }),
        },
      });
      checkout.on('payment.failed', (response: any) => {
        lastFailure = text(response?.error?.description) || 'The payment failed.';
      });
      checkout.open();
    });
  }
}
