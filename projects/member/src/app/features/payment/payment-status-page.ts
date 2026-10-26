import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { PaymentGatewayService } from '../../core/payment/payment-gateway.service';

type PaymentResult = 'success' | 'failed' | 'unknown';

const SUCCESS = ['success', 'successful', 'captured', 'paid', 'completed', 'authorized', 'true'];
const FAILURE = ['failed', 'failure', 'fail', 'cancelled', 'canceled', 'error', 'false'];

const MONEY = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

/**
 * Where every payment comes back to.
 *
 * Razorpay posts the result to the payment gateway's `redirectURL`; the gateway
 * verifies it and sends the browser here (the `source_url` given with
 * PROCCED_PAYMENT). The result is read from the query parameters it adds, and
 * what was paid for from the context saved before the member left.
 *
 * The parameter names are best guesses — confirm against a live redirect.
 */
@Component({
  selector: 'opd-payment-status-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-[#f7f7fc] px-5 py-10">
      <section class="mx-auto max-w-[480px] rounded-2xl border border-[#EDF0F7] bg-white p-6 text-center shadow-sm">
        <span
          class="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl font-bold text-white"
          [class.bg-[#34A853]]="result() === 'success'"
          [class.bg-danger-700]="result() === 'failed'"
          [class.bg-[#9CA3AF]]="result() === 'unknown'"
          aria-hidden="true"
          >{{ result() === 'success' ? '✓' : result() === 'failed' ? '✕' : '…' }}</span
        >
        <h1 class="mt-4 text-xl font-bold text-ink-900" role="status">
          @switch (result()) {
            @case ('success') { Payment successful }
            @case ('failed') { Payment failed }
            @default { Confirming your payment }
          }
        </h1>
        <p class="mt-1 text-sm text-ink-700">
          @switch (result()) {
            @case ('success') { Your payment is received and your booking is confirmed. }
            @case ('failed') { {{ failureReason() || 'The payment did not go through.' }} Your booking stays pending until it is paid. }
            @default { We have not received a confirmation yet. Check your bookings in a few minutes; if money left your account it is refunded when a payment does not complete. }
          }
        </p>

        @if (rows().length) {
          <dl class="mt-5 space-y-2 border-t border-surface-border pt-4 text-left text-sm">
            @for (row of rows(); track row.label) {
              <div class="flex justify-between gap-3">
                <dt class="text-ink-500">{{ row.label }}</dt>
                <dd class="break-all text-right font-medium text-ink-900">{{ row.value }}</dd>
              </div>
            }
          </dl>
        }

        <div class="mt-6 flex flex-col gap-3">
          <a
            class="flex min-h-touch items-center justify-center rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white hover:bg-[#034DA2]"
            [routerLink]="context()?.returnTo ?? '/member'"
            (click)="done()"
            >{{ context()?.returnLabel ?? 'Back to home' }}</a
          >
          <a
            class="flex min-h-touch items-center justify-center rounded-xl border border-surface-border bg-white px-6 text-sm font-semibold text-ink-900 hover:border-[#A4BFFE7A]"
            routerLink="/member/bookings"
            (click)="done()"
            >View bookings</a
          >
        </div>
      </section>
    </div>
  `,
})
export class PaymentStatusPage {
  private readonly payments = inject(PaymentGatewayService);
  private readonly params = inject(ActivatedRoute).snapshot.queryParamMap;

  private param(...keys: string[]): string {
    for (const key of keys) {
      const value = this.params.get(key)?.trim();
      if (value) return value;
    }
    return '';
  }

  private readonly orderId = this.param('orderId', 'order_id');

  /** Only the context of this order — an older payment's is ignored. */
  protected readonly context = computed(() => {
    const saved = this.payments.readContext();
    return saved && (!this.orderId || saved.orderId === this.orderId) ? saved : null;
  });

  private readonly paymentId = this.param('razorpay_payment_id', 'paymentId', 'payment_id', 'txnId');
  protected readonly failureReason = computed(() =>
    this.param('error[description]', 'error_description', 'errorMessage', 'message', 'reason'),
  );

  protected readonly result = computed<PaymentResult>(() => {
    const status = this.param('status', 'payment_status', 'paymentStatus', 'txnStatus', 'result').toLowerCase();
    if (FAILURE.includes(status) || this.param('error[code]', 'error_code')) return 'failed';
    if (SUCCESS.includes(status)) return 'success';
    // Razorpay's own success fields, when the gateway passes them through.
    if (this.param('razorpay_payment_id') && this.param('razorpay_signature')) return 'success';
    return 'unknown';
  });

  protected readonly rows = computed(() => {
    const ctx = this.context();
    const rows: { label: string; value: string }[] = [];
    if (ctx?.description) rows.push({ label: 'Paid for', value: ctx.description });
    if (ctx?.amount) rows.push({ label: 'Amount', value: MONEY.format(ctx.amount) });
    const order = this.orderId || ctx?.orderId;
    if (order) rows.push({ label: 'Order ID', value: order });
    if (this.paymentId) rows.push({ label: 'Payment ID', value: this.paymentId });
    return rows;
  });

  /** The result has been seen; a later visit should not show it again. */
  protected done(): void {
    this.payments.clearContext();
  }
}
