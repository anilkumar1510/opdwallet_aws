import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

/**
 * Online Consultation — DUMMY / STATIC journey, zero backend.
 *
 * Self-contained wizard reproducing patient-flows Section 1 end to end, all mock:
 * Consult Now / Schedule → speciality → doctor list (with search + empanelment
 * request) → select patient → video/audio → slot (scheduled only) → payment
 * breakdown (wallet block + Razorpay self-pay) → booking created & auto-confirmed
 * → invoice → consultation on app → e-prescription → stored in Health Records.
 * Cancellation exists but is not allowed (per spec). No network calls. See
 * REMOVED-APIS.md.
 */

interface Doctor {
  id: string;
  name: string;
  speciality: string;
  qualification: string;
  experience: number;
  fee: number;
  rating: number;
  gender: 'Male' | 'Female';
  languages: string;
  nextIn: string;
}

const SPECIALITIES = [
  'General Physician',
  'Dermatology',
  'Paediatrics',
  'Gynaecology',
  'Psychiatry',
  'ENT',
];

const DOCTORS: Doctor[] = [
  { id: 'd1', name: 'Dr. Aarti Sharma', speciality: 'General Physician', qualification: 'MBBS, MD (Medicine)', experience: 12, fee: 500, rating: 4.8, gender: 'Female', languages: 'English, Hindi', nextIn: 'Available now' },
  { id: 'd2', name: 'Dr. Rahul Verma', speciality: 'General Physician', qualification: 'MBBS', experience: 7, fee: 300, rating: 4.5, gender: 'Male', languages: 'English, Hindi', nextIn: 'in 10 min' },
  { id: 'd3', name: 'Dr. Neha Gupta', speciality: 'Dermatology', qualification: 'MBBS, MD (Dermatology)', experience: 9, fee: 700, rating: 4.7, gender: 'Female', languages: 'English, Hindi', nextIn: 'Available now' },
  { id: 'd4', name: 'Dr. Sameer Khan', speciality: 'Paediatrics', qualification: 'MBBS, DCH', experience: 15, fee: 600, rating: 4.9, gender: 'Male', languages: 'English, Hindi, Urdu', nextIn: 'in 20 min' },
  { id: 'd5', name: 'Dr. Pooja Nair', speciality: 'Gynaecology', qualification: 'MBBS, DGO', experience: 11, fee: 650, rating: 4.6, gender: 'Female', languages: 'English, Hindi, Malayalam', nextIn: 'Available now' },
  { id: 'd6', name: 'Dr. Vivek Rao', speciality: 'Psychiatry', qualification: 'MBBS, MD (Psychiatry)', experience: 10, fee: 800, rating: 4.7, gender: 'Male', languages: 'English, Hindi', nextIn: 'in 30 min' },
  { id: 'd7', name: 'Dr. Anjali Menon', speciality: 'ENT', qualification: 'MBBS, MS (ENT)', experience: 8, fee: 550, rating: 4.5, gender: 'Female', languages: 'English, Hindi', nextIn: 'Available now' },
];

const PATIENTS = [
  { id: 'shivam', name: 'Shivam Jha', rel: 'Self' },
  { id: 'sayani', name: 'Sayani Kumari', rel: 'Spouse' },
];

const SLOT_DATES = ['Today, 9 Sep', 'Tomorrow, 10 Sep', 'Thu, 11 Sep'];
const SLOT_TIMES = ['10:00 AM', '12:30 PM', '3:00 PM', '6:30 PM'];

// Online consultation benefit config (mock, matches the dummy policy).
const PER_TXN_LIMIT = 300;
const COPAY_PCT = 20;

type Step =
  | 'find'
  | 'schedule'
  | 'details'
  | 'payment'
  | 'confirmed'
  | 'consultation'
  | 'prescription';

@Component({
  selector: 'opd-online-consult-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <button type="button" class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50" aria-label="Back" (click)="headerBack()">&larr;</button>
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">Online Consultation</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">Video or audio with a network doctor</p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        <p class="mb-4 rounded-xl border border-dashed border-warning-400 bg-warning-50 px-3 py-2 text-xs text-warning-700">
          🧪 Static demo journey — no data is saved and no payment is taken.
        </p>

        <!-- ── Landing ─────────────────────────────────────────────────────── -->
        @if (!started()) {
          <div class="mb-5 rounded-2xl border border-[#CDDDFE] bg-[#F3F7FF] p-5">
            <p class="text-sm text-ink-700">Online Consultation coverage</p>
            <p class="mt-1 text-2xl font-bold text-[#034DA2]">₹5,000 <span class="text-sm font-normal text-ink-500">left this year</span></p>
            <p class="mt-1 text-xs text-ink-500">Up to ₹{{ perTxn }} per consultation from wallet · {{ copayPct }}% co-payment</p>
          </div>

          <button type="button" class="min-h-touch w-full rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white hover:bg-[#034DA2]" (click)="start()">
            Find a doctor →
          </button>
        }

        <!-- ── Wizard ──────────────────────────────────────────────────────── -->
        @else {
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-bold text-[#034DA2]">{{ consultNow() === true ? 'Consult Now' : consultNow() === false ? 'Schedule' : 'Book consultation' }}</h2>
            <span class="text-xs text-ink-500">Step {{ step() + 1 }} of {{ steps().length }}</span>
          </div>

          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
            @switch (currentStep()) {
              @case ('find') {
                <p class="mb-2 text-sm font-medium text-ink-700">Select speciality</p>
                <div class="grid grid-cols-2 gap-2">
                  @for (s of specialities; track s) {
                    <button type="button" class="min-h-touch rounded-xl border px-3 text-sm" [class.border-brand-500]="speciality() === s" [class.bg-blue-50]="speciality() === s" [class.border-surface-border]="speciality() !== s" (click)="pickSpeciality(s)">{{ s }}</button>
                  }
                </div>
                @if (speciality()) {
                  <div class="mt-5 border-t border-surface-border pt-4">
                @if (empanelment()) {
                  <p class="mb-1 text-sm font-medium text-ink-700">Request a doctor for empanelment</p>
                  <p class="mb-3 text-xs text-ink-500">Can't find your preferred doctor? Submit them for consideration.</p>
                  @if (empanelSubmitted()) {
                    <div class="rounded-xl bg-[#F0FDF4] px-3 py-3 text-sm text-success-700">
                      ✓ Request submitted. Status: <strong>Under review</strong>. We'll notify you if the doctor is empanelled.
                    </div>
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
                  <p class="mb-2 text-sm font-medium text-ink-700">{{ speciality() }} — available doctors</p>
                  <input class="mb-3 min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm outline-none focus:border-brand-500" placeholder="Search doctor by name" [value]="search()" (input)="search.set($any($event.target).value)" />
                  <div class="space-y-2">
                    @for (d of filteredDoctors(); track d.id) {
                      <button type="button" class="w-full rounded-xl border px-4 py-3 text-left" [class.border-brand-500]="doctor()?.id === d.id" [class.bg-blue-50]="doctor()?.id === d.id" [class.border-surface-border]="doctor()?.id !== d.id" (click)="doctor.set(d)">
                        <div class="flex items-start justify-between gap-3">
                          <div class="flex gap-3">
                            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF3FF] text-sm font-bold text-[#034DA2]">{{ initials(d.name) }}</span>
                            <div>
                              <p class="text-sm font-semibold text-ink-900">{{ d.name }}</p>
                              <p class="text-xs text-ink-500">{{ d.qualification }} · {{ d.experience }} yrs</p>
                              <p class="text-xs text-ink-500">★ {{ d.rating }} · {{ d.languages }} · {{ d.gender }}</p>
                            </div>
                          </div>
                          <div class="shrink-0 text-right">
                            <p class="text-sm font-semibold text-[#034DA2]">₹{{ d.fee }}</p>
                            <p class="text-xs" [class.text-success-700]="d.nextIn === 'Available now'" [class.text-ink-500]="d.nextIn !== 'Available now'">{{ d.nextIn }}</p>
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
              }
              @case ('schedule') {
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
                    <div class="scrollbar-hide mb-3 flex gap-2 overflow-x-auto">
                      @for (d of slotDates; track d) {
                        <button type="button" class="min-h-touch shrink-0 rounded-full border px-4 text-sm" [class.border-brand-500]="slotDate() === d" [class.bg-blue-50]="slotDate() === d" [class.border-surface-border]="slotDate() !== d" (click)="slotDate.set(d)">{{ d }}</button>
                      }
                    </div>
                    <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      @for (t of slotTimes; track t) {
                        <button type="button" class="min-h-touch rounded-xl border px-3 text-sm" [class.border-brand-500]="slotTime() === t" [class.bg-blue-50]="slotTime() === t" [class.border-surface-border]="slotTime() !== t" (click)="slotTime.set(t)">{{ t }}</button>
                      }
                    </div>
                  </div>
                }
              }
              @case ('details') {
                <p class="mb-3 text-sm font-medium text-ink-700">Who is this consultation for?</p>
                <div class="space-y-2">
                  @for (p of patients; track p.id) {
                    <button type="button" class="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm" [class.border-brand-500]="patient()?.id === p.id" [class.bg-blue-50]="patient()?.id === p.id" [class.border-surface-border]="patient()?.id !== p.id" (click)="patient.set(p)">
                      <span class="font-medium text-ink-900">{{ p.name }} <span class="text-xs text-ink-500">({{ p.rel }})</span></span>
                      @if (patient()?.id === p.id) { <span class="text-brand-700">✓</span> }
                    </button>
                  }
                </div>
                <p class="mb-3 mt-5 border-t border-surface-border pt-4 text-sm font-medium text-ink-700">Consultation type</p>
                <div class="grid gap-3 sm:grid-cols-2">
                  @for (m of ['Video','Audio']; track m) {
                    <button type="button" class="min-h-touch rounded-xl border px-4 text-sm font-medium" [class.border-brand-500]="mode() === m" [class.bg-blue-50]="mode() === m" [class.text-brand-700]="mode() === m" [class.border-surface-border]="mode() !== m" (click)="mode.set(m)">{{ m }}</button>
                  }
                </div>
              }
              @case ('payment') {
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
                <p class="mt-3 text-xs text-ink-500">Wallet is blocked on payment; the self-pay amount goes through Razorpay.</p>
              }
              @case ('confirmed') {
                <div class="text-center">
                  <p class="text-3xl">✅</p>
                  <p class="mt-2 text-base font-bold text-[#034DA2]">Booking confirmed</p>
                  <p class="mt-1 text-sm text-ink-700">Auto-confirmed on payment — no waiting for provider confirmation.</p>
                </div>
                <dl class="mt-4 space-y-2 text-sm">
                  @for (row of summaryRows(); track row.label) {
                    <div class="flex justify-between gap-3 border-b border-surface-border pb-2"><dt class="text-ink-500">{{ row.label }}</dt><dd class="text-right font-medium text-ink-900">{{ row.value }}</dd></div>
                  }
                </dl>
                <p class="mt-3 rounded-xl bg-[#F0FDF4] px-3 py-2 text-sm text-success-700">🧾 Invoice generated and stored under Health Records › Invoices.</p>
                <button type="button" class="mt-3 text-sm font-medium text-danger-700 underline" (click)="tryCancel()">Cancel this consultation</button>
                @if (cancelNote(); as note) { <p class="mt-2 text-xs text-warning-700">{{ note }}</p> }
              }
              @case ('consultation') {
                <div class="text-center">
                  <p class="text-3xl">{{ mode() === 'Audio' ? '📞' : '🎥' }}</p>
                  <p class="mt-2 text-base font-bold text-[#034DA2]">{{ mode() }} consultation</p>
                  <p class="mt-1 text-sm text-ink-700">with {{ doctor()?.name }}</p>
                  @if (!inCall()) {
                    <button type="button" class="mt-4 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-4 text-sm font-semibold text-white" (click)="inCall.set(true)">Join {{ mode() }} call</button>
                  } @else {
                    <div class="mt-4 flex h-40 items-center justify-center rounded-2xl bg-[#0B2C63] text-white">In call with {{ doctor()?.name }}…</div>
                    <button type="button" class="mt-3 min-h-touch w-full rounded-xl bg-danger-600 px-4 text-sm font-semibold text-white" (click)="inCall.set(false)">End call</button>
                  }
                </div>
              }
              @case ('prescription') {
                <p class="mb-2 text-base font-bold text-[#034DA2]">Prescription</p>
                <p class="text-sm text-ink-700">{{ doctor()?.name }} · {{ patient()?.name }}</p>
                <ul class="mt-3 space-y-2 text-sm">
                  <li class="rounded-xl bg-surface-sunk px-3 py-2"><span class="font-medium text-ink-900">Paracetamol 500mg</span> — 1 tablet twice a day after food, 5 days</li>
                  <li class="rounded-xl bg-surface-sunk px-3 py-2"><span class="font-medium text-ink-900">Cetirizine 10mg</span> — 1 tablet at night, 3 days</li>
                  <li class="rounded-xl bg-surface-sunk px-3 py-2"><span class="font-medium text-ink-900">Advice</span> — plenty of fluids and rest</li>
                </ul>
                <p class="mt-3 rounded-xl bg-[#F0FDF4] px-3 py-2 text-sm text-success-700">✓ E-prescription saved to Health Records › My Prescriptions.</p>
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
export class OnlineConsultPage {
  protected readonly specialities = SPECIALITIES;
  protected readonly patients = PATIENTS;
  protected readonly slotDates = SLOT_DATES;
  protected readonly slotTimes = SLOT_TIMES;
  protected readonly perTxn = PER_TXN_LIMIT;
  protected readonly copayPct = COPAY_PCT;

  protected readonly started = signal(false);
  protected readonly consultNow = signal<boolean | null>(null);
  protected readonly step = signal(0);
  protected readonly stepError = signal<string | null>(null);

  protected readonly speciality = signal('');
  protected readonly search = signal('');
  protected readonly doctor = signal<Doctor | null>(null);
  protected readonly patient = signal<{ id: string; name: string; rel: string } | null>(null);
  protected readonly mode = signal('');
  protected readonly slotDate = signal('');
  protected readonly slotTime = signal('');
  protected readonly inCall = signal(false);
  protected readonly cancelNote = signal<string | null>(null);

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

  protected readonly filteredDoctors = computed(() => {
    const q = this.search().trim().toLowerCase();
    return DOCTORS.filter((d) => d.speciality === this.speciality() && (!q || d.name.toLowerCase().includes(q)))
      .sort((a, b) => (a.nextIn === 'Available now' ? -1 : 1) - (b.nextIn === 'Available now' ? -1 : 1));
  });

  /** Mock payment breakdown: per-transaction limit + co-payment, excess self-paid. */
  protected readonly pay = computed(() => {
    const fee = this.doctor()?.fee ?? 0;
    const covered = Math.min(fee, PER_TXN_LIMIT);
    const copay = Math.round((covered * COPAY_PCT) / 100);
    const walletBlock = covered - copay;
    const excess = Math.max(0, fee - PER_TXN_LIMIT);
    const selfPay = copay + excess;
    return { fee, covered, copay, walletBlock, excess, selfPay };
  });

  protected initials(name: string): string {
    return name.replace('Dr. ', '').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
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

  protected summaryRows(): { label: string; value: string }[] {
    const rows = [
      { label: 'Doctor', value: this.doctor()?.name ?? '' },
      { label: 'Speciality', value: this.speciality() },
      { label: 'Patient', value: this.patient()?.name ?? '' },
      { label: 'Type', value: this.mode() },
    ];
    if (this.consultNow() === false) rows.push({ label: 'Slot', value: `${this.slotDate()} · ${this.slotTime()}` });
    rows.push({ label: 'Paid', value: `₹${this.pay().selfPay} (₹${this.pay().walletBlock} from wallet)` });
    return rows;
  }

  protected start(): void {
    this.consultNow.set(null);
    this.started.set(true);
    this.step.set(0);
    this.stepError.set(null);
  }

  protected pickSpeciality(s: string): void {
    this.speciality.set(s);
    this.doctor.set(null);
    this.search.set('');
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
        if (this.consultNow() === false && !(this.slotDate() && this.slotTime())) return 'Pick a date and time.';
        return null;
      case 'details':
        if (!this.patient()) return 'Select who this is for.';
        return this.mode() ? null : 'Choose Video or Audio.';
      default: return null;
    }
  }

  protected next(): void {
    // Empanelment sub-view swallows the primary button while open.
    if (this.currentStep() === 'find' && this.empanelment()) { this.empanelment.set(false); return; }
    const err = this.validate();
    if (err) { this.stepError.set(err); return; }
    this.stepError.set(null);
    if (this.currentStep() === 'prescription') { this.finish(); return; }
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
    this.inCall.set(false);
    this.cancelNote.set(null);
  }
}
