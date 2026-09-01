import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AppointmentBookingStore } from '../../core/appointments/booking.store';
import { InClinicFlowStore } from '../../core/appointments/inclinic-flow.store';
import { ConsultDay, ConsultMode } from '../../core/appointments/booking';
import { relationshipLabel } from '../../core/domain/codes';
import { OrderValidation as CoverCheck } from '../../core/domain/cover-check';
import { formatMoney } from '../../core/domain/money';
import { FamilyStore } from '../../core/family/family.store';
import { Member } from '../../core/member/member.model';
import { TransactionsStore } from '../../core/transactions/transactions.store';
import { LoadingView } from '../../shared/ui/state-views';

const DATE = new Intl.DateTimeFormat('en-IN', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** Final step: review, check wallet coverage, then book. */
@Component({
  selector: 'opd-appointment-confirm-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingView],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            [routerLink]="['/member', basePath(), isOnline() ? 'doctors' : 'select-slot']"
            [queryParams]="backParams()"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">Confirm Appointment</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">Review the details before booking</p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        @if (!doctor()) {
          <opd-loading label="Loading details" />
        } @else {
          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <dl class="space-y-4">
              <div>
                <dt class="text-xs uppercase tracking-wide text-ink-500">Doctor</dt>
                <dd class="mt-0.5 text-lg font-bold text-[#0B2C63]">{{ doctor()?.name }}</dd>
                <dd class="text-sm text-ink-700">{{ specialtyName() }}</dd>
              </div>
              <div class="border-t border-surface-border pt-4">
                <dt class="text-xs uppercase tracking-wide text-ink-500">Patient</dt>
                <dd class="mt-0.5 font-medium text-ink-900">{{ patientName() }}</dd>
              </div>
              <div class="border-t border-surface-border pt-4">
                <dt class="text-xs uppercase tracking-wide text-ink-500">Type</dt>
                <dd class="mt-0.5 font-medium text-ink-900">
                  {{ isOnline() ? 'Video consultation' : 'In clinic' }}
                </dd>
                @if (!isOnline() && clinic(); as venue) {
                  <dd class="text-sm text-ink-700">{{ venue.name }} — {{ venue.addressLine }}</dd>
                }
              </div>
              @if (!isOnline()) {
                <div class="border-t border-surface-border pt-4">
                  <dt class="text-xs uppercase tracking-wide text-ink-500">When</dt>
                  <dd class="mt-0.5 font-medium text-ink-900">{{ dateLabel() }}</dd>
                  <dd class="text-sm text-ink-700">{{ timeSlot() }}</dd>
                </div>
              }
              <div class="flex items-center justify-between border-t border-surface-border pt-4">
                <dt class="font-semibold text-ink-900">Consultation fee</dt>
                <dd class="text-xl font-bold text-[#0B2C63]">{{ money(fee()) }}</dd>
              </div>
            </dl>
          </section>

          <!-- ONLINE only: IN_CLINIC already chose the patient on its own
               select-patient page before reaching here. -->
          @if (isOnline() && family.family().length > 1) {
            <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
              <h2 class="mb-4 text-base font-semibold text-[#0E51A2] lg:text-lg">Select Patient</h2>
              <div class="space-y-2">
                @for (member of family.family(); track member.id) {
                  <button
                    type="button"
                    class="block w-full rounded-xl border-2 p-3 text-left transition-colors"
                    [class.border-\[#0F5FDC\]]="patient()?.id === member.id"
                    [class.bg-blue-50]="patient()?.id === member.id"
                    [class.border-surface-border]="patient()?.id !== member.id"
                    [attr.aria-pressed]="patient()?.id === member.id"
                    (click)="selectedPatientId.set(member.id)"
                  >
                    <span class="block text-sm font-medium text-ink-900">{{ member.fullName }}</span>
                    <span class="block text-xs text-ink-500">{{ relationship(member) }}</span>
                  </button>
                }
              </div>
            </section>
          }

          <!-- ONLINE only: the reference collects these three on this screen.
               IN_CLINIC gets the equivalents from its own select-slot step. -->
          @if (isOnline()) {
            <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
              <h2 class="mb-4 text-base font-semibold text-[#0E51A2] lg:text-lg">
                How should the doctor reach you?
              </h2>

              <label for="contactNumber" class="mb-1 block text-sm font-medium text-ink-700"
                >Contact number</label
              >
              <input
                id="contactNumber"
                name="contactNumber"
                type="tel"
                required
                placeholder="Enter contact number"
                class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm"
                [value]="contactNumber()"
                (input)="contactNumber.set($any($event.target).value)"
              />

              <p class="mb-2 mt-4 text-sm font-medium text-ink-700">Call preference</p>
              <div class="grid grid-cols-3 gap-2">
                @for (option of callOptions; track option.value) {
                  <button
                    type="button"
                    class="min-h-touch rounded-xl border-2 px-2 text-sm font-medium transition-colors"
                    [class.border-\[#0F5FDC\]]="callPreference() === option.value"
                    [class.bg-blue-50]="callPreference() === option.value"
                    [class.border-surface-border]="callPreference() !== option.value"
                    [attr.aria-pressed]="callPreference() === option.value"
                    (click)="callPreference.set(option.value)"
                  >
                    {{ option.label }}
                  </button>
                }
              </div>

              <p class="mb-2 mt-4 text-sm font-medium text-ink-700">When</p>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  class="min-h-touch rounded-xl border-2 px-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                  [class.bg-blue-50]="timeChoice() === 'NOW'"
                  [attr.aria-pressed]="timeChoice() === 'NOW'"
                  [disabled]="!canConsultNow()"
                  [title]="canConsultNow() ? '' : 'This doctor has no slot within the next 5 minutes'"
                  (click)="timeChoice.set('NOW')"
                >
                  Consult Now
                </button>
                <button
                  type="button"
                  class="min-h-touch rounded-xl border-2 px-2 text-sm font-medium transition-colors"
                  [class.bg-blue-50]="timeChoice() === 'LATER'"
                  [attr.aria-pressed]="timeChoice() === 'LATER'"
                  (click)="timeChoice.set('LATER')"
                >
                  Schedule Later
                </button>
              </div>
              @if (!canConsultNow()) {
                <p class="mt-2 text-xs text-warning-700">
                  This doctor isn't free right now — schedule a slot instead.
                </p>
              }

              @if (timeChoice() === 'LATER') {
                <div class="mt-4">
                  @if (laterDays().length) {
                    <div class="flex gap-2 overflow-x-auto pb-2">
                      @for (day of laterDays(); track day.date) {
                        <button
                          type="button"
                          class="min-h-touch shrink-0 rounded-xl border px-3 text-sm"
                          [class.bg-blue-50]="day.date === laterDate()"
                          (click)="pickDay(day.date)"
                        >
                          {{ day.date }}
                        </button>
                      }
                    </div>
                    <div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      @for (slot of laterSlots(); track slot.id) {
                        <button
                          type="button"
                          class="min-h-touch rounded-xl border px-2 text-sm disabled:pointer-events-none disabled:opacity-40"
                          [class.bg-blue-50]="slot.id === onlineSlotId()"
                          [disabled]="!slot.isAvailable"
                          (click)="pickSlot(slot.id, slot.label)"
                        >
                          {{ slot.label }}
                        </button>
                      }
                    </div>
                  } @else {
                    <p class="text-sm text-ink-500">No times available for this doctor.</p>
                  }
                </div>
              }
            </section>
          }

          <!-- Wallet coverage, checked before committing. -->
          @if (validation(); as check) {
            <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
              <h2 class="mb-3 text-base font-semibold text-[#0E51A2] lg:text-lg">Payment</h2>
              <!-- Line order and gating follow the reference's PaymentProcessor
                   breakdown (components/PaymentProcessor.tsx:347-410). One label
                   deliberately differs: see the wallet/insurance note below. -->
              <dl class="space-y-2 text-sm">
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Consultation fee</dt>
                  <dd class="font-medium text-ink-900">{{ money(check.billAmount) }}</dd>
                </div>

                @if (check.walletBalance.amount > 0) {
                  <div class="flex justify-between gap-3">
                    <dt class="text-ink-700">Wallet balance</dt>
                    <dd class="font-medium text-ink-900">{{ money(check.walletBalance) }}</dd>
                  </div>
                }

                @if (check.copay.amount > 0) {
                  <div class="flex justify-between gap-3">
                    <dt class="text-danger-700">
                      Your copay@if (check.copayPercentage > 0) {
                        <span> ({{ check.copayPercentage }}%)</span>
                      }
                    </dt>
                    <dd class="font-medium text-danger-700">&minus; {{ money(check.copay) }}</dd>
                  </div>
                  <div class="flex justify-between gap-3 border-t border-surface-border pt-2">
                    <dt class="text-ink-700">Insurance eligible amount</dt>
                    <dd class="font-medium text-ink-900">{{ money(check.insuranceEligible) }}</dd>
                  </div>
                }

                @if (check.excess.amount > 0 && check.serviceLimit.amount > 0) {
                  <div class="flex justify-between gap-3 rounded-lg bg-warning-50 px-2 py-1.5">
                    <dt class="text-warning-700">Service transaction limit applied</dt>
                    <dd class="font-medium text-warning-700">Max {{ money(check.serviceLimit) }}</dd>
                  </div>
                  <div class="flex justify-between gap-3">
                    <dt class="text-danger-700">Additional out-of-pocket</dt>
                    <dd class="font-medium text-danger-700">&minus; {{ money(check.excess) }}</dd>
                  </div>
                }

                @if (check.fromWallet.amount > 0) {
                  <div class="flex justify-between gap-3 border-t border-surface-border pt-2">
                    <dt class="font-medium text-success-700">Paid from your wallet</dt>
                    <dd class="font-medium text-success-700">{{ money(check.fromWallet) }}</dd>
                  </div>
                }

                <div class="flex justify-between gap-3 border-t border-surface-border pt-2">
                  <dt class="font-semibold text-ink-900">You pay total</dt>
                  <dd class="text-lg font-bold text-danger-700">{{ money(check.youPay) }}</dd>
                </div>
              </dl>

              @if (check.excess.amount > 0 && check.serviceLimit.amount > 0) {
                <p class="mt-3 rounded-xl bg-[#EAF1FB] px-3 py-2 text-xs text-[#0B2C63]">
                  <strong>Note:</strong> this service has a transaction limit of
                  {{ money(check.serviceLimit) }}. After applying your
                  @if (check.copayPercentage > 0) {
                    <span>{{ check.copayPercentage }}% </span>
                  }
                  copay ({{ money(check.copay) }}), your wallet can cover a maximum of
                  {{ money(check.fromWallet) }}. You pay the remaining
                  {{ money(check.excess) }} out of pocket.
                </p>
              }
              @for (warning of check.warnings; track warning) {
                <p class="mt-3 rounded-xl bg-warning-50 px-3 py-2 text-sm text-warning-700">
                  {{ warning }}
                </p>
              }
              @if (check.reason) {
                <p class="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700">
                  {{ check.reason }}
                </p>
              }
            </section>
          }

          @if (confirmProblem(); as problem) {
            <p class="mt-4 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">
              {{ problem }}
            </p>
          }

          @if (store.bookingError(); as error) {
            <p class="mt-4 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">
              {{ error }}
            </p>
          }

          <button
            type="button"
            class="mt-5 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#034DA2] disabled:opacity-50"
            [disabled]="store.booking() || blocked()"
            (click)="confirm()"
          >
            {{ store.booking() ? 'Booking…' : 'Confirm appointment' }}
          </button>
        }
      </div>
    </div>
  `,
})
export class AppointmentConfirmPage {
  readonly mode = input<ConsultMode>('IN_CLINIC');
  readonly doctorId = input<string>('');
  readonly clinicId = input<string>('');
  readonly specialtyId = input<string>('');
  readonly specialtyName = input<string>('');
  readonly patientId = input<string>('');
  readonly slotId = input<string>('');
  readonly appointmentDate = input<string>('');
  readonly timeSlot = input<string>('');

  protected readonly store = inject(AppointmentBookingStore);
  private readonly flow = inject(InClinicFlowStore);
  private readonly transactions = inject(TransactionsStore);
  protected readonly family = inject(FamilyStore);
  private readonly router = inject(Router);

  protected readonly money = formatMoney;
  protected readonly callOptions = [
    { value: 'VOICE' as const, label: 'Voice' },
    { value: 'VIDEO' as const, label: 'Video' },
    { value: 'BOTH' as const, label: 'Voice & Video' },
  ];
  protected readonly validation = signal<CoverCheck | null>(null);
  /** Set when confirm cannot proceed, so the screen says so instead of no-opping. */
  protected readonly confirmProblem = signal<string | null>(null);

  // ONLINE only. The reference collects these on this screen; IN_CLINIC gets the
  // equivalents from its select-slot step, so they stay unused there.
  protected readonly contactNumber = signal('');
  /** Guards the prefill so it happens once and never fights the member. */
  private contactPrefilled = false;
  protected readonly callPreference = signal<'VOICE' | 'VIDEO' | 'BOTH'>('BOTH');
  protected readonly timeChoice = signal<'NOW' | 'LATER'>('NOW');
  protected readonly laterDays = signal<readonly ConsultDay[]>([]);
  protected readonly laterDate = signal('');
  protected readonly onlineSlotId = signal('');
  protected readonly onlineTime = computed(() =>
    this.timeChoice() === 'NOW' ? 'Immediate' : this.laterTime(),
  );
  protected readonly laterTime = signal('');
  /**
   * NOW books today, matching the reference. `toLocaleDateString('en-CA')`,
   * not `toISOString()` — the latter converts to UTC first, which reads as
   * "yesterday" for any member west of UTC-ahead midnight (e.g. IST, 00:00-
   * 05:30) clicking Consult Now on what their own calendar already calls today.
   */
  protected readonly onlineDate = computed(() =>
    this.timeChoice() === 'NOW' ? new Date().toLocaleDateString('en-CA') : this.laterDate(),
  );
  protected readonly laterSlots = computed(
    () => this.laterDays().find((day) => day.date === this.laterDate())?.slots ?? [],
  );

  /** IN_CLINIC never shows this control at all, so default true is never seen. */
  protected readonly canConsultNow = computed(() => this.doctor()?.canConsultNow ?? true);

  constructor() {
    // Doctors may be cold on a deep link, so ask for the list explicitly.
    effect(() => this.store.selectDoctors(this.specialtyId(), this.mode()));

    // If this doctor turns out to have nothing within 5 minutes, NOW is not a
    // real option — move off it rather than leave a disabled choice selected.
    effect(() => {
      if (!this.canConsultNow() && this.timeChoice() === 'NOW') this.timeChoice.set('LATER');
    });

    // The reference prefills the contact number from the member's own record —
    // once. Re-filling whenever the field is empty would stop the member
    // clearing it, which is what an earlier version of this effect did.
    effect(() => {
      const phone = this.family.activeMember()?.phone;
      if (phone && !this.contactPrefilled) {
        this.contactPrefilled = true;
        this.contactNumber.set(phone);
      }
    });

    // Slot options for "Schedule later". ONLINE has no clinic, so no clinicId.
    effect(() => {
      if (!this.isOnline() || this.timeChoice() !== 'LATER') return;
      const id = this.doctorId();
      if (!id) return;
      void this.store.days(id, '').then((days) => {
        this.laterDays.set(days);
        if (days.length && !this.laterDate()) this.laterDate.set(days[0].date);
      });
    });

    // Check wallet coverage as soon as the fee is known.
    effect(() => {
      const doctor = this.doctor();
      const patient = this.patient();
      if (!doctor || !patient) return;
      void this.runValidation();
    });
  }

  /**
   * ONLINE's own patient choice, made by tapping a card in the Select Patient
   * section below — matching the reference, which folds the picker into this
   * screen rather than giving it a separate route the way IN_CLINIC has one.
   * Null until the member taps a card, at which point it wins over the
   * defaulted-from-viewed-profile fallback in `patient` below.
   */
  protected readonly selectedPatientId = signal<string | null>(null);

  protected relationship(member: Member): string {
    return relationshipLabel(member.relationship);
  }

  /**
   * Who the appointment is for.
   *
   * IN_CLINIC supplies `patientId` from its select-patient step, which wins
   * outright. ONLINE has no such step — `selectedPatientId` is this screen's
   * own picker, and falls back to the active family member (rather than
   * leaving the screen with no patient) only until the member taps a card:
   * without that fallback the ONLINE journey rendered a blank patient, never
   * validated, and its confirm button silently did nothing.
   */
  protected readonly patient = computed<Member | null>(() => {
    const id = this.patientId();
    const family = this.family.family();
    if (id) return family.find((member) => member.id === id) ?? null;
    const chosen = this.selectedPatientId();
    if (chosen) return family.find((member) => member.id === chosen) ?? null;
    return this.family.activeMember();
  });

  protected readonly isOnline = computed(() => this.mode() === 'ONLINE');
  protected readonly basePath = computed(() =>
    this.isOnline() ? 'online-consult' : 'appointments',
  );
  protected readonly doctor = computed(() => this.store.doctorById(this.doctorId()));
  protected readonly clinic = computed(() =>
    this.doctor()?.clinics.find((candidate) => candidate.id === this.clinicId()),
  );
  protected readonly patientName = computed(() => this.patient()?.fullName ?? '');

  protected readonly fee = computed(() => {
    const doctor = this.doctor();
    if (!doctor) return { amount: 0, currency: 'INR' as const };
    return this.isOnline() ? doctor.onlineFee : (this.clinic()?.fee ?? doctor.onlineFee);
  });

  /** The API can refuse a booking outright; respect that. */
  protected readonly blocked = computed(() => this.validation()?.isValid === false);

  protected readonly dateLabel = computed(() => {
    const raw = this.appointmentDate();
    const parsed = raw ? new Date(raw) : null;
    return parsed && !Number.isNaN(parsed.getTime()) ? DATE.format(parsed) : raw;
  });

  protected backParams(): Record<string, string> {
    const base = { specialtyId: this.specialtyId(), specialtyName: this.specialtyName() };
    if (this.isOnline()) return base;
    return {
      ...base,
      doctorId: this.doctorId(),
      clinicId: this.clinicId(),
      patientId: this.patientId(),
    };
  }

  private async runValidation(): Promise<void> {
    this.validation.set(
      await this.store.validate({
        patientId: this.patient()?.id ?? '',
        doctorId: this.doctorId(),
        specialty: this.specialtyName(),
        consultationFee: this.fee().amount,
        appointmentType: this.mode(),
      }),
    );
  }

  protected pickDay(date: string): void {
    this.laterDate.set(date);
    this.onlineSlotId.set('');
    this.laterTime.set('');
  }

  protected pickSlot(id: string, label: string): void {
    this.onlineSlotId.set(id);
    this.laterTime.set(label);
  }

  protected async confirm(): Promise<void> {
    const doctor = this.doctor();
    const patient = this.patient();
    // Surface the failure rather than swallowing it. A silent return here is why
    // the ONLINE journey was dead for the whole audit: the button was enabled,
    // clicking it did nothing, and nothing said why.
    if (!doctor || !patient) {
      this.confirmProblem.set(
        !patient
          ? 'We could not tell who this appointment is for. Go back and choose a patient.'
          : 'We could not load this doctor. Go back and choose again.',
      );
      return;
    }
    if (this.isOnline() && !this.contactNumber().trim()) {
      this.confirmProblem.set('Enter a contact number so the doctor can reach you.');
      return;
    }
    if (this.isOnline() && this.timeChoice() === 'LATER' && !this.onlineSlotId()) {
      this.confirmProblem.set('Choose a time for your consultation.');
      return;
    }
    this.confirmProblem.set(null);

    const clinic = this.clinic();
    const created = await this.store.create({
      // In-clinic raises the request unpaid: the wallet settles only after the
      // clinic has confirmed the slot. See the field's own note for why this
      // one flag is what holds the sequence together.
      ...(this.isOnline() ? {} : { useWallet: false }),
      patientId: patient.id,
      patientName: patient.fullName,
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialty: this.specialtyName(),
      // The reference synthesises a slot id when the API did not supply one.
      // ONLINE has no slot route, so it builds one from the chosen date and time
      // exactly as web-member does: `<doctorId>_ONLINE_<date>_<time>`.
      slotId: this.isOnline()
        ? this.onlineSlotId() ||
          `${doctor.id}_ONLINE_${this.onlineDate()}_${this.onlineTime().replace(/[:\s]/g, '_')}`
        : this.slotId() ||
          `${doctor.id}_${this.clinicId()}_${this.appointmentDate()}_${this.timeSlot()}`,
      clinicId: clinic?.id,
      clinicName: clinic?.name,
      clinicAddress: clinic?.addressLine,
      appointmentType: this.mode(),
      appointmentDate: this.isOnline()
        ? this.onlineDate()
        : this.appointmentDate() || new Date().toISOString().slice(0, 10),
      timeSlot: this.isOnline() ? this.onlineTime() : this.timeSlot(),
      consultationFee: this.fee().amount,
      ...(this.isOnline()
        ? { contactNumber: this.contactNumber().trim(), callPreference: this.callPreference() }
        : {}),
    });

    if (created === null) return;

    // IN_CLINIC ends somewhere else entirely, and for a different reason than
    // ONLINE does. Nothing has been collected: the request is on hold with the
    // wallet portion blocked, waiting on operations to confirm the slot with
    // the clinic. So the member goes to the journey screen, which is where the
    // cart, the payment, the letter and the prescription all live.
    //
    // The API raises a payment alongside the appointment, and which one it
    // raised decides whether the journey can use it. Three shapes exist, and
    // only the first is the member's self-payment:
    //
    //   copay, wallet covers its share -> COPAY for exactly what is owed
    //                                     (verified: ₹250 on a ₹500 fee at 50%)
    //   wallet short of its share      -> shortfall + copay + excess, so MORE
    //                                     than the cart shows (verified: ₹500
    //                                     against a cart of ₹200)
    //   nothing owed                   -> the whole fee, out of pocket
    //
    // So the amount is checked rather than assumed. Settling a ₹500 record
    // while the cart says ₹200 would be a money bug, and the shape is not
    // knowable from the create response — it carries no payment amount.
    if (!this.isOnline()) {
      const check = this.validation();
      // Shape 2 from the comment above: when the category balance can't
      // cover the wallet's share, the API's own create-appointment logic
      // (appointments.service.ts:553-554) adds that shortfall on top of
      // copay+excess. The validate response never rolls it into
      // `totalMemberPayment` — it only surfaces `walletBalance` and
      // `fromWallet` separately — so this was never getting checked here,
      // and every shortfall booking had its real payment discarded as a
      // "mismatch" even though the API charged correctly.
      const shortfall = check ? Math.max(0, check.fromWallet.amount - check.walletBalance.amount) : 0;
      const owed = (check?.youPay.amount ?? 0) + shortfall;
      let paymentId: string | null = null;
      if (created.paymentId) {
        const raised = owed > 0 ? await this.transactions.paymentById(created.paymentId) : null;
        if (raised && raised.amount.amount === owed) paymentId = created.paymentId;
        if (!paymentId) await this.store.discardPayment(created.paymentId);
      }
      this.flow.start({
        appointmentId: created.appointmentId,
        doctorName: doctor.name,
        specialty: this.specialtyName(),
        clinicName: clinic?.name ?? '',
        clinicAddress: clinic?.addressLine ?? '',
        patientName: patient.fullName,
        appointmentDate: this.appointmentDate() || new Date().toISOString().slice(0, 10),
        timeSlot: this.timeSlot(),
        fee: this.fee().amount,
        // The split the member was just shown, carried forward verbatim so the
        // cart cannot quietly disagree with the screen they agreed to.
        blocked: check?.fromWallet.amount ?? this.fee().amount,
        selfPay: owed,
        copayPercentage: check?.copayPercentage ?? 0,
        paymentId,
        at: new Date().toISOString(),
      });
      await this.router.navigate(['/member/appointments/journey', created.appointmentId]);
      return;
    }

    // The wallet has already been settled by this call, and where a copay, a
    // shortfall or a full out-of-pocket charge remains the API creates it as a
    // PENDING payment whose `paymentId` comes back on `created`. The member is
    // NOT taken to settle it: both consult modes end on the bookings list.
    //
    // RULED session 50, after being built in 34 and reverted in 40 for want of a
    // ruling. Twelve unsettled consultation copays accumulated before criterion 6
    // made the gap visible.
    //
    // Booking-first is unchanged: the appointment exists before any payment
    // screen is reached. Only the DESTINATION comes from the reference — React
    // lands on /member/bookings?tab=doctors, and the payment screen's own
    // redirect param carries the member back there. RN's consultation hub was
    // considered and not adopted; see parity register entry 17.
    //
    // The payment screen's Cancel sits beside Pay and shares that redirect, so
    // this guarantees the member is TOLD what is owed, not that it is collected.
    // That was the basis of the ruling, not an oversight.
    //
    // Only when something is owed. Nothing outstanding goes to the list.
    if (created.paymentId) {
      await this.router.navigate(['/member/payments', created.paymentId]);
      return;
    }
    await this.router.navigate(['/member/bookings'], { queryParams: { tab: 'doctors' } });
  }
}
