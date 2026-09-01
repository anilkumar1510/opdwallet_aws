import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BookingsStore } from '../../core/bookings/bookings.store';
import { BookingKind } from '../../core/bookings/booking.model';
import { formatBookingWhen } from '../../core/bookings/booking-when';
import { formatMoney } from '../../core/domain/money';
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
          <ul class="grid gap-5 lg:grid-cols-2">
            @for (service of store.services(); track service.id) {
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

  protected readonly money = formatMoney;

  protected readonly config = computed(() => SCREENS[this.area()] ?? SCREENS['VISION']);

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
