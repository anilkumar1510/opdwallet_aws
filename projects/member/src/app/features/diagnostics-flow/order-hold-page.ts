import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DiagnosticsFlowStore } from '../../core/diagnostics-flow/diagnostics-flow.store';
import { formatMoney, money } from '../../core/domain/money';

/**
 * Flow 7 steps 8 to 17 — everything after the order goes on hold.
 *
 * None of it is built, and the reason is one thing rather than ten: an order
 * cannot be held. `OrderStatus` runs PLACED, CONFIRMED, SAMPLE_COLLECTED,
 * PROCESSING, COMPLETED, CANCELLED — there is no state for "waiting on
 * adjudication", and orders are created already paid. Adjudication does exist,
 * but it runs on a PRESCRIPTION before an order exists, which is why the
 * portal's other diagnostics journey starts with an upload.
 *
 * So this screen ends the journey where the code actually ends it, and sets out
 * what would follow. It offers the prescription route as the way to place a
 * real order today, because that one works end to end.
 */
@Component({
  selector: 'opd-order-hold-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            [routerLink]="['/member', store.area(), 'flow', 'review']"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to your order"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1
              class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]"
            >
              On hold
            </h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">
              {{ store.chosenTest()?.name }}
            </p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        <p class="mb-5 rounded-xl bg-warning-50 px-4 py-3 text-sm text-warning-700" role="note">
          This order is not real. We cannot hold an order yet — orders are created already paid, and
          there is no state for one waiting on a decision. Everything below is what would happen
          next.
        </p>

        <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
          <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">Your order</h2>
          <dl class="mt-3 space-y-2 text-sm">
            <div class="flex justify-between gap-3">
              <dt class="text-ink-700">Test</dt>
              <dd class="font-medium text-ink-900">{{ store.chosenTest()?.name }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-ink-700">Provider</dt>
              <dd class="text-right font-medium text-ink-900">
                {{ store.chosenVendor()?.name }}
              </dd>
            </div>
            <div class="flex justify-between gap-3 border-t border-surface-border pt-2">
              <dt class="font-semibold text-ink-900">Order value</dt>
              <dd class="text-lg font-bold text-ink-900">{{ fmt(total()) }}</dd>
            </div>
          </dl>
        </section>

        <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
          <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">What would happen next</h2>
          <ol class="mt-3 space-y-2.5">
            <li class="text-sm text-ink-500">
              We check coverage, duplicate tests and how often you have had them. Some tests may
              come off the order, and the price may change. Nothing is charged while that runs.
            </li>
            <li class="text-sm text-ink-500">
              We tell you the order is ready, with whatever changed.
            </li>
            <li class="text-sm text-ink-900">
              You see what stayed, what was removed and what you owe, and you pay your share.
            </li>
            <li class="text-sm text-ink-500">
              Your receipt is issued, and the order is placed with the provider.
            </li>
            <li class="text-sm text-ink-500">
              They collect the sample or see you at the centre, and your report arrives in your
              health records.
            </li>
            <li class="text-sm text-ink-500">
              The invoice is raised once the report is delivered — it follows delivery, not payment.
            </li>
            <li class="text-sm text-ink-500">
              If the order fails after payment, your cover is released and what you paid is
              refunded.
            </li>
          </ol>
        </section>

        <!-- Steps 8 to 17, one screen each, for showing the journey whole. -->
        <a
          [routerLink]="['/member', store.area(), 'flow', 'step', 8]"
          class="mt-5 flex min-h-touch w-full items-center justify-center rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white hover:bg-[#034DA2]"
          >Walk through what happens next</a
        >

        <!--
          Not a consolation prize: the prescription route reaches a real order,
          a real payment and a real report today. Sending someone there is the
          most useful thing this screen can do.
        -->
        <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
          <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">To book this for real</h2>
          <p class="mt-1 text-sm text-ink-700">
            Upload your prescription instead. That route places a real order with a provider, takes
            payment and delivers the report.
          </p>
          <a
            [routerLink]="['/member', hub(), 'upload']"
            class="mt-4 flex min-h-touch w-full items-center justify-center rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white hover:bg-[#034DA2]"
            >Upload a prescription</a
          >
          <a
            [routerLink]="['/member', hub()]"
            class="mt-3 flex min-h-touch w-full items-center justify-center rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900 hover:bg-surface-sunk"
            >Back to {{ store.area() === 'radiology' ? 'radiology' : 'pathology' }}</a
          >
        </section>
      </div>
    </div>
  `,
})
export class OrderHoldPage {
  protected readonly store = inject(DiagnosticsFlowStore);
  protected readonly fmt = formatMoney;

  protected total() {
    return money(this.store.total());
  }

  protected hub(): string {
    return this.store.area() === 'radiology' ? 'diagnostics' : 'lab-tests';
  }
}
