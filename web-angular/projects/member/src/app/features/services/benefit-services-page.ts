import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BookingsStore } from '../../core/bookings/bookings.store';
import { WalletStore } from '../../core/wallet/wallet.store';
import { BookingKind } from '../../core/bookings/booking.model';
import { formatBookingWhen } from '../../core/bookings/booking-when';
import { formatMoney } from '../../core/domain/money';
import { consultationService } from '../../core/services/benefit-services';
import { BenefitServicesStore } from '../../core/services/benefit-services.store';
import { SERVICE_SCREEN_COPY } from '../../core/services/benefit-services';
import { EmptyView, ErrorView, LoadingView } from '../../shared/ui/state-views';
import { StatusBadge } from '../../shared/ui/status-badge';

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

interface ScreenConfig {
  readonly categoryId: string;
  readonly title: string;
  readonly subtitle: string;
  readonly emptyTitle: string;
  readonly bookingKind: BookingKind;
  readonly tab: string;
}

const SCREENS: Readonly<Record<string, ScreenConfig>> = {
  VISION: {
    categoryId: 'CAT007',
    ...SERVICE_SCREEN_COPY.VISION,
    bookingKind: BookingKind.Vision,
    tab: 'vision',
  },
  DENTAL: {
    categoryId: 'CAT006',
    ...SERVICE_SCREEN_COPY.DENTAL,
    bookingKind: BookingKind.Dental,
    tab: 'dental',
  },
};

/**
 * Vision (CAT007) and Dental (CAT006) — bookable service cards plus the
 * member's existing bookings. Both categories are the same contract, so one
 * screen serves them; `area` comes from the route.
 */
@Component({
  selector: 'opd-benefit-services-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingView, ErrorView, EmptyView, StatusBadge],
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
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">{{ config().title }}</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">{{ config().subtitle }}</p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[1240px] px-5 py-6 lg:px-8">
        @if (store.loading()) {
          <opd-loading label="Loading services" />
        } @else if (store.noCover()) {
          <opd-empty
            title="No active cover"
            detail="Your policy assignment is not currently in force, so these services cannot be booked. Contact your administrator."
          />
        } @else if (store.error(); as error) {
          <opd-error [error]="error" (retry)="store.retry()" />
        } @else if (store.services().length) {
          <!--
            Sheet flow 3 step 2 - "Policy coverage details appear: eligible
            amount, frequency and covered items are shown. Coverage is shown
            instead of a payment breakdown, because nothing is charged here."

            The covered items were always the cards below; what was missing was
            the money. Every figure comes from wallet/balance - available and
            total from the category, the two limits from the config block beside
            it. Nothing is computed here.
          -->
          @if (cover(); as cover) {
            <section class="mb-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
              <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">Your cover</h2>
              <dl class="mt-3 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Available to use</dt>
                  <dd class="font-semibold text-ink-900">
                    {{ cover.isUnlimited ? 'Unlimited' : money(cover.available) }}
                  </dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Used so far</dt>
                  <dd class="font-medium text-ink-900">{{ money(cover.consumed) }}</dd>
                </div>
                @if (cover.annualLimit; as annual) {
                  <div class="flex justify-between gap-3">
                    <dt class="text-ink-700">Each policy year</dt>
                    <dd class="font-medium text-ink-900">{{ money(annual) }}</dd>
                  </div>
                }
                @if (cover.perClaimLimit; as perClaim) {
                  <div class="flex justify-between gap-3">
                    <dt class="text-ink-700">Most per booking</dt>
                    <dd class="font-medium text-ink-900">{{ money(perClaim) }}</dd>
                  </div>
                }
              </dl>

              @if (cover.isExhausted) {
                <p class="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700">
                  You have used all of this cover for the current policy year.
                </p>
              }
            </section>
          }

          <!--
            Flow 4 step 2 - "Compare dentists". The sheet makes this the ENTRY
            POINT: "Fees, availability, experience and distance are compared
            side by side. Comparison view is the entry point, not a plain list."

            It is not built as an entry point and cannot be yet, for two
            reasons worth keeping visible rather than burying:

              - There are no dentists. A dental booking records a clinic and
                nothing else, so there is nobody to compare or to show
                experience for. It is the same gap that stops step 24's "same
                dentist who recommended the procedure" from being enforceable.
              - A fee is per service. Nothing can be priced until a service is
                chosen, so a comparison ahead of that has no fee column.

            What exists is a CLINIC comparison one step in, on fees and
            availability, naming the two dimensions it cannot fill. This says so
            and points at it, instead of leaving the member to discover that the
            sheet's first real step is missing.
          -->
          @if (isDental()) {
            <section class="mb-5 rounded-2xl border border-dashed border-[#0F5FDC] bg-white p-5">
              <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">Compare dentists</h2>
              <p class="mt-1 text-sm text-ink-700">
                Comparing dentists by experience is not available yet — we do not hold a dentist on
                a dental booking, only the clinic.
              </p>
              <p class="mt-2 text-sm text-ink-500">
                You can still compare the clinics that offer each treatment, on fee and
                availability.
              </p>
              <a
                routerLink="/member/dental/compare"
                class="mt-4 flex min-h-touch w-full items-center justify-center rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white hover:bg-[#034DA2]"
                >Compare clinics side by side</a
              >
            </section>
          }

          <!--
            Step 3. The order journey is the one the sheet describes; the cards
            below are a clinic booking, which appears in neither sheet. Both are
            offered while retiring one is an open decision.
          -->
          @if (isVision()) {
            <a
              routerLink="/member/vision/order"
              class="mb-5 flex min-h-touch w-full items-center justify-center rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white hover:bg-[#034DA2]"
              >Start a new order and get a coupon</a
            >
          }

          <!--
            Dental only. These cards open the clinic-booking journey - clinics,
            slots, confirm, pay - which is dental's actual flow 4: compare
            dentists, book a visit, pick a slot.

            Vision does not work that way. Its journey is an order and a coupon
            spent at a partner, and the clinic model appears in neither the
            Patient Flows sheet nor the Vision Backend tab. It also had no data:
            vision-bookings/clinics returned an empty list on the live database,
            so every card led to a dead end.

            The booking routes are left in place so existing bookings and old
            links still resolve; what is removed is the way in.
          -->
          @if (!isVision()) {
          <ul class="grid gap-5 lg:grid-cols-2">
            @for (service of bookable(); track service.id) {
              <li
                class="rounded-2xl border border-[#F0C89A] p-6"
                style="background: linear-gradient(180deg,#F3F7FF 0%,#E9F1FF 100%)"
              >
                <h2 class="text-xl font-bold text-[#034DA2]">{{ service.name }}</h2>
                @if (service.description) {
                  <p class="mt-2 text-sm text-ink-700">{{ service.description }}</p>
                }
                <a
                  [routerLink]="['/member', config().tab, 'clinics']"
                  [queryParams]="{ serviceCode: service.code }"
                  class="mt-5 flex min-h-touch items-center justify-center rounded-xl text-base font-semibold text-white transition-opacity hover:opacity-90"
                  style="background: linear-gradient(90deg,#1A4E8F 0%,#5AA0E8 100%)"
                >
                  Book Now
                </a>
              </li>
            }
          </ul>
          <p class="mt-4 rounded-xl bg-surface-sunk px-4 py-3 text-sm text-ink-500">
            Fillings, X-rays and other treatment are not booked here. Your dentist recommends them
            at the visit and gives you an estimate — we check that against your plan before anything
            is charged.
          </p>
          }
        } @else {
          <opd-empty
            [title]="config().emptyTitle"
            detail="Your plan does not include bookable services in this category."
          />
        }

        @if (myBookings().length) {
          <section class="mt-8">
            <h2 class="mb-3 text-[18px] font-medium text-[#1c1c1c]">Your bookings</h2>
            <ul class="space-y-3">
              @for (booking of myBookings(); track booking.id) {
                <li class="rounded-2xl border border-[#EDF0F7] bg-white p-4 shadow-sm">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-base font-semibold text-[#034DA2]">
                        {{ booking.title }}
                      </p>
                      <p class="mt-0.5 truncate text-sm text-ink-700">{{ booking.location }}</p>
                      <p class="mt-1 text-xs text-ink-500">{{ when(booking) }}</p>
                    </div>
                    <div class="shrink-0 text-right">
                      <opd-status-badge [status]="booking.status" />
                      <p class="mt-2 text-base font-semibold text-[#303030]">
                        {{ money(booking.amount) }}
                      </p>
                    </div>
                  </div>
                </li>
              }
            </ul>

            <a
              [routerLink]="['/member/bookings']"
              [queryParams]="{ tab: config().tab }"
              class="mt-4 flex min-h-touch w-full items-center justify-center rounded-xl border border-[#C9D8F0] bg-white px-5 text-sm font-semibold text-[#0E51A2] transition-colors hover:bg-[#F5F8FF]"
            >
              View all {{ config().tab }} bookings
            </a>
          </section>
        }
      </div>
    </div>
  `,
})
export class BenefitServicesPage {
  /** 'VISION' or 'DENTAL', supplied by the route's data. */
  readonly area = input<string>('VISION');

  protected readonly store = inject(BenefitServicesStore);
  private readonly bookings = inject(BookingsStore);
  private readonly wallet = inject(WalletStore);

  protected readonly money = formatMoney;

  protected readonly config = computed(() => SCREENS[this.area()] ?? SCREENS['VISION']);

  /**
   * Dental books the consultation and nothing else — see `consultationService`.
   * Vision is unaffected: its services genuinely are the things being bought.
   */
  protected readonly bookable = computed(() => {
    const services = this.store.services();
    if (this.area() !== 'DENTAL') return services;
    const consultation = consultationService(services);
    return consultation ? [consultation] : [];
  });

  protected readonly isVision = computed(() => this.area() === 'VISION');
  protected readonly isDental = computed(() => this.area() === 'DENTAL');

  /**
   * This screen's own category balance — sheet step 2's "eligible amount and
   * frequency".
   *
   * Read from the wallet rather than fetched again: the shell already loads it
   * for the balance in the header, and a second request for numbers already in
   * memory would show the member two figures that can disagree while one is in
   * flight.
   */
  protected readonly cover = computed(
    () =>
      this.wallet
        .wallet()
        ?.categories.find((category) => category.code === this.config().categoryId) ?? null,
  );

  constructor() {
    effect(() => this.store.select(this.config().categoryId));
  }

  /** `all`, not the filtered list, so the Bookings screen's chips cannot leak in. */
  protected readonly myBookings = computed(() =>
    this.bookings.all().filter((booking) => booking.kind === this.config().bookingKind),
  );

  protected readonly when = formatBookingWhen;

  protected date(value: Date | null): string {
    return value ? DATE.format(value) : 'Date not recorded';
  }
}
