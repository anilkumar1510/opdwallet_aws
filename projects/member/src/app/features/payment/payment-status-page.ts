import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import {
  PaymentGatewayService,
  PaymentState,
  PaymentVerification,
  toPaymentState,
} from '../../core/payment/payment-gateway.service';

/** `checking` while the APIs answer; `unknown` when neither could. */
type PaymentResult = PaymentState | 'checking' | 'unknown';

const MONEY = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
const WHEN = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

/**
 * Where every payment comes back to: /member/payment-status?orderId=…&status=…
 *
 * The result shown is the gateway's `status` query parameter (true → success,
 * false → failed). On landing the order's service requests (payment_status)
 * and payment attempts (GET_PAYMENTS) are read for `orderId` for the details,
 * and decide the result only when the URL carries no `status`. What was paid for comes from the context
 * saved before the member left for Razorpay.
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
          [class.bg-warning-700]="result() === 'pending'"
          [class.bg-[#9CA3AF]]="result() === 'checking' || result() === 'unknown'"
          aria-hidden="true"
          >{{ icon() }}</span
        >
        <h1 class="mt-4 text-xl font-bold text-ink-900" role="status" aria-live="polite">
          @switch (result()) {
            @case ('checking') { Confirming your payment… }
            @case ('success') { Payment successful }
            @case ('failed') { Payment failed }
            @case ('pending') { Payment is being processed }
            @default { We could not confirm your payment }
          }
        </h1>
        <p class="mt-1 text-sm text-ink-700">
          @switch (result()) {
            @case ('checking') { This takes a few seconds. Please don't close this page. }
            @case ('success') { Your payment is received and your booking is confirmed. }
            @case ('failed') { The payment did not go through. Your booking stays pending until it is paid. If money left your account, it is refunded. }
            @case ('pending') { We have not received the final status from the bank yet. Check again in a minute. }
            @default { We could not reach the payment service. Check again in a moment, or see your bookings. }
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
          @if (result() === 'pending' || result() === 'unknown') {
            <button
              type="button"
              class="flex min-h-touch items-center justify-center rounded-xl border border-[#0F5FDC] bg-white px-6 text-sm font-semibold text-[#0F5FDC] hover:bg-blue-50"
              (click)="check()"
            >
              Check again
            </button>
          }
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

  /**
   * The order id, once. A return URL that already carried `?orderId=` gets the
   * gateway's own appended after it ("X?orderId=X"), so only the part before
   * any `?` or `&` is the id.
   */
  private readonly orderId = (this.params.get('orderId') ?? this.params.get('order_id') ?? '').split(/[?&]/)[0].trim();
  /** The gateway's verdict on the redirect ("true" / "false"); decides the result when present. */
  private readonly redirectStatus = (this.params.get('status') ?? '').trim();

  private readonly checking = signal(true);
  private readonly verification = signal<PaymentVerification | null>(null);
  private checkSeq = 0;

  /** Only the context of this order — an older payment's is ignored. */
  protected readonly context = computed(() => {
    const saved = this.payments.readContext();
    return saved && (!this.orderId || saved.orderId === this.orderId) ? saved : null;
  });

  protected readonly result = computed<PaymentResult>(() => {
    // 1. The gateway's verdict on the redirect (`status=true|false`) decides,
    //    at once — the APIs below only fill in the details.
    if (this.redirectStatus) return toPaymentState(this.redirectStatus);
    if (this.checking()) return 'checking';
    const v = this.verification();
    // 2. Without one, the order service's payment_status.
    if (v?.state) return v.state;
    // 3. Then the latest payment attempt.
    const latest = v?.transactions[0];
    if (latest?.status) return toPaymentState(latest.status);
    return 'unknown';
  });

  protected readonly icon = computed(() => {
    switch (this.result()) {
      case 'success': return '✓';
      case 'failed': return '✕';
      case 'pending': return '!';
      default: return '…';
    }
  });

  protected readonly rows = computed(() => {
    const ctx = this.context();
    const latest = this.verification()?.transactions[0];
    const rows: { label: string; value: string }[] = [];
    if (ctx?.description) rows.push({ label: 'Paid for', value: ctx.description });
    const amount = latest?.amount ?? ctx?.amount;
    if (amount) rows.push({ label: 'Amount', value: MONEY.format(amount) });
    const order = this.orderId || ctx?.orderId;
    if (order) rows.push({ label: 'Order ID', value: order });
    if (latest?.id) rows.push({ label: 'Payment ID', value: latest.id });
    if (latest?.mode) rows.push({ label: 'Paid by', value: latest.mode });
    if (latest?.at) rows.push({ label: 'Date', value: WHEN.format(latest.at) });
    const statusText = this.verification()?.statusText;
    // The order's own status only when it, not the redirect, decided the result.
    if (statusText && !this.checking() && !this.redirectStatus) rows.push({ label: 'Payment status', value: statusText });
    return rows;
  });

  constructor() {
    void this.check();
  }

  /** Reads the order's payment from both services; "Check again" repeats it. */
  protected async check(): Promise<void> {
    if (!this.orderId) {
      this.checking.set(false);
      return;
    }
    const seq = ++this.checkSeq;
    this.checking.set(true);
    const verification = await this.payments.verify(this.orderId);
    if (seq !== this.checkSeq) return;
    this.verification.set(verification);
    this.checking.set(false);
  }

  /** The result has been seen; a later visit should not show it again. */
  protected done(): void {
    this.payments.clearContext();
  }
}
