import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

/**
 * Dental — DUMMY / STATIC journey, zero backend.
 *
 * Patient-flows Section 4, all mock. A dental CONSULTATION (backend-confirmed
 * before payment, like in-clinic) with an optional PROCEDURE route: after the
 * visit the member uploads the prescription and answers whether a procedure was
 * recommended. No → completed. Yes → add estimate → create cart on hold →
 * adjudication → review → slot with the same dentist → payment → receipt →
 * pending → confirm → cashless letter → procedure visit → invoice. No network
 * calls. See REMOVED-APIS.md.
 */

interface Dentist {
  id: string;
  name: string;
  clinic: string;
  distanceKm: number;
  experience: number;
  fee: number;
  rating: number;
  next: string;
}

const DENTISTS: Dentist[] = [
  { id: 'd1', name: 'Dr. Kavya Rao', clinic: 'SmileCare, Sector 15', distanceKm: 1.4, experience: 10, fee: 600, rating: 4.8, next: 'Today 5:00 PM' },
  { id: 'd2', name: 'Dr. Arjun Nair', clinic: 'Dental Studio, Sector 29', distanceKm: 2.8, experience: 13, fee: 500, rating: 4.6, next: 'Tomorrow 11:00 AM' },
  { id: 'd3', name: 'Dr. Meera Shah', clinic: 'ClearDent, DLF Phase 2', distanceKm: 4.2, experience: 8, fee: 550, rating: 4.7, next: 'Today 6:30 PM' },
];

const PATIENTS = [
  { id: 'shivam', name: 'Shivam Jha', rel: 'Self' },
  { id: 'sayani', name: 'Sayani Kumari', rel: 'Spouse' },
];
const SLOT_DATES = ['Today, 10 Sep', 'Tomorrow, 11 Sep'];
const SLOT_TIMES = ['10:00 AM', '12:30 PM', '3:00 PM', '6:30 PM'];

const PER_TXN_LIMIT = 400;
const COPAY_PCT = 20;

function breakdown(value: number) {
  const covered = Math.min(value, PER_TXN_LIMIT);
  const copay = Math.round((covered * COPAY_PCT) / 100);
  const walletBlock = covered - copay;
  const excess = Math.max(0, value - PER_TXN_LIMIT);
  return { value, covered, copay, walletBlock, excess, selfPay: copay + excess };
}

type Step =
  | 'compare' | 'book' | 'pending' | 'cart' | 'receipt' | 'visit' | 'completed'
  | 'estimate' | 'procAdj' | 'procSlot' | 'procPayment' | 'procConfirm' | 'procCompleted';

@Component({
  selector: 'opd-dental-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none">
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <button type="button" class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50" aria-label="Back" (click)="headerBack()">&larr;</button>
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">Dental</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">Consultation, and a procedure if recommended</p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        <p class="mb-4 rounded-xl border border-dashed border-warning-400 bg-warning-50 px-3 py-2 text-xs text-warning-700">🧪 Static demo journey — no data is saved and no payment is taken.</p>

        @if (!started()) {
          <div class="rounded-2xl border border-[#CDDDFE] bg-[#F3F7FF] p-5">
            <p class="text-sm text-ink-700">Dental coverage</p>
            <p class="mt-1 text-2xl font-bold text-[#034DA2]">₹5,000 <span class="text-sm font-normal text-ink-500">left this year</span></p>
            <p class="mt-1 text-xs text-ink-500">Up to ₹{{ perTxn }} per transaction from wallet · {{ copayPct }}% co-payment</p>
          </div>
          <button type="button" class="mt-5 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white hover:bg-[#034DA2]" (click)="start()">Compare dentists →</button>
        }

        @else {
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-bold text-[#034DA2]">{{ procedure() === true ? 'Dental procedure' : 'Dental consultation' }}</h2>
          </div>

          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
            @switch (currentStep()) {
              @case ('compare') {
                <p class="mb-3 text-sm font-medium text-ink-700">Compare dentists</p>
                <div class="space-y-2">
                  @for (d of dentists; track d.id) {
                    <button type="button" class="w-full rounded-xl border px-4 py-3 text-left" [class.border-brand-500]="dentist()?.id === d.id" [class.bg-blue-50]="dentist()?.id === d.id" [class.border-surface-border]="dentist()?.id !== d.id" (click)="dentist.set(d)">
                      <div class="flex items-start justify-between gap-3">
                        <div><p class="text-sm font-semibold text-ink-900">{{ d.name }}</p><p class="text-xs text-ink-500">{{ d.clinic }}</p><p class="text-xs text-ink-500">{{ d.experience }} yrs · ★ {{ d.rating }}</p></div>
                        <div class="shrink-0 text-right"><p class="text-sm font-semibold text-[#034DA2]">₹{{ d.fee }}</p><p class="text-xs text-ink-500">{{ d.distanceKm }} km</p><p class="text-xs text-success-700">{{ d.next }}</p></div>
                      </div>
                    </button>
                  }
                </div>
              }
              @case ('book') {
                <p class="mb-2 text-sm font-medium text-ink-700">Pick date and time</p>
                <div class="mb-3 flex gap-2">
                  @for (d of slotDates; track d) { <button type="button" class="min-h-touch shrink-0 rounded-full border px-4 text-sm" [class.border-brand-500]="slotDate() === d" [class.bg-blue-50]="slotDate() === d" [class.border-surface-border]="slotDate() !== d" (click)="slotDate.set(d)">{{ d }}</button> }
                </div>
                <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  @for (t of slotTimes; track t) { <button type="button" class="min-h-touch rounded-xl border px-3 text-sm" [class.border-brand-500]="slotTime() === t" [class.bg-blue-50]="slotTime() === t" [class.border-surface-border]="slotTime() !== t" (click)="slotTime.set(t)">{{ t }}</button> }
                </div>
                <p class="mb-2 mt-5 border-t border-surface-border pt-4 text-sm font-medium text-ink-700">Who is the visit for?</p>
                <div class="space-y-2">
                  @for (p of patients; track p.id) { <button type="button" class="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm" [class.border-brand-500]="patient()?.id === p.id" [class.bg-blue-50]="patient()?.id === p.id" [class.border-surface-border]="patient()?.id !== p.id" (click)="patient.set(p)"><span class="font-medium text-ink-900">{{ p.name }} <span class="text-xs text-ink-500">({{ p.rel }})</span></span>@if (patient()?.id === p.id) { <span class="text-brand-700">✓</span> }</button> }
                </div>
                <label class="mb-1 mt-4 block text-sm font-medium text-ink-700">Contact number</label>
                <input class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm outline-none focus:border-brand-500" inputmode="tel" placeholder="10-digit mobile" [value]="contact()" (input)="contact.set($any($event.target).value)" />
              }
              @case ('pending') {
                <div class="text-center"><p class="text-3xl">⏳</p><p class="mt-2 text-base font-bold text-[#034DA2]">Request raised — pending confirmation</p><p class="mt-1 text-sm text-ink-700">Wallet blocked, no payment yet. Operations confirms the slot with {{ dentist()?.clinic }}.</p></div>
                <button type="button" class="mt-4 min-h-touch w-full rounded-xl border border-dashed border-surface-border px-4 text-sm font-semibold text-ink-700 hover:bg-surface-sunk" (click)="consultConfirmed.set(true)">Simulate: clinic confirmation</button>
              }
              @case ('cart') {
                <p class="mb-2 rounded-xl bg-[#F0FDF4] px-3 py-2 text-sm text-success-700">🔔 Confirmed — your cart is ready.</p>
                <p class="mb-3 text-sm font-medium text-ink-700">Payment breakdown</p>
                <dl class="space-y-2 text-sm">
                  <div class="flex justify-between"><dt class="text-ink-700">Consultation fee</dt><dd class="font-medium text-ink-900">₹{{ consultPay().value }}</dd></div>
                  <div class="flex justify-between"><dt class="text-ink-700">Wallet eligible (limit ₹{{ perTxn }})</dt><dd class="font-medium text-ink-900">₹{{ consultPay().covered }}</dd></div>
                  <div class="flex justify-between"><dt class="text-ink-700">Co-payment ({{ copayPct }}%)</dt><dd class="font-medium text-danger-700">− ₹{{ consultPay().copay }}</dd></div>
                  <div class="flex justify-between border-t border-surface-border pt-2"><dt class="text-ink-700">Wallet block</dt><dd class="font-medium text-success-700">₹{{ consultPay().walletBlock }}</dd></div>
                  @if (consultPay().excess > 0) { <div class="flex justify-between"><dt class="text-ink-700">Above per-transaction limit</dt><dd class="font-medium text-ink-900">₹{{ consultPay().excess }}</dd></div> }
                  <div class="flex justify-between border-t border-surface-border pt-2"><dt class="font-semibold text-ink-900">You pay now (Razorpay)</dt><dd class="text-lg font-bold text-ink-900">₹{{ consultPay().selfPay }}</dd></div>
                </dl>
              }
              @case ('receipt') {
                <div class="text-center"><p class="text-3xl">🧾</p><p class="mt-2 text-base font-bold text-[#034DA2]">Payment received</p></div>
                <div class="mt-4 rounded-2xl border border-[#CDDDFE] bg-[#F3F7FF] p-4">
                  <p class="text-sm font-semibold text-[#034DA2]">📄 Cashless letter</p>
                  <p class="mt-1 text-xs text-ink-700">Generated about 2 hours before your consult ({{ slotDate() }} · {{ slotTime() }}). Carries patient, dentist, clinic and approved amount.</p>
                  <button type="button" class="mt-2 text-sm font-medium text-brand-700 underline" (click)="consultCashless.set(true)">Download cashless letter</button>
                  @if (consultCashless()) { <p class="mt-1 text-xs text-success-700">Downloaded and emailed (demo).</p> }
                </div>
              }
              @case ('visit') {
                <p class="mb-2 text-base font-bold text-[#034DA2]">Visit the clinic</p>
                <p class="text-sm text-ink-700">Attend your appointment. The dentist gives a physical prescription.</p>
                <p class="mb-1 mt-4 text-sm font-medium text-ink-700">Upload prescription</p>
                <input type="file" class="sr-only" accept="image/*,.pdf" id="rx" (change)="onPrescription($event)" />
                <label for="rx" class="block w-full cursor-pointer rounded-xl border-2 border-dashed border-[#CDDDFE] bg-[#F7FAFF] px-6 py-5 text-center"><span class="block font-medium text-[#0B2C63]">{{ prescriptionFile() ? 'Replace prescription' : 'Upload prescription' }}</span></label>
                @if (prescriptionFile(); as f) { <p class="mt-2 truncate text-sm text-ink-900">{{ f }}</p> }
                <p class="mb-2 mt-5 border-t border-surface-border pt-4 text-sm font-medium text-ink-700">Was a procedure recommended?</p>
                <div class="grid grid-cols-2 gap-3">
                  <button type="button" class="min-h-touch rounded-xl border px-4 text-sm font-medium" [class.border-brand-500]="procedure() === false" [class.bg-blue-50]="procedure() === false" [class.border-surface-border]="procedure() !== false" (click)="procedure.set(false)">No</button>
                  <button type="button" class="min-h-touch rounded-xl border px-4 text-sm font-medium" [class.border-brand-500]="procedure() === true" [class.bg-blue-50]="procedure() === true" [class.border-surface-border]="procedure() !== true" (click)="procedure.set(true)">Yes</button>
                </div>
              }
              @case ('completed') {
                <div class="text-center"><p class="text-3xl">✅</p><p class="mt-2 text-base font-bold text-[#034DA2]">Consultation completed</p><p class="mt-1 text-sm text-ink-700">No procedure recommended. Invoice raised and the wallet block became a debit.</p></div>
              }
              @case ('estimate') {
                <p class="mb-2 text-base font-bold text-[#034DA2]">Add the procedure estimate</p>
                <p class="mb-3 text-sm text-ink-700">Enter the estimate the dentist gave, against the same prescription and dentist.</p>
                <label class="mb-1 block text-xs font-medium text-ink-700">Procedure</label>
                <input class="mb-3 min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm outline-none focus:border-brand-500" [value]="procedureName()" (input)="procedureName.set($any($event.target).value)" />
                <label class="mb-1 block text-xs font-medium text-ink-700">Estimated amount (₹)</label>
                <input class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm outline-none focus:border-brand-500" type="number" inputmode="numeric" [value]="estimate()" (input)="estimate.set(+$any($event.target).value)" />
              }
              @case ('procAdj') {
                @if (!procAdjudicated()) {
                  <div class="text-center"><p class="text-3xl">⏳</p><p class="mt-2 text-base font-bold text-[#034DA2]">Cart on hold — adjudication</p><p class="mt-1 text-sm text-ink-700">The procedure is checked against your policy and prescription. Nothing is charged while it's on hold.</p></div>
                  <button type="button" class="mt-4 min-h-touch w-full rounded-xl border border-dashed border-surface-border px-4 text-sm font-semibold text-ink-700 hover:bg-surface-sunk" (click)="procAdjudicated.set(true)">Simulate: adjudicator creates the cart</button>
                } @else {
                  <p class="mb-2 rounded-xl bg-[#F0FDF4] px-3 py-2 text-sm text-success-700">🔔 Procedure cart ready.</p>
                  <dl class="space-y-2 text-sm">
                    <div class="flex justify-between"><dt class="text-ink-700">Procedure</dt><dd class="font-medium text-ink-900">{{ procedureName() }}</dd></div>
                    <div class="flex justify-between"><dt class="text-ink-700">Estimate</dt><dd class="font-medium text-ink-900">₹{{ estimate() }}</dd></div>
                    <div class="flex justify-between"><dt class="text-ink-700">Approved value</dt><dd class="font-medium text-success-700">₹{{ estimate() }}</dd></div>
                  </dl>
                }
              }
              @case ('procSlot') {
                <p class="mb-1 text-sm font-medium text-ink-700">Select a slot with {{ dentist()?.name }}</p>
                <p class="mb-3 text-xs text-ink-500">Restricted to the dentist who recommended the procedure.</p>
                <div class="mb-3 flex gap-2">
                  @for (d of slotDates; track d) { <button type="button" class="min-h-touch shrink-0 rounded-full border px-4 text-sm" [class.border-brand-500]="procSlotDate() === d" [class.bg-blue-50]="procSlotDate() === d" [class.border-surface-border]="procSlotDate() !== d" (click)="procSlotDate.set(d)">{{ d }}</button> }
                </div>
                <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  @for (t of slotTimes; track t) { <button type="button" class="min-h-touch rounded-xl border px-3 text-sm" [class.border-brand-500]="procSlotTime() === t" [class.bg-blue-50]="procSlotTime() === t" [class.border-surface-border]="procSlotTime() !== t" (click)="procSlotTime.set(t)">{{ t }}</button> }
                </div>
              }
              @case ('procPayment') {
                <p class="mb-3 text-sm font-medium text-ink-700">Procedure payment breakdown</p>
                <dl class="space-y-2 text-sm">
                  <div class="flex justify-between"><dt class="text-ink-700">Procedure value</dt><dd class="font-medium text-ink-900">₹{{ procPay().value }}</dd></div>
                  <div class="flex justify-between"><dt class="text-ink-700">Wallet eligible (limit ₹{{ perTxn }})</dt><dd class="font-medium text-ink-900">₹{{ procPay().covered }}</dd></div>
                  <div class="flex justify-between"><dt class="text-ink-700">Co-payment ({{ copayPct }}%)</dt><dd class="font-medium text-danger-700">− ₹{{ procPay().copay }}</dd></div>
                  <div class="flex justify-between border-t border-surface-border pt-2"><dt class="text-ink-700">Wallet block</dt><dd class="font-medium text-success-700">₹{{ procPay().walletBlock }}</dd></div>
                  @if (procPay().excess > 0) { <div class="flex justify-between"><dt class="text-ink-700">Above per-transaction limit</dt><dd class="font-medium text-ink-900">₹{{ procPay().excess }}</dd></div> }
                  <div class="flex justify-between border-t border-surface-border pt-2"><dt class="font-semibold text-ink-900">You pay now (Razorpay)</dt><dd class="text-lg font-bold text-ink-900">₹{{ procPay().selfPay }}</dd></div>
                </dl>
              }
              @case ('procConfirm') {
                <div class="text-center"><p class="text-3xl">🧾</p><p class="mt-2 text-base font-bold text-[#034DA2]">Payment received</p><p class="mt-1 text-sm text-ink-700">Procedure appointment is pending confirmation — it isn't auto-confirmed.</p></div>
                @if (!procConfirmed()) {
                  <button type="button" class="mt-4 min-h-touch w-full rounded-xl border border-dashed border-surface-border px-4 text-sm font-semibold text-ink-700 hover:bg-surface-sunk" (click)="procConfirmed.set(true)">Simulate: clinic confirmation</button>
                } @else {
                  <div class="mt-4 rounded-2xl border border-[#CDDDFE] bg-[#F3F7FF] p-4"><p class="text-sm font-semibold text-[#034DA2]">📄 Cashless letter</p><p class="mt-1 text-xs text-ink-700">Ready — carries patient, dentist, clinic, procedure and approved amount.</p></div>
                }
              }
              @case ('procCompleted') {
                <div class="text-center"><p class="text-3xl">✅</p><p class="mt-2 text-base font-bold text-[#034DA2]">Procedure completed</p><p class="mt-1 text-sm text-ink-700">Invoice raised and the wallet block became a debit.</p></div>
              }
            }

            @if (stepError(); as err) { <p class="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">{{ err }}</p> }
          </section>

          <div class="mt-5 flex gap-3">
            @if (currentStep() !== 'completed' && currentStep() !== 'procCompleted') {
              <button type="button" class="flex min-h-touch items-center rounded-xl border border-surface-border bg-white px-6 text-sm font-semibold text-ink-900 hover:border-[#A4BFFE7A]" (click)="back()">Back</button>
            }
            <button type="button" class="min-h-touch flex-1 rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white hover:bg-[#034DA2]" (click)="next()">{{ primaryLabel() }}</button>
          </div>
        }
      </div>
    </div>
  `,
})
export class DentalPage {
  protected readonly dentists = DENTISTS;
  protected readonly patients = PATIENTS;
  protected readonly slotDates = SLOT_DATES;
  protected readonly slotTimes = SLOT_TIMES;
  protected readonly perTxn = PER_TXN_LIMIT;
  protected readonly copayPct = COPAY_PCT;

  protected readonly started = signal(false);
  protected readonly step = signal(0);
  protected readonly stepError = signal<string | null>(null);

  protected readonly dentist = signal<Dentist | null>(null);
  protected readonly slotDate = signal('');
  protected readonly slotTime = signal('');
  protected readonly patient = signal<{ id: string; name: string; rel: string } | null>(null);
  protected readonly contact = signal('');
  protected readonly consultConfirmed = signal(false);
  protected readonly consultCashless = signal(false);
  protected readonly prescriptionFile = signal<string | null>(null);
  protected readonly procedure = signal<boolean | null>(null);

  protected readonly procedureName = signal('Root canal treatment');
  protected readonly estimate = signal(5000);
  protected readonly procAdjudicated = signal(false);
  protected readonly procSlotDate = signal('');
  protected readonly procSlotTime = signal('');
  protected readonly procConfirmed = signal(false);

  protected readonly steps = computed<Step[]>(() => {
    const consult: Step[] = ['compare', 'book', 'pending', 'cart', 'receipt', 'visit'];
    const proc = this.procedure();
    if (proc === false) return [...consult, 'completed'];
    if (proc === true) return [...consult, 'estimate', 'procAdj', 'procSlot', 'procPayment', 'procConfirm', 'procCompleted'];
    return consult;
  });
  protected readonly currentStep = computed<Step>(() => this.steps()[this.step()] ?? 'compare');

  protected readonly consultPay = computed(() => breakdown(this.dentist()?.fee ?? 0));
  protected readonly procPay = computed(() => breakdown(this.estimate() || 0));

  protected primaryLabel(): string {
    switch (this.currentStep()) {
      case 'compare': return 'Book Visit';
      case 'book': return 'Request appointment';
      case 'cart': return `Pay ₹${this.consultPay().selfPay} via Razorpay`;
      case 'receipt': return 'Continue to visit';
      case 'estimate': return 'Create cart';
      case 'procPayment': return `Pay ₹${this.procPay().selfPay} via Razorpay`;
      case 'completed': case 'procCompleted': return 'Done';
      default: return 'Continue';
    }
  }

  protected start(): void {
    this.started.set(true);
    this.step.set(0);
    this.stepError.set(null);
  }

  protected onPrescription(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    (event.target as HTMLInputElement).value = '';
    if (file) this.prescriptionFile.set(file.name);
  }

  private validate(): string | null {
    switch (this.currentStep()) {
      case 'compare': return this.dentist() ? null : 'Pick a dentist.';
      case 'book':
        if (!(this.slotDate() && this.slotTime())) return 'Pick a date and time.';
        if (!this.patient()) return 'Select who the visit is for.';
        return /^\d{10}$/.test(this.contact().trim()) ? null : 'Enter a valid 10-digit contact number.';
      case 'pending': return this.consultConfirmed() ? null : 'Waiting on the clinic — use the button above.';
      case 'visit':
        if (!this.prescriptionFile()) return 'Upload the prescription.';
        return this.procedure() !== null ? null : 'Answer whether a procedure was recommended.';
      case 'estimate': return this.estimate() > 0 ? null : 'Enter the procedure estimate.';
      case 'procAdj': return this.procAdjudicated() ? null : 'Waiting on adjudication — use the button above.';
      case 'procSlot': return this.procSlotDate() && this.procSlotTime() ? null : 'Pick a procedure slot.';
      case 'procConfirm': return this.procConfirmed() ? null : 'Waiting on the clinic — use the button above.';
      default: return null;
    }
  }

  protected next(): void {
    const err = this.validate();
    if (err) { this.stepError.set(err); return; }
    this.stepError.set(null);
    if (this.currentStep() === 'completed' || this.currentStep() === 'procCompleted') { this.finish(); return; }
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
    this.dentist.set(null);
    this.slotDate.set(''); this.slotTime.set('');
    this.patient.set(null); this.contact.set('');
    this.consultConfirmed.set(false); this.consultCashless.set(false);
    this.prescriptionFile.set(null); this.procedure.set(null);
    this.procAdjudicated.set(false); this.procSlotDate.set(''); this.procSlotTime.set('');
    this.procConfirmed.set(false);
  }
}
