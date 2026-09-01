import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { OrderValidation as CoverCheck } from '../../core/domain/cover-check';
import { formatMoney } from '../../core/domain/money';
import { FamilyStore } from '../../core/family/family.store';
import { VaccinationStore } from '../../core/vaccination/vaccination.store';
import { LoadingView } from '../../shared/ui/state-views';

const DATE = new Intl.DateTimeFormat('en-IN', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** Step 5: review everything, then create the booking. */
@Component({
  selector: 'opd-vaccination-confirm-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingView],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            [routerLink]="['/member/vaccination/select-slot']"
            [queryParams]="{ serviceId: serviceId(), vendorId: vendorId(), patientId: patientId() }"
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
                <dt class="text-xs uppercase tracking-wide text-ink-500">Vaccine</dt>
                <dd class="mt-0.5 text-lg font-bold text-[#0B2C63]">{{ serviceName() }}</dd>
              </div>
              <div class="border-t border-surface-border pt-4">
                <dt class="text-xs uppercase tracking-wide text-ink-500">Patient</dt>
                <dd class="mt-0.5 font-medium text-ink-900">{{ patientName() }}</dd>
              </div>
              <div class="border-t border-surface-border pt-4">
                <dt class="text-xs uppercase tracking-wide text-ink-500">Provider</dt>
                <dd class="mt-0.5 font-medium text-ink-900">{{ vendor()?.name }}</dd>
                <dd class="text-sm text-ink-700">{{ vendor()?.address }}</dd>
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
export class VaccinationConfirmPage {
  readonly serviceId = input<string>('');
  readonly vendorId = input<string>('');
  readonly patientId = input<string>('');
  readonly slotId = input<string>('');
  readonly appointmentDate = input<string>('');
  readonly appointmentTime = input<string>('');

  protected readonly store = inject(VaccinationStore);
  private readonly family = inject(FamilyStore);
  private readonly router = inject(Router);

  protected readonly money = formatMoney;

  constructor() {
    // Both lists may be cold on a deep link (services list is loaded once
    // globally; vendors need this specific service asked for explicitly).
    this.store.loadServices();
    effect(() => this.store.loadVendors(this.serviceId()));

    effect(() => {
      const vendor = this.vendor();
      const slotId = this.slotId();
      const patientId = this.patientId();
      if (!vendor || !slotId || !patientId) {
        this.cover.set(null);
        return;
      }
      void this.store
        .validate({
          patientId,
          vendorId: vendor.id,
          serviceId: this.serviceId(),
          slotId,
          price: vendor.price.amount,
          appointmentDate: this.appointmentDate(),
        })
        .then((result) => this.cover.set(result));
    });
  }

  protected readonly vendor = computed(() => this.store.vendorById(this.vendorId()));

  protected readonly serviceName = computed(
    () => this.store.serviceById(this.serviceId())?.name ?? '',
  );

  protected readonly patientName = computed(
    () => this.family.family().find((member) => member.id === this.patientId())?.fullName ?? '',
  );

  protected readonly price = computed(
    () => this.vendor()?.price ?? { amount: 0, currency: 'INR' as const },
  );

  protected readonly dateLabel = computed(() => {
    const raw = this.appointmentDate();
    const parsed = raw ? new Date(raw) : null;
    return parsed && !Number.isNaN(parsed.getTime()) ? DATE.format(parsed) : raw;
  });

  /** Null until the API has been asked, or if the check itself failed. */
  protected readonly cover = signal<CoverCheck | null>(null);

  protected readonly canConfirm = computed(
    () => this.cover()?.isValid !== false && !this.store.validating() && !this.store.booking(),
  );

  protected readonly ready = computed(
    () => this.vendor() !== undefined && this.patientName() !== '',
  );

  protected async confirm(): Promise<void> {
    const vendor = this.vendor();
    if (!vendor) return;

    const created = await this.store.create({
      patientId: this.patientId(),
      vendorId: vendor.id,
      serviceId: this.serviceId(),
      serviceCode: this.store.serviceById(this.serviceId())?.code ?? '',
      serviceName: this.serviceName(),
      slotId: this.slotId(),
      price: vendor.price.amount,
      appointmentDate: this.appointmentDate(),
      appointmentTime: this.appointmentTime(),
    });

    if (created === null) return;

    // Same rule as dental: a booking that owes nothing goes straight to the
    // list; one with a payment still owed goes to the payment screen.
    if (created.paymentId) {
      await this.router.navigate(['/member/payments', created.paymentId]);
      return;
    }
    await this.router.navigate(['/member/bookings'], { queryParams: { tab: 'vaccination' } });
  }
}
