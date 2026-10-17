import { ChangeDetectionStrategy, Component, computed, signal, inject, OnInit } from '@angular/core';
import { OpdConsultationService, Speciality, Doctor, Patient, Slot, BookingResponse } from '../../services/opd-consultation.service';
import { AgoraService } from '../../services/agora.service';
import { AgoraVideoComponent } from './components/agora-video.component';
import { ConsultHeaderComponent } from './components/consult-header.component';
import { ConsultBannerComponent } from './components/consult-banner.component';
import { SpecialitySelectionComponent } from './components/speciality-selection.component';
import { DoctorSelectionComponent } from './components/doctor-selection.component';
import { SlotSelectionComponent } from './components/slot-selection.component';
import { PatientSelectionComponent } from './components/patient-selection.component';
import { WizardStepComponent } from './components/wizard-step.component';
import { AppointmentDateSliderComponent } from './components/appointment-date-slider/appointment-date-slider.component';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';

type Step = 'find' | 'schedule' | 'details' | 'payment' | 'confirmed' | 'consultation' | 'prescription';

@Component({
  selector: 'opd-online-consult-page',
  standalone: true,
imports: [
    CommonModule,
    ConsultHeaderComponent,
    ConsultBannerComponent,
    SpecialitySelectionComponent,
    DoctorSelectionComponent,
    SlotSelectionComponent,
    PatientSelectionComponent,
    WizardStepComponent,
    AppointmentDateSliderComponent,
    AgoraVideoComponent,
    DatePipe,
    CurrencyPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <opd-consult-header (back)="headerBack()" />

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        @if (!started()) {
          <opd-consult-banner [perTxn]="300" [copayPct]="20" />
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
                      <opd-doctor-selection [speciality]="speciality()" [doctors]="filteredDoctors()" [selectedDoctor]="doctor()" (searchChanged)="onSearchChange($event)" (doctorSelected)="doctor.set($event)" />
                    </div>
                  }
                </div>
              </ng-container>

<ng-container *ngSwitchCase="'schedule'">
                <div class="space-y-4">
                  <p class="mb-1 text-sm font-medium text-ink-700">How would you like to consult?</p>
                  <p class="mb-3 text-xs text-ink-500">with {{ doctor()?.name }} — {{ doctor()?.nextIn }}</p>
                  <div class="space-y-3">
                    <button
                      type="button"
                      class="flex w-full items-center justify-between gap-3 rounded-2xl border-[1.5px] p-4 text-left disabled:opacity-50"
                      [class.border-brand-500]="consultNow() === true"
                      [class.bg-blue-50]="consultNow() === true"
                      [class.border-surface-border]="consultNow() !== true"
                      [disabled]="!doctorAvailableNow()"
                      (click)="consultNow.set(true)"
                    >
                      <span>
                        <span class="block font-semibold text-[#034DA2]">Consult Now</span>
                        <span class="mt-0.5 block text-xs" [class.text-success-700]="doctorAvailableNow()" [class.text-ink-500]="!doctorAvailableNow()">
                          {{ doctorAvailableNow() ? 'Connect instantly' : 'Not available immediately — schedule instead' }}
                        </span>
                      </span>
                      @if (consultNow() === true) { <span class="text-brand-700">✓</span> }
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
                      <p class="mb-2 text-sm font-medium text-ink-700">Select date and time</p>
                      <app-appointment-date-slider
                        [availableDays]="7"
                        [showPickerButton]="true"
                        [practitionerId]="doctor()?.id || ''"
                        [uhId]="'HCLW-27028'"
                        [facilityId]="doctor()?.facility_id || ''"
                        [departmentId]="doctor()?.department_id || ''"
                        (dateSelected)="selectSlotDate($event)"
                      />
                      <div class="mt-4">
                        <p class="mb-2 text-sm font-medium text-ink-700">Available time slots</p>
                        @if (isLoading('slots')) {
                          <div class="flex justify-center py-4"><div class="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div></div>
                        } @else if (getError('slots'); as err) {
                          <p class="rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700 flex items-center gap-2" role="alert">
                            <span>⚠</span> {{ err }} <button class="ml-2 underline text-sm" (click)="selectSlotDate(slotDate())">Retry</button>
                          </p>
                        } @else {
                          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            @for (t of slots(); track t.id) {
                              <button type="button" class="min-h-touch rounded-xl border px-3 text-sm" [class.border-brand-500]="slot()?.id === t.id" [class.bg-blue-50]="slot()?.id === t.id" [class.border-surface-border]="slot()?.id !== t.id" (click)="slot.set(t)">{{ t.slotNo }}</button>
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
                      <div class="flex justify-between"><dt class="text-ink-700">Wallet eligible (limit ₹{{ perTxn }})</dt><dd class="font-medium text-ink-900">₹{{ pay().covered }}</dd></div>
                      <div class="flex justify-between"><dt class="text-ink-700">Co-payment ({{ copayPct }}%)</dt><dd class="font-medium text-red-700">− ₹{{ pay().copay }}</dd></div>
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
  private readonly consultationService = inject(OpdConsultationService);
  private readonly agoraService = inject(AgoraService);

  protected readonly perTxn = 300;
  protected readonly copayPct = 20;

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

  protected readonly doctorAvailableNow = computed(() => this.doctor()?.nextIn === 'Available now');

  /** Mock payment breakdown: per-transaction limit + co-payment, excess self-paid. */
  protected readonly pay = computed(() => {
    const fee = this.doctor()?.fee ?? 0;
    const covered = Math.min(fee, this.perTxn);
    const copay = Math.round((covered * this.copayPct) / 100);
    const walletBlock = covered - copay;
    const excess = Math.max(0, fee - this.perTxn);
    const selfPay = copay + excess;
    return { fee, covered, copay, walletBlock, excess, selfPay };
  });

  ngOnInit() {
    this.loadInitialData();
  }

  protected loadInitialData(): void {
    this.consultationService.getSpecialities().subscribe(specs => this.specialities.set(specs));
    this.consultationService.getFamilyList().subscribe(pats => this.patients.set(pats));
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
    this.search.set('');
    this.searchTerm.set('');
    this.consultationService.getDoctors(code).subscribe(docs => this.filteredDoctors.set(docs));
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

  protected selectSlotDate(date: number): void {
    this.slotDate.set(date);
    if (this.doctor()) {
      // this.consultationService.getSlots(this.doctor()!.id!, date).subscribe(s => this.slots.set(s));
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
        if (this.consultNow() === false && !(this.slotDate() && this.slot()?.id)) return 'Pick a date and time.';
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
        next: () => {
          // Build checkout snapshot and calculate payment
          const checkoutData = this.buildCheckoutSnapshot();
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

  private buildCartSnapshot(): any {
    return {
      cart_snapshot: {
        opdcart: {
          serviceItemId: this.doctor()?.id,
          serviceItemName: this.doctor()?.name,
          consultation_type_code: this.mode(),
          serviceDate: Date.now(),
          serviceStartTime: Date.now(),
          serviceEndTime: Date.now() + 900000,
          slotId: this.slot()?.id,
          patient_id: this.patient()?.patient_id,
          speciality_id: this.doctor()?.speciality_id,
          facility_id: '813cdb10-d750-11f0-a474-da069b21f2f6-53',
          provider_code: 'HCL-001',
          serviceType_code: 'op_consultation',
          mode_of_appointment: 'opd_network',
          serviceType: 'OP Consultation',
          serviceItemCode: this.doctor()?.doctor_code
        }
      }
    };
  }

  private buildCheckoutSnapshot(): any {
    return {
      checkout_snapshot: {
        patient_id: this.patient()?.patient_id,
        checkoutsnapshot: {
          facility_id: '813cdb10-d750-11f0-a474-da069b21f2f6-53',
          doctor_id: this.doctor()?.id,
          speciality_id: this.doctor()?.speciality_id,
          consultation_type: this.mode(),
          consultation_type_code: this.mode(),
          patient_type: 'OP',
          slot_id: this.slot()?.id,
          serviceDate: Date.now(),
          serviceStartTime: Date.now(),
          serviceEndTime: Date.now() + 900000,
          serviceItemId: this.doctor()?.id
        }
      }
    };
  }

  private buildBookingSnapshot(): any {
    return {
      booking_snapshot: {
        serviceRequestHandler: {
          patient_details: {
            patient_id: this.patient()?.patient_id,
            patientType: 'OP',
            uhId: this.patient()?.uhId,
            payer_info: { id: 'cash', payer_type: 'cash', payer_name: 'Cash' }
          },
          facility_id: '813cdb10-d750-11f0-a474-da069b21f2f6-53',
          doctor_id: this.doctor()?.id,
          services: [{
            id: this.doctor()?.id,
            serviceItemId: this.doctor()?.id,
            serviceItemName: this.doctor()?.name,
            consultation_type: this.mode(),
            consultation_type_code: this.mode(),
            serviceType: 'OP Consultation',
            serviceType_code: 'op_consultation',
            slotId: this.slot()?.id
          }],
          payment_details: [{ payment_type: 'E-Payment', payment_status: 'Pending' }],
          mode_of_appointment: 'opd_network'
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