import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AhcBookingStore, AhcRoute } from '../../core/ahc/ahc-booking.store';
import { AhcStore } from '../../core/ahc/ahc.store';
import { AhcTest } from '../../core/ahc/ahc';
import { Icon } from '../../shared/ui/icon';
import { EmptyView, LoadingView } from '../../shared/ui/state-views';

const DATE = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

/**
 * Wellness Services — the CAT008 benefit, which is an Annual Health Checkup
 * package rather than a spend category. Mirrors web-member's
 * app/member/wellness/page.tsx.
 */
@Component({
  selector: 'opd-wellness-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, LoadingView, EmptyView],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[1240px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            routerLink="/member"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to home"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">Wellness Services</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">
              Access wellness and preventive care services
            </p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[900px] px-5 py-6 lg:px-8">
        @if (store.loading()) {
          <opd-loading label="Loading your package" />
        } @else if (store.checkupPackage(); as pkg) {
          <!-- Package summary -->
          <section class="rounded-2xl border border-surface-border bg-white p-6 shadow-soft">
            <div class="flex items-start gap-4">
              <span
                class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white"
                style="background: linear-gradient(180deg,#1a6fd4 0%,#034da2 100%)"
                aria-hidden="true"
              >
                <opd-icon name="sparkles" [size]="30" />
              </span>

              <div class="min-w-0 flex-1">
                <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Annual Health Check Package
                </p>
                <h2 class="mt-1 truncate text-2xl font-bold text-[#0B2C63]">{{ pkg.name }}</h2>
              </div>

              @if (eligible()) {
                <span
                  class="shrink-0 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-[#034DA2]"
                  >• Available</span
                >
              } @else {
                <span class="shrink-0 rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700"
                  >• Unavailable</span
                >
              }
            </div>

            <dl class="mt-6 grid grid-cols-2 gap-4 border-t border-surface-border pt-5">
              <div>
                <dt class="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Total Tests
                </dt>
                <dd class="mt-1 text-3xl font-bold text-[#0B2C63]">{{ pkg.totalTests }}</dd>
              </div>
              <div class="border-l border-surface-border pl-4">
                <dt class="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Valid Until
                </dt>
                <dd class="mt-1 text-3xl font-bold text-[#0B2C63]">{{ validUntil() }}</dd>
              </div>
            </dl>
          </section>

          @if (pkg.labTests.length) {
            <section class="mt-5 overflow-hidden rounded-2xl border border-surface-border bg-white">
              <header class="flex items-center gap-3 bg-[#F7FAFF] px-5 py-4">
                <span class="text-[#034DA2]" aria-hidden="true">
                  <opd-icon name="lab" [size]="20" />
                </span>
                <h3 class="flex-1 text-lg font-semibold text-[#034DA2]">Lab Tests</h3>
                <span
                  class="rounded-md bg-blue-50 px-2.5 py-0.5 text-sm font-medium text-[#034DA2]"
                  >{{ pkg.labTests.length }}</span
                >
              </header>
              <ul class="divide-y divide-surface-border">
                @for (test of pkg.labTests; track test.id) {
                  <li class="flex items-center gap-3 px-5 py-4">
                    <span class="text-[#034DA2]" aria-hidden="true">&#10003;</span>
                    <span class="text-ink-900">{{ test.name }}</span>
                  </li>
                }
              </ul>
            </section>
          }

          @if (pkg.diagnosticTests.length) {
            <section class="mt-5 overflow-hidden rounded-2xl border border-surface-border bg-white">
              <header class="flex items-center gap-3 bg-[#F7FAFF] px-5 py-4">
                <span class="text-[#034DA2]" aria-hidden="true">
                  <opd-icon name="records" [size]="20" />
                </span>
                <h3 class="flex-1 text-lg font-semibold text-[#034DA2]">Diagnostic Tests</h3>
                <span
                  class="rounded-md bg-blue-50 px-2.5 py-0.5 text-sm font-medium text-[#034DA2]"
                  >{{ pkg.diagnosticTests.length }}</span
                >
              </header>
              <ul class="divide-y divide-surface-border">
                @for (test of pkg.diagnosticTests; track test.id) {
                  <li class="flex items-center gap-3 px-5 py-4">
                    <span class="text-[#034DA2]" aria-hidden="true">&#10003;</span>
                    <span class="text-ink-900">{{ test.name }}</span>
                  </li>
                }
              </ul>
            </section>
          }

          <!-- Three entry options (Patient Flows section 8, step 2) -->
          <section class="mt-5 rounded-2xl border border-surface-border bg-white p-6">
            <h3 class="text-lg font-semibold text-[#034DA2]">Book your health check</h3>
            <!--
              Flow 8 branches into two routes that close each other off, and the
              rule that pathology comes first only shows up when you hit it.
              This walks all 23 steps and says which are built as described.
            -->
            <a
              [routerLink]="['/member/ahc/walkthrough', 1]"
              class="mt-1 inline-block text-sm font-medium text-brand-700 underline"
              >See how the whole journey works</a
            >
            <p class="mt-1 text-sm text-ink-700">
              @if (anyOpen()) {
                Book the two legs separately or take the whole package in one go. This benefit can
                be used <strong>once per policy year</strong> — choosing one option closes the others.
              } @else {
                {{ store.eligibility()?.reason ?? 'You have already used this benefit for the current policy year.' }}
              }
            </p>

            <!--
              Demonstration only. The once-a-year rule is right, and it closes
              every option the moment a check has been taken — which on a demo
              database is permanent, and leaves the whole journey unreachable.
              The API refuses this outside development.
            -->
            @if (!anyOpen()) {
              <div class="mt-3 border-t border-surface-border pt-3">
                <p class="text-xs text-ink-500">
                  For demonstrations: cancel this year's check and open the options again.
                </p>
                <button
                  type="button"
                  class="mt-2 min-h-touch w-full rounded-xl border border-dashed border-surface-border px-4 text-sm font-semibold text-ink-700 hover:bg-surface-sunk disabled:opacity-60"
                  [disabled]="resetting()"
                  (click)="startOver()"
                >
                  {{ resetting() ? 'Starting over…' : 'Start over (demo)' }}
                </button>
              </div>
            }

            <ul class="mt-4 space-y-3">
              @for (option of options(); track option.route) {
                <li>
                  <button
                    type="button"
                    class="flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    [class]="
                      option.disabled
                        ? 'border-[#E5E7EB] bg-gray-50'
                        : 'border-[#0F5FDC] bg-white hover:bg-blue-50'
                    "
                    [disabled]="option.disabled"
                    (click)="start(option.route)"
                  >
                    <div class="min-w-0 flex-1">
                      <p class="font-semibold text-[#0B2C63]">{{ option.title }}</p>
                      <p class="mt-0.5 text-sm text-ink-700">{{ option.detail }}</p>
                    </div>
                    @if (option.badge) {
                      <span class="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        {{ option.badge }}
                      </span>
                    }
                  </button>
                </li>
              }
            </ul>

            @if (booked().pathology && !booked().radiology) {
              <p class="mt-4 rounded-xl bg-warning-50 px-3 py-2 text-sm text-warning-700">
                Your pathology leg is booked and billed. Book radiology to use the rest of this
                benefit — it is billed either way.
              </p>
            }
          </section>

        } @else {
          <opd-empty
            title="No checkup package"
            detail="No annual health check package has been published for your policy."
          />
        }
      </div>
    </div>
  `,
})
export class WellnessPage {
  protected readonly store = inject(AhcStore);
  private readonly booking = inject(AhcBookingStore);
  private readonly router = inject(Router);

  protected readonly booked = this.booking.booked;

  constructor() {
    void this.store.load();
    void this.booking.loadBookedLegs();
  }

  /**
   * The three options and when each is closed.
   *
   * Radiology is deliberately not gated on `eligible()`: the eligibility route
   * reports "already booked this policy year" the moment the pathology order
   * exists, while the sheet wants the radiology leg to stay open after it.
   */
  protected readonly options = computed(() => {
    const booked = this.booked();
    const anyBooked = booked.pathology || booked.radiology;
    const eligible = this.eligible();
    return [
      {
        route: 'PATHOLOGY' as AhcRoute,
        title: 'Book Pathology',
        detail: 'Blood and sample tests. Book this first — radiology opens once it is booked.',
        disabled: booked.pathology || (!eligible && !anyBooked),
        badge: booked.pathology ? 'Booked' : '',
      },
      {
        route: 'RADIOLOGY' as AhcRoute,
        title: 'Book Radiology',
        detail: booked.pathology
          ? 'Scans at a centre. Your pathology leg is already booked.'
          : 'Scans at a centre. Available once pathology is booked.',
        disabled: !booked.pathology || booked.radiology,
        badge: booked.radiology ? 'Booked' : !booked.pathology ? 'Pathology first' : '',
      },
      {
        route: 'PACKAGE' as AhcRoute,
        title: 'Book the entire package',
        detail: 'Pathology and radiology together, in one journey.',
        disabled: anyBooked || !eligible,
        badge: anyBooked ? 'Closed' : '',
      },
    ];
  });

  /** Whether any of the three options can still be taken. */
  protected readonly anyOpen = computed(() => this.options().some((o) => !o.disabled));

  protected readonly resetting = signal(false);

  /** See the button's comment — development only, refused elsewhere. */
  protected async startOver(): Promise<void> {
    this.resetting.set(true);
    try {
      if (await this.booking.demoReset()) await this.store.refresh();
    } finally {
      this.resetting.set(false);
    }
  }

  protected async start(route: AhcRoute): Promise<void> {
    this.booking.setRoute(route);
    await this.router.navigate([
      route === 'RADIOLOGY' ? '/member/ahc/booking/diagnostic' : '/member/ahc/booking',
    ]);
  }

  protected readonly eligible = computed(() => this.store.eligibility()?.isEligible === true);

  protected readonly validUntil = computed(() => {
    const until = this.store.checkupPackage()?.validUntil;
    return until ? DATE.format(until) : 'No expiry';
  });

  protected trackTest(test: AhcTest): string {
    return test.id;
  }
}
