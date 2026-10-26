import { ChangeDetectionStrategy, Component, computed, signal, inject } from '@angular/core';

import { MOCK_WALLET_BALANCE, splitPayment, percentCopay } from '../../core/domain/payment-split';
import { PolicyStore } from '../../core/member/policy.store';
import { PaymentSplitView } from '../../shared/ui/payment-split';

import { BenefitCategory } from '../../core/domain/codes';
import { ClaimModeStore } from '../../core/member/claim-mode.store';
import { ClaimOption } from '../../shared/ui/claim-option';
import { CoverageBannerComponent } from '../../shared/ui/coverage-banner';

/**
 * Vaccination — DUMMY / STATIC journey, zero backend.
 *
 * Patient-flows Section 6, all mock. Vendor vaccine booking, backend-confirmed
 * before payment (like in-clinic): select vaccine (age/gender eligibility) →
 * optional prescription → provider + slot → request raised & pending
 * confirmation (wallet blocked, no payment) → simulate vendor confirmation →
 * cart + payment (wallet + Razorpay) → receipt → cashless letter (2h prior) →
 * vaccination at vendor → vendor reports completion or no-show → invoice. The
 * operations confirmation queue is backend/out of the portal. No network calls.
 * See REMOVED-APIS.md.
 */

interface Vaccine { id: string; name: string; ageNote: string; price: number; }
interface Provider { id: string; name: string; site: string; distanceKm: number; }

const VACCINES: Vaccine[] = [
  { id: 'v1', name: 'Influenza (Flu)', ageNote: 'All ages', price: 800 },
  { id: 'v2', name: 'Hepatitis B', ageNote: 'All ages · 3-dose', price: 1200 },
  { id: 'v3', name: 'HPV', ageNote: '9–26 years', price: 3000 },
  { id: 'v4', name: 'Typhoid', ageNote: 'All ages', price: 1500 },
  { id: 'v5', name: 'Tetanus (Td)', ageNote: 'All ages', price: 500 },
];
const DOSES = ['First dose', 'Second dose', 'Booster'];
const PROVIDERS: Provider[] = [
  { id: 'p1', name: 'Apollo Vaccination Centre', site: 'Sector 14, Gurugram', distanceKm: 1.5 },
  { id: 'p2', name: 'Fortis Immunisation', site: 'Sector 44, Gurugram', distanceKm: 3.2 },
  { id: 'p3', name: 'Max Vaccine Clinic', site: 'DLF Phase 2', distanceKm: 4.6 },
];
const PATIENTS = [
  { id: 'shivam', name: 'Shivam Jha', rel: 'Self' },
  { id: 'sayani', name: 'Sayani Kumari', rel: 'Spouse' },
];
const SLOT_DATES = ['Today, 11 Sep', 'Tomorrow, 12 Sep'];
const SLOT_TIMES = ['10:00 AM', '12:30 PM', '3:00 PM', '6:30 PM'];

const PER_TXN_LIMIT = 400;
const COPAY_PCT = 20;

/** Co-payment first, then the per-transaction limit, then the wallet balance. */
function breakdown(value: number, balance: number) {
  const split = splitPayment(value, percentCopay(COPAY_PCT), PER_TXN_LIMIT, balance);
  return { value, split, copay: split.copayAmount, walletBlock: split.walletPays, excess: split.aboveLimit, selfPay: split.memberPays };
}

type Step = 'vaccine' | 'details' | 'provider' | 'pending' | 'cart' | 'receipt' | 'visit' | 'completed';

@Component({
  selector: 'opd-vaccination-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ClaimOption, CoverageBannerComponent, PaymentSplitView],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none">
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <button type="button" class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50" aria-label="Back" (click)="headerBack()">&larr;</button>
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">Vaccination</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">Vaccine booking at an empanelled vendor</p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">

        @if (!started()) {
          <opd-coverage-banner [category]="BenefitCategory.Vaccination" />
          @if (claimModes.allowsCashless(BenefitCategory.Vaccination)) {
            <button type="button" class="mt-5 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white hover:bg-[#034DA2]" (click)="start()">Book a vaccine →</button>
          }
          <opd-claim-option [category]="BenefitCategory.Vaccination" [label]="'vaccination'" />
        }

        @else {
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-bold text-[#034DA2]">Book vaccination</h2>
          </div>

          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
            @switch (currentStep()) {
              @case ('vaccine') {
                <p class="mb-1 text-sm font-medium text-ink-700">Select vaccine</p>
                <p class="mb-3 text-xs text-ink-500">Catalogue follows age and gender eligibility.</p>
                <div class="space-y-2">
                  @for (v of vaccines; track v.id) {
                    <button type="button" class="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm" [class.border-brand-500]="vaccine()?.id === v.id" [class.bg-blue-50]="vaccine()?.id === v.id" [class.border-surface-border]="vaccine()?.id !== v.id" (click)="vaccine.set(v)">
                      <span><span class="font-medium text-ink-900">{{ v.name }}</span> <span class="text-xs text-ink-500">· {{ v.ageNote }}</span></span>
                      <span class="font-semibold text-[#034DA2]">₹{{ v.price }}</span>
                    </button>
                  }
                </div>
                <p class="mb-2 mt-5 border-t border-surface-border pt-4 text-sm font-medium text-ink-700">Dose</p>
                <div class="grid grid-cols-3 gap-2">
                  @for (d of doses; track d) { <button type="button" class="min-h-touch rounded-xl border px-2 text-xs font-medium" [class.border-brand-500]="dose() === d" [class.bg-blue-50]="dose() === d" [class.border-surface-border]="dose() !== d" (click)="dose.set(d)">{{ d }}</button> }
                </div>
              }
              @case ('details') {
                <p class="mb-3 text-sm font-medium text-ink-700">Who is the vaccine for?</p>
                <div class="space-y-2">
                  @for (p of patients; track p.id) { <button type="button" class="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm" [class.border-brand-500]="patient()?.id === p.id" [class.bg-blue-50]="patient()?.id === p.id" [class.border-surface-border]="patient()?.id !== p.id" (click)="patient.set(p)"><span class="font-medium text-ink-900">{{ p.name }} <span class="text-xs text-ink-500">({{ p.rel }})</span></span>@if (patient()?.id === p.id) { <span class="text-brand-700">✓</span> }</button> }
                </div>
                <p class="mb-1 mt-5 border-t border-surface-border pt-4 text-sm font-medium text-ink-700">Prescription <span class="text-xs font-normal text-ink-500">(optional)</span></p>
                <p class="mb-2 text-xs text-ink-500">Vaccination doesn't need a prescription.</p>
                <input type="file" class="sr-only" accept="image/*,.pdf" id="rx" (change)="onPrescription($event)" />
                <label for="rx" class="block w-full cursor-pointer rounded-xl border-2 border-dashed border-[#CDDDFE] bg-[#F7FAFF] px-6 py-5 text-center"><span class="block font-medium text-[#0B2C63]">{{ prescriptionFile() ? 'Replace prescription' : 'Upload prescription (optional)' }}</span></label>
                @if (prescriptionFile(); as f) { <p class="mt-2 truncate text-sm text-ink-900">{{ f }}</p> }
              }
              @case ('provider') {
                <p class="mb-2 text-sm font-medium text-ink-700">Select provider</p>
                <div class="space-y-2">
                  @for (p of providers; track p.id) { <button type="button" class="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm" [class.border-brand-500]="provider()?.id === p.id" [class.bg-blue-50]="provider()?.id === p.id" [class.border-surface-border]="provider()?.id !== p.id" (click)="provider.set(p)"><span><span class="font-medium text-ink-900">{{ p.name }}</span><span class="block text-xs text-ink-500">{{ p.site }}</span></span><span class="text-xs text-ink-500">{{ p.distanceKm }} km</span></button> }
                </div>
                <p class="mb-2 mt-5 border-t border-surface-border pt-4 text-sm font-medium text-ink-700">Date and time</p>
                <div class="mb-3 flex gap-2">
                  @for (d of slotDates; track d) { <button type="button" class="min-h-touch shrink-0 rounded-full border px-4 text-sm" [class.border-brand-500]="slotDate() === d" [class.bg-blue-50]="slotDate() === d" [class.border-surface-border]="slotDate() !== d" (click)="slotDate.set(d)">{{ d }}</button> }
                </div>
                <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  @for (t of slotTimes; track t) { <button type="button" class="min-h-touch rounded-xl border px-3 text-sm" [class.border-brand-500]="slotTime() === t" [class.bg-blue-50]="slotTime() === t" [class.border-surface-border]="slotTime() !== t" (click)="slotTime.set(t)">{{ t }}</button> }
                </div>
              }
              @case ('pending') {
                <div class="text-center"><p class="text-3xl">⏳</p><p class="mt-2 text-base font-bold text-[#034DA2]">Request raised — pending confirmation</p><p class="mt-1 text-sm text-ink-700">Wallet blocked, no payment yet. Operations confirms the slot and vaccine with {{ provider()?.name }}.</p></div>
                <button type="button" class="mt-4 min-h-touch w-full rounded-xl border border-dashed border-surface-border px-4 text-sm font-semibold text-ink-700 hover:bg-surface-sunk" (click)="confirmed.set(true)">Simulate: vendor confirmation</button>
              }
              @case ('cart') {
                <p class="mb-2 rounded-xl bg-[#F0FDF4] px-3 py-2 text-sm text-success-700">🔔 Confirmed — your cart is ready.</p>
                <p class="mb-3 text-sm font-medium text-ink-700">Payment breakdown</p>
                <opd-payment-split [split]="pay().split" [billLabel]="(vaccine()?.name ?? 'Vaccine') + ' · ' + dose()" />
              }
              @case ('receipt') {
                <div class="text-center"><p class="text-3xl">🧾</p><p class="mt-2 text-base font-bold text-[#034DA2]">Payment received</p></div>
                <div class="mt-4 rounded-2xl border border-[#CDDDFE] bg-[#F3F7FF] p-4">
                  <p class="text-sm font-semibold text-[#034DA2]">📄 Cashless letter</p>
                  <p class="mt-1 text-xs text-ink-700">Generated about 2 hours before your slot ({{ slotDate() }} · {{ slotTime() }}). Carries patient, vaccine, vendor and approved amount.</p>
                  <button type="button" class="mt-2 text-sm font-medium text-brand-700 underline" (click)="cashless.set(true)">Download cashless letter</button>
                  @if (cashless()) { <p class="mt-1 text-xs text-success-700">Downloaded and emailed (demo).</p> }
                </div>
              }
              @case ('visit') {
                <p class="mb-2 text-base font-bold text-[#034DA2]">Vaccination at the vendor</p>
                <p class="text-sm text-ink-700">Attend {{ provider()?.name }}. The vendor verifies the cashless letter and administers the dose, then reports the outcome.</p>
                <div class="mt-4 grid grid-cols-2 gap-3">
                  <button type="button" class="min-h-touch rounded-xl border px-3 text-sm font-medium" [class.border-brand-500]="outcome() === 'done'" [class.bg-blue-50]="outcome() === 'done'" [class.border-surface-border]="outcome() !== 'done'" (click)="outcome.set('done')">Simulate: dose administered</button>
                  <button type="button" class="min-h-touch rounded-xl border px-3 text-sm font-medium" [class.border-brand-500]="outcome() === 'noshow'" [class.bg-blue-50]="outcome() === 'noshow'" [class.border-surface-border]="outcome() !== 'noshow'" (click)="outcome.set('noshow')">Simulate: no-show</button>
                </div>
              }
              @case ('completed') {
                @if (outcome() === 'noshow') {
                  <div class="text-center"><p class="text-3xl">🚫</p><p class="mt-2 text-base font-bold text-danger-700">Marked as no-show</p><p class="mt-1 text-sm text-ink-700">The vendor reported that the patient did not attend. Penalisation is still to be discussed.</p></div>
                } @else {
                  <div class="text-center"><p class="text-3xl">✅</p><p class="mt-2 text-base font-bold text-[#034DA2]">Vaccination completed</p><p class="mt-1 text-sm text-ink-700">Invoice raised and the wallet block became a debit.</p></div>
                }
              }
            }

            @if (stepError(); as err) { <p class="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">{{ err }}</p> }
          </section>

          <div class="mt-5 flex gap-3">
            @if (currentStep() !== 'completed') {
              <button type="button" class="flex min-h-touch items-center rounded-xl border border-surface-border bg-white px-6 text-sm font-semibold text-ink-900 hover:border-[#A4BFFE7A]" (click)="back()">Back</button>
            }
            <button type="button" class="min-h-touch flex-1 rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white hover:bg-[#034DA2]" (click)="next()">{{ primaryLabel() }}</button>
          </div>
        }
      </div>
    </div>
  `,
})
export class VaccinationPage {
  protected readonly claimModes = inject(ClaimModeStore);
  /**
   * Wallet balance this benefit can draw on. Fixed mock for now; the live
   * pool-or-total balance is PolicyStore.availableBalanceFor(benefit).
   */
  protected readonly walletBalance = computed(() => MOCK_WALLET_BALANCE);
  protected readonly BenefitCategory = BenefitCategory;
  protected readonly vaccines = VACCINES;
  protected readonly doses = DOSES;
  protected readonly providers = PROVIDERS;
  protected readonly patients = PATIENTS;
  protected readonly slotDates = SLOT_DATES;
  protected readonly slotTimes = SLOT_TIMES;
  protected readonly perTxn = PER_TXN_LIMIT;
  protected readonly copayPct = COPAY_PCT;

  protected readonly started = signal(false);
  protected readonly step = signal(0);
  protected readonly stepError = signal<string | null>(null);

  protected readonly vaccine = signal<Vaccine | null>(null);
  protected readonly dose = signal('');
  protected readonly patient = signal<{ id: string; name: string; rel: string } | null>(null);
  protected readonly prescriptionFile = signal<string | null>(null);
  protected readonly provider = signal<Provider | null>(null);
  protected readonly slotDate = signal('');
  protected readonly slotTime = signal('');
  protected readonly confirmed = signal(false);
  protected readonly cashless = signal(false);
  protected readonly outcome = signal<'done' | 'noshow' | null>(null);

  protected readonly steps: Step[] = ['vaccine', 'details', 'provider', 'pending', 'cart', 'receipt', 'visit', 'completed'];
  protected readonly currentStep = computed<Step>(() => this.steps[this.step()] ?? 'vaccine');

  protected readonly pay = computed(() => breakdown(this.vaccine()?.price ?? 0, this.walletBalance()));

  protected primaryLabel(): string {
    switch (this.currentStep()) {
      case 'cart': return `Pay ₹${this.pay().selfPay} via Razorpay`;
      case 'receipt': return 'Continue to visit';
      case 'completed': return 'Done';
      default: return 'Continue';
    }
  }

  protected start(): void { this.started.set(true); this.step.set(0); this.stepError.set(null); }

  protected onPrescription(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    (event.target as HTMLInputElement).value = '';
    if (file) this.prescriptionFile.set(file.name);
  }

  private validate(): string | null {
    switch (this.currentStep()) {
      case 'vaccine':
        if (!this.vaccine()) return 'Select a vaccine.';
        return this.dose() ? null : 'Select the dose.';
      case 'details': return this.patient() ? null : 'Select who the vaccine is for.';
      case 'provider':
        if (!this.provider()) return 'Select a provider.';
        return this.slotDate() && this.slotTime() ? null : 'Pick a date and time.';
      case 'pending': return this.confirmed() ? null : 'Waiting on the vendor — use the button above.';
      case 'visit': return this.outcome() ? null : 'Record the vendor outcome to continue.';
      default: return null;
    }
  }

  protected next(): void {
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
    this.vaccine.set(null); this.dose.set('');
    this.patient.set(null); this.prescriptionFile.set(null);
    this.provider.set(null); this.slotDate.set(''); this.slotTime.set('');
    this.confirmed.set(false); this.cashless.set(false); this.outcome.set(null);
  }
}
