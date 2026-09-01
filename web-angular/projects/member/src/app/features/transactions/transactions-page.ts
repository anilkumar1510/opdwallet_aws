import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { formatMoney } from '../../core/domain/money';
import { TransactionsStore } from '../../core/transactions/transactions.store';
import { EmptyView, ErrorView, LoadingView } from '../../shared/ui/state-views';
import { StatusBadge } from '../../shared/ui/status-badge';
import { BackLink } from '../../shared/ui/back-link';
import { PageHeader } from '../../shared/ui/page-header';

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

@Component({
  selector: 'opd-transactions-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingView, ErrorView, EmptyView, StatusBadge, BackLink, PageHeader],
  template: `
    <opd-page-header
      title="Order History"
      subtitle="Everything you have spent, and how it was paid"
    />

    <div class="mx-auto w-full max-w-[480px] px-5 pb-5 pt-6 lg:max-w-[1240px] lg:px-8 lg:py-6">
      <!-- Desktop keeps the reference portal's own black title. -->
      <div class="hidden lg:block">
        <opd-back-link />
        <!-- "Order History", as the reference titles it (orders/page.tsx:140). It was
             "Transaction History" here, which became actively wrong in session 54 when
             /member/transactions started serving the wallet ledger — two screens under
             one name is the confusion that change existed to remove. -->
        <h1 class="text-2xl font-bold text-black lg:text-3xl">Order History</h1>
        <p class="mt-0.5 text-sm text-ink-500">Everything you have spent, and how it was paid</p>
      </div>

      @if (store.loading()) {
        <opd-loading label="Loading transactions" />
      } @else if (store.error(); as error) {
        <opd-error [error]="error" (retry)="store.retry()" />
      } @else {
        @if (store.summary(); as summary) {
          <div class="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div class="rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white p-4" style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.24)">
              <p class="text-xs text-ink-500">Transactions</p>
              <p class="mt-1 text-2xl font-semibold text-[#034DA2]">{{ summary.count }}</p>
            </div>
            <div class="rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white p-4" style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.24)">
              <p class="text-xs text-ink-500">Total spent</p>
              <p class="mt-1 text-2xl font-semibold text-[#303030]">{{ money(summary.totalSpent) }}</p>
            </div>
            <div class="rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white p-4" style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.24)">
              <p class="text-xs text-ink-500">From wallet</p>
              <p class="mt-1 text-2xl font-semibold text-success-700">{{ money(summary.fromWallet) }}</p>
            </div>
            <div class="rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white p-4" style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.24)">
              <p class="text-xs text-ink-500">Paid yourself</p>
              <p class="mt-1 text-2xl font-semibold text-[#303030]">{{ money(summary.selfPaid) }}</p>
            </div>
          </div>

          @if (summary.byService.length) {
            <section class="mt-6">
              <h2 class="mb-3 text-[18px] font-medium text-[#1c1c1c]">Where it went</h2>
              <ul class="divide-y divide-surface-border overflow-hidden rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white">
                @for (row of summary.byService; track row.serviceLabel) {
                  <li class="flex items-center justify-between px-4 py-3 text-sm">
                    <span class="text-ink-700">{{ row.serviceLabel }} ({{ row.count }})</span>
                    <span class="font-medium text-[#303030]">{{ money(row.amount) }}</span>
                  </li>
                }
              </ul>
            </section>
          }
        }

        @if (store.transactions().length) {
          <section class="mt-6">
            <h2 class="mb-3 text-[18px] font-medium text-[#1c1c1c]">Activity</h2>
            <ul class="space-y-3">
              @for (txn of store.transactions(); track txn.id) {
                <li
                  class="rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white p-4"
                  style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.24)"
                >
                  <a
                    [routerLink]="['/member/orders', txn.reference]"
                    class="flex items-start justify-between gap-3"
                  >
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2">
                        <span class="rounded-md bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-[#034DA2]">{{
                          txn.serviceLabel
                        }}</span>
                        <span class="truncate text-xs text-ink-500">{{ txn.reference }}</span>
                      </div>
                      <p class="mt-1 truncate text-sm font-medium text-ink-900">
                        {{ txn.serviceName }}
                      </p>
                      <p class="mt-1 text-xs text-ink-500">
                        {{ date(txn.occurredAt) }} · {{ txn.paymentMethodLabel }}
                      </p>
                    </div>
                    <div class="shrink-0 text-right">
                      <opd-status-badge [status]="txn.status" />
                      <p class="mt-2 text-base font-semibold text-[#303030]">{{ money(txn.total) }}</p>
                      <p class="text-xs text-ink-500">
                        {{ money(txn.fromWallet) }} wallet · {{ money(txn.selfPaid) }} you
                      </p>
                    </div>
                  </a>
                </li>
              }
            </ul>

            @if (store.hasMore()) {
              <button
                type="button"
                class="mt-3 min-h-touch w-full rounded-xl border border-surface-border bg-white text-sm font-medium text-brand-700 disabled:opacity-60"
                [disabled]="store.loadingMore()"
                (click)="store.loadMore()"
              >
                {{ store.loadingMore() ? 'Loading…' : 'Show more' }}
              </button>
            }
          </section>
        } @else {
          <opd-empty title="No transactions yet" detail="Spending will appear here." />
        }
      }
    </div>
  `,
})
export class TransactionsPage {
  protected readonly store = inject(TransactionsStore);
  protected readonly money = formatMoney;

  protected date(value: Date | null): string {
    return value ? DATE.format(value) : 'Date not recorded';
  }
}
