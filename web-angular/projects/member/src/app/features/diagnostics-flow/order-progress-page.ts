import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DiagnosticsFlowStore } from '../../core/diagnostics-flow/diagnostics-flow.store';
import { formatMoney, money } from '../../core/domain/money';
import { EmptyView } from '../../shared/ui/state-views';

/**
 * Flow 7 steps 8 to 17, one screen each.
 *
 * Everything from the hold onwards is a walkthrough: an order cannot be held,
 * so none of this is running against a real record. What it does show is the
 * SHAPE of each step — what the member would see, in the order they would see
 * it, with the figures carried from the choices they actually made.
 *
 * One component rather than ten files because the steps differ only in their
 * copy and which figures they show; ten near-identical shells would be ten
 * places to fix the header the next time it changes.
 *
 * The co-payment is a flat 20% stand-in. The real split runs through
 * `CopayCalculator` and then the per-service transaction limit, and depends on
 * the member's plan — reproducing that here would be a second implementation of
 * the one thing in this system that must never have two.
 */
const COPAY_RATE = 0.2;

interface WalkStep {
  readonly n: number;
  readonly title: string;
  readonly caption: string;
}

const STEPS: readonly WalkStep[] = [
  { n: 8, title: 'Being checked', caption: 'Backend adjudication' },
  { n: 9, title: 'Your order is ready', caption: 'We let you know' },
  { n: 10, title: 'Your adjusted order', caption: 'What stayed, what changed' },
  { n: 11, title: 'Payment', caption: 'Your share' },
  { n: 12, title: 'Receipt', caption: 'Straight after payment' },
  { n: 13, title: 'Confirmed with the provider', caption: 'Your order is placed' },
  { n: 14, title: 'Collection or scan', caption: 'The visit itself' },
  { n: 15, title: 'Report delivered', caption: 'In your health records' },
  { n: 16, title: 'Invoice', caption: 'After delivery, not payment' },
  { n: 17, title: 'If the order fails', caption: 'Refund' },
];

@Component({
  selector: 'opd-order-progress-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, EmptyView],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            [routerLink]="backLink()"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back a step"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1
              class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]"
            >
              {{ current().title }}
            </h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">
              Step {{ current().n }} of 17 — {{ current().caption }}
            </p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        @if (store.chosenTest(); as test) {
          <p class="mb-5 rounded-xl bg-warning-50 px-4 py-3 text-sm text-warning-700" role="note">
            A walkthrough. Nothing here is a real order — an order cannot be held for adjudication
            yet, so every step from the hold onwards is shown rather than run.
          </p>

          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            @switch (current().n) {
              @case (8) {
                <p class="text-sm text-ink-700">
                  We check what your plan covers, whether any of this duplicates a recent test, and
                  how often you are allowed it. Some tests can come off the order and the price can
                  change.
                </p>
                <p class="mt-3 text-sm font-medium text-ink-900">
                  Nothing is charged while this runs. Your cover is held, not spent.
                </p>
              }
              @case (9) {
                <p class="text-sm text-ink-700">
                  We tell you the moment it is decided, with anything that changed.
                </p>
                <p class="mt-3 rounded-xl bg-surface-sunk px-4 py-3 text-sm text-ink-500">
                  Sent by WhatsApp and push notification. Neither channel delivers yet — the message
                  is written and logged, and this list is where you would find it.
                </p>
              }
              @case (10) {
                <dl class="space-y-2 text-sm">
                  <div class="flex justify-between gap-3">
                    <dt class="text-ink-700">{{ test.name }}</dt>
                    <dd class="font-medium text-success-700">Kept</dd>
                  </div>
                  <div class="flex justify-between gap-3 border-t border-surface-border pt-2">
                    <dt class="text-ink-700">Order value</dt>
                    <dd class="font-medium text-ink-900">{{ fmt(orderValue()) }}</dd>
                  </div>
                  <div class="flex justify-between gap-3">
                    <dt class="text-ink-700">Paid from your cover</dt>
                    <dd class="font-medium text-success-700">{{ fmt(fromCover()) }}</dd>
                  </div>
                  <div class="flex justify-between gap-3">
                    <dt class="text-ink-700">Co-payment</dt>
                    <dd class="font-medium text-ink-900">{{ fmt(copay()) }}</dd>
                  </div>
                  <div class="flex justify-between gap-3 border-t border-surface-border pt-2">
                    <dt class="font-semibold text-ink-900">You pay</dt>
                    <dd class="text-lg font-bold text-ink-900">{{ fmt(copay()) }}</dd>
                  </div>
                </dl>
                <p class="mt-3 rounded-xl bg-surface-sunk px-4 py-3 text-sm text-ink-500">
                  Nothing was removed from this order. The co-payment is a flat 20% here — your real
                  share is worked out from your plan, and can differ.
                </p>
              }
              @case (11) {
                <p class="text-sm text-ink-700">
                  {{ fmt(fromCover()) }} comes from your cover and is blocked now. You pay
                  {{ fmt(copay()) }}.
                </p>
                <p class="mt-3 rounded-xl bg-surface-sunk px-4 py-3 text-sm text-ink-500">
                  Your share would go to the payment gateway. On this database that is the dummy
                  gateway, the same stand-in the rest of the portal uses.
                </p>
              }
              @case (12) {
                <p class="text-3xl font-bold text-[#0B2C63]">{{ fmt(copay()) }}</p>
                <p class="mt-0.5 text-sm text-ink-700">Paid by you</p>
                <dl class="mt-4 space-y-2 border-t border-surface-border pt-4 text-sm">
                  <div class="flex justify-between gap-3">
                    <dt class="text-ink-700">Test</dt>
                    <dd class="font-medium text-ink-900">{{ test.name }}</dd>
                  </div>
                  <div class="flex justify-between gap-3">
                    <dt class="text-ink-700">Provider</dt>
                    <dd class="text-right font-medium text-ink-900">{{ test.vendorName }}</dd>
                  </div>
                </dl>
                <p class="mt-3 text-sm text-ink-500">
                  A receipt confirms the payment. It is not the tax invoice — that comes after the
                  report, at step 16.
                </p>
              }
              @case (13) {
                <p class="text-sm text-ink-700">
                  Your order goes to {{ test.vendorName }}. Integrated partners confirm in real
                  time; the rest are confirmed by our team.
                </p>
              }
              @case (14) {
                <p class="text-sm text-ink-700">
                  @if (store.collection() === 'HOME') {
                    Their team collects your sample at {{ store.pincode() }}.
                  } @else {
                    You visit {{ store.chosenVendor()?.address }}.
                  }
                  @if (store.chosenSlot(); as slot) {
                    <span class="mt-2 block font-medium text-ink-900"
                      >{{ slot.date }} at {{ slot.startTime }}</span
                    >
                  }
                </p>
              }
              @case (15) {
                <p class="text-sm text-ink-700">
                  Your report lands here and in your health records. Integrated partners push it;
                  for the rest our team uploads it.
                </p>
                <p class="mt-3 text-sm text-ink-500">
                  This part is real on an order placed from a prescription — reports are listed and
                  open from the order screen.
                </p>
              }
              @case (16) {
                <p class="text-sm text-ink-700">
                  Raised once the report is delivered and the order closes.
                  <span class="font-medium text-ink-900"
                    >The invoice follows delivery, not payment</span
                  >, and your held cover becomes a debit at the same moment.
                </p>
                <p class="mt-3 rounded-xl bg-surface-sunk px-4 py-3 text-sm text-ink-500">
                  Nothing raises one today — the lab and radiology modules have no invoice at all.
                </p>
              }
              @case (17) {
                <p class="text-sm text-ink-700">
                  If the order is cancelled or fails after you have paid, the block on your cover is
                  released and the {{ fmt(copay()) }} you paid is refunded.
                </p>
                <p class="mt-3 rounded-xl bg-surface-sunk px-4 py-3 text-sm text-ink-500">
                  Your cover really is credited back today. The part you paid yourself has to be
                  refunded by hand — there is no gateway refund wired up.
                </p>
              }
            }
          </section>

          <div class="mt-5 flex flex-col gap-3 sm:flex-row">
            <a
              [routerLink]="backLink()"
              class="flex min-h-touch flex-1 items-center justify-center rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900 hover:bg-surface-sunk"
              >Back</a
            >
            @if (next(); as step) {
              <a
                [routerLink]="['/member', store.area(), 'flow', 'step', step]"
                class="flex min-h-touch flex-1 items-center justify-center rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white hover:bg-[#034DA2]"
                >Next step</a
              >
            } @else {
              <a
                [routerLink]="['/member', hub()]"
                class="flex min-h-touch flex-1 items-center justify-center rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white hover:bg-[#034DA2]"
                >Finish</a
              >
            }
          </div>
        } @else {
          <opd-empty
            title="Nothing to walk through"
            detail="Start from a test so the steps have something to show."
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
export class OrderProgressPage {
  /** 8 to 17, from the route. */
  readonly step = input<string>('8');

  protected readonly store = inject(DiagnosticsFlowStore);
  protected readonly fmt = formatMoney;

  protected readonly current = computed(
    () => STEPS.find((s) => String(s.n) === this.step()) ?? STEPS[0],
  );

  protected next(): number | null {
    const index = STEPS.findIndex((s) => s.n === this.current().n);
    return index >= 0 && index < STEPS.length - 1 ? STEPS[index + 1].n : null;
  }

  /** Step 8 goes back to the hold; the rest go back one step. */
  protected backLink(): unknown[] {
    const index = STEPS.findIndex((s) => s.n === this.current().n);
    return index <= 0
      ? ['/member', this.store.area(), 'flow', 'hold']
      : ['/member', this.store.area(), 'flow', 'step', STEPS[index - 1].n];
  }

  protected hub(): string {
    return this.store.area() === 'radiology' ? 'diagnostics' : 'lab-tests';
  }

  protected orderValue() {
    return money(this.store.total());
  }

  /** See COPAY_RATE — a stand-in for the plan's own calculation. */
  protected copay() {
    return money(Math.round(this.store.total() * COPAY_RATE));
  }

  protected fromCover() {
    return money(this.store.total() - Math.round(this.store.total() * COPAY_RATE));
  }
}
