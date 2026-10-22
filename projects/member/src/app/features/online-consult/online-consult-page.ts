import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, signal, inject, OnInit } from '@angular/core';
import { OpdConsultationService, Speciality, Doctor, Patient, Slot, BookingResponse, CartSnapshot, CheckoutSnapshot } from '../../services/opd-consultation.service';
import moment from 'moment';
import { BenefitCategory, toBenefitCategory } from '../../core/domain/codes';
import { FamilyStore } from '../../core/family/family.store';
import { findRelationshipInVersion, getPrimaryRelationship } from '../../core/member/policy.mapper';
import { PolicyStore } from '../../core/member/policy.store';
import { CoverageBannerComponent } from '../../shared/ui/coverage-banner';
import { AgoraService } from '../../services/agora.service';
import { AgoraVideoComponent } from './components/agora-video.component';
import { ConsultHeaderComponent } from './components/consult-header.component';
import { SpecialitySelectionComponent } from './components/speciality-selection.component';
import { DoctorSelectionComponent } from './components/doctor-selection.component';
import { PatientSelectionComponent } from './components/patient-selection.component';
import { WizardStepComponent } from './components/wizard-step.component';
import { AppointmentDateSliderComponent } from './components/appointment-date-slider/appointment-date-slider.component';
import { CommonModule } from '@angular/common';

type Step = 'find' | 'schedule' | 'details' | 'payment' | 'confirmed' | 'consultation' | 'prescription';

@Component({
  selector: 'opd-online-consult-page',
  standalone: true,
  imports: [
    CommonModule,
    ConsultHeaderComponent,
    CoverageBannerComponent,
    SpecialitySelectionComponent,
    DoctorSelectionComponent,
    PatientSelectionComponent,
    WizardStepComponent,
    AppointmentDateSliderComponent,
    AgoraVideoComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <opd-consult-header (back)="headerBack()" />

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        @if (!started()) {
          <opd-coverage-banner [category]="BenefitCategory.OnlineConsultation" />
          <button type="button" class="min-h-touch w-full rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white hover:bg-[#034DA2]" (click)="start()">
            Find a doctor →
          </button>
        } @else {
          <opd-wizard-step
            [title]="'Book consultation'"
            [stepIndex]="step()"
            [totalSteps]="steps().length"
            (back)="back()"
            (next)="next()"
            [primaryLabel]="primaryLabel()"
          >
            <ng-container [ngSwitch]="currentStep()">
              <ng-container *ngSwitchCase="'find'">
                <div class="space-y-4">
                  @if (isLoading('specialities')) {
                    <div class="flex justify-center py-4"><div class="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div></div>
                  } @else if (getError('specialities'); as err) {
                    <p class="rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700 flex items-center gap-2" role="alert">
                      <span>⚠</span> {{ err }} <button class="ml-2 underline text-sm" (click)="pickSpeciality('retry')">Retry</button>
                    </p>
                  }
                  <opd-speciality-selection [specialities]="specialities()" [selectedSpeciality]="speciality()" (specialitySelected)="pickSpeciality($event)" />
                  @if (speciality()) {
                    <div class="mt-5 border-t border-surface-border pt-4">
                      @if (isLoading('doctors')) {
                        <div class="flex justify-center py-4"><div class="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div></div>
                      } @else if (getError('doctors'); as err) {
                        <p class="rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700 flex items-center gap-2" role="alert">
                          <span>⚠</span> {{ err }} <button class="ml-2 underline text-sm" (click)="pickSpeciality(speciality())">Retry</button>
                        </p>
                      }
                      <opd-doctor-selection [speciality]="speciality()" [doctors]="filteredDoctors()" [selectedDoctor]="doctor()" (searchChanged)="onSearchChange($event)" (doctorSelected)="selectDoctor($event)" />
                    </div>
                  }
                </div>
              </ng-container>

<ng-container *ngSwitchCase="'schedule'">
                <div class="space-y-4">
                  <p class="mb-1 text-sm font-medium text-ink-700">How would you like to consult?</p>
                  <p class="mb-3 text-xs text-ink-500">with {{ doctor()?.name }}{{ doctor()?.nextIn ? ' — ' + doctor()?.nextIn : '' }}</p>
                  <div class="space-y-3">
                    <button
                      type="button"
                      class="flex w-full items-center justify-between gap-3 rounded-2xl border-[1.5px] p-4 text-left transition-all"
                      [class.border-brand-500]="consultNow() === true && doctorAvailableNow()"
                      [class.bg-blue-50]="consultNow() === true && doctorAvailableNow()"
                      [class.border-surface-border]="consultNow() !== true && doctorAvailableNow()"
                      [class.border-gray-200]="!doctorAvailableNow()"
                      [class.bg-gray-100]="!doctorAvailableNow()"
                      [class.cursor-not-allowed]="!doctorAvailableNow()"
                      [class.opacity-50]="!doctorAvailableNow()"
                      [class.grayscale]="!doctorAvailableNow()"
                      [disabled]="!doctorAvailableNow()"
                      (click)="doctorAvailableNow() && consultNow.set(true)"
                    >
                      <span>
                        <span class="block font-semibold" [class.text-[#034DA2]]="doctorAvailableNow()" [class.text-gray-500]="!doctorAvailableNow()">
                          Consult Now
                        </span>
                        <span class="mt-0.5 block text-xs" [class.text-success-700]="doctorAvailableNow()" [class.text-gray-400]="!doctorAvailableNow()">
                          {{ doctorAvailableNow() ? 'Connect instantly' : 'Not available immediately — schedule instead' }}
                        </span>
                      </span>
                      @if (consultNow() === true && doctorAvailableNow()) { <span class="text-brand-700">✓</span> }
                    </button>
                    <button
                      type="button"
                      class="flex w-full items-center justify-between gap-3 rounded-2xl border-[1.5px] p-4 text-left"
                      [class.border-brand-500]="consultNow() === false"
                      [class.bg-blue-50]="consultNow() === false"
                      [class.border-surface-border]="consultNow() !== false"
                      (click)="consultNow.set(false)"
                    >
                      <span>
                        <span class="block font-semibold text-[#034DA2]">Schedule for Later</span>
                        <span class="mt-0.5 block text-xs text-ink-500">Pick a date and time slot</span>
                      </span>
                      @if (consultNow() === false) { <span class="text-brand-700">✓</span> }
                    </button>
                  </div>
                  @if (consultNow() === false) {
                    <div class="mt-5 border-t border-surface-border pt-4">
                      <app-appointment-date-slider
                        [availableDays]="7"
                        [showPickerButton]="true"
                        [practitionerId]="doctor()?.id || ''"
                        [uhId]="patient()?.uhId || ''"
                        [facilityId]="doctor()?.facility_id || ''"
                        [departmentId]="doctor()?.department_id || ''"
                        (dateSelected)="selectSlotDate($event)"
                      />
                      <div class="mt-4">
                        <div class="mb-2 flex items-center justify-between">
                          <p class="text-sm font-medium text-ink-700">Available time slots</p>
                          @if (!isSlotsLoading() && slots().length > 0) {
                            <span class="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#034DA2]">
                              {{ availableSlotCount() }} Available Slot{{ availableSlotCount() === 1 ? '' : 's' }}
                            </span>
                          }
                        </div>

                        @if (isSlotsLoading()) {
                          <div class="flex justify-center py-6">
                            <div class="h-6 w-6 animate-spin rounded-full border-2 border-[#0F5FDC] border-t-transparent"></div>
                          </div>
                        } @else if (slots().length === 0) {
                          <p class="text-center text-sm text-ink-500 py-4">No slots available for this date</p>
                        } @else {
                          @if (availableSlotCount() === 0) {
                            <p class="mb-3 rounded-xl bg-gray-50 py-3 text-center text-sm text-ink-500">No slots available for this date</p>
                          }
                          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            @for (t of slots(); track t.id || $index) {
                              <button
                                type="button"
                                class="min-h-touch rounded-xl border px-3 text-sm transition-all flex items-center justify-center text-center"
                                [class.border-[#0F5FDC]]="slot()?.id === t.id && isSlotValid(t)"
                                [class.bg-blue-50]="slot()?.id === t.id && isSlotValid(t)"
                                [class.text-[#034DA2]]="slot()?.id === t.id && isSlotValid(t)"
                                [class.font-semibold]="slot()?.id === t.id && isSlotValid(t)"
                                [class.border-surface-border]="slot()?.id !== t.id && isSlotValid(t)"
                                [class.hover:border-blue-300]="isSlotValid(t) && slot()?.id !== t.id"
                                [class.cursor-pointer]="isSlotValid(t)"
                                [class.opacity-40]="!isSlotValid(t)"
                                [class.cursor-not-allowed]="!isSlotValid(t)"
                                [class.bg-gray-100]="!isSlotValid(t)"
                                [class.text-ink-400]="!isSlotValid(t)"
                                [class.border-gray-200]="!isSlotValid(t)"
                                [disabled]="!isSlotValid(t)"
                                (click)="selectSlot(t)"
                              >
                                {{ formatSlotRange(t) }}
                              </button>
                            }
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              </ng-container>

              <ng-container *ngSwitchCase="'details'">
                <div class="space-y-4">
                  @if (isLoading('family')) {
                    <div class="flex justify-center py-4"><div class="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div></div>
                  } @else if (getError('family'); as err) {
                    <p class="rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700 flex items-center gap-2" role="alert">
                      <span>⚠</span> {{ err }} <button class="ml-2 underline text-sm" (click)="loadInitialData()">Retry</button>
                    </p>
                  }
                  <opd-patient-selection [patients]="patients()" [selectedPatient]="patient()" [mode]="mode()" (patientSelected)="patient.set($event)" (modeChanged)="mode.set($event)" />
                </div>
              </ng-container>

              <ng-container *ngSwitchCase="'payment'">
                <div class="space-y-4">
                  @if (isLoading('cart') || isLoading('checkout') || isLoading('booking')) {
                    <div class="flex justify-center py-8"><div class="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div></div>
                  } @else if (getError('cart') || getError('checkout') || getError('booking'); as err) {
                    <p class="rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700 flex items-center gap-2" role="alert">
                      <span>⚠</span> {{ err }} <button class="ml-2 underline text-sm" (click)="next()">Retry</button>
                    </p>
                  }
                  <div class="space-y-4">
                    <p class="mb-3 text-sm font-medium text-ink-700">Payment breakdown</p>
                    <dl class="space-y-2 text-sm">
                      <div class="flex justify-between"><dt class="text-ink-700">Consultation fee</dt><dd class="font-medium text-ink-900">₹{{ pay().fee }}</dd></div>
                      <div class="flex justify-between"><dt class="text-ink-700">Wallet eligible (limit ₹{{ perTxn() }})</dt><dd class="font-medium text-ink-900">₹{{ pay().covered }}</dd></div>
                      <div class="flex justify-between"><dt class="text-ink-700">Co-payment ({{ copayPct() }}{{ copayMode() === 'flat' ? '' : '%' }})</dt><dd class="font-medium text-red-700">− ₹{{ pay().copay }}</dd></div>
                      <div class="flex justify-between border-t border-surface-border pt-2"><dt class="text-ink-700">Wallet block</dt><dd class="font-medium text-green-700">₹{{ pay().walletBlock }}</dd></div>
                      @if (pay().excess > 0) {
                        <div class="flex justify-between"><dt class="text-ink-700">Above per-transaction limit</dt><dd class="font-medium text-ink-900">₹{{ pay().excess }}</dd></div>
                      }
                      <div class="flex justify-between border-t border-surface-border pt-2"><dt class="font-semibold text-ink-900">You pay now (Razorpay)</dt><dd class="text-lg font-bold text-ink-900">₹{{ pay().selfPay }}</dd></div>
                    </dl>
                    <p class="mt-3 text-xs text-ink-500">Wallet is blocked on payment; the self-pay amount goes through Razorpay.</p>
                  </div>
                </div>
              </ng-container>

              <ng-container *ngSwitchCase="'confirmed'">
                <div class="text-center">
                  <p class="text-3xl">✅</p>
                  <p class="mt-2 text-base font-bold text-blue-700">Booking confirmed</p>
                  <p class="mt-1 text-sm text-ink-700">Auto-confirmed on payment — no waiting for provider confirmation.</p>
                </div>
                <dl class="mt-4 space-y-2 text-sm">
                  <div class="flex justify-between gap-3 border-b border-surface-border pb-2"><dt class="text-ink-500">Doctor</dt><dd class="text-right font-medium text-ink-900">{{ doctor()?.name }}</dd></div>
                  <div class="flex justify-between gap-3 border-b border-surface-border pb-2"><dt class="text-ink-500">Patient</dt><dd class="text-right font-medium text-ink-900">{{ patient()?.name }}</dd></div>
                  <div class="flex justify-between gap-3 border-b border-surface-border pb-2"><dt class="text-ink-500">Mode</dt><dd class="text-right font-medium text-ink-900">{{ mode() }}</dd></div>
                  <div class="flex justify-between gap-3 border-b border-surface-border pb-2"><dt class="text-ink-500">Paid</dt><dd class="text-right font-medium text-ink-900">₹{{ pay().selfPay }} (₹{{ pay().walletBlock }} from wallet)</dd></div>
                </dl>
                <p class="mt-3 rounded-xl bg-green-100 px-3 py-2 text-sm text-green-700">🧾 Invoice generated and stored under Health Records › Invoices.</p>
              </ng-container>

              <ng-container *ngSwitchCase="'consultation'">
                @if (!inCall()) {
                  <div class="text-center py-8">
                    <p class="text-3xl">{{ mode() === 'Audio' ? '📞' : '🎥' }}</p>
                    <p class="mt-2 text-base font-bold text-blue-700">{{ mode() }} consultation</p>
                    <p class="mt-1 text-sm text-ink-700">with {{ doctor()?.name }}</p>
                    <button type="button" class="mt-4 min-h-touch w-full rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white" (click)="joinVideoCall()">Join {{ mode() }} call</button>
                  </div>
                } @else {
                  <opd-agora-video [serviceRequestId]="consultationRequestId()" (callEnded)="endCall()" />
                }
              </ng-container>

              <ng-container *ngSwitchCase="'prescription'">
                <p class="mb-2 text-base font-bold text-blue-700">Prescription</p>
                <p class="text-sm text-ink-700">{{ doctor()?.name }} · {{ patient()?.name }}</p>
                <div class="mt-3 space-y-2 text-sm">
                  @if (prescription(); as rx) {
                    @for (med of rx.medications; track med.name) {
                      <div class="rounded-xl bg-gray-100 px-3 py-2">
                        <span class="font-medium text-ink-900">{{ med.name }}</span> — {{ med.dosage }}, {{ med.duration }}
                      </div>
                    }
                    <p class="rounded-xl bg-green-100 px-3 py-2 text-sm text-green-700">✓ E-prescription saved to Health Records › My Prescriptions.</p>
                  } @else {
                    <p class="text-sm text-ink-500">Loading prescription...</p>
                  }
                </div>
              </ng-container>

              <ng-container *ngSwitchDefault>
                <p class="text-center py-8 text-ink-500">Step not found</p>
              </ng-container>
            </ng-container>

            @if (stepError(); as err) {
              <p class="mt-3 rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700" role="alert">{{ err }}</p>
            }
          </opd-wizard-step>
        }
      </div>
    </div>
  `,
})
export class OnlineConsultPage implements OnInit {
  readonly BenefitCategory = BenefitCategory;

  private readonly consultationService = inject(OpdConsultationService);
  private readonly agoraService = inject(AgoraService);
  private readonly policyStore = inject(PolicyStore);
  private readonly family = inject(FamilyStore);
  readonly cdr = inject(ChangeDetectorRef);

  protected readonly policyCategory = computed(() => {
    const version = this.policyStore.version();
    const activeMember = this.family.activeMember();
    const relCode = activeMember?.relationshipCode || (activeMember?.isPrimary ? 'self' : 'self');
    const rel = version
      ? (findRelationshipInVersion(version, relCode) ?? getPrimaryRelationship(version))
      : null;
    return rel?.categories?.find(
      (c) =>
        toBenefitCategory(c.category_code) === BenefitCategory.OnlineConsultation ||
        toBenefitCategory(c.category_name) === BenefitCategory.OnlineConsultation,
    );
  });

  protected readonly perTxn = computed(() => {
    const cat = this.policyCategory();
    return cat?.per_transaction_limit ?? cat?.per_claim_limit ?? 300;
  });

  protected readonly copayPct = computed(() => {
    const cat = this.policyCategory();
    return typeof cat?.co_payment_value === 'number' ? cat.co_payment_value : 20;
  });

  protected readonly copayMode = computed(() => {
    const cat = this.policyCategory();
    return cat?.co_payment_mode?.toLowerCase() === 'flat' ? 'flat' : 'percent';
  });

  protected readonly specialities = signal<Speciality[]>([]);
  protected readonly patients = signal<Patient[]>([]);
  protected readonly slots = signal<Slot[]>([]);
  protected readonly slotDates = signal<number[]>([]);

  protected formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today, ' + date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow, ' + date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  protected readonly started = signal(false);
  protected readonly consultNow = signal<boolean | null>(null);
  protected readonly step = signal(0);
  protected readonly stepError = signal<string | null>(null);

  protected readonly speciality = signal<string>('');
  protected readonly search = signal('');
  protected readonly searchTerm = signal('');
  protected readonly doctor = signal<Doctor | null>(null);
  protected readonly filteredDoctors = signal<Doctor[]>([]);
  protected readonly patient = signal<Patient | null>(null);
  protected readonly mode = signal('');
  protected readonly slotDate = signal<number>(0);
  protected readonly slot = signal<Slot | null>(null);
  protected readonly isSlotsLoading = signal(false);
  protected readonly inCall = signal(false);
  protected readonly consultationRequestId = signal<string | null>(null);
  protected readonly cancelNote = signal<string | null>(null);
  protected readonly prescription = signal<any | null>(null);

  // Loading and error states from service
  protected readonly loading = this.consultationService.loading$;
  protected readonly errors = this.consultationService.errors$;

  // Helper to check loading state
  isLoading(key: string): boolean {
    return this.consultationService.isLoading(key);
  }

  getError(key: string): string | undefined {
    return this.consultationService.getError(key);
  }

  // Empanelment side journey
  protected readonly empanelment = signal(false);
  protected readonly empanelSubmitted = signal(false);
  protected readonly empName = signal('');
  protected readonly empClinic = signal('');
  protected readonly empSpec = signal('');

  protected readonly steps = computed<Step[]>(() => [
    'find', 'schedule', 'details', 'payment', 'confirmed', 'consultation', 'prescription',
  ]);
  protected readonly currentStep = computed<Step>(() => this.steps()[this.step()] ?? 'find');

  protected readonly doctorAvailableNow = computed(() => {
    const doc = this.doctor();
    if (!doc) return false;
    if (typeof doc.canConsultNow === 'boolean') {
      return doc.canConsultNow;
    }
    return doc.nextIn === 'Available now';
  });

  /** Available slot count calculated dynamically from valid slots */
  protected readonly availableSlotCount = computed(() => {
    return this.slots().filter(s => this.isSlotValid(s)).length;
  });

  /** Dynamic payment breakdown: per-transaction limit + co-payment, excess self-paid. */
  protected readonly pay = computed(() => {
    const fee = this.doctor()?.fee ?? 0;
    const perTxnLimit = this.perTxn();
    const cat = this.policyCategory();
    const poolCode = cat?.pool_code?.trim();
    const pool = poolCode
      ? this.policyStore.pools().find(
          (p) =>
            p.code?.trim().toUpperCase() === poolCode?.toUpperCase() ||
            p.id?.trim().toUpperCase() === poolCode?.toUpperCase(),
        )
      : null;
    const availableBalance = pool ? pool.available.amount : this.policyStore.walletTotal().available.amount;

    const covered = Math.min(fee, perTxnLimit, availableBalance);
    const copay = this.copayMode() === 'flat'
      ? Math.min(this.copayPct(), covered)
      : Math.round((covered * this.copayPct()) / 100);
    const walletBlock = Math.max(0, covered - copay);
    const excess = Math.max(0, fee - covered);
    const selfPay = fee - walletBlock;
    return { fee, covered, copay, walletBlock, excess, selfPay };
  });

  ngOnInit() {
    this.loadInitialData();
  }

  protected loadInitialData(): void {
    this.consultationService.getSpecialities().subscribe(specs => this.specialities.set(specs));
    this.consultationService.getFamilyList().subscribe(pats => {
      this.patients.set(pats);
      if (pats.length && !this.patient()) {
        this.patient.set(pats[0]);
      }
    });
  }

  protected start(): void {
    this.consultNow.set(null);
    this.started.set(true);
    this.step.set(0);
    this.stepError.set(null);
  }

  protected pickSpeciality(code: string): void {
    this.speciality.set(code);
    this.doctor.set(null);
    this.slot.set(null);
    this.slots.set([]);
    this.slotDate.set(0);
    this.search.set('');
    this.searchTerm.set('');
    this.consultationService.getDoctors(code).subscribe(docs => this.filteredDoctors.set(docs));
  }

  protected selectDoctor(doc: Doctor): void {
    this.doctor.set(doc);
    this.consultNow.set(null);
    this.slot.set(null);
    this.slots.set([]);
    this.slotDate.set(0);
  }

  protected onSearchChange(value: string): void {
    if (!value.trim()) {
      this.consultationService.getDoctors(this.speciality()).subscribe(docs => {
        this.filteredDoctors.set(docs);
        this.search.set('');
      });
      return;
    }
    this.search.set(value);
    this.filteredDoctors.set(
      this.filteredDoctors().filter(d => 
        d.name.toLowerCase().includes(value.toLowerCase())
      )
    );
  }

  private getSlotDay(timestamp: number): string {
    const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    return days[new Date(timestamp).getDay()];
  }

  /**
   * Slot validation logic:
   * A slot is valid only if:
   * 1. Status is "available"
   * 2. Start time is in the future
   * 3. End time is in the future
   */
  protected isSlotValid(s: Slot): boolean {
    if (!s) return false;

    // Slot status must be "available"
    const status = (s.status || '').toLowerCase().trim();
    if (status !== 'available') {
      return false;
    }

    const now = Date.now();

    // Check direct timestamp
    if (typeof s.slot_start_time === 'number' && s.slot_start_time > 0) {
      if (s.slot_start_time <= now) return false;
      if (typeof s.slot_end_time === 'number' && s.slot_end_time <= now) return false;
      return true;
    }

    // Fallback: check slot_date and slotStartTime if start timestamp wasn't provided directly
    if (s.slot_date) {
      const slotDayStart = moment(s.slot_date).startOf('day');
      const todayStart = moment().startOf('day');
      if (slotDayStart.isBefore(todayStart)) {
        return false;
      }
      if (slotDayStart.isSame(todayStart) && s.slotStartTime) {
        const timeParts = s.slotStartTime.match(/(\d+):(\d+)/);
        if (timeParts) {
          const slotMoment = slotDayStart.clone()
            .hour(parseInt(timeParts[1], 10))
            .minute(parseInt(timeParts[2], 10));
          if (slotMoment.valueOf() <= now) {
            return false;
          }
        }
      }
    }

    return true;
  }

  protected formatSlotRange(slot: Slot): string {
    if (slot.slot_start_time && slot.slot_end_time) {
      const start = new Date(slot.slot_start_time).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      const end = new Date(slot.slot_end_time).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      return `${start} - ${end}`;
    }
    if (slot.slotStartTime && slot.slotEndTime) {
      return `${slot.slotStartTime} - ${slot.slotEndTime}`;
    }
    if (slot.slotNo) {
      return `Slot ${slot.slotNo}`;
    }
    return 'Slot';
  }

  protected selectSlot(t: Slot): void {
    if (!this.isSlotValid(t)) return;
    this.slot.set(t);
  }

  protected selectSlotDate(date: number): void {
    this.slotDate.set(date);
    this.slot.set(null);
    if (this.doctor()) {
      this.isSlotsLoading.set(true);
      const slotDays = this.getSlotDay(date);
      const uhId = this.patient()?.uhId || 'HCLW-27028';

      this.consultationService
        .getSlots(
          this.doctor()!.id!,
          date,
          slotDays,
          this.doctor()?.facility_id || '',
          this.doctor()?.department_id || '',
          uhId
        )
        .subscribe({
          next: (slots) => {
            console.log('Slots Response:', slots);
            const slotList = slots || [];
            this.slots.set([...slotList]);

            // Auto-select first valid available slot
            const firstValid = slotList.find(s => this.isSlotValid(s));
            this.slot.set(firstValid ?? null);

            this.isSlotsLoading.set(false);
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Slot Error', err);
            this.slots.set([]);
            this.slot.set(null);
            this.isSlotsLoading.set(false);
            this.cdr.detectChanges();
          }
        });
    }
  }

  protected openEmpanelment(): void {
    this.empanelSubmitted.set(false);
    this.empName.set('');
    this.empClinic.set('');
    this.empSpec.set(this.speciality());
    this.empanelment.set(true);
  }

  protected submitEmpanelment(): void {
    if (!this.empName().trim()) return;
    this.empanelSubmitted.set(true);
  }

  protected tryCancel(): void {
    this.cancelNote.set('Cancellation is not allowed for online consultations today. Rescheduling and follow-up are planned.');
  }

  private validate(): string | null {
    switch (this.currentStep()) {
      case 'find':
        if (!this.speciality()) return 'Select a speciality.';
        return this.doctor() ? null : 'Select a doctor.';
      case 'schedule':
        if (this.consultNow() === null) return 'Choose Consult Now or Schedule.';
        if (this.consultNow() === true && !this.doctorAvailableNow()) {
          return 'Doctor is not available for immediate consultation. Please schedule for later.';
        }
        if (this.consultNow() === false) {
          if (!this.slotDate() || !this.slot()?.id) return 'Pick a date and time.';
          if (!this.isSlotValid(this.slot()!)) return 'The selected slot is no longer available. Please select another slot.';
        }
        return null;
      case 'details':
        if (!this.patient()) return 'Select who this is for.';
        return this.mode() ? null : 'Choose Video or Audio.';
      default: return null;
    }
  }

  protected next(): void {
    if (this.currentStep() === 'find' && this.empanelment()) { this.empanelment.set(false); return; }
    const err = this.validate();
    if (err) { this.stepError.set(err); return; }
    this.stepError.set(null);

    if (this.currentStep() === 'payment') {
      // Build cart snapshot and add to cart
      const cartData = this.buildCartSnapshot();
      this.consultationService.addToCart(cartData).subscribe({
        next: (cartRes: any) => {
          const cartId = cartRes?.resource?.[0]?.id || cartRes?.resource?.[0]?.cart_snapshot?.id || cartRes?.id || '';
          // Build checkout snapshot and calculate payment
          const checkoutData = this.buildCheckoutSnapshot(cartId);
          this.consultationService.checkout(checkoutData).subscribe({
            next: () => {
              // Proceed to booking
              const bookingData = this.buildBookingSnapshot();
              this.consultationService.bookAppointment(bookingData).subscribe({
                next: (res) => {
                  this.consultationRequestId.set(res.serviceRequestId || '');
                  this.step.set(this.step() + 1);
                },
                error: (err) => this.stepError.set('Booking failed: ' + err.message)
              });
            },
            error: (err) => this.stepError.set('Checkout failed: ' + err.message)
          });
        },
        error: (err) => this.stepError.set('Cart creation failed: ' + err.message)
      });
    } else if (this.currentStep() === 'consultation') {
      // Move to prescription after consultation
      this.loadPrescription();
      this.step.set(this.step() + 1);
    } else if (this.currentStep() === 'prescription') {
      this.finish();
    } else {
      this.step.set(this.step() + 1);
    }
  }

  protected back(): void {
    this.stepError.set(null);
    if (this.step() === 0) { this.started.set(false); return; }
    this.step.set(this.step() - 1);
  }

  protected headerBack(): void {
    if (this.started()) { this.back(); return; }
    history.back();
  }

  protected primaryLabel(): string {
    switch (this.currentStep()) {
      case 'payment': return `Pay ₹${this.pay().selfPay} via Razorpay`;
      case 'prescription': return 'Done';
      case 'confirmed': return 'Join consultation';
      case 'consultation': return 'View prescription';
      default: return 'Continue';
    }
  }

  protected joinVideoCall(): void {
    this.inCall.set(true);
  }

  protected endCall(): void {
    this.inCall.set(false);
  }

  protected loadPrescription(): void {
    if (this.consultationRequestId()) {
      this.consultationService.getPrescription(this.consultationRequestId()!).subscribe({
        next: (rx) => this.prescription.set(rx),
        error: () => this.prescription.set({ medications: [] })
      });
    }
  }

  private buildCartSnapshot(): CartSnapshot {
    const doc = this.doctor();
    const s = this.slot();
    const pat = this.patient();

    return {
      cart_snapshot: {
        facility_id: doc?.facility_id || '',
        patient_id: pat?.mapped_id || pat?.patient_id || pat?.id || '',
        serviceType: 'OP Consultation',
        serviceType_code: 'op_consultation',
        serviceItemName: doc?.name || '',
        serviceItemCode: doc?.doctor_code || '',
        service_code: doc?.doctor_code || '',
        serviceItemId: doc?.id || '',
        provider_name: doc?.provider_name || 'HCL Healthcare',
        provider_code: doc?.provider_code || 'HCLHC001',
        cug_code: doc?.cug_code || 'TC0001',
        mrp: doc?.mrp ?? doc?.fee ?? 0,
        selling_discount_rate: doc?.selling_discount_rate ?? 0,
        selling_amount: doc?.selling_amount ?? doc?.fee ?? 0,
        status: 'Pending',
        department_name: doc?.department_name || doc?.speciality || 'General Physician',
        department_id: doc?.department_id || '',
        subDepartment_name: doc?.subDepartment_name || doc?.speciality || 'General Physician',
        subDepartment_id: doc?.subDepartment_id || '',
        speciality_id: doc?.speciality_id || '',
        serviceDate: s?.slot_date || Date.now(),
        serviceStartTime: s?.slot_start_time || Date.now(),
        serviceEndTime: s?.slot_end_time || (s?.slot_start_time ? s.slot_start_time + 1200000 : Date.now() + 1200000),
        slotId: s?.id || '',
        slotNo: s?.slotNo || 1,
        slot: s ? this.formatSlotRange(s) : '',
        slot_type: 'dynamic',
        mode_of_appointment: doc?.mode_of_appointment || 'habithealth',
        consultation_type_code: this.mode(),
        tag_data: []
      }
    };
  }

  private buildCheckoutSnapshot(cartId?: string): CheckoutSnapshot {
    const doc = this.doctor();
    const s = this.slot();
    const pat = this.patient();
    const policyId = this.policyStore.version()?.policy_id || this.policyStore.assignment()?.policy_id || '786123';
    const now = Date.now();
    const sDate = s?.slot_date || now;
    const sStart = s?.slot_start_time || now;
    const sEnd = s?.slot_end_time || (s?.slot_start_time ? s.slot_start_time + 1200000 : now + 1200000);
    const uhId = pat?.uhId || 'HCLW-27028';
    const facilityAddress = doc?.facility_address || {
      street1: 'Raheja Mind Space',
      street2: 'Madhapur',
      street3: '',
      city: 'hyderabad',
      state: 'telangana',
      pincode: '500081',
      country: 'india',
      latitude: 17.4410131,
      longitude: 78.3808268,
      cityDisplayName: 'Hyderabad',
      stateDisplayName: 'Telangana',
      pincodeDisplayName: '',
      countryDisplayName: 'India'
    };

    return {
      policy_id: policyId,
      checkout_snapshot: {
        opdCheckout: {
          facility_id: doc?.facility_id || '',
          patient_id: pat?.mapped_id || pat?.patient_id || pat?.id || '',
          scheme_code: '',
          is_use_wallet: false,
          bg_code: 'cash-benefit-group',
          scheme_discount_applicable: false,
          type: '',
          uhId: uhId,
          is_use_care_coin: false,
          orderedFrom: 'Patient Portal',
          old_serviceRequestId: '',
          provider_name: doc?.provider_name || 'HCL Healthcare',
          provider_code: doc?.provider_code || 'HCL-001',
          op_services: [
            {
              serviceItemId: doc?.id || '',
              serviceItemName: doc?.name || '',
              speciality_id: doc?.speciality_id || '',
              service_code: doc?.doctor_code || '',
              part_of_package: false,
              serviceItemCode: doc?.doctor_code || doc?.id || '',
              consultation_type: 'Tele Consult',
              consultation_type_code: this.mode(),
              over_booking_status: false,
              order_date_time: now,
              speciality_name: (doc?.speciality || 'GENERAL PHYSICIAN').toUpperCase(),
              service_type: 'OP Consultation',
              serviceName: doc?.name || '',
              appointment_time: sEnd,
              serviceType: 'OP Consultation',
              serviceType_code: 'op_consultation',
              slotId: s?.id || '',
              extra_data: {
                edit_price: false,
                speciality_name: (doc?.speciality || 'GENERAL PHYSICIAN').toUpperCase(),
                facility_name: doc?.facility_name || 'HCL Healthcare Clinic',
                qualification: doc?.qualification || 'MBBS'
              },
              slotNo: String(s?.slotNo || 1),
              serviceDate: sDate,
              serviceStartTime: sStart,
              serviceEndTime: sEnd,
              category: (doc?.speciality || 'GENERAL PHYSICIAN').toUpperCase(),
              speciality_code: (doc?.speciality_code || doc?.speciality || 'GENERAL PHYSICIAN').toUpperCase(),
              department_id: doc?.department_id || '',
              department_name: doc?.department_name || 'OP Consultation',
              subDepartment_id: doc?.subDepartment_id || '',
              subDepartment_name: doc?.subDepartment_name || 'OP Consultation',
              qty: 1,
              cart_id: cartId || '',
              is_centre_visit: false,
              is_home_collection: false,
              logo_id: '',
              doctor_profile_path: doc?.profile_path || 'assets/images/doctorProfile/alternatedocImage.png',
              patient_instructions: '',
              practice_type_code: 'individual',
              practice_type_name: 'Individual Practice',
              performing_doctor: doc?.name || '',
              participant: [
                {
                  participantId: doc?.id || '',
                  participantName: doc?.name || '',
                  participantRole: 'doctor'
                }
              ],
              doctor_experience: String(doc?.experience || 0),
              doctor_telecom: doc?.telecom || '9999444444'
            }
          ],
          mode_of_appointment: doc?.mode_of_appointment || 'habithealth',
          facility_address: facilityAddress,
          tag_data: []
        }
      }
    };
  }

  private buildBookingSnapshot(): any {
    const doc = this.doctor();
    const s = this.slot();
    const pat = this.patient();

    return {
      booking_snapshot: {
        serviceRequestHandler: {
          patient_details: {
            patient_id: pat?.mapped_id || pat?.patient_id || pat?.id,
            patientType: 'OP',
            uhId: pat?.uhId,
            payer_info: { id: 'cash', payer_type: 'cash', payer_name: 'Cash' }
          },
          facility_id: doc?.facility_id,
          doctor_id: doc?.id,
          services: [{
            id: doc?.id,
            serviceItemId: doc?.id,
            serviceItemName: doc?.name,
            consultation_type: this.mode(),
            consultation_type_code: this.mode(),
            serviceType: 'OP Consultation',
            serviceType_code: 'op_consultation',
            slotId: s?.id
          }],
          payment_details: [{ payment_type: 'E-Payment', payment_status: 'Pending' }],
          mode_of_appointment: doc?.mode_of_appointment || 'habithealth'
        }
      }
    };
  }

  private finish(): void {
    this.started.set(false);
    this.step.set(0);
    this.inCall.set(false);
    this.cancelNote.set(null);
    this.consultationRequestId.set(null);
  }
}