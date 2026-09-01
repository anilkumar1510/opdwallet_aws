import { ChangeDetectionStrategy, Component, inject, input, resource } from '@angular/core';
import { RouterLink } from '@angular/router';

import { formatMoney } from '../../core/domain/money';
import { TransactionsStore } from '../../core/transactions/transactions.store';
import { EmptyView, LoadingView } from '../../shared/ui/state-views';
import { StatusBadge } from '../../shared/ui/status-badge';

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/** One transaction and the payment behind it. */
@Component({
  selector: 'opd-transaction-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingView, EmptyView, StatusBadge],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            routerLink="/member/orders"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to transactions"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">Transaction</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">{{ transactionId() }}</p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        @if (detail.isLoading()) {
          <opd-loading label="Loading transaction" />
        } @else if (detail.value(); as data) {
          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <span class="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-[#034DA2]">{{
                  data.transaction.serviceLabel
                }}</span>
                <h2 class="mt-1 truncate text-lg font-bold text-[#0B2C63]">
                  {{ data.transaction.serviceName }}
                </h2>
                <p class="mt-0.5 text-xs text-ink-500">{{ date(data.transaction.occurredAt) }}</p>
              </div>
              <opd-status-badge [status]="data.transaction.status" />
            </div>

            <dl class="mt-5 space-y-2 border-t border-surface-border pt-4 text-sm">
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Total</dt>
                <dd class="font-medium text-ink-900">{{ money(data.transaction.total) }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Paid from wallet</dt>
                <dd class="font-medium text-success-700">
                  {{ money(data.transaction.fromWallet) }}
                </dd>
              </div>
              @if (data.transaction.copay.amount > 0) {
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Copay</dt>
                  <dd class="font-medium text-ink-900">{{ money(data.transaction.copay) }}</dd>
                </div>
              }
              <div class="flex justify-between gap-3 border-t border-surface-border pt-2">
                <dt class="font-semibold text-ink-900">You paid</dt>
                <dd class="text-lg font-bold text-[#0B2C63]">
                  {{ money(data.transaction.selfPaid) }}
                </dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Method</dt>
                <dd class="font-medium text-ink-900">
                  {{ data.transaction.paymentMethodLabel }}
                </dd>
              </div>
            </dl>
          </section>

          @if (data.payment; as payment) {
            <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
              <div class="flex items-start justify-between gap-3">
                <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">Payment</h2>
                <opd-status-badge [status]="payment.status" />
              </div>
              <dl class="mt-3 space-y-2 text-sm">
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Reference</dt>
                  <dd class="font-medium text-ink-900">{{ payment.reference }}</dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Amount</dt>
                  <dd class="font-medium text-ink-900">{{ money(payment.amount) }}</dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Type</dt>
                  <dd class="font-medium text-ink-900">{{ payment.typeLabel }}</dd>
                </div>
              </dl>

              <a
                [routerLink]="['/member/payments', payment.reference]"
                class="mt-4 flex min-h-touch w-full items-center justify-center rounded-xl border border-[#C9D8F0] bg-white px-5 text-sm font-semibold text-[#0E51A2] hover:bg-[#F5F8FF]"
                >View payment</a
              >
            </section>
          }
        } @else {
          <opd-empty title="Transaction not found" detail="We could not find that transaction." />
        }
      </div>
    </div>
  `,
})
export class TransactionDetailPage {
  readonly transactionId = input<string>('');

  private readonly store = inject(TransactionsStore);
  protected readonly money = formatMoney;

  protected readonly detail = resource({
    params: () => this.transactionId(),
    loader: ({ params }) =>
      params ? this.store.transactionById(params) : Promise.resolve(null),
  });

  protected date(value: Date | null): string {
    return value ? DATE.format(value) : 'Date not recorded';
  }
}
