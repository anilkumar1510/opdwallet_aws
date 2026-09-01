import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';

import { RouterLink } from '@angular/router';

import { InClinicFlowStore } from '../../core/appointments/inclinic-flow.store';
import { Booking, BookingKind } from '../../core/bookings/booking.model';
import { formatBookingWhen } from '../../core/bookings/booking-when';
import { BookingsStore } from '../../core/bookings/bookings.store';
import { formatMoney } from '../../core/domain/money';
import { EmptyView, ErrorView, LoadingView } from '../../shared/ui/state-views';
import { StatusBadge } from '../../shared/ui/status-badge';
import { BackLink } from '../../shared/ui/back-link';
import { PageHeader } from '../../shared/ui/page-header';

/**
 * Order and keys mirror web-member's tabs, so `?tab=` matches either portal.
 * Vaccination is the exception — appended at the end, since web-member has no
 * such tab (its own vaccination journey was never wired to a real API either).
 */
const FILTERS: readonly { key: BookingKind | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: BookingKind.Appointment, label: 'Doctors' },
  { key: BookingKind.Lab, label: 'Lab' },
  { key: BookingKind.Diagnostic, label: 'Diagnostic' },
  { key: BookingKind.Pharmacy, label: 'Pharmacy' },
  { key: BookingKind.Dental, label: 'Dental' },
  { key: BookingKind.Vision, label: 'Vision' },
  { key: BookingKind.Ahc, label: 'Health checkup' },
  { key: BookingKind.Vaccination, label: 'Vaccination' },
];

@Component({
  selector: 'opd-bookings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    RouterLink,
    LoadingView,
    ErrorView,
    EmptyView,
    StatusBadge,
    BackLink,
    PageHeader,
  ],
  template: `
    <opd-page-header title="Bookings" subtitle="Consultations, dental and vision appointments" />

    <div class="mx-auto w-full max-w-[480px] px-5 pb-5 pt-6 lg:max-w-[1240px] lg:px-8 lg:py-6">
      <div class="hidden lg:block">
        <opd-back-link />
        <h1 class="text-2xl font-bold text-black lg:text-3xl">Bookings</h1>
        <p class="mt-0.5 text-sm text-ink-500">Consultations, dental and vision appointments</p>
      </div>

      @if (store.loading()) {
        <opd-loading label="Loading bookings" />
      } @else if (store.error(); as error) {
        <opd-error [error]="error" (retry)="store.retry()" />
      } @else {
        @if (store.invoiceError(); as error) {
          <p class="mb-3 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700">{{ error }}</p>
        }
        @if (store.cancelError(); as error) {
          <p class="mt-4 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">
            {{ error }}
          </p>
        }

        @if (store.partial().length) {
          <p class="mt-4 rounded-xl bg-warning-50 px-3 py-2 text-sm text-warning-700" role="status">
            Could not load {{ store.partial().join(' and ') }}. Everything else is shown below.
          </p>
        }

        <div class="scrollbar-hide mt-5 flex gap-2 overflow-x-auto pb-1">
          @for (filter of filters; track filter.key) {
            <button
              type="button"
              class="min-h-touch shrink-0 rounded-full border px-4 text-sm font-medium transition-colors"
              [class]="
                store.filter() === filter.key
                  ? 'border-[#034DA2] bg-[#034DA2] text-white'
                  : 'border-[#E5E7EB] bg-white text-ink-700 hover:border-[#A4BFFE7A]'
              "
              [attr.aria-pressed]="store.filter() === filter.key"
              (click)="store.setFilter(filter.key)"
            >
              {{ filter.label }} ({{ count(filter.key) }})
            </button>
          }
        </div>

        @if (store.bookings().length) {
          @if (store.upcoming().length) {
            <section class="mt-6">
              <h2 class="mb-3 text-[18px] font-medium text-[#1c1c1c]">Upcoming</h2>
              <ul class="space-y-3">
                @for (booking of store.upcoming(); track booking.id) {
                  <li>
                    <ng-container
                      [ngTemplateOutlet]="row"
                      [ngTemplateOutletContext]="{ $implicit: booking }"
                    />
                  </li>
                }
              </ul>
            </section>
          }

          @if (store.past().length) {
            <section class="mt-7">
              <h2 class="mb-3 text-[18px] font-medium text-[#1c1c1c]">Past</h2>
              <ul class="space-y-3">
                @for (booking of store.past(); track booking.id) {
                  <li>
                    <ng-container
                      [ngTemplateOutlet]="row"
                      [ngTemplateOutletContext]="{ $implicit: booking }"
                    />
                  </li>
                }
              </ul>
            </section>
          }
        } @else {
          <opd-empty title="Nothing here yet" detail="Bookings you make will appear here." />
        }
      }
    </div>

    <ng-template #row let-booking>
      <div
        class="rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white p-4"
        style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.24)"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="rounded-md bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-[#034DA2]">{{
                booking.kindLabel
              }}</span>
              <span class="truncate text-xs text-ink-500">{{ booking.reference }}</span>
            </div>
            <p class="mt-1 truncate text-base font-semibold text-[#034DA2]">{{ booking.title }}</p>
            <p class="mt-0.5 truncate text-sm text-ink-700">{{ booking.subtitle }}</p>
            <p class="mt-1 text-xs text-ink-500">{{ when(booking) }}</p>
            <p class="mt-0.5 truncate text-xs text-ink-500">{{ booking.location }}</p>
          </div>
          <div class="shrink-0 text-right">
            <opd-status-badge [status]="booking.status" />
            <p class="mt-2 text-base font-semibold text-[#303030]">{{ money(booking.amount) }}</p>
            @if (booking.walletPaid) {
              <p class="text-xs text-ink-500">{{ money(booking.walletPaid) }} from wallet</p>
            }
            <!-- Without this the row reads "₹1,000 · ₹400 from wallet" whether or
                 not the ₹600 copay has been settled, so a member holding a debt
                 sees the same thing as one who owes nothing. The journey ends on
                 this screen, so this is where it has to be said. See
                 audit/20-copay-continuation.md. -->
            @if (booking.outstanding) {
              <p class="text-xs font-semibold text-danger-700">
                {{ money(booking.outstanding) }} still to pay
              </p>
            }
            @if (booking.hasPrescription) {
              <p class="text-xs text-success-700">Prescription ready</p>
            }
            <!-- Two different facts used to share one flag. hasInvoice is
                 invoiceGenerated for dental and vision, but reportCount > 0
                 for a lab order - which is REPORTS, not an invoice. The row
                 said "Invoice available" for both, and only one of them has an
                 invoice route to download from. Split by invoicePath, which is
                 set only where an invoice genuinely exists. -->
            @if (booking.invoicePath) {
              <button
                type="button"
                class="text-xs font-medium text-primary-700 underline underline-offset-2 disabled:opacity-60"
                [disabled]="store.downloading() === booking.id"
                (click)="store.downloadInvoice(booking)"
              >
                {{ store.downloading() === booking.id ? 'Preparing invoice…' : 'Download invoice' }}
              </button>
            } @else if (booking.hasInvoice) {
              <p class="text-xs text-success-700">Reports available</p>
            }
          </div>
        </div>

        <!-- The way back into an in-clinic request. Without it the journey is a
             dead end: the member is told the cart is ready and has nowhere to
             open it, which is the whole reason the flow has a step 12. The
             label carries the urgency because the sheet's own notification —
             WhatsApp and push — does not exist yet, so this list is the only
             place the member will learn the clinic said yes. -->
        @if (journey(booking.reference); as inClinic) {
          <a
            [routerLink]="['/member/appointments/journey', booking.reference]"
            class="mt-3 flex min-h-touch w-full items-center justify-center rounded-xl px-4 text-sm font-semibold"
            [class]="
              inClinic.awaitingPayment
                ? 'bg-[#0F5FDC] text-white'
                : 'border border-[#0F5FDC] text-[#0F5FDC]'
            "
          >
            @if (inClinic.awaitingPayment) {
              Your cart is ready — pay {{ money(inClinic.selfPay) }}
            } @else {
              View request
            }
          </a>
        }

        <!-- Only from PENDING_CONFIRMATION or CONFIRMED, and only while the
             booking is still ahead — the same rule web-member applies. -->
        @if (booking.isCancellable) {
          <!-- One click cancels. The two-step confirm was removed on request:
               the action is reversible in the sense that matters (the wallet is
               refunded), and a member who taps "Cancel booking" has already
               decided. -->
          <button
            type="button"
            class="mt-3 min-h-touch w-full rounded-xl border border-danger-600 px-4 text-sm font-semibold text-danger-700 hover:bg-danger-50 disabled:opacity-60"
            [disabled]="store.cancelling()"
            (click)="cancel(booking)"
          >
            {{ store.cancelling() ? 'Cancelling…' : 'Cancel booking' }}
          </button>
        }

        <!-- Cancelling a PRESCRIPTION, which is not cancelling a booking: a
             different endpoint, a different rule (UPLOADED only) and a required
             reason. Kept separate from isCancellable above because a lab ORDER
             and a lab PRESCRIPTION are both BookingKind.Lab. -->
        @if (booking.cancelPrescriptionPath) {
          <!-- Also one click. The API demands a reason of 10-500 characters
               (CancelLabPrescriptionDto), so the portal sends a fixed one rather
               than making the member write an essay to withdraw their own upload.
               See cancelPrescription() below for what is sent. -->
          <button
            type="button"
            class="mt-3 min-h-touch w-full rounded-xl border border-danger-600 px-4 text-sm font-semibold text-danger-700 hover:bg-danger-50 disabled:opacity-60"
            [disabled]="store.cancellingPrescription() === booking.id"
            (click)="cancelPrescription(booking)"
          >
            {{ store.cancellingPrescription() === booking.id ? 'Cancelling…' : 'Cancel prescription' }}
          </button>
        }
      </div>
    </ng-template>
  `,
})
export class BookingsPage {
  /** Bound from ?tab= via withComponentInputBinding(), e.g. from the lab screen. */
  readonly tab = input<string | undefined>(undefined);

  protected readonly store = inject(BookingsStore);
  private readonly inClinic = inject(InClinicFlowStore);
  protected readonly money = formatMoney;
  protected readonly filters = FILTERS;

  /**
   * The in-clinic journey held against this booking, if there is one. Keyed by
   * `reference`, which for an appointment is the appointmentId the booking was
   * created with — `id` is the Mongo `_id` and would never match.
   */
  protected journey(reference: string) {
    return this.inClinic.view(reference);
  }

  constructor() {
    effect(() => {
      // Tab keys are already web-member's lowercase values, so compare as-is.
      const requested = this.tab()?.trim().toLowerCase();
      if (!requested) return;
      const match = FILTERS.find((filter) => filter.key === requested);
      this.store.setFilter(match ? match.key : 'ALL');
    });
  }

  /** Which row has its confirm step open; only ever one at a time. */
  /**
   * The API rejects a cancellation reason under 10 characters, so one is sent on
   * the member's behalf. It is deliberately neutral and identifies itself as
   * portal-generated: ops reads this field, and inventing a motive the member
   * never gave would be worse than saying plainly that none was collected.
   */
  private static readonly CANCEL_REASON = 'Cancelled by the member from the portal.';

  protected async cancelPrescription(booking: Booking): Promise<void> {
    await this.store.cancelPrescription(booking, BookingsPage.CANCEL_REASON);
  }

  protected async cancel(booking: Booking): Promise<void> {
    await this.store.cancel(booking);
  }

  protected count(key: BookingKind | 'ALL'): number {
    return this.store.counts()[key] ?? 0;
  }

  protected readonly when = formatBookingWhen;
}
