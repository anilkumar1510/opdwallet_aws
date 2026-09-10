import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

/**
 * Pathology / Radiology & Cardiology — DUMMY / STATIC journey, zero backend.
 *
 * Patient-flows Section 7, all mock. Two cards share this flow (kind bound from
 * the route): concern tabs → select test/package → provider → mode (pathology
 * only) + slot → order placed on hold (wallet blocked, no payment) → backend
 * adjudication (removes/reprices tests) → review adjusted order + payment
 * breakdown → wallet + Razorpay → receipt → order confirmed → collection/scan →
 * report → invoice after delivery. No network calls. See REMOVED-APIS.md.
 */

type Kind = 'PATHOLOGY' | 'RADIOLOGY';

interface TestItem { name: string; price: number; }
interface TestPackage { id: string; concern: string; name: string; prep: string; tat: string; items: TestItem[]; }
interface Provider { id: string; name: string; distanceKm: number; accreditation: string; tat: string; }

const CATALOGUE: Record<Kind, TestPackage[]> = {
  PATHOLOGY: [
    { id: 't1', concern: 'Diabetes', name: 'Diabetes Panel', prep: 'Fasting 8–10 hrs', tat: '24 hrs', items: [{ name: 'HbA1c', price: 400 }, { name: 'Fasting Glucose', price: 150 }] },
    { id: 't2', concern: 'Thyroid', name: 'Thyroid Profile (T3 T4 TSH)', prep: 'No fasting', tat: '24 hrs', items: [{ name: 'T3', price: 200 }, { name: 'T4', price: 200 }, { name: 'TSH', price: 250 }] },
    { id: 't3', concern: 'Full Body', name: 'Full Body Checkup', prep: 'Fasting 10–12 hrs', tat: '48 hrs', items: [{ name: 'CBC', price: 300 }, { name: 'Lipid Profile', price: 400 }, { name: 'Liver Function', price: 450 }] },
  ],
  RADIOLOGY: [
    { id: 'r1', concern: 'Heart', name: 'Cardiac Screen', prep: 'No prep', tat: 'Same day', items: [{ name: 'ECG', price: 300 }, { name: '2D Echo', price: 1500 }] },
    { id: 'r2', concern: 'Full Body', name: 'Ultrasound Abdomen', prep: 'Fasting 6 hrs', tat: 'Same day', items: [{ name: 'USG Abdomen', price: 1200 }] },
    { id: 'r3', concern: 'Bones', name: 'X-Ray (Chest + Spine)', prep: 'No prep', tat: 'Same day', items: [{ name: 'Chest X-Ray', price: 400 }, { name: 'Spine X-Ray', price: 450 }] },
  ],
};

const PROVIDERS: Provider[] = [
  { id: 'p1', name: 'Metropolis Labs', distanceKm: 1.6, accreditation: 'NABL', tat: '24 hrs' },
  { id: 'p2', name: 'Dr Lal PathLabs', distanceKm: 2.9, accreditation: 'NABL, CAP', tat: '24 hrs' },
  { id: 'p3', name: 'SRL Diagnostics', distanceKm: 4.3, accreditation: 'NABL', tat: '36 hrs' },
];
const SLOT_DATES = ['Today, 11 Sep', 'Tomorrow, 12 Sep'];
const SLOT_TIMES = ['7:00 AM', '9:00 AM', '11:00 AM', '4:00 PM'];
const COLLECTION_CHARGE = 100;
const PER_TXN_LIMIT = 500;
const COPAY_PCT = 20;

const LIFECYCLE = ['Order confirmed with provider', 'Sample collected / scan done', 'Report delivered to Health Records'];

type Step = 'test' | 'provider' | 'book' | 'hold' | 'adjusted' | 'receipt' | 'progress';

@Component({
  selector: 'opd-diagnostics-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none">
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <button type="button" class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50" aria-label="Back" (click)="headerBack()">&larr;</button>
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">{{ title() }}</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">Tests are adjudicated before you pay</p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        <p class="mb-4 rounded-xl border border-dashed border-warning-400 bg-warning-50 px-3 py-2 text-xs text-warning-700">🧪 Static demo journey — no data is saved and no payment is taken.</p>

        @if (!started()) {
          <div class="rounded-2xl border border-[#CDDDFE] bg-[#F3F7FF] p-5">
            <p class="text-sm text-ink-700">{{ title() }} coverage</p>
            <p class="mt-1 text-2xl font-bold text-[#034DA2]">₹5,000 <span class="text-sm font-normal text-ink-500">left this year</span></p>
            <p class="mt-1 text-xs text-ink-500">Up to ₹{{ perTxn }} per transaction from wallet · {{ copayPct }}% co-payment</p>
          </div>
          <button type="button" class="mt-5 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white hover:bg-[#034DA2]" (click)="start()">Browse tests →</button>
        }

        @else {
          <div class="mb-4"><h2 class="text-lg font-bold text-[#034DA2]">Book a test</h2></div>

          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
            @switch (currentStep()) {
              @case ('test') {
                <p class="mb-2 text-sm font-medium text-ink-700">Grouped by health concern</p>
                <div class="scrollbar-hide mb-3 flex gap-2 overflow-x-auto">
                  @for (c of concerns(); track c) { <button type="button" class="min-h-touch shrink-0 rounded-full border px-4 text-sm" [class.border-brand-500]="concern() === c" [class.bg-blue-50]="concern() === c" [class.border-surface-border]="concern() !== c" (click)="concern.set(c)">{{ c }}</button> }
                </div>
                <div class="space-y-2">
                  @for (t of testsForConcern(); track t.id) {
                    <button type="button" class="w-full rounded-xl border px-4 py-3 text-left" [class.border-brand-500]="pkg()?.id === t.id" [class.bg-blue-50]="pkg()?.id === t.id" [class.border-surface-border]="pkg()?.id !== t.id" (click)="pkg.set(t)">
                      <div class="flex items-start justify-between gap-3">
                        <div><p class="text-sm font-semibold text-ink-900">{{ t.name }}</p><p class="text-xs text-ink-500">{{ t.items.length }} test(s) · {{ t.prep }} · report {{ t.tat }}</p></div>
                        <p class="shrink-0 text-sm font-semibold text-[#034DA2]">₹{{ sumItems(t.items) }}</p>
                      </div>
                    </button>
                  }
                </div>
              }
              @case ('provider') {
                <p class="mb-2 text-sm font-medium text-ink-700">Select provider</p>
                <div class="space-y-2">
                  @for (p of providers; track p.id) { <button type="button" class="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm" [class.border-brand-500]="provider()?.id === p.id" [class.bg-blue-50]="provider()?.id === p.id" [class.border-surface-border]="provider()?.id !== p.id" (click)="provider.set(p)"><span><span class="font-medium text-ink-900">{{ p.name }}</span><span class="block text-xs text-ink-500">{{ p.accreditation }} · report {{ p.tat }}</span></span><span class="text-xs text-ink-500">{{ p.distanceKm }} km</span></button> }
                </div>
              }
              @case ('book') {
                @if (kind() === 'PATHOLOGY') {
                  <p class="mb-2 text-sm font-medium text-ink-700">Mode of collection</p>
                  <div class="mb-4 grid gap-3 sm:grid-cols-2">
                    @for (m of ['home','centre']; track m) { <button type="button" class="min-h-touch rounded-xl border px-4 text-sm font-medium" [class.border-brand-500]="mode() === m" [class.bg-blue-50]="mode() === m" [class.text-brand-700]="mode() === m" [class.border-surface-border]="mode() !== m" (click)="mode.set($any(m))">{{ m === 'home' ? 'Home collection' : 'Visit centre' }}</button> }
                  </div>
                }
                <p class="mb-2 text-sm font-medium text-ink-700">Date and time</p>
                <div class="mb-3 flex gap-2">
                  @for (d of slotDates; track d) { <button type="button" class="min-h-touch shrink-0 rounded-full border px-4 text-sm" [class.border-brand-500]="slotDate() === d" [class.bg-blue-50]="slotDate() === d" [class.border-surface-border]="slotDate() !== d" (click)="slotDate.set(d)">{{ d }}</button> }
                </div>
                <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  @for (t of slotTimes; track t) { <button type="button" class="min-h-touch rounded-xl border px-3 text-sm" [class.border-brand-500]="slotTime() === t" [class.bg-blue-50]="slotTime() === t" [class.border-surface-border]="slotTime() !== t" (click)="slotTime.set(t)">{{ t }}</button> }
                </div>
              }
              @case ('hold') {
                <div class="text-center"><p class="text-3xl">⏳</p><p class="mt-2 text-base font-bold text-[#034DA2]">Order on hold — adjudication</p><p class="mt-1 text-sm text-ink-700">Your order is checked for coverage, duplicates and frequency limits. Wallet blocked, nothing charged yet.</p></div>
                <button type="button" class="mt-4 min-h-touch w-full rounded-xl border border-dashed border-surface-border px-4 text-sm font-semibold text-ink-700 hover:bg-surface-sunk" (click)="adjudicated.set(true)">Simulate: backend adjudication</button>
              }
              @case ('adjusted') {
                <p class="mb-2 rounded-xl bg-[#F0FDF4] px-3 py-2 text-sm text-success-700">🔔 Your order is ready with adjustments.</p>
                <ul class="space-y-1.5 text-sm">
                  @for (it of retained(); track it.name) { <li class="flex justify-between"><span class="text-ink-900">{{ it.name }}</span><span class="font-medium text-ink-900">₹{{ it.price }}</span></li> }
                  @for (it of removed(); track it.name) { <li class="flex justify-between text-ink-400"><span class="line-through">{{ it.name }}</span><span class="text-xs">removed · already done in 90 days</span></li> }
                </ul>
                <dl class="mt-3 space-y-2 border-t border-surface-border pt-3 text-sm">
                  <div class="flex justify-between"><dt class="text-ink-700">Test value</dt><dd class="font-medium text-ink-900">₹{{ testValue() }}</dd></div>
                  @if (collectionCharge() > 0) { <div class="flex justify-between"><dt class="text-ink-700">Home collection charge</dt><dd class="font-medium text-ink-900">₹{{ collectionCharge() }}</dd></div> }
                  <div class="flex justify-between"><dt class="text-ink-700">Wallet eligible (limit ₹{{ perTxn }})</dt><dd class="font-medium text-ink-900">₹{{ pay().covered }}</dd></div>
                  <div class="flex justify-between"><dt class="text-ink-700">Co-payment ({{ copayPct }}%)</dt><dd class="font-medium text-danger-700">− ₹{{ pay().copay }}</dd></div>
                  <div class="flex justify-between border-t border-surface-border pt-2"><dt class="text-ink-700">Wallet block</dt><dd class="font-medium text-success-700">₹{{ pay().walletBlock }}</dd></div>
                  @if (pay().excess > 0) { <div class="flex justify-between"><dt class="text-ink-700">Above per-transaction limit</dt><dd class="font-medium text-ink-900">₹{{ pay().excess }}</dd></div> }
                  <div class="flex justify-between border-t border-surface-border pt-2"><dt class="font-semibold text-ink-900">You pay now (Razorpay)</dt><dd class="text-lg font-bold text-ink-900">₹{{ pay().selfPay }}</dd></div>
                </dl>
              }
              @case ('receipt') {
                <div class="text-center"><p class="text-3xl">🧾</p><p class="mt-2 text-base font-bold text-[#034DA2]">Payment received</p><p class="mt-1 text-sm text-ink-700">Receipt issued. Order confirmed with {{ provider()?.name }}.</p></div>
              }
              @case ('progress') {
                <p class="mb-3 text-sm font-medium text-ink-700">Order status</p>
                <ol class="space-y-3">
                  @for (s of lifecycle; track s; let i = $index) {
                    <li class="flex gap-3">
                      <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold" [class.bg-success-600]="i < stage()" [class.text-white]="i <= stage()" [class.bg-[#0F5FDC]]="i === stage()" [class.bg-surface-border]="i > stage()" [class.text-ink-400]="i > stage()">{{ i < stage() ? '✓' : (i + 1) }}</span>
                      <span class="text-sm" [class.font-semibold]="i === stage()" [class.text-ink-900]="i <= stage()" [class.text-ink-400]="i > stage()">{{ s }}</span>
                    </li>
                  }
                </ol>
                @if (stage() < lifecycle.length - 1) {
                  <button type="button" class="mt-3 min-h-touch w-full rounded-xl border border-dashed border-surface-border px-4 text-sm font-semibold text-ink-700 hover:bg-surface-sunk" (click)="advanceStage()">Advance status (demo)</button>
                } @else {
                  <p class="mt-3 rounded-xl bg-[#F0FDF4] px-3 py-2 text-sm text-success-700">✓ Report in Health Records. Invoice raised after delivery; the wallet block became a debit.</p>
                }
              }
            }

            @if (stepError(); as err) { <p class="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">{{ err }}</p> }
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
export class DiagnosticsPage {
  /** Bound from route data via withComponentInputBinding(). */
  readonly kind = input<Kind>('PATHOLOGY');

  protected readonly providers = PROVIDERS;
  protected readonly slotDates = SLOT_DATES;
  protected readonly slotTimes = SLOT_TIMES;
  protected readonly perTxn = PER_TXN_LIMIT;
  protected readonly copayPct = COPAY_PCT;
  protected readonly lifecycle = LIFECYCLE;

  protected readonly started = signal(false);
  protected readonly step = signal(0);
  protected readonly stepError = signal<string | null>(null);

  protected readonly concern = signal('');
  protected readonly pkg = signal<TestPackage | null>(null);
  protected readonly provider = signal<Provider | null>(null);
  protected readonly mode = signal<'home' | 'centre' | null>(null);
  protected readonly slotDate = signal('');
  protected readonly slotTime = signal('');
  protected readonly adjudicated = signal(false);
  protected readonly stage = signal(0);

  protected readonly steps: Step[] = ['test', 'provider', 'book', 'hold', 'adjusted', 'receipt', 'progress'];
  protected readonly currentStep = computed<Step>(() => this.steps[this.step()] ?? 'test');

  protected title = computed(() => (this.kind() === 'RADIOLOGY' ? 'Radiology & Cardiology' : 'Pathology'));
  protected readonly catalogue = computed(() => CATALOGUE[this.kind()]);
  protected readonly concerns = computed(() => [...new Set(this.catalogue().map((t) => t.concern))]);
  protected readonly testsForConcern = computed(() => this.catalogue().filter((t) => !this.concern() || t.concern === this.concern()));

  /** Adjudication drops the last item of a multi-test package (duplicate). */
  protected readonly retained = computed(() => {
    const items = this.pkg()?.items ?? [];
    return this.adjudicated() && items.length > 1 ? items.slice(0, -1) : items;
  });
  protected readonly removed = computed(() => {
    const items = this.pkg()?.items ?? [];
    return this.adjudicated() && items.length > 1 ? items.slice(-1) : [];
  });
  protected readonly testValue = computed(() => this.retained().reduce((s, i) => s + i.price, 0));
  protected readonly collectionCharge = computed(() => (this.kind() === 'PATHOLOGY' && this.mode() === 'home' ? COLLECTION_CHARGE : 0));
  protected readonly pay = computed(() => {
    const value = this.testValue() + this.collectionCharge();
    const covered = Math.min(value, PER_TXN_LIMIT);
    const copay = Math.round((covered * COPAY_PCT) / 100);
    const walletBlock = covered - copay;
    const excess = Math.max(0, value - PER_TXN_LIMIT);
    return { value, covered, copay, walletBlock, excess, selfPay: copay + excess };
  });

  protected sumItems(items: TestItem[]): number { return items.reduce((s, i) => s + i.price, 0); }

  protected primaryLabel(): string {
    switch (this.currentStep()) {
      case 'adjusted': return `Pay ₹${this.pay().selfPay} via Razorpay`;
      case 'receipt': return 'Track order';
      case 'progress': return 'Done';
      default: return 'Continue';
    }
  }

  protected start(): void { this.started.set(true); this.step.set(0); this.stepError.set(null); }
  protected advanceStage(): void { this.stage.set(Math.min(LIFECYCLE.length - 1, this.stage() + 1)); }

  private validate(): string | null {
    switch (this.currentStep()) {
      case 'test': return this.pkg() ? null : 'Select a test or package.';
      case 'provider': return this.provider() ? null : 'Select a provider.';
      case 'book':
        if (this.kind() === 'PATHOLOGY' && !this.mode()) return 'Choose a mode of collection.';
        return this.slotDate() && this.slotTime() ? null : 'Pick a date and time.';
      case 'hold': return this.adjudicated() ? null : 'Waiting on adjudication — use the button above.';
      default: return null;
    }
  }

  protected next(): void {
    const err = this.validate();
    if (err) { this.stepError.set(err); return; }
    this.stepError.set(null);
    if (this.currentStep() === 'progress') { this.finish(); return; }
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
    this.concern.set(''); this.pkg.set(null); this.provider.set(null);
    this.mode.set(null); this.slotDate.set(''); this.slotTime.set('');
    this.adjudicated.set(false); this.stage.set(0);
  }
}
