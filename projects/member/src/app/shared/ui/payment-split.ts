import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { PaymentSplit } from '../../core/domain/payment-split';

const NUMBER = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/**
 * The payment breakdown, in the order the money is worked out: the bill, the
 * co-payment on it, what is left, the limit, what the wallet pays, anything
 * above the limit, and what the member pays.
 */
@Component({
  selector: 'opd-payment-split',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let s = split();
    <dl class="space-y-2 text-sm">
      @for (line of billLines(); track line.label) {
        <div class="flex justify-between gap-3"><dt class="text-ink-700">{{ line.label }}</dt><dd class="font-medium text-ink-900">₹{{ n(line.amount) }}</dd></div>
      }
      <div class="flex justify-between gap-3" [class.border-t]="billLines().length" [class.border-surface-border]="billLines().length" [class.pt-2]="billLines().length">
        <dt class="text-ink-700">{{ billLabel() }}</dt><dd class="font-medium text-ink-900">₹{{ n(s.bill) }}</dd>
      </div>
      <div class="flex justify-between gap-3">
        <dt class="text-ink-700">Co-payment{{ s.copay.mode === 'PERCENT' ? ' (' + s.copay.value + '%)' : '' }} <span class="text-xs text-ink-500">· paid by you</span></dt>
        <dd class="font-medium text-danger-700">− ₹{{ n(s.copayAmount) }}</dd>
      </div>
      <div class="flex justify-between gap-3 border-t border-surface-border pt-2">
        <dt class="text-ink-700">Amount after co-payment</dt><dd class="font-medium text-ink-900">₹{{ n(s.afterCopay) }}</dd>
      </div>
      <div class="flex justify-between gap-3">
        <dt class="text-ink-700">{{ limitLabel() }}</dt><dd class="font-medium text-ink-900">{{ s.limit !== null ? '₹' + n(s.limit) : 'No limit' }}</dd>
      </div>
      <div class="flex justify-between gap-3">
        <dt class="text-ink-700">{{ walletLabel() }} <span class="text-xs text-ink-500">· the lower of the two</span></dt>
        <dd class="font-medium text-success-700">₹{{ n(s.walletPays) }}</dd>
      </div>
      @if (s.aboveLimit > 0) {
        <div class="flex justify-between gap-3">
          <dt class="text-ink-700">Above the limit <span class="text-xs text-ink-500">· paid by you</span></dt>
          <dd class="font-medium text-ink-900">₹{{ n(s.aboveLimit) }}</dd>
        </div>
      }
      <div class="flex justify-between gap-3 border-t border-surface-border pt-2">
        <dt class="font-semibold text-ink-900">
          {{ youPayLabel() }}
          @if (s.aboveLimit > 0) {
            <span class="block text-xs font-normal text-ink-500">Co-payment ₹{{ n(s.copayAmount) }} + above the limit ₹{{ n(s.aboveLimit) }}</span>
          }
        </dt>
        <dd class="text-lg font-bold text-ink-900">₹{{ n(s.memberPays) }}</dd>
      </div>
    </dl>
  `,
})
export class PaymentSplitView {
  readonly split = input.required<PaymentSplit>();
  /** "Per transaction limit" on cashless bookings, "Per claim limit" on claims. */
  readonly limitLabel = input('Per transaction limit');
  readonly billLabel = input('Bill amount');
  /** Items that make up the bill, shown above it when there is more than one. */
  readonly billLines = input<readonly { label: string; amount: number }[]>([]);
  readonly walletLabel = input('Wallet pays');
  readonly youPayLabel = input('You pay now (Razorpay)');

  protected n(v: number): string {
    return NUMBER.format(v);
  }
}
