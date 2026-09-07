import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { DiagnosticsFlowStore } from '../../core/diagnostics-flow/diagnostics-flow.store';
import { formatMoney, money } from '../../core/domain/money';
import { EmptyView } from '../../shared/ui/state-views';

/**
 * Flow 7 step 7 — *"Order review and order placed on hold (wallet balance is
 * blocked). No payment is taken at this point."*
 *
 * The one screen in this journey that cannot do what the sheet says. There is
 * no order state for a hold and no wallet block to place: orders are created
 * paid, and the wallet only supports a debit. So this reviews the order
 * honestly and then hands over to a screen that explains where it stops, rather
 * than creating a paid order and calling it a hold.
 */
@Component({
  selector: 'opd-order-review-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, EmptyView],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            [routerLink]="['/member', store.area(), 'flow', 'slot']"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to times"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1
              class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]"
            >
              Review your order
            </h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">
              Nothing is charged yet
            </p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        @if (store.chosenTest(); as test) {
          @if (test.isPlaceholder) {
            <p class="mb-5 rounded-xl bg-warning-50 px-4 py-3 text-sm text-warning-700" role="note">
              A walkthrough on a placeholder test. The figures are made up and no order will be
              placed.
            </p>
          }
          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <dl class="space-y-2 text-sm">
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Test</dt>
                <dd class="font-medium text-ink-900">{{ test.name }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Provider</dt>
                <dd class="text-right font-medium text-ink-900">{{ test.vendorName }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Collection</dt>
                <dd class="text-right font-medium text-ink-900">
                  {{ store.collection() === 'HOME' ? 'At home' : 'At their centre' }}
                  @if (store.collectionIsPlaceholder()) {
                    <span class="block text-xs font-normal text-warning-700">
                      Placeholder — this provider does not collect at home
                    </span>
                  }
                </dd>
              </div>
              @if (store.chosenSlot(); as slot) {
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">When</dt>
                  <dd class="font-medium text-ink-900">
                    {{ slot.date }} at {{ slot.startTime }}
                  </dd>
                </div>
              }

              <div class="flex justify-between gap-3 border-t border-surface-border pt-2">
                <dt class="text-ink-700">Test</dt>
                <dd class="font-medium text-ink-900">{{ fmt(test.price) }}</dd>
              </div>
              @if (store.collectionCharge(); as charge) {
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Home collection</dt>
                  <dd class="font-medium text-ink-900">{{ fmt(charge) }}</dd>
                </div>
              }
              <div class="flex justify-between gap-3 border-t border-surface-border pt-2">
                <dt class="font-semibold text-ink-900">Order value</dt>
                <dd class="text-lg font-bold text-ink-900">{{ fmt(total()) }}</dd>
              </div>
            </dl>

            <!--
              Step 7's own words, and the reason there is no figure for what the
              member pays yet: adjudication decides which tests stay and what
              they cost, and it has not run.
            -->
            <p class="mt-4 rounded-xl bg-surface-sunk px-4 py-3 text-sm text-ink-500">
              Placing this puts the order on hold while we check what your plan covers. No money
              moves until that is done and you have seen the adjusted order.
            </p>

            <button
              type="button"
              class="mt-5 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white hover:bg-[#034DA2]"
              (click)="placeOnHold()"
            >
              Place the order on hold
            </button>
          </section>
        } @else {
          <opd-empty title="Nothing to review" detail="Start by picking a test." />
          <a
            [routerLink]="['/member', store.area(), 'flow']"
            class="mt-4 flex min-h-touch w-full items-center justify-center rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900 hover:bg-surface-sunk"
            >Back to tests</a
          >
        }
      </div>
    </div>
  `,
})
export class OrderReviewPage {
  protected readonly store = inject(DiagnosticsFlowStore);
  private readonly router = inject(Router);
  protected readonly fmt = formatMoney;

  protected total() {
    return money(this.store.total());
  }

  protected placeOnHold(): void {
    void this.router.navigate(['/member', this.store.area(), 'flow', 'hold']);
  }
}
