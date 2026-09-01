import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { CLINIC_BOOKING_API, ClinicArea } from '../../core/clinic-booking/clinic-booking';
import { ClinicBookingStore } from '../../core/clinic-booking/clinic-booking.store';
import { OrderValidation as CoverCheck } from '../../core/domain/cover-check';
import { formatMoney } from '../../core/domain/money';
import { FamilyStore } from '../../core/family/family.store';
import { BenefitServicesStore } from '../../core/services/benefit-services.store';
import { LoadingView } from '../../shared/ui/state-views';

const DATE = new Intl.DateTimeFormat('en-IN', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** Step 4: review everything, then create the booking. */
@Component({
  selector: 'opd-confirm-booking-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingView],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            [routerLink]="['/member', basePath(), 'select-slot']"
            [queryParams]="{
              serviceCode: serviceCode(),
              clinicId: clinicId(),
              patientId: patientId(),
            }"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to slots"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">Confirm Booking</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">Review the details before booking</p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        @if (!ready()) {
          <opd-loading label="Loading details" />
        } @else {
          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <dl class="space-y-4">
              <div>
                <dt class="text-xs uppercase tracking-wide text-ink-500">Service</dt>
                <dd class="mt-0.5 text-lg font-bold text-[#0B2C63]">{{ serviceName() }}</dd>
              </div>
              <div class="border-t border-surface-border pt-4">
                <dt class="text-xs uppercase tracking-wide text-ink-500">Patient</dt>
                <dd class="mt-0.5 font-medium text-ink-900">{{ patientName() }}</dd>
              </div>
              <div class="border-t border-surface-border pt-4">
                <dt class="text-xs uppercase tracking-wide text-ink-500">Clinic</dt>
                <dd class="mt-0.5 font-medium text-ink-900">{{ clinic()?.name }}</dd>
                <dd class="text-sm text-ink-700">{{ clinic()?.addressLine }}</dd>
              </div>
              <div class="border-t border-surface-border pt-4">
                <dt class="text-xs uppercase tracking-wide text-ink-500">Appointment</dt>
                <dd class="mt-0.5 font-medium text-ink-900">{{ dateLabel() }}</dd>
                <dd class="text-sm text-ink-700">{{ appointmentTime() }}</dd>
              </div>
              @if (price().amount > 0) {
                <div class="flex items-center justify-between border-t border-surface-border pt-4">
                  <dt class="font-semibold text-ink-900">Amount</dt>
                  <dd class="text-xl font-bold text-[#0B2C63]">{{ money(price()) }}</dd>
                </div>
              }
            </dl>

            @if (store.validating()) {
              <p class="mt-4 text-xs text-ink-500">Checking your cover&hellip;</p>
            } @else if (cover(); as check) {
              <dl class="mt-4 space-y-2 border-t border-surface-border pt-4 text-sm">
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Paid from wallet</dt>
                  <dd class="font-medium text-success-700">{{ money(check.fromWallet) }}</dd>
                </div>
                @if (check.copay.amount > 0) {
                  <div class="flex justify-between gap-3">
                    <dt class="text-ink-700">Copay</dt>
                    <dd class="font-medium text-ink-900">{{ money(check.copay) }}</dd>
                  </div>
                }
                @if (check.excess.amount > 0) {
                  <div class="flex justify-between gap-3">
                    <dt class="text-ink-700">
                      Above the {{ money(check.serviceLimit) }} limit for this service
                    </dt>
                    <dd class="font-medium text-ink-900">{{ money(check.excess) }}</dd>
                  </div>
                }
                <div class="flex justify-between gap-3 border-t border-surface-border pt-2">
                  <dt class="font-semibold text-ink-900">You pay</dt>
                  <dd class="text-lg font-bold text-[#0B2C63]">{{ money(check.youPay) }}</dd>
                </div>
              </dl>

              @for (warning of check.warnings; track warning) {
                <p class="mt-2 rounded-xl bg-warning-50 px-3 py-2 text-xs text-warning-700">
                  {{ warning }}
                </p>
              }
              @if (!check.isValid) {
                <p class="mt-2 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">
                  {{ check.reason ?? 'This booking cannot be confirmed right now.' }}
                </p>
              } @else if (check.insufficientBalance) {
                <p class="mt-2 rounded-xl bg-warning-50 px-3 py-2 text-xs text-warning-700">
                  Your wallet balance of {{ money(check.walletBalance) }} does not cover this
                  booking.
                </p>
              }
            } @else {
              <p class="mt-4 text-xs text-ink-500">
                Wallet deduction and any copay are calculated by the clinic when the booking is
                confirmed.
              </p>
            }
          </section>

          @if (store.bookingError(); as error) {
            <p class="mt-4 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">
              {{ error }}
            </p>
          }

          <button
            type="button"
            class="mt-5 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#034DA2] disabled:opacity-50"
            [disabled]="!canConfirm()"
            (click)="confirm()"
          >
            {{ store.booking() ? 'Confirming…' : 'Confirm booking' }}
          </button>
        }
      </div>
    </div>
  `,
})
export class ConfirmBookingPage {
  readonly area = input<ClinicArea>('VISION');
  readonly serviceCode = input<string>('');
  readonly clinicId = input<string>('');
  readonly patientId = input<string>('');
  readonly slotId = input<string>('');
  readonly appointmentDate = input<string>('');
  readonly appointmentTime = input<string>('');

  protected readonly store = inject(ClinicBookingStore);
  private readonly family = inject(FamilyStore);
  private readonly services = inject(BenefitServicesStore);
  private readonly router = inject(Router);

  protected readonly money = formatMoney;

  protected readonly basePath = computed(() => CLINIC_BOOKING_API[this.area()].basePath);

  constructor() {
    // Both lists may be cold on a deep link, so ask for them explicitly.
    effect(() => this.services.select(CLINIC_BOOKING_API[this.area()].categoryId));
    effect(() => this.store.selectClinics(this.area(), this.serviceCode()));

    // Ask the API what this booking actually costs, as web-member does on this
    // step. Needs the clinic resolved, since the price comes from it.
    effect(() => {
      const clinic = this.clinic();
      const slotId = this.slotId();
      const patientId = this.patientId();
      if (!clinic || !slotId || !patientId) {
        this.cover.set(null);
        return;
      }
      void this.store
        .validate(this.area(), {
          patientId,
          clinicId: clinic.id,
          serviceCode: this.serviceCode(),
          slotId,
          price: clinic.servicePrice.amount,
        })
        .then((result) => this.cover.set(result));
    });
  }

  protected readonly clinic = computed(() => this.store.clinicById(this.clinicId()));

  protected readonly serviceName = computed(
    () =>
      this.services.services().find((service) => service.code === this.serviceCode())?.name ??
      this.serviceCode(),
  );

  protected readonly patientName = computed(
    () => this.family.family().find((member) => member.id === this.patientId())?.fullName ?? '',
  );

  protected readonly price = computed(
    () => this.clinic()?.servicePrice ?? { amount: 0, currency: 'INR' as const },
  );

  protected readonly dateLabel = computed(() => {
    const raw = this.appointmentDate();
    const parsed = raw ? new Date(raw) : null;
    return parsed && !Number.isNaN(parsed.getTime()) ? DATE.format(parsed) : raw;
  });

  /** Null until the API has been asked, or if the check itself failed. */
  protected readonly cover = signal<CoverCheck | null>(null);

  /**
   * A cover check that came back `valid: false` blocks the booking. One that
   * never arrived does not — the API rejects it again on create anyway.
   */
  protected readonly canConfirm = computed(
    () => this.cover()?.isValid !== false && !this.store.validating() && !this.store.booking(),
  );

  /** Every field the POST needs must be resolved before showing the button. */
  protected readonly ready = computed(
    () => this.clinic() !== undefined && this.patientName() !== '',
  );

  protected async confirm(): Promise<void> {
    const clinic = this.clinic();
    if (!clinic) return;

    const created = await this.store.create(this.area(), {
      patientId: this.patientId(),
      clinicId: this.clinicId(),
      serviceCode: this.serviceCode(),
      serviceName: this.serviceName(),
      slotId: this.slotId(),
      price: clinic.servicePrice.amount,
      appointmentDate: this.appointmentDate(),
      appointmentTime: this.appointmentTime(),
    });

    if (created === null) return;

    // Vision's own payment screen runs `process-payment`, which is what creates
    // its payment; the booking is all that exists at this point.
    if (this.area() === 'VISION') {
      await this.router.navigate(['/member/vision/payment', created.bookingId]);
      return;
    }

    // Dental settles against the wallet on this call, and where a copay or excess
    // remains the API creates it as a PENDING payment and returns its id. Take
    // the member there to settle it.
    //
    // RULED session 50, after being built in 34 and reverted in 40 for want of a
    // ruling. Booking-first is unchanged and is the point: the booking exists
    // before any payment screen is reached. The reference does the opposite —
    // it stashes the booking and creates it after payment — which is what left
    // thirteen payments with no booking behind them. Entry 5 rules that
    // do-not-port; this adopts the reference's DESTINATION only.
    //
    // Only when something is owed. A booking that owes nothing goes to the list.
    if (created.paymentId) {
      await this.router.navigate(['/member/payments', created.paymentId]);
      return;
    }
    await this.router.navigate(['/member/bookings'], { queryParams: { tab: 'dental' } });
  }
}
