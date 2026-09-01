import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { formatMoney } from '../../core/domain/money';
import { FamilyStore } from '../../core/family/family.store';
import { WalletStore } from '../../core/wallet/wallet.store';
import { TransactionDirection, WalletTransaction } from '../../core/wallet/wallet.model';
import { BackLink } from '../../shared/ui/back-link';
import { PageHeader } from '../../shared/ui/page-header';
import { WalletLedger } from './wallet-ledger';
import { EmptyView, ErrorView, LoadingView } from '../../shared/ui/state-views';

@Component({
  selector: 'opd-wallet-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LoadingView, ErrorView, EmptyView, BackLink, WalletLedger, PageHeader],
  template: `
    <opd-page-header title="Wallet" [subtitle]="store.memberName()" />

    <div class="mx-auto w-full max-w-3xl px-4 pb-5 pt-6">
      <!-- The wallet is reached from the balance card on the home screen, and
           had no way back but the browser control. The reference's history screen
           carries one (transactions/page.tsx:521). -->
      <div class="hidden lg:block">
        <div class="flex items-center gap-3">
          <opd-back-link />
          <div>
            <h1 class="text-lg font-semibold text-ink-900">Wallet</h1>
            <p class="mt-0.5 text-sm text-ink-500">{{ store.memberName() }}</p>
          </div>
        </div>
      </div>

      @if (store.loading()) {
        <opd-loading label="Loading wallet" />
      } @else if (store.error(); as error) {
        <opd-error [error]="error" (retry)="store.retry()" />
      } @else if (store.wallet(); as wallet) {
        @if (!wallet.exists) {
          <opd-empty
            title="No wallet for this member"
            detail="There is no active benefit wallet for the current policy period."
          />
        } @else {
          <!-- Totals -->
          <section class="mt-4 rounded-2xl bg-brand-600 p-5 text-white shadow-soft">
            <p class="text-xs uppercase tracking-wide text-brand-100">Available balance</p>
            <p class="mt-1 text-3xl font-semibold">{{ amount(wallet.totals.available) }}</p>
            <!-- /wallet/balance carries no policy period, so it comes from the
                 profile assignment held in FamilyStore. -->
            @if (coveragePeriod(); as period) {
              <p class="mt-1 text-xs text-brand-100">{{ period }}</p>
            }
            <div class="mt-4 h-2 overflow-hidden rounded-full bg-brand-700">
              <div
                class="h-full rounded-full bg-accent"
                [style.width.%]="wallet.totals.consumedPercent"
              ></div>
            </div>
            <dl class="mt-3 flex justify-between text-xs text-brand-100">
              <div><dt class="inline">Allocated </dt><dd class="inline font-medium text-white">{{ amount(wallet.totals.allocated) }}</dd></div>
              <div><dt class="inline">Used </dt><dd class="inline font-medium text-white">{{ amount(wallet.totals.consumed) }}</dd></div>
            </dl>
            @if (wallet.isShared) {
              <p class="mt-3 rounded-lg bg-brand-700 px-2 py-1 text-xs">
                Shared across your family
              </p>
            }
          </section>

          <!-- Per-family-member consumption, shared wallets only -->
          @if (wallet.isShared && wallet.familyConsumption.length) {
            <section class="mt-5">
              <h2 class="text-sm font-semibold text-ink-900">Used by each member</h2>
              <ul class="mt-2 divide-y divide-surface-border rounded-2xl bg-surface">
                @for (entry of wallet.familyConsumption; track entry.memberId) {
                  <li class="flex items-center justify-between px-4 py-3 text-sm">
                    <span class="text-ink-700">{{ nameFor(entry.memberId) }}</span>
                    <span class="font-medium text-ink-900">{{ amount(entry.consumed) }}</span>
                  </li>
                }
              </ul>
            </section>
          }

          <!-- Categories -->
          @if (wallet.categories.length) {
            <section class="mt-5">
              <h2 class="text-sm font-semibold text-ink-900">Benefits</h2>
              <ul class="mt-2 grid gap-3 sm:grid-cols-2">
                @for (category of wallet.categories; track category.category + category.label) {
                  <li class="rounded-2xl bg-surface p-4 shadow-soft">
                    <p class="text-sm font-medium text-ink-900">{{ category.label }}</p>
                    @if (category.isUnlimited) {
                      <p class="mt-1 text-lg font-semibold text-success-700">Unlimited</p>
                    } @else {
                      <p
                        class="mt-1 text-lg font-semibold"
                        [class.text-ink-900]="!category.isExhausted"
                        [class.text-ink-500]="category.isExhausted"
                      >
                        {{ amount(category.available) }}
                      </p>
                      @if (category.isExhausted) {
                        <p class="mt-0.5 text-xs font-medium text-danger-700">Fully used</p>
                      } @else {
                        <p class="mt-0.5 text-xs text-ink-500">
                          of {{ amount(category.allocated) }}
                        </p>
                      }
                    }
                  </li>
                }
              </ul>
            </section>
          }

          <opd-wallet-ledger />
        }
      }
    </div>
  `,
})
export class WalletPage {
  protected readonly store = inject(WalletStore);

  /** Net change is rendered with its own sign, so the figure itself is unsigned. */
  protected absolute(value: { amount: number; currency: 'INR' }): { amount: number; currency: 'INR' } {
    return value.amount < 0 ? { ...value, amount: -value.amount } : value;
  }
  private readonly family = inject(FamilyStore);

  private readonly namesById = computed(
    () => new Map(this.family.family().map((member) => [member.id, member.fullName])),
  );

  private readonly periodFormat = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  /**
   * The policy period the wallet applies to. Sourced from the active member's
   * assignment, because GET /wallet/balance does not return it.
   */
  protected readonly coveragePeriod = computed(() => {
    const activeId = this.family.activeMember()?.id;
    const policy = this.family.policies().find((candidate) => candidate.holderId === activeId);
    if (!policy?.validTill) return null;

    const till = this.periodFormat.format(policy.validTill);
    return policy.validFrom
      ? `Cover ${this.periodFormat.format(policy.validFrom)} – ${till}`
      : `Cover until ${till}`;
  });

  protected readonly amount = formatMoney;

  private readonly dateFormat = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  protected occurredAt(transaction: WalletTransaction): string {
    return transaction.occurredAt ? this.dateFormat.format(transaction.occurredAt) : 'Date unknown';
  }

  protected isCredit(transaction: WalletTransaction): boolean {
    return transaction.direction === TransactionDirection.Credit;
  }

  protected nameFor(memberId: string): string {
    return this.namesById().get(memberId) ?? 'Family member';
  }
}
