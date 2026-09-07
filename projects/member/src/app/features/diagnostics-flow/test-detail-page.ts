import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { DiagnosticsFlowStore } from '../../core/diagnostics-flow/diagnostics-flow.store';
import { formatMoney } from '../../core/domain/money';
import { EmptyView } from '../../shared/ui/state-views';

/**
 * Flow 7 step 3 — the test itself: *"Detail shows preparation, sample type and
 * report turnaround time."*
 *
 * All three of those live on the master-test record, which only the admin API
 * exposes. They are listed with what we do not know rather than dropped,
 * because a member deciding whether to book a fasting test needs to be told we
 * cannot tell them — not left to assume there is nothing to prepare.
 */
@Component({
  selector: 'opd-test-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, EmptyView],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            [routerLink]="['/member', store.area(), 'flow']"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to tests"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1
              class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]"
            >
              {{ store.chosenTest()?.name ?? 'Test' }}
            </h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">
              Step 3 of your order
            </p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        @if (store.chosenTest(); as test) {
          @if (test.isPlaceholder) {
            <p class="mb-5 rounded-xl bg-warning-50 px-4 py-3 text-sm text-warning-700" role="note">
              This test is a placeholder — nobody near you prices it. The price below is made up so
              the rest of the journey can be shown. Nothing will be ordered.
            </p>
          }
          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <p class="text-3xl font-bold text-[#0B2C63]">{{ money(test.price) }}</p>
            <p class="mt-0.5 text-sm text-ink-700">
              at {{ test.vendorName }} — other providers may charge differently
            </p>

            <dl class="mt-5 space-y-2 border-t border-surface-border pt-4 text-sm">
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Test code</dt>
                <dd class="font-medium text-ink-900">{{ test.code || 'Not recorded' }}</dd>
              </div>
              <!--
                The three the sheet asks for. Named, and marked as unknown,
                because "not shown" and "nothing to do" look identical on a
                screen and only one of them is safe.
              -->
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">How to prepare</dt>
                <dd class="text-right text-ink-500">Not recorded — ask the provider</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Sample type</dt>
                <dd class="text-right text-ink-500">Not recorded</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Report turnaround</dt>
                <dd class="text-right text-ink-500">Not recorded</dd>
              </div>
            </dl>

            <p class="mt-4 rounded-xl bg-warning-50 px-4 py-3 text-sm text-warning-700">
              If this test needs fasting or any other preparation, the provider will tell you when
              they call to confirm. We do not hold that detail yet.
            </p>

            <button
              type="button"
              class="mt-5 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white hover:bg-[#034DA2]"
              (click)="next()"
            >
              Choose a provider
            </button>
          </section>
        } @else {
          <opd-empty
            title="Nothing chosen yet"
            detail="Start from the list of tests so we know what you are booking."
          />
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
export class TestDetailPage {
  protected readonly store = inject(DiagnosticsFlowStore);
  private readonly router = inject(Router);
  protected readonly money = formatMoney;

  protected next(): void {
    void this.router.navigate(['/member', this.store.area(), 'flow', 'provider']);
  }
}
