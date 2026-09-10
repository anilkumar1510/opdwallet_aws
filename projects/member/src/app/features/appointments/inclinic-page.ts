import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

/**
 * In-Clinic Consultation — DUMMY / STATIC journey, zero backend.
 *
 * Self-contained wizard reproducing patient-flows Section 2 end to end, all mock:
 * Book New Consult → speciality → detect location / postal code → doctors sorted
 * by distance (with clinic, distance, fee, next slot; search + empanelment
 * request) → book → patient → slot (today + 36h) → request raised & pending
 * confirmation (wallet blocked, no payment) → backend confirms (demo) → cart
 * ready → review cart + payment breakdown → wallet block + Razorpay → receipt →
 * cashless letter → visit at clinic → upload prescription → completed & invoice.
 * No network calls. See REMOVED-APIS.md.
 */

interface Doctor {
  id: string;
  name: string;
  speciality: string;
  clinic: string;
  distanceKm: number;
  qualification: string;
  experience: number;
  fee: number;
  rating: number;
  gender: 'Male' | 'Female';
  nextSlot: string;
}

const SPECIALITIES = ['General Physician', 'Dermatology', 'Orthopaedics', 'Paediatrics', 'ENT', 'Cardiology'];

const DOCTORS: Doctor[] = [
  { id: 'd1', name: 'Dr. Aarti Sharma', speciality: 'General Physician', clinic: 'HealthFirst Clinic, Sector 14', distanceKm: 1.2, qualification: 'MBBS, MD', experience: 12, fee: 500, rating: 4.8, gender: 'Female', nextSlot: 'Today 5:00 PM' },
  { id: 'd2', name: 'Dr. Rahul Verma', speciality: 'General Physician', clinic: 'City Care, DLF Phase 1', distanceKm: 3.4, qualification: 'MBBS', experience: 7, fee: 400, rating: 4.5, gender: 'Male', nextSlot: 'Tomorrow 11:00 AM' },
  { id: 'd3', name: 'Dr. Neha Gupta', speciality: 'Dermatology', clinic: 'SkinWell, Sector 29', distanceKm: 2.1, qualification: 'MBBS, MD (Derm)', experience: 9, fee: 700, rating: 4.7, gender: 'Female', nextSlot: 'Today 6:30 PM' },
  { id: 'd4', name: 'Dr. Sameer Khan', speciality: 'Orthopaedics', clinic: 'BoneCare, Sector 44', distanceKm: 4.8, qualification: 'MBBS, MS (Ortho)', experience: 15, fee: 800, rating: 4.9, gender: 'Male', nextSlot: 'Tomorrow 10:00 AM' },
  { id: 'd5', name: 'Dr. Pooja Nair', speciality: 'Paediatrics', clinic: 'Little Steps, Sector 47', distanceKm: 5.6, qualification: 'MBBS, DCH', experience: 11, fee: 600, rating: 4.6, gender: 'Female', nextSlot: 'Today 7:00 PM' },
  { id: 'd6', name: 'Dr. Anjali Menon', speciality: 'ENT', clinic: 'ClearSound ENT, Sector 15', distanceKm: 1.9, qualification: 'MBBS, MS (ENT)', experience: 8, fee: 550, rating: 4.5, gender: 'Female', nextSlot: 'Tomorrow 12:30 PM' },
];

const PATIENTS = [
  { id: 'shivam', name: 'Shivam Jha', rel: 'Self' },
  { id: 'sayani', name: 'Sayani Kumari', rel: 'Spouse' },
];

const POSTAL_SUGGESTIONS = ['122001 — Sector 14, Gurugram', '122002 — DLF Phase 1', '122018 — Sector 47'];
const SLOT_DATES = ['Today, 9 Sep', 'Tomorrow, 10 Sep'];
const SLOT_TIMES = ['10:00 AM', '12:30 PM', '3:00 PM', '6:30 PM'];

const PER_TXN_LIMIT = 300;
const COPAY_PCT = 20;

type Step =
  | 'speciality'
  | 'find'
  | 'when'
  | 'pending'
  | 'cart'
  | 'receipt'
  | 'visit'
  | 'completed';

@Component({
  selector: 'opd-inclinic-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none">
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <button type="button" class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50" aria-label="Back" (click)="headerBack()">&larr;</button>
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">In-Clinic Consultation</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">Physical consultation at a network clinic</p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        <p class="mb-4 rounded-xl border border-dashed border-warning-400 bg-warning-50 px-3 py-2 text-xs text-warning-700">
          🧪 Static demo journey — no data is saved and no payment is taken.
        </p>

        @if (!started()) {
          <div class="mb-5 rounded-2xl border border-[#CDDDFE] bg-[#F3F7FF] p-5">
            <p class="text-sm text-ink-700">In-Clinic Consultation coverage</p>
            <p class="mt-1 text-2xl font-bold text-[#034DA2]">₹5,000 <span class="text-sm font-normal text-ink-500">left this year</span></p>
            <p class="mt-1 text-xs text-ink-500">Up to ₹{{ perTxn }} per visit from wallet · {{ copayPct }}% co-payment</p>
          </div>
          <button type="button" class="min-h-touch w-full rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white hover:bg-[#034DA2]" (click)="start()">Book New Consult →</button>
        }

        @else {
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-bold text-[#034DA2]">Book consultation</h2>
            <span class="text-xs text-ink-500">Step {{ step() + 1 }} of {{ steps.length }}</span>
          </div>

          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
            @switch (currentStep()) {
              @case ('speciality') {
                <p class="mb-3 text-sm font-medium text-ink-700">Select speciality</p>
                <div class="grid grid-cols-2 gap-2">
                  @for (s of specialities; track s) {
                    <button type="button" class="min-h-touch rounded-xl border px-3 text-sm" [class.border-brand-500]="speciality() === s" [class.bg-blue-50]="speciality() === s" [class.border-surface-border]="speciality() !== s" (click)="pickSpeciality(s)">{{ s }}</button>
                  }
                </div>
              }
              @case ('find') {
                <p class="mb-1 text-sm font-medium text-ink-700">Set your location</p>
                <p class="mb-3 text-xs text-ink-500">Doctors are sorted by distance from here.</p>
                <button type="button" class="mb-3 flex min-h-touch w-full items-center justify-center gap-2 rounded-xl border border-[#0F5FDC] bg-blue-50 px-4 text-sm font-semibold text-[#0F5FDC]" (click)="detectLocation()">📍 Auto-detect my location</button>
                @if (detected(); as loc) {
                  <p class="mb-3 rounded-xl bg-[#F0FDF4] px-3 py-2 text-xs text-success-700">Detected: {{ loc }}</p>
                }
                <label class="mb-1 block text-xs font-medium text-ink-700">Or search by postal code / area</label>
                <input class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm outline-none focus:border-brand-500" placeholder="Enter postal code" [value]="postalCode()" (input)="postalCode.set($any($event.target).value)" />
                <div class="mt-2 space-y-1">
                  @for (sug of postalSuggestions; track sug) {
                    <button type="button" class="block w-full rounded-lg px-2 py-1.5 text-left text-xs text-ink-700 hover:bg-surface-sunk" (click)="pickSuggestion(sug)">{{ sug }}</button>
                  }
                </div>
                <div class="mt-5 border-t border-surface-border pt-4">
                @if (empanelment()) {
                  <p class="mb-1 text-sm font-medium text-ink-700">Request a doctor for empanelment</p>
                  <p class="mb-3 text-xs text-ink-500">Can't find your preferred doctor? Submit them for consideration.</p>
                  @if (empanelSubmitted()) {
                    <div class="rounded-xl bg-[#F0FDF4] px-3 py-3 text-sm text-success-700">✓ Request submitted. Status: <strong>Under review</strong>.</div>
                    <button type="button" class="mt-3 text-sm font-medium text-brand-700 underline" (click)="empanelment.set(false)">Back to doctor list</button>
                  } @else {
                    <div class="grid gap-3">
                      <input class="min-h-touch rounded-xl border border-surface-border px-3 text-sm outline-none focus:border-brand-500" placeholder="Doctor name" [value]="empName()" (input)="empName.set($any($event.target).value)" />
                      <input class="min-h-touch rounded-xl border border-surface-border px-3 text-sm outline-none focus:border-brand-500" placeholder="Clinic / hospital" [value]="empClinic()" (input)="empClinic.set($any($event.target).value)" />
                      <input class="min-h-touch rounded-xl border border-surface-border px-3 text-sm outline-none focus:border-brand-500" placeholder="Speciality" [value]="empSpec()" (input)="empSpec.set($any($event.target).value)" />
                    </div>
                    <div class="mt-3 flex gap-3">
                      <button type="button" class="min-h-touch flex-1 rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900" (click)="empanelment.set(false)">Cancel</button>
                      <button type="button" class="min-h-touch flex-1 rounded-xl bg-[#0F5FDC] px-4 text-sm font-semibold text-white" (click)="submitEmpanelment()">Submit request</button>
                    </div>
                  }
                } @else {
                  <p class="mb-2 text-sm font-medium text-ink-700">{{ speciality() }} — nearest first</p>
                  <input class="mb-3 min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm outline-none focus:border-brand-500" placeholder="Search doctor by name" [value]="search()" (input)="search.set($any($event.target).value)" />
                  <div class="space-y-2">
                    @for (d of filteredDoctors(); track d.id) {
                      <button type="button" class="w-full rounded-xl border px-4 py-3 text-left" [class.border-brand-500]="doctor()?.id === d.id" [class.bg-blue-50]="doctor()?.id === d.id" [class.border-surface-border]="doctor()?.id !== d.id" (click)="doctor.set(d)">
                        <div class="flex items-start justify-between gap-3">
                          <div>
                            <p class="text-sm font-semibold text-ink-900">{{ d.name }}</p>
                            <p class="text-xs text-ink-500">{{ d.clinic }}</p>
                            <p class="text-xs text-ink-500">{{ d.qualification }} · {{ d.experience }} yrs · ★ {{ d.rating }}</p>
                          </div>
                          <div class="shrink-0 text-right">
                            <p class="text-sm font-semibold text-[#034DA2]">₹{{ d.fee }}</p>
                            <p class="text-xs text-ink-500">{{ d.distanceKm }} km</p>
                            <p class="text-xs text-success-700">{{ d.nextSlot }}</p>
                          </div>
                        </div>
                      </button>
                    }
                    @if (!filteredDoctors().length) {
                      <p class="rounded-xl bg-surface-sunk px-3 py-2 text-sm text-ink-500">No doctors match “{{ search() }}”.</p>
                    }
                  </div>
                  <button type="button" class="mt-3 w-full rounded-xl border border-dashed border-surface-border px-4 py-2 text-sm font-medium text-ink-700" (click)="openEmpanelment()">Can't find your doctor? Request empanelment</button>
                }
                </div>
              }
              @case ('when') {
                <p class="mb-3 text-sm font-medium text-ink-700">Who is this visit for?</p>
                <div class="space-y-2">
                  @for (p of patients; track p.id) {
                    <button type="button" class="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm" [class.border-brand-500]="patient()?.id === p.id" [class.bg-blue-50]="patient()?.id === p.id" [class.border-surface-border]="patient()?.id !== p.id" (click)="patient.set(p)">
                      <span class="font-medium text-ink-900">{{ p.name }} <span class="text-xs text-ink-500">({{ p.rel }})</span></span>
                      @if (patient()?.id === p.id) { <span class="text-brand-700">✓</span> }
                    </button>
                  }
                </div>
                <p class="mb-1 mt-5 border-t border-surface-border pt-4 text-sm font-medium text-ink-700">Select date and time</p>
                <p class="mb-3 text-xs text-ink-500">Slots within the next 36 hours.</p>
                <div class="mb-3 flex gap-2">
                  @for (d of slotDates; track d) {
                    <button type="button" class="min-h-touch shrink-0 rounded-full border px-4 text-sm" [class.border-brand-500]="slotDate() === d" [class.bg-blue-50]="slotDate() === d" [class.border-surface-border]="slotDate() !== d" (click)="slotDate.set(d)">{{ d }}</button>
                  }
                </div>
                <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  @for (t of slotTimes; track t) {
                    <button type="button" class="min-h-touch rounded-xl border px-3 text-sm" [class.border-brand-500]="slotTime() === t" [class.bg-blue-50]="slotTime() === t" [class.border-surface-border]="slotTime() !== t" (click)="slotTime.set(t)">{{ t }}</button>
                  }
                </div>
              }
              @case ('pending') {
                <div class="text-center">
                  <p class="text-3xl">⏳</p>
                  <p class="mt-2 text-base font-bold text-[#034DA2]">Request raised — pending confirmation</p>
                  <p class="mt-1 text-sm text-ink-700">Your wallet is blocked, but <strong>no payment is taken yet</strong>. Operations will confirm the slot with the clinic.</p>
                </div>
                <p class="mt-3 rounded-xl bg-warning-50 px-3 py-2 text-xs text-warning-700">You'll get a WhatsApp and push notification once the cart is ready.</p>
                <p class="mt-2 text-center text-xs text-ink-400">(Demo: tap the button below to simulate the clinic confirming.)</p>
              }
              @case ('cart') {
                <p class="mb-2 rounded-xl bg-[#F0FDF4] px-3 py-2 text-sm text-success-700">🔔 Appointment confirmed — your cart is ready.</p>
                <p class="mb-3 text-sm font-medium text-ink-700">Payment breakdown</p>
                <dl class="space-y-2 text-sm">
                  <div class="flex justify-between"><dt class="text-ink-700">Consultation fee</dt><dd class="font-medium text-ink-900">₹{{ pay().fee }}</dd></div>
                  <div class="flex justify-between"><dt class="text-ink-700">Wallet eligible (limit ₹{{ perTxn }})</dt><dd class="font-medium text-ink-900">₹{{ pay().covered }}</dd></div>
                  <div class="flex justify-between"><dt class="text-ink-700">Co-payment ({{ copayPct }}%)</dt><dd class="font-medium text-danger-700">− ₹{{ pay().copay }}</dd></div>
                  <div class="flex justify-between border-t border-surface-border pt-2"><dt class="text-ink-700">Wallet block</dt><dd class="font-medium text-success-700">₹{{ pay().walletBlock }}</dd></div>
                  @if (pay().excess > 0) {
                    <div class="flex justify-between"><dt class="text-ink-700">Above per-transaction limit</dt><dd class="font-medium text-ink-900">₹{{ pay().excess }}</dd></div>
                  }
                  <div class="flex justify-between border-t border-surface-border pt-2"><dt class="font-semibold text-ink-900">You pay now (Razorpay)</dt><dd class="text-lg font-bold text-ink-900">₹{{ pay().selfPay }}</dd></div>
                </dl>
              }
              @case ('receipt') {
                @if (cancelled()) {
                  <div class="text-center">
                    <p class="text-3xl">🚫</p>
                    <p class="mt-2 text-base font-bold text-danger-700">Appointment cancelled</p>
                    <p class="mt-1 text-sm text-ink-700">Your blocked wallet amount has been released. No cashless letter was generated.</p>
                  </div>
                } @else {
                  <div class="text-center">
                    <p class="text-3xl">🧾</p>
                    <p class="mt-2 text-base font-bold text-[#034DA2]">Payment received</p>
                    <p class="mt-1 text-sm text-ink-700">Receipt issued. This confirms payment — the tax invoice comes after the visit.</p>
                  </div>
                  <dl class="mt-4 space-y-2 text-sm">
                    @for (row of summaryRows(); track row.label) {
                      <div class="flex justify-between gap-3 border-b border-surface-border pb-2"><dt class="text-ink-500">{{ row.label }}</dt><dd class="text-right font-medium text-ink-900">{{ row.value }}</dd></div>
                    }
                  </dl>

                  <div class="mt-4 rounded-2xl border border-[#CDDDFE] bg-[#F3F7FF] p-4">
                    <p class="text-sm font-semibold text-[#034DA2]">📄 Cashless letter</p>
                    @if (!cashlessGenerated()) {
                      <p class="mt-1 text-xs text-ink-700">
                        Generated about <strong>2 hours before</strong> your appointment ({{ slotDate() }} · {{ slotTime() }}).
                        You can cancel the appointment any time until then.
                      </p>
                      <button type="button" class="mt-3 min-h-touch w-full rounded-xl border border-[#0F5FDC] bg-white px-4 text-sm font-semibold text-[#0F5FDC]" (click)="generateCashless()">
                        Simulate: 2 hours before appointment
                      </button>
                    } @else {
                      <p class="mt-1 text-xs text-ink-700">Ready — carries the patient, doctor, clinic and approved amount. Show this at the clinic reception.</p>
                      <button type="button" class="mt-2 text-sm font-medium text-brand-700 underline" (click)="cashlessNote.set('Cashless letter downloaded and emailed (demo).')">Download cashless letter</button>
                      @if (cashlessNote(); as n) { <p class="mt-1 text-xs text-success-700">{{ n }}</p> }
                    }
                  </div>

                  @if (!cashlessGenerated()) {
                    <button type="button" class="mt-3 min-h-touch w-full rounded-xl border border-danger-600 px-4 text-sm font-semibold text-danger-700 hover:bg-danger-50" (click)="cancelAppointment()">
                      Cancel appointment
                    </button>
                  } @else {
                    <p class="mt-3 rounded-xl bg-surface-sunk px-3 py-2 text-xs text-ink-500">Cancellation is now closed — the cashless letter has been generated.</p>
                  }
                }
              }
              @case ('visit') {
                <p class="mb-2 text-base font-bold text-[#034DA2]">Visit the clinic</p>
                <p class="text-sm text-ink-700">Attend your appointment. The clinic verifies the cashless letter and the doctor gives a physical prescription.</p>
                <div class="mt-4">
                  <p class="mb-1 text-sm font-medium text-ink-700">Upload prescription</p>
                  <p class="mb-2 text-xs text-ink-500">Required to close the consultation.</p>
                  <input type="file" class="sr-only" accept="image/*,.pdf" id="rx" (change)="onPrescription($event)" />
                  <label for="rx" class="block w-full cursor-pointer rounded-xl border-2 border-dashed border-[#CDDDFE] bg-[#F7FAFF] px-6 py-6 text-center">
                    <span class="block font-medium text-[#0B2C63]">{{ prescriptionFile() ? 'Replace prescription' : 'Upload prescription' }}</span>
                    <span class="mt-1 block text-xs text-ink-500">Photo or PDF</span>
                  </label>
                  @if (prescriptionFile(); as f) { <p class="mt-2 truncate text-sm text-ink-900">{{ f }}</p> }
                </div>
              }
              @case ('completed') {
                <div class="text-center">
                  <p class="text-3xl">✅</p>
                  <p class="mt-2 text-base font-bold text-[#034DA2]">Consultation completed</p>
                  <p class="mt-1 text-sm text-ink-700">Invoice raised and the wallet block has become a debit.</p>
                </div>
                <p class="mt-3 rounded-xl bg-[#F0FDF4] px-3 py-2 text-sm text-success-700">🧾 Invoice available under Health Records › Invoices. Prescription saved to My Prescriptions.</p>
              }
            }

            @if (stepError(); as err) {
              <p class="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">{{ err }}</p>
            }
          </section>

          <div class="mt-5 flex gap-3">
            <button type="button" class="flex min-h-touch items-center rounded-xl border border-surface-border bg-white px-6 text-sm font-semibold text-ink-900 hover:border-[#A4BFFE7A]" (click)="back()">Back</button>
            <button type="button" class="min-h-touch flex-1 rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white hover:bg-[#034DA2]" (click)="next()">{{ primaryLabel() }}</button>
          </div>
        }
      </div>
    </div>
  `,
})
export class InClinicPage {
  protected readonly specialities = SPECIALITIES;
  protected readonly patients = PATIENTS;
  protected readonly postalSuggestions = POSTAL_SUGGESTIONS;
  protected readonly slotDates = SLOT_DATES;
  protected readonly slotTimes = SLOT_TIMES;
  protected readonly perTxn = PER_TXN_LIMIT;
  protected readonly copayPct = COPAY_PCT;

  protected readonly started = signal(false);
  protected readonly step = signal(0);
  protected readonly stepError = signal<string | null>(null);

  protected readonly speciality = signal('');
  protected readonly detected = signal<string | null>(null);
  protected readonly postalCode = signal('');
  protected readonly search = signal('');
  protected readonly doctor = signal<Doctor | null>(null);
  protected readonly patient = signal<{ id: string; name: string; rel: string } | null>(null);
  protected readonly slotDate = signal('');
  protected readonly slotTime = signal('');
  protected readonly cashlessNote = signal<string | null>(null);
  protected readonly cashlessGenerated = signal(false);
  protected readonly cancelled = signal(false);
  protected readonly prescriptionFile = signal<string | null>(null);

  protected readonly empanelment = signal(false);
  protected readonly empanelSubmitted = signal(false);
  protected readonly empName = signal('');
  protected readonly empClinic = signal('');
  protected readonly empSpec = signal('');

  protected readonly steps: Step[] = [
    'speciality', 'find', 'when',
    'pending', 'cart', 'receipt', 'visit', 'completed',
  ];
  protected readonly currentStep = computed<Step>(() => this.steps[this.step()] ?? 'speciality');

  protected readonly filteredDoctors = computed(() => {
    const q = this.search().trim().toLowerCase();
    return DOCTORS.filter((d) => d.speciality === this.speciality() && (!q || d.name.toLowerCase().includes(q)))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  });

  protected readonly pay = computed(() => {
    const fee = this.doctor()?.fee ?? 0;
    const covered = Math.min(fee, PER_TXN_LIMIT);
    const copay = Math.round((covered * COPAY_PCT) / 100);
    const walletBlock = covered - copay;
    const excess = Math.max(0, fee - PER_TXN_LIMIT);
    return { fee, covered, copay, walletBlock, excess, selfPay: copay + excess };
  });

  protected primaryLabel(): string {
    switch (this.currentStep()) {
      case 'pending': return 'Simulate clinic confirmation';
      case 'cart': return `Pay ₹${this.pay().selfPay} via Razorpay`;
      case 'receipt': return this.cancelled() ? 'Done' : 'Continue to visit';
      case 'visit': return 'Complete consultation';
      case 'completed': return 'Done';
      default: return 'Continue';
    }
  }

  protected summaryRows(): { label: string; value: string }[] {
    return [
      { label: 'Doctor', value: this.doctor()?.name ?? '' },
      { label: 'Clinic', value: this.doctor()?.clinic ?? '' },
      { label: 'Patient', value: this.patient()?.name ?? '' },
      { label: 'Slot', value: `${this.slotDate()} · ${this.slotTime()}` },
      { label: 'Paid', value: `₹${this.pay().selfPay} (₹${this.pay().walletBlock} from wallet)` },
    ];
  }

  protected start(): void {
    this.started.set(true);
    this.step.set(0);
    this.stepError.set(null);
  }

  protected pickSpeciality(s: string): void {
    this.speciality.set(s);
    this.doctor.set(null);
    this.search.set('');
  }

  protected detectLocation(): void {
    this.postalCode.set('122018');
    this.detected.set('Gurugram, Haryana 122018');
  }

  protected pickSuggestion(sug: string): void {
    this.postalCode.set(sug.split(' — ')[0]);
    this.detected.set(sug);
  }

  protected onPrescription(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    (event.target as HTMLInputElement).value = '';
    if (file) this.prescriptionFile.set(file.name);
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

  private validate(): string | null {
    switch (this.currentStep()) {
      case 'speciality': return this.speciality() ? null : 'Select a speciality.';
      case 'find':
        if (!(this.postalCode().trim() || this.detected())) return 'Detect or enter your location.';
        return this.doctor() ? null : 'Select a doctor.';
      case 'when':
        if (!this.patient()) return 'Select who this is for.';
        return this.slotDate() && this.slotTime() ? null : 'Pick a date and time.';
      case 'receipt':
        if (this.cancelled()) return null;
        return this.cashlessGenerated()
          ? null
          : 'The cashless letter is generated ~2 hours before the appointment — simulate it (or cancel) to continue.';
      case 'visit': return this.prescriptionFile() ? null : 'Upload the prescription to complete.';
      default: return null;
    }
  }

  protected generateCashless(): void {
    this.cashlessGenerated.set(true);
  }

  protected cancelAppointment(): void {
    this.cancelled.set(true);
  }

  protected next(): void {
    if (this.currentStep() === 'find' && this.empanelment()) { this.empanelment.set(false); return; }
    // A cancelled appointment ends the journey.
    if (this.currentStep() === 'receipt' && this.cancelled()) { this.finish(); return; }
    const err = this.validate();
    if (err) { this.stepError.set(err); return; }
    this.stepError.set(null);
    if (this.currentStep() === 'completed') { this.finish(); return; }
    this.step.set(this.step() + 1);
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

  private finish(): void {
    this.started.set(false);
    this.step.set(0);
    this.prescriptionFile.set(null);
    this.cashlessNote.set(null);
    this.cashlessGenerated.set(false);
    this.cancelled.set(false);
  }
}
