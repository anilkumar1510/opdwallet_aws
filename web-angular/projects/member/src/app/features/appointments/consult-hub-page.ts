import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { formatBookingWhen } from '../../core/bookings/booking-when';
import { Booking, BookingKind } from '../../core/bookings/booking.model';
import { BookingsStore } from '../../core/bookings/bookings.store';
import { formatMoney } from '../../core/domain/money';
import { EmptyView, ErrorView, LoadingView } from '../../shared/ui/state-views';
import { StatusBadge } from '../../shared/ui/status-badge';

interface HubConfig {
  readonly title: string;
  readonly subtitle: string;
  readonly emptyDetail: string;
  readonly cta: string;
  readonly basePath: string;
}

const HUBS: Readonly<Record<'IN_CLINIC' | 'ONLINE', HubConfig>> = {
  IN_CLINIC: {
    title: 'In-Clinic Consultation',
    subtitle: 'Book a doctor visit near you',
    emptyDetail: 'Appointments you book will appear here.',
    cta: 'Book Appointment',
    basePath: 'appointments',
  },
  ONLINE: {
    title: 'Online Consultation',
    subtitle: 'Talk to a doctor over video',
    emptyDetail: 'Video consultations you book will appear here.',
    cta: 'Book Consultation',
    basePath: 'online-consult',
  },
};

/**
 * The hub for both consultation journeys — /member/appointments and
 * /member/online-consult. `mode` comes from the route, as on the specialties
 * and doctors screens.
 *
 * web-member refetches `appointments/user/:id?type=IN_CLINIC|ONLINE` here.
 * BookingsStore already holds every appointment for the active family member,
 * so this filters that list rather than requesting a subset of what is already
 * in memory. Live, the unfiltered call returns 10: 2 in-clinic, 8 online.
 */
@Component({
  selector: 'opd-consult-hub-page',
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

      <div class="mx-auto max-w-[900px] px-5 py-6 lg:px-8">
        <a
          [routerLink]="['/member', config().basePath, 'specialties']"
          class="flex min-h-touch w-full items-center justify-center rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-95 lg:text-base"
          style="background: linear-gradient(90deg,#1F63B4 0%,#5DA4FB 100%)"
        >
          {{ config().cta }}
        </a>

        @if (store.loading()) {
          <opd-loading label="Loading appointments" />
        } @else if (store.error(); as error) {
          <opd-error [error]="error" (retry)="store.retry()" />
        } @else {
          @if (upcoming().length) {
            <section class="mt-6">
              <h2 class="mb-3 text-[18px] font-medium text-[#1c1c1c]">Upcoming</h2>
              <ul class="space-y-3">
                @for (booking of upcoming(); track booking.id) {
                  <li class="rounded-2xl border border-[#EDF0F7] bg-white p-4 shadow-sm">
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0 flex-1">
                        <p class="truncate text-base font-semibold text-[#034DA2]">
                          {{ booking.title }}
                        </p>
                        <p class="mt-0.5 truncate text-sm text-ink-700">{{ booking.subtitle }}</p>
                        <p class="mt-1 text-xs text-ink-500">{{ when(booking) }}</p>
                        <p class="mt-0.5 truncate text-xs text-ink-500">{{ booking.location }}</p>
                      </div>
                      <div class="shrink-0 text-right">
                        <opd-status-badge [status]="booking.status" />
                        <p class="mt-2 text-base font-semibold text-[#303030]">
                          {{ money(booking.amount) }}
                        </p>
                      </div>
                    </div>

<!-- The reference's rule exactly: a CONFIRMED online appointment
                         with no prescription yet (online-consult/page.tsx:312).
                         A prescription means the consultation is over.

                         The route takes the Mongo _id, NOT the APT- reference:
                         joinConsultation does new Types.ObjectId(appointmentId)
                         and a business id would throw. Booking.id is that _id
                         (booking.mapper.ts:94); Booking.reference is not. -->
                    @if (canJoin(booking)) {
                      <a
                        class="mt-3 flex min-h-touch w-full items-center justify-center rounded-xl bg-[#0F5FDC] px-4 text-sm font-semibold text-white"
                        [routerLink]="['/member/consultations', booking.id]"
                        >Join call</a
                      >
                    }
                  </li>
                }
              </ul>
            </section>
          }

          @if (past().length) {
            <section class="mt-7">
              <h2 class="mb-3 text-[18px] font-medium text-[#1c1c1c]">Past</h2>
              <ul class="space-y-3">
                @for (booking of past(); track booking.id) {
                  <li class="rounded-2xl border border-[#EDF0F7] bg-white p-4 shadow-sm">
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0 flex-1">
                        <p class="truncate text-base font-semibold text-[#034DA2]">
                          {{ booking.title }}
                        </p>
                        <p class="mt-0.5 truncate text-sm text-ink-700">{{ booking.subtitle }}</p>
                        <p class="mt-1 text-xs text-ink-500">{{ when(booking) }}</p>
                      </div>
                      <div class="shrink-0 text-right">
                        <opd-status-badge [status]="booking.status" />
                        <p class="mt-2 text-base font-semibold text-[#303030]">
                          {{ money(booking.amount) }}
                        </p>
                      </div>
                    </div>

                    <!-- Also here, because the reference gates on STATUS alone
                         and never on the date. A consultation confirmed for an
                         hour ago is still one the member should be able to join;
                         "Past" here only means the scheduled time has passed. -->
                    @if (canJoin(booking)) {
                      <a
                        class="mt-3 flex min-h-touch w-full items-center justify-center rounded-xl bg-[#0F5FDC] px-4 text-sm font-semibold text-white"
                        [routerLink]="['/member/consultations', booking.id]"
                        >Join call</a
                      >
                    }
                  </li>
                }
              </ul>
            </section>
          }

          @if (!mine().length) {
            <opd-empty title="No appointments yet" [detail]="config().emptyDetail" />
          }
        }
      </div>
    </div>
  `,
})
export class ConsultHubPage {
  /** 'IN_CLINIC' or 'ONLINE', supplied by the route's data. */
  readonly mode = input<'IN_CLINIC' | 'ONLINE'>('IN_CLINIC');

  protected readonly store = inject(BookingsStore);
  protected readonly money = formatMoney;
  protected readonly when = formatBookingWhen;

  protected readonly config = computed(() => HUBS[this.mode()]);

  /** `all`, not the filtered list, so the Bookings screen's chips cannot leak in. */
  protected readonly mine = computed(() =>
    this.store
      .all()
      .filter(
        (booking) =>
          booking.kind === BookingKind.Appointment && booking.consultMode === this.mode(),
      ),
  );

  protected readonly upcoming = computed(() => this.mine().filter((b: Booking) => b.isUpcoming));

  /**
   * Only ONLINE consultations get a call. An in-clinic appointment shares this
   * screen and must not offer one — `config().basePath` distinguishes the two
   * journeys, but `consultMode` is the property of the booking itself.
   */
  protected canJoin(booking: Booking): boolean {
    return (
      booking.consultMode === 'ONLINE' &&
      booking.statusCode === 'CONFIRMED' &&
      !booking.hasPrescription
    );
  }
  protected readonly past = computed(() => this.mine().filter((b: Booking) => !b.isUpcoming));
}
