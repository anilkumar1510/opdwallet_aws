import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import {
  CONCERNS,
  DiagnosticTest,
  FlowArea,
  PLACEHOLDER_TESTS,
  matchesConcern,
  placeholderTest,
} from '../../core/diagnostics-flow/diagnostics-flow';
import { DiagnosticsFlowStore } from '../../core/diagnostics-flow/diagnostics-flow.store';
import { formatMoney } from '../../core/domain/money';
import { LoadingView } from '../../shared/ui/state-views';

/**
 * Flow 7 step 2 — "tabs grouped by common health concerns", and the list of
 * tests inside the one you pick.
 *
 * The tabs are the first thing on the screen, as the step describes. The postal
 * code sits under them because a test has no price until a provider near you
 * quotes one — so the concern is chosen first and priced second, rather than
 * making the member prove where they live before they can look at anything.
 */
@Component({
  selector: 'opd-concerns-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingView],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[1000px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            [routerLink]="['/member', hub()]"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1
              class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]"
            >
              {{ isRadiology() ? 'Scans by health concern' : 'Tests by health concern' }}
            </h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">
              Pick what you are checking on
            </p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[1000px] px-5 py-6 lg:px-8">
        <!--
          Step 2's own words: "first screen shows clickable tabs". So the tabs
          come first and are always here, whether or not a postal code has been
          entered — the concern is what the member came in knowing, and the
          postal code is only how we price it.

          Nothing in the data records which concern a test belongs to, so the
          grouping is ours. Said once, at the bottom, rather than on each tab.
        -->
        <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
          <h2 class="text-sm font-medium text-ink-900">What are you checking on?</h2>
          <div class="mt-3 flex flex-wrap gap-2">
            @for (concern of concerns; track concern.id) {
              <button
                type="button"
                class="min-h-touch rounded-xl border px-4 text-left text-sm font-semibold"
                [class]="
                  concern.id === selected()
                    ? 'border-[#0F5FDC] bg-[#0F5FDC] text-white'
                    : 'border-surface-border text-ink-900 hover:bg-surface-sunk'
                "
                (click)="selected.set(concern.id)"
              >
                {{ concern.label }}
              </button>
            }
          </div>
          <p class="mt-2 text-sm text-ink-500">{{ blurb() }}</p>
        </section>

        <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
          <label class="block">
            <span class="text-sm font-medium text-ink-900">Where are you?</span>
            <span class="mt-0.5 block text-sm text-ink-500">
              Prices come from the providers who serve your postal code.
            </span>
            <div class="mt-3 flex gap-2">
              <input
                type="text"
                inputmode="numeric"
                [value]="store.pincode()"
                (input)="store.pincode.set($any($event.target).value)"
                placeholder="e.g. 201301"
                class="min-h-touch min-w-0 flex-1 rounded-xl border border-surface-border px-3 text-sm text-ink-900 outline-none focus:border-[#0F5FDC]"
              />
              <button
                type="button"
                class="min-h-touch shrink-0 rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white disabled:opacity-60"
                [disabled]="!store.pincode().trim() || store.loading()"
                (click)="store.loadCatalogue()"
              >
                Find
              </button>
            </div>
          </label>
        </section>

        @if (store.error(); as problem) {
          <p class="mt-5 rounded-xl bg-danger-50 px-4 py-3 text-sm text-danger-700" role="alert">
            {{ problem }}
          </p>
        }

        @if (store.loading()) {
          <opd-loading label="Loading tests" />
        } @else if (!store.tests().length) {
          <p class="mt-5 text-sm text-ink-500">
            Enter your postal code to see which {{ isRadiology() ? 'scans' : 'tests' }} under
            {{ label() }} are available near you, and what they cost.
          </p>
        } @else {
          @if (visible().length) {
            <ul class="mt-5 grid gap-3 sm:grid-cols-2">
              @for (test of visible(); track test.id) {
                <li class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
                  <h2 class="text-base font-semibold text-[#0B2C63]">{{ test.name }}</h2>
                  <p class="mt-0.5 text-sm text-ink-500">{{ test.vendorName }}</p>
                  <p class="mt-3 text-lg font-bold text-ink-900">{{ money(test.price) }}</p>
                  @if (test.listPrice.amount > test.price.amount) {
                    <p class="text-xs text-ink-500 line-through">{{ money(test.listPrice) }}</p>
                  }
                  <button
                    type="button"
                    class="mt-4 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-4 text-sm font-semibold text-white hover:bg-[#034DA2]"
                    (click)="choose(test)"
                  >
                    See this test
                  </button>
                </li>
              }
            </ul>
          } @else {
            <!--
              An empty tab used to say only "nothing here", which reads as a
              category with nothing in it rather than one nobody near you
              prices. These name what belongs under it, and none of them can be
              chosen — a test no provider quotes would dead-end at an empty
              provider list two screens on.
            -->
            <p class="mt-5 text-sm text-ink-700">
              No provider near {{ store.pincode() }} prices anything under {{ label() }} yet. It
              would usually hold tests like these.
            </p>
            <ul class="mt-3 grid gap-3 sm:grid-cols-2">
              @for (name of placeholders(); track name) {
                <li class="rounded-2xl border border-dashed border-surface-border bg-white p-5">
                  <div class="flex items-start justify-between gap-3">
                    <h2 class="text-base font-semibold text-ink-700">{{ name }}</h2>
                    <span
                      class="shrink-0 rounded-md bg-warning-50 px-2 py-0.5 text-xs font-medium text-warning-700"
                      >Placeholder</span
                    >
                  </div>
                  <p class="mt-2 text-sm text-ink-500">
                    Nobody near you prices this. You can still walk the rest of the journey with
                    it — nothing will be ordered.
                  </p>
                  <button
                    type="button"
                    class="mt-4 min-h-touch w-full rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900 hover:bg-surface-sunk"
                    (click)="choosePlaceholder(name)"
                  >
                    Walk through with this
                  </button>
                </li>
              }
            </ul>
          }

          <p class="mt-5 rounded-xl bg-surface-sunk px-4 py-3 text-sm text-ink-500">
            These groupings are our own — nothing in the catalogue records which concern a test
            belongs to yet. Every test a nearby provider prices appears under one of them.
          </p>
        }
      </div>
    </div>
  `,
})
export class ConcernsPage {
  /** 'pathology' or 'radiology', from the route data — flow 7 step 1's two cards. */
  readonly area = input<FlowArea>('pathology');
  /** Set when the member picked a concern on the card itself — flow 7 step 1. */
  readonly concern = input<string | undefined>(undefined);

  protected readonly store = inject(DiagnosticsFlowStore);
  private readonly router = inject(Router);
  protected readonly money = formatMoney;
  protected readonly concerns = CONCERNS;

  protected readonly selected = signal(CONCERNS[0].id);

  constructor() {
    // A concern chosen on the previous screen opens on that tab.
    queueMicrotask(() => {
      const chosen = this.concern();
      if (chosen && CONCERNS.some((c) => c.id === chosen)) this.selected.set(chosen);
    });
    // Reads the route's area once, and clears a half-finished journey if the
    // member switched cards.
    queueMicrotask(() => this.store.setArea(this.area()));
  }

  protected isRadiology(): boolean {
    return this.area() === 'radiology';
  }

  protected hub(): string {
    return this.isRadiology() ? 'diagnostics' : 'lab-tests';
  }

  protected label(): string {
    return CONCERNS.find((c) => c.id === this.selected())?.label ?? '';
  }

  /** What this tab would hold — see `PLACEHOLDER_TESTS`. */
  protected placeholders(): readonly string[] {
    return PLACEHOLDER_TESTS[this.selected()] ?? [];
  }

  protected blurb(): string {
    return CONCERNS.find((c) => c.id === this.selected())?.blurb ?? '';
  }

  protected readonly visible = computed(() => {
    const concern = CONCERNS.find((c) => c.id === this.selected());
    if (!concern) return [];
    // One row per test name: the same test priced by three providers is one
    // thing to choose here, and the provider comes next.
    const seen = new Set<string>();
    return this.store.tests().filter((test) => {
      if (!matchesConcern(test, concern) || seen.has(test.code)) return false;
      seen.add(test.code);
      return true;
    });
  });

  /**
   * Opens the journey on a stand-in test, so the whole flow can be shown even
   * where the catalogue is thin. `isPlaceholder` travels with it and every
   * later screen repeats that nothing is being ordered.
   */
  protected choosePlaceholder(name: string): void {
    this.choose(placeholderTest(name));
  }

  protected choose(test: DiagnosticTest): void {
    this.store.chosenTest.set(test);
    void this.router.navigate(['/member', this.area(), 'flow', 'test']);
  }
}
