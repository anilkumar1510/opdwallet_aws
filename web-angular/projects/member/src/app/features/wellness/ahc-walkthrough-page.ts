import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AhcBookingStore } from '../../core/ahc/ahc-booking.store';

/**
 * Flow 8, the annual health check — all 23 steps, one screen each.
 *
 * The journey itself is built and bookable: the three options, both legs of the
 * individual route, the once-a-year check, payment and the reports. What it has
 * never had is a way to SEE the whole shape, and flow 8 is the one flow where
 * that matters most — it branches into two routes that close each other off,
 * and the rule that pathology comes first is invisible until you hit it.
 *
 * So each step says what it is and, where a real screen exists, sends you to
 * it. `live` marks those. Two steps carry a `gap` note: the sheet splits the
 * provider from the centre beneath it, and this portal has no such split — the
 * centre IS the thing you choose. Everything else is built as described,
 * including route B, which collects both legs and places ONE order carrying
 * them (`AhcBookingStore.place` sends the lab and diagnostic halves together).
 */
interface AhcStep {
  readonly n: number;
  readonly title: string;
  readonly body: string;
  /** Route to the real screen, when there is one. */
  readonly live?: readonly string[];
  /** Named when the step is not built as its own thing. */
  readonly gap?: string;
}

const STEPS: readonly AhcStep[] = [
  {
    n: 1,
    title: 'Open the annual health check',
    body: 'The card shows only when the check is part of your plan. It can be taken once a year.',
    live: ['/member/wellness'],
  },
  {
    n: 2,
    title: 'Three options appear',
    body: 'Book pathology, book radiology, or book the whole package. Taking one closes the others — the cards grey out as soon as a route is chosen.',
    live: ['/member/wellness'],
  },
  {
    n: 3,
    title: 'Route A — pathology first',
    body: 'On the individual route, pathology has to be booked before radiology. Radiology cannot be booked on its own.',
    live: ['/member/ahc/booking'],
  },
  {
    n: 4,
    title: 'Postal code',
    body: 'Your postal code decides which providers can serve you.',
    live: ['/member/ahc/booking'],
  },
  {
    n: 5,
    title: 'Mode of collection',
    body: 'At home or at the collection centre. This applies to pathology only — radiology is always a centre visit.',
    live: ['/member/ahc/booking'],
  },
  {
    n: 6,
    title: 'Choose the pathology provider',
    body: 'Only providers who serve your postal code are listed.',
    live: ['/member/ahc/booking'],
  },
  {
    n: 7,
    title: 'Collection address',
    body: 'Needed when you have asked for home collection.',
    live: ['/member/ahc/booking'],
  },
  {
    n: 8,
    title: 'Date and time',
    body: 'Slots come from the provider you chose.',
    live: ['/member/ahc/booking'],
  },
  {
    n: 9,
    title: 'Place the booking',
    body: 'Checked against the once-a-year limit rather than a money limit — the annual health check is counted, not spent.',
    live: ['/member/ahc/booking'],
  },
  {
    n: 10,
    title: 'Pathology confirmed and billed',
    body: 'Billing happens here, whether or not you go on to book radiology. Booking the whole package greys out at this point.',
    gap: 'Confirmation and billing happen on the payment screen rather than as a step of their own.',
    live: ['/member/ahc/booking/payment'],
  },
  {
    n: 11,
    title: 'Route A — radiology after pathology',
    body: 'Radiology opens once a pathology booking exists.',
    live: ['/member/ahc/booking/diagnostic'],
  },
  {
    n: 12,
    title: 'Postal code',
    body: 'Confirm it again for the radiology leg.',
    live: ['/member/ahc/booking/diagnostic'],
  },
  {
    n: 13,
    title: 'Choose the radiology provider',
    body: 'No collection step here — radiology is a centre visit.',
    live: ['/member/ahc/booking/diagnostic'],
  },
  {
    n: 14,
    title: 'Choose the centre',
    body: 'The sheet separates the provider from the specific centre, because a centre has to hold the equipment your scans need.',
    gap: 'The branches listed under a centre are placeholders — the vendor API exposes no branch list — and nothing records which equipment a centre holds.',
    live: ['/member/ahc/booking/diagnostic'],
  },
  {
    n: 15,
    title: 'Date and time',
    body: 'Slots come from the centre.',
    live: ['/member/ahc/booking/diagnostic'],
  },
  {
    n: 16,
    title: 'Radiology placed and confirmed',
    body: 'Checked against the same once-a-year limit.',
    live: ['/member/ahc/booking/diagnostic'],
  },
  {
    n: 17,
    title: 'Route B — the whole package',
    body: 'Pathology and radiology together, in one journey. Taken instead of the individual route; once taken, the other two options close.',
    live: ['/member/wellness'],
  },
  {
    n: 18,
    title: 'Postal code',
    body: 'One postal code for the whole package.',
    live: ['/member/ahc/booking'],
  },
  {
    n: 19,
    title: 'Choose the provider',
    body: 'One provider covers the whole package on this route.',
    live: ['/member/ahc/booking'],
  },
  {
    n: 20,
    title: 'Choose the centre',
    body: 'The centre has to offer the full package.',
    gap: 'The same placeholder branches as step 14, on the screen that chooses the provider for the package.',
    live: ['/member/ahc/booking'],
  },
  {
    n: 21,
    title: 'Date and time',
    body: 'One appointment for both legs — a slot for the collection and a slot for the scan.',
    live: ['/member/ahc/booking/diagnostic'],
  },
  {
    n: 22,
    title: 'Place the booking',
    body: 'Checked against the once-a-year limit.',
    live: ['/member/ahc/booking'],
  },
  {
    n: 23,
    title: 'Package confirmed and billed',
    body: 'One booking covers both legs, billing is done, and the other two options grey out.',
    live: ['/member/ahc/booking/payment'],
  },
];

@Component({
  selector: 'opd-ahc-walkthrough-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
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
              Step {{ current().n }} of 23 — {{ routeLabel() }}
            </p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
          <p class="text-sm text-ink-700">{{ current().body }}</p>

          @if (current().gap; as gap) {
            <!--
              Named on the step it belongs to. A member walking this needs to
              know which parts of the description they will actually meet.
            -->
            <p class="mt-4 rounded-xl bg-warning-50 px-4 py-3 text-sm text-warning-700">
              <span class="font-semibold">Not as described:</span> {{ gap }}
            </p>
          } @else {
            <p class="mt-4 rounded-xl bg-success-50 px-4 py-3 text-sm text-success-700">
              Built, and this is the screen you would be on.
            </p>
          }

          @if (current().live; as link) {
            <a
              [routerLink]="link"
              class="mt-4 flex min-h-touch w-full items-center justify-center rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900 hover:bg-surface-sunk"
              >Open the real screen</a
            >
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
              [routerLink]="['/member/ahc/walkthrough', step]"
              class="flex min-h-touch flex-1 items-center justify-center rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white hover:bg-[#034DA2]"
              >Next step</a
            >
          } @else {
            <a
              routerLink="/member/wellness"
              class="flex min-h-touch flex-1 items-center justify-center rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white hover:bg-[#034DA2]"
              >Finish</a
            >
          }
        </div>

        <p class="mt-5 text-center text-sm text-ink-500">
          {{ built() }} of 23 steps are built as the sheet describes them.
        </p>
      </div>
    </div>
  `,
})
export class AhcWalkthroughPage {
  readonly step = input<string>('1');

  protected readonly booking = inject(AhcBookingStore);

  protected readonly current = computed(
    () => STEPS.find((s) => String(s.n) === this.step()) ?? STEPS[0],
  );

  /** Which of the sheet's three sections this step belongs to. */
  protected routeLabel(): string {
    const n = this.current().n;
    if (n <= 2) return 'Getting in';
    if (n <= 16) return 'Route A, the two legs';
    return 'Route B, the whole package';
  }

  protected next(): number | null {
    const index = STEPS.findIndex((s) => s.n === this.current().n);
    return index >= 0 && index < STEPS.length - 1 ? STEPS[index + 1].n : null;
  }

  protected backLink(): unknown[] {
    const index = STEPS.findIndex((s) => s.n === this.current().n);
    return index <= 0 ? ['/member/wellness'] : ['/member/ahc/walkthrough', STEPS[index - 1].n];
  }

  protected built(): number {
    return STEPS.filter((s) => !s.gap).length;
  }
}
