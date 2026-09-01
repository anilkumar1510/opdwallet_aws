import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, input, resource } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { CLINIC_BOOKING_API } from '../../core/clinic-booking/clinic-booking';
import { ClinicBookingStore } from '../../core/clinic-booking/clinic-booking.store';
import { formatMoney, money } from '../../core/domain/money';
import { EmptyView, LoadingView } from '../../shared/ui/state-views';

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/** Step 5, vision only: the booking's payment summary after confirmation. */
@Component({
  selector: 'opd-vision-payment-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingView, EmptyView],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            routerLink="/member/bookings"
            [queryParams]="{ tab: 'vision' }"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to bookings"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">Booking Confirmed</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">{{ bookingId() }}</p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        @if (booking.isLoading()) {
          <opd-loading label="Loading booking" />
        } @else if (booking.value(); as detail) {
          <section
            class="rounded-2xl border border-success-700/20 bg-success-50 p-5 text-center lg:p-6"
          >
            <p class="text-3xl" aria-hidden="true">&#10003;</p>
            <h2 class="mt-2 text-lg font-bold text-success-700">Your booking is confirmed</h2>
            <p class="mt-1 text-sm text-ink-700">{{ detail.serviceName }}</p>
          </section>

          <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <h2 class="mb-3 text-base font-semibold text-[#0E51A2] lg:text-lg">Appointment</h2>
            <dl class="space-y-2 text-sm">
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Patient</dt>
                <dd class="font-medium text-ink-900">{{ detail.patientName }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Clinic</dt>
                <dd class="truncate pl-2 font-medium text-ink-900">{{ detail.clinicName }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">When</dt>
                <dd class="font-medium text-ink-900">
                  {{ date(detail.appointmentDate) }} at {{ detail.appointmentTime }}
                </dd>
              </div>
            </dl>
          </section>

          <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <h2 class="mb-3 text-base font-semibold text-[#0E51A2] lg:text-lg">Payment</h2>
            <dl class="space-y-2 text-sm">
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Bill amount</dt>
                <dd class="font-medium text-ink-900">{{ amount(detail.billAmount) }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Paid from wallet</dt>
                <dd class="font-medium text-success-700">{{ amount(detail.walletDebitAmount) }}</dd>
              </div>
              <div class="flex justify-between gap-3 border-t border-surface-border pt-2">
                <dt class="font-semibold text-ink-900">You pay</dt>
                <dd class="text-lg font-bold text-[#0B2C63]">
                  {{ amount(detail.totalMemberPayment) }}
                </dd>
              </div>
              @if (detail.paymentStatus) {
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Status</dt>
                  <dd class="font-medium text-ink-900">{{ detail.paymentStatus }}</dd>
                </div>
              }
            </dl>
          </section>

          @if (store.bookingError(); as error) {
            <p class="mt-4 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">
              {{ error }}
            </p>
          }

          <!-- Until this runs the booking exists but the wallet has not been
               debited, which is the step web-member performs here. -->
          @if (isUnpaid(detail)) {
            <button
              type="button"
              class="mt-5 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white hover:bg-[#034DA2] disabled:opacity-50"
              [disabled]="store.booking()"
              (click)="pay()"
            >
              {{ store.booking() ? 'Completing…' : 'Complete payment' }}
            </button>
          }

          <a
            routerLink="/member/bookings"
            [queryParams]="{ tab: 'vision' }"
            class="mt-3 flex min-h-touch w-full items-center justify-center rounded-xl border border-[#C9D8F0] bg-white px-6 text-sm font-semibold text-[#0E51A2] hover:bg-[#F5F8FF]"
          >
            View my bookings
          </a>
        } @else {
          <opd-empty title="Booking not found" detail="We could not find that booking." />
        }
      </div>
    </div>
  `,
})
export class VisionPaymentPage {
  readonly bookingId = input<string>('');

  private readonly http = inject(HttpClient);
  protected readonly store = inject(ClinicBookingStore);
  private readonly router = inject(Router);
  protected readonly amount = (value: number | undefined) => formatMoney(money(value));

  /** PAID and COMPLETED are both terminal; anything else still owes the debit. */
  protected isUnpaid(detail: { paymentStatus?: string }): boolean {
    const status = detail.paymentStatus?.trim().toUpperCase() ?? '';
    return status !== 'PAID' && status !== 'COMPLETED';
  }

  protected async pay(): Promise<void> {
    const result = await this.store.processVisionPayment(this.bookingId());
    if (!result) return;

    // A copay or excess continues at the gateway; wallet-only ends here.
    if (result.paymentRequired && result.paymentId) {
      await this.router.navigate(['/member/payments', result.paymentId]);
      return;
    }
    this.booking.reload();
  }

  protected readonly booking = resource({
    params: () => this.bookingId(),
    loader: async ({ params }) => {
      if (!params) return null;
      // This route returns the booking directly, not wrapped.
      const response = await firstValueFrom(
        this.http.get<Record<string, never>>(CLINIC_BOOKING_API['VISION'].byId(params)),
      );
      const data = (response as Record<string, unknown>)['data'] ?? response;
      return data as unknown as {
        serviceName: string;
        patientName: string;
        clinicName: string;
        appointmentDate: string;
        appointmentTime: string;
        billAmount: number;
        walletDebitAmount: number;
        totalMemberPayment: number;
        paymentStatus: string;
      };
    },
  });

  protected date(value: string): string {
    const parsed = value ? new Date(value) : null;
    return parsed && !Number.isNaN(parsed.getTime()) ? DATE.format(parsed) : value;
  }
}
