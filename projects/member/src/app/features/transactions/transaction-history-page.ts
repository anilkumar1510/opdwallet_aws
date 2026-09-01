import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { WalletStore } from '../../core/wallet/wallet.store';
import { BackLink } from '../../shared/ui/back-link';
import { PageHeader } from '../../shared/ui/page-header';
import { ErrorView, LoadingView } from '../../shared/ui/state-views';
import { WalletLedger } from '../wallet/wallet-ledger';

/**
 * Transaction History — what the home balance card opens.
 *
 * The card used to open `/member/wallet`, which carries the same ledger under a
 * balance panel and eight benefit rows. The reference's card opens a dedicated
 * history screen, and Angular's own home quicklink was already **labelled**
 * "Transaction History" while pointing at the service-order list — a tile naming
 * a screen that did not exist.
 *
 * This resolves parity register entry 2 in the reference's favour: `/member/orders`
 * keeps the service-order list, `/member/transactions` is the wallet ledger, as
 * in web-member.
 */
@Component({
  selector: 'opd-transaction-history-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BackLink, LoadingView, ErrorView, WalletLedger, PageHeader],
  template: `
    <opd-page-header title="Transaction history" subtitle="Your complete wallet record" />

    <div class="mx-auto w-full max-w-3xl px-4 pb-5 pt-6">
      <div class="hidden lg:block">
        <opd-back-link />
        <h1 class="text-lg font-semibold text-ink-900">Transaction history</h1>
        <p class="mt-0.5 text-sm text-ink-500">Your complete wallet record</p>
      </div>

      @if (store.loading()) {
        <opd-loading label="Loading transactions" />
      } @else if (store.error(); as error) {
        <opd-error [error]="error" (retry)="store.retry()" />
      } @else {
        <!-- The current balance, so the running balance on the newest row has
             something to agree with. The reference leads with the same figure. -->
        @if (store.wallet(); as wallet) {
          <section class="mt-4 rounded-2xl bg-surface p-4">
            <p class="text-xs text-ink-500">Current balance</p>
            <p class="mt-0.5 text-2xl font-semibold text-ink-900">
              {{ amount(wallet.totals.available) }}
            </p>
          </section>
        }
        <opd-wallet-ledger />
      }
    </div>
  `,
})
export class TransactionHistoryPage {
  protected readonly store = inject(WalletStore);
  protected readonly amount = (value: { amount: number; currency: 'INR' }) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
      .format(value.amount);
}
