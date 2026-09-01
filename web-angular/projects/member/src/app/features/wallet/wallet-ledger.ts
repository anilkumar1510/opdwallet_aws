import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { Money, formatMoney } from '../../core/domain/money';
import { TransactionDirection, WalletTransaction } from '../../core/wallet/wallet.model';
import { WalletStore } from '../../core/wallet/wallet.store';
import { EmptyView } from '../../shared/ui/state-views';

/**
 * The wallet ledger: credits/debits/net, the rows, and paging.
 *
 * Shared by two screens on purpose. `/member/wallet` shows it under the balance
 * and benefits; `/member/transactions` is the dedicated Transaction History the
 * home balance card opens, matching the reference. Duplicating ninety lines of
 * money rendering across both is how the two drift.
 */
@Component({
  selector: 'opd-wallet-ledger',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyView],
  template: `
      <!-- Transactions -->
      <section class="mt-6">
        <h2 class="text-sm font-semibold text-ink-900">Activity</h2>

        <!-- Credits / debits / net. Computed over the member's WHOLE history,
             not the page on screen — see TOTALS_WINDOW in wallet.store.ts.
             The reference shows these on its Transaction History screen; the
             balance card that opens this page links there, so a member
             arriving here expected them and found only a list. -->
        @if (store.activityTotals(); as totals) {
          <dl class="mt-2 grid grid-cols-3 gap-2">
            <div class="rounded-xl bg-surface p-3">
              <dt class="text-xs text-ink-500">Total credits</dt>
              <dd class="mt-0.5 text-sm font-semibold text-success-700">
                +{{ amount(totals.credits) }}
              </dd>
            </div>
            <div class="rounded-xl bg-surface p-3">
              <dt class="text-xs text-ink-500">Total debits</dt>
              <dd class="mt-0.5 text-sm font-semibold text-ink-900">
                −{{ amount(totals.debits) }}
              </dd>
            </div>
            <div class="rounded-xl bg-surface p-3">
              <dt class="text-xs text-ink-500">Net change</dt>
              <dd
                class="mt-0.5 text-sm font-semibold"
                [class.text-success-700]="totals.net.amount >= 0"
                [class.text-danger-700]="totals.net.amount < 0"
              >
                {{ totals.net.amount >= 0 ? '+' : '−' }}{{ amount(absolute(totals.net)) }}
              </dd>
            </div>
          </dl>
          <p class="mt-1 text-xs text-ink-500">Across {{ totals.counted }} transactions</p>
        }
        @if (store.transactions().length) {
          <ul class="mt-2 divide-y divide-surface-border rounded-2xl bg-surface">
            @for (transaction of store.transactions(); track transaction.id) {
              <li class="flex items-start gap-3 px-4 py-3">
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-ink-900">
                    {{ transaction.description }}
                  </p>
                  <p class="mt-0.5 text-xs text-ink-500">
                    {{ occurredAt(transaction) }}
                    @if (transaction.categoryLabel; as label) {
                      · {{ label }}
                    }
                  </p>
                  @if (transaction.isReversed) {
                    <span
                      class="mt-1 inline-block rounded-md bg-warning-50 px-1.5 py-0.5 text-xs font-medium text-warning-700"
                      >Reversed</span
                    >
                  }
                </div>
                <span
                  class="shrink-0 text-sm font-semibold"
                  [class.text-success-700]="isCredit(transaction)"
                  [class.text-ink-900]="!isCredit(transaction)"
                  [class.line-through]="transaction.isReversed"
                >
                  {{ isCredit(transaction) ? '+' : '−' }}{{ amount(transaction.amount) }}
                  <!-- The balance AFTER this transaction. Three identical
                       ₹300 debits on one day are otherwise impossible to tell
                       apart or reconcile against the total. The API sends it
                       as newBalance.total; it was simply never mapped. -->
                  @if (transaction.balanceAfter; as balance) {
                    <span class="mt-0.5 block text-xs font-normal text-ink-500">
                      Bal: {{ amount(balance) }}
                    </span>
                  }
                </span>
              </li>
            }
          </ul>

          @if (store.hasMore()) {
            <button
              type="button"
              class="mt-3 min-h-touch w-full rounded-xl border border-surface-border bg-surface text-sm font-medium text-brand-700 disabled:opacity-60"
              [disabled]="store.loadingMore()"
              (click)="store.loadMore()"
            >
              {{ store.loadingMore() ? 'Loading…' : 'Show more' }}
            </button>
          }
        } @else {
          <opd-empty title="No activity yet" detail="Wallet transactions will appear here." />
        }
      </section>
  `,
})
export class WalletLedger {
  protected readonly store = inject(WalletStore);
  protected readonly amount = formatMoney;

  protected isCredit(transaction: WalletTransaction): boolean {
    return transaction.direction === TransactionDirection.Credit;
  }

  protected occurredAt(transaction: WalletTransaction): string {
    const at = transaction.occurredAt;
    return at ? DATE.format(at) : 'Date not recorded';
  }

  /** Net change is rendered with its own sign, so the figure itself is unsigned. */
  protected absolute(value: Money): Money {
    return value.amount < 0 ? { ...value, amount: -value.amount } : value;
  }
}

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
