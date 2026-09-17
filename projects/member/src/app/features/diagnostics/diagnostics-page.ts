import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

/**
 * Pathology / Radiology & Cardiology — DUMMY / STATIC journey, zero backend.
 *
 * Patient-flows Section 7 (prescription-led), all mock. Two cards share this
 * flow (kind bound from the route). The member submits a PRESCRIPTION and a
 * POSTAL CODE — not an order. The adjudicator builds ONE cart per serviceable
 * provider and pushes them all, so the member compares providers and picks one:
 *
 *   entry → upload/existing prescription + postal code (compulsory, disclaimer)
 *   → submit (order getting digitised) → queued for backend adjudication
 *   → [CASE 1 rejected · CASE 2 carts in full · CASE 3 carts in part]
 *   → cart ready (WhatsApp + push) → compare providers (price per test + total,
 *     postal-code providers first, then nearby radius with distance)
 *   → select one provider (discards the others) → wallet share + co-payment
 *   → mode of collection (home / centre) → address or centre within same postal
 *   → wallet breakdown → payment (wallet block + Razorpay) → pending confirmation
 *   → confirmed → order placed / receipt → sample collection / scan
 *   → report upload (opens 76 hrs after delivery) → completed + invoice.
 *
 * No network calls. See REMOVED-APIS.md.
 */

type Kind = 'PATHOLOGY' | 'RADIOLOGY';

interface CartTest { name: string; price: number; }
interface OmittedTest { name: string; reason: string; }
interface ProviderCart {
  id: string;
  name: string;
  distanceKm: number;
  withinPostal: boolean;
  accreditation: string;
  tat: string;
  homeCollection: boolean;
  tests: CartTest[];
  omitted: OmittedTest[];
}

/** One cart per provider, as the adjudicator would push them. The last provider
 *  in each list omits a test to demonstrate CASE 3 (carts built in part). */
const PROVIDER_CARTS: Record<Kind, ProviderCart[]> = {
  PATHOLOGY: [
    { id: 'p1', name: 'Metropolis Labs', distanceKm: 1.6, withinPostal: true, accreditation: 'NABL', tat: '24 hrs', homeCollection: true,
      tests: [{ name: 'HbA1c', price: 400 }, { name: 'Fasting Glucose', price: 150 }, { name: 'Lipid Profile', price: 600 }, { name: 'TSH', price: 250 }], omitted: [] },
    { id: 'p2', name: 'Dr Lal PathLabs', distanceKm: 2.9, withinPostal: true, accreditation: 'NABL, CAP', tat: '24 hrs', homeCollection: true,
      tests: [{ name: 'HbA1c', price: 380 }, { name: 'Fasting Glucose', price: 140 }, { name: 'Lipid Profile', price: 650 }, { name: 'TSH', price: 230 }], omitted: [] },
    { id: 'p3', name: 'SRL Diagnostics', distanceKm: 4.3, withinPostal: false, accreditation: 'NABL', tat: '36 hrs', homeCollection: false,
      tests: [{ name: 'HbA1c', price: 360 }, { name: 'Fasting Glucose', price: 150 }, { name: 'TSH', price: 240 }], omitted: [{ name: 'Lipid Profile', reason: 'Not offered by this lab' }] },
  ],
  RADIOLOGY: [
    { id: 'r1', name: 'Star Imaging Centre', distanceKm: 2.1, withinPostal: true, accreditation: 'NABH', tat: 'Same day', homeCollection: false,
      tests: [{ name: 'ECG', price: 300 }, { name: '2D Echo', price: 1500 }, { name: 'Chest X-Ray', price: 400 }], omitted: [] },
    { id: 'r2', name: 'Vijaya Diagnostics', distanceKm: 3.4, withinPostal: true, accreditation: 'NABL, NABH', tat: 'Same day', homeCollection: false,
      tests: [{ name: 'ECG', price: 280 }, { name: '2D Echo', price: 1450 }, { name: 'Chest X-Ray', price: 420 }], omitted: [] },
    { id: 'r3', name: 'Aarthi Scans', distanceKm: 6.2, withinPostal: false, accreditation: 'NABH', tat: 'Next day', homeCollection: false,
      tests: [{ name: 'ECG', price: 260 }, { name: 'Chest X-Ray', price: 380 }], omitted: [{ name: '2D Echo', reason: 'Not covered under policy' }] },
  ],
};

/** What the uploaded/existing prescription lists, shown before adjudication. */
const PRESCRIBED: Record<Kind, string[]> = {
  PATHOLOGY: ['HbA1c', 'Fasting Glucose', 'Lipid Profile', 'TSH'],
  RADIOLOGY: ['ECG', '2D Echo', 'Chest X-Ray'],
};

const SAVED_POSTAL = '560103';
const SAVED_ADDRESSES = ['402, Prestige Palms', '12, Green Meadows'];
const COLLECTION_CHARGE = 150;
const PER_TXN_LIMIT = 500;
const COPAY_PCT = 20;

/** Member-visible fulfilment stages after payment (backend flow 3 stays admin-side). */
const LIFECYCLE = ['Order confirmed with provider', 'Sample collection / scan', 'Report uploaded to Health Records'];

type Step = 'rx' | 'queue' | 'compare' | 'fulfil' | 'breakdown' | 'pending' | 'placed' | 'progress';
type AdjResult = 'pending' | 'ready' | 'rejected';

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
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">Prescription-led · providers adjudicated before you pay</p>
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
          <button type="button" class="mt-5 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white hover:bg-[#034DA2]" (click)="start()">Start new order →</button>
        }

        @else {
          <div class="mb-4"><h2 class="text-lg font-bold text-[#034DA2]">New {{ title() }} order</h2></div>

          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
            @switch (currentStep()) {

              @case ('rx') {
                <p class="mb-2 text-sm font-medium text-ink-700">Prescription</p>
                <div class="mb-3 grid gap-3 sm:grid-cols-2">
                  <button type="button" class="rounded-xl border px-4 py-3 text-left text-sm" [class.border-brand-500]="rxSource() === 'existing'" [class.bg-blue-50]="rxSource() === 'existing'" [class.border-surface-border]="rxSource() !== 'existing'" (click)="rxSource.set('existing')">
                    <span class="font-semibold text-ink-900">Use existing</span>
                    <span class="block text-xs text-ink-500">Dr A. Rao · {{ prescribed().length }} tests</span>
                  </button>
                  <button type="button" class="rounded-xl border border-dashed px-4 py-3 text-left text-sm" [class.border-brand-500]="rxSource() === 'upload'" [class.bg-blue-50]="rxSource() === 'upload'" [class.border-surface-border]="rxSource() !== 'upload'" (click)="rxSource.set('upload')">
                    <span class="font-semibold text-ink-900">📎 Upload prescription</span>
                    <span class="block text-xs text-ink-500">{{ rxSource() === 'upload' ? 'prescription.pdf selected' : 'JPG / PNG / PDF, up to 5 MB' }}</span>
                  </button>
                </div>

                <p class="mb-1 mt-4 text-sm font-medium text-ink-700">Postal code <span class="text-danger-600">*</span></p>
                <input type="text" inputmode="numeric" maxlength="6" placeholder="6-digit postal code" [value]="postal()" (input)="postal.set($any($event.target).value)" class="min-h-touch w-full rounded-xl border border-surface-border px-4 text-sm outline-none focus:border-brand-500" />
                <button type="button" class="mt-2 rounded-full border border-surface-border px-3 py-1 text-xs text-ink-700 hover:bg-surface-sunk" (click)="postal.set(savedPostal)">Use saved · {{ savedPostal }}</button>
                <p class="mt-3 rounded-xl bg-warning-50 px-3 py-2 text-xs text-warning-700">⚠ Select the correct postal code for the cart. Providers are shown on the basis of this postal code and the nearby radius — a wrong postal code produces a cart no provider can serve, and you only find out at the end.</p>
              }

              @case ('queue') {
                <div class="text-center">
                  <p class="text-3xl">🗂️</p>
                  <p class="mt-2 text-base font-bold text-[#034DA2]">Order getting digitised</p>
                  <p class="mt-1 text-sm text-ink-700">No payment is taken and nothing is blocked yet. Your order is queued for backend adjudication — the adjudicator builds one cart per serviceable provider at <span class="font-medium text-ink-900">{{ postal() }}</span>.</p>
                </div>
                <ul class="mt-4 space-y-1.5 text-sm text-ink-700">
                  <li>✓ Prescription saved with a unique identifier</li>
                  <li>✓ Duplicate check run against your earlier prescriptions</li>
                  <li>⏳ Assigned to an adjudicator for cart creation</li>
                </ul>
                @if (adjResult() === 'pending') {
                  <div class="mt-4 grid gap-2">
                    <button type="button" class="min-h-touch w-full rounded-xl border border-dashed border-surface-border px-4 text-sm font-semibold text-ink-700 hover:bg-surface-sunk" (click)="adjResult.set('ready')">Simulate: adjudicator pushes carts</button>
                    <button type="button" class="min-h-touch w-full rounded-xl border border-dashed border-danger-300 px-4 text-sm font-semibold text-danger-700 hover:bg-danger-50" (click)="adjResult.set('rejected')">Simulate: order rejected (no serviceable provider)</button>
                  </div>
                } @else if (adjResult() === 'ready') {
                  <p class="mt-4 rounded-xl bg-[#F0FDF4] px-3 py-2 text-sm text-success-700">🔔 WhatsApp + push: your cart is ready. Continue to compare providers.</p>
                } @else {
                  <p class="mt-4 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700">🔔 WhatsApp + push: order rejected. Continue to see the reason.</p>
                }
              }

              @case ('compare') {
                @if (adjResult() === 'rejected') {
                  <div class="text-center">
                    <p class="text-3xl">🚫</p>
                    <p class="mt-2 text-base font-bold text-danger-700">Order rejected</p>
                    <p class="mt-1 text-sm text-ink-700">Reason: <span class="font-medium text-ink-900">No provider serves the selected postal code.</span></p>
                    <p class="mt-1 text-xs text-ink-500">Nothing was blocked and no cart was created. Try a different postal code.</p>
                  </div>
                } @else {
                  <p class="mb-1 rounded-xl bg-[#F0FDF4] px-3 py-2 text-sm text-success-700">🔔 Cart ready. Compare providers on the same prescription and pick one.</p>
                  <p class="mb-3 text-xs text-ink-500">Providers at your postal code appear first, then nearby within the radius.</p>
                  <div class="space-y-3">
                    @for (c of providerCarts(); track c.id) {
                      <button type="button" class="w-full rounded-xl border px-4 py-3 text-left" [class.border-brand-500]="selectedCart()?.id === c.id" [class.bg-blue-50]="selectedCart()?.id === c.id" [class.border-surface-border]="selectedCart()?.id !== c.id" (click)="selectedCart.set(c)">
                        <div class="flex items-start justify-between gap-3">
                          <div class="min-w-0">
                            <p class="text-sm font-semibold text-ink-900">{{ c.name }}</p>
                            <p class="text-xs text-ink-500">{{ c.accreditation }} · report {{ c.tat }} · {{ c.distanceKm }} km</p>
                            <span class="mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium" [class.bg-blue-50]="c.withinPostal" [class.text-brand-700]="c.withinPostal" [class.bg-surface-sunk]="!c.withinPostal" [class.text-ink-500]="!c.withinPostal">{{ c.withinPostal ? 'At your postal code' : 'Nearby' }}</span>
                            @if (c.omitted.length) { <span class="ml-1 inline-block rounded-full bg-warning-50 px-2 py-0.5 text-[11px] font-medium text-warning-700">Partial cart</span> }
                          </div>
                          <p class="shrink-0 text-sm font-bold text-[#034DA2]">₹{{ cartTotal(c) }}</p>
                        </div>
                        <ul class="mt-2 space-y-0.5 border-t border-surface-border pt-2 text-xs">
                          @for (t of c.tests; track t.name) { <li class="flex justify-between"><span class="text-ink-700">{{ t.name }}</span><span class="text-ink-900">₹{{ t.price }}</span></li> }
                          @for (o of c.omitted; track o.name) { <li class="flex justify-between text-ink-400"><span class="line-through">{{ o.name }}</span><span>{{ o.reason }}</span></li> }
                        </ul>
                      </button>
                    }
                  </div>
                }
              }

              @case ('fulfil') {
                <p class="mb-2 rounded-xl bg-blue-50 px-3 py-2 text-sm text-brand-700">Wallet covers ₹{{ pay().walletBlock }} · you pay ₹{{ pay().selfPay }} on {{ selectedCart()?.name }}</p>
                <p class="mb-2 text-sm font-medium text-ink-700">Mode of collection</p>
                <div class="mb-4 grid gap-3 sm:grid-cols-2">
                  <button type="button" class="min-h-touch rounded-xl border px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40" [class.border-brand-500]="mode() === 'home'" [class.bg-blue-50]="mode() === 'home'" [class.border-surface-border]="mode() !== 'home'" [disabled]="!homeAvailable()" (click)="mode.set('home')">Home collection</button>
                  <button type="button" class="min-h-touch rounded-xl border px-4 text-sm font-medium" [class.border-brand-500]="mode() === 'centre'" [class.bg-blue-50]="mode() === 'centre'" [class.border-surface-border]="mode() !== 'centre'" (click)="mode.set('centre')">Visit centre</button>
                </div>
                @if (!homeAvailable()) { <p class="mb-3 -mt-2 text-xs text-ink-500">Home collection is not serviced by {{ selectedCart()?.name }} at this postal code.</p> }

                <p class="mb-2 text-xs text-ink-500">Postal code {{ postal() }} is locked for this order and cannot be changed here.</p>

                @if (mode() === 'home') {
                  <p class="mb-2 text-sm font-medium text-ink-700">Address (within {{ postal() }})</p>
                  <div class="space-y-2">
                    @for (a of addresses(); track a) { <button type="button" class="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm" [class.border-brand-500]="address() === a" [class.bg-blue-50]="address() === a" [class.border-surface-border]="address() !== a" (click)="address.set(a)"><span class="text-ink-900">{{ a }} — {{ postal() }}</span></button> }
                  </div>
                  <button type="button" class="mt-2 rounded-full border border-dashed border-surface-border px-3 py-1 text-xs text-ink-700 hover:bg-surface-sunk" (click)="addAddress()">+ Add new address</button>
                } @else if (mode() === 'centre') {
                  <p class="mb-2 text-sm font-medium text-ink-700">Centre (at {{ postal() }})</p>
                  <div class="space-y-2">
                    @for (ct of centres(); track ct) { <button type="button" class="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm" [class.border-brand-500]="centre() === ct" [class.bg-blue-50]="centre() === ct" [class.border-surface-border]="centre() !== ct" (click)="centre.set(ct)"><span class="text-ink-900">{{ ct }}</span></button> }
                  </div>
                }
              }

              @case ('breakdown') {
                <p class="mb-2 text-sm font-medium text-ink-700">Payment breakdown — {{ selectedCart()?.name }}</p>
                <dl class="space-y-2 text-sm">
                  <div class="flex justify-between"><dt class="text-ink-700">Test value</dt><dd class="font-medium text-ink-900">₹{{ testValue() }}</dd></div>
                  @if (collectionCharge() > 0) { <div class="flex justify-between"><dt class="text-ink-700">Home collection charge</dt><dd class="font-medium text-ink-900">₹{{ collectionCharge() }}</dd></div> }
                  <div class="flex justify-between border-t border-surface-border pt-2"><dt class="text-ink-700">Wallet eligible (limit ₹{{ perTxn }})</dt><dd class="font-medium text-ink-900">₹{{ pay().covered }}</dd></div>
                  <div class="flex justify-between"><dt class="text-ink-700">Co-payment ({{ copayPct }}%)</dt><dd class="font-medium text-danger-700">− ₹{{ pay().copay }}</dd></div>
                  <div class="flex justify-between"><dt class="text-ink-700">Wallet block</dt><dd class="font-medium text-success-700">₹{{ pay().walletBlock }}</dd></div>
                  @if (pay().excess > 0) { <div class="flex justify-between"><dt class="text-ink-700">Above per-transaction limit</dt><dd class="font-medium text-ink-900">₹{{ pay().excess }}</dd></div> }
                  <div class="flex justify-between border-t border-surface-border pt-2"><dt class="font-semibold text-ink-900">You pay now (Razorpay)</dt><dd class="text-lg font-bold text-ink-900">₹{{ pay().selfPay }}</dd></div>
                </dl>
              }

              @case ('pending') {
                <div class="text-center">
                  <p class="text-3xl">⌛</p>
                  <p class="mt-2 text-base font-bold text-[#034DA2]">Pending provider confirmation</p>
                  <p class="mt-1 text-sm text-ink-700">Payment done — wallet blocked and self-pay charged. Integrated partners confirm automatically; others are confirmed through the backend.</p>
                </div>
                @if (!confirmed()) {
                  <button type="button" class="mt-4 min-h-touch w-full rounded-xl border border-dashed border-surface-border px-4 text-sm font-semibold text-ink-700 hover:bg-surface-sunk" (click)="confirmed.set(true)">Simulate: provider confirms</button>
                } @else {
                  <p class="mt-4 rounded-xl bg-[#F0FDF4] px-3 py-2 text-sm text-success-700">✓ Confirmed with {{ selectedCart()?.name }}.</p>
                }
              }

              @case ('placed') {
                <div class="text-center"><p class="text-3xl">🧾</p><p class="mt-2 text-base font-bold text-[#034DA2]">Order placed</p><p class="mt-1 text-sm text-ink-700">Receipt issued for {{ selectedCart()?.name }}. The invoice follows once the order is delivered.</p></div>
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
                } @else if (stage() === lifecycle.length - 1) {
                  <p class="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-xs text-brand-700">Report upload opens 76 hours after the delivery date — this mirrors the prescription upload after an in-clinic consultation and is what closes the order.</p>
                  <button type="button" class="mt-2 min-h-touch w-full rounded-xl border border-dashed border-surface-border px-4 text-sm font-semibold text-ink-700 hover:bg-surface-sunk" (click)="advanceStage()">Simulate: upload report (76 hrs after delivery)</button>
                } @else {
                  <p class="mt-3 rounded-xl bg-[#F0FDF4] px-3 py-2 text-sm text-success-700">✓ Report in Health Records. Order completed, invoice raised, and the wallet block became a debit.</p>
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

  protected readonly perTxn = PER_TXN_LIMIT;
  protected readonly copayPct = COPAY_PCT;
  protected readonly savedPostal = SAVED_POSTAL;
  protected readonly lifecycle = LIFECYCLE;

  protected readonly started = signal(false);
  protected readonly step = signal(0);
  protected readonly stepError = signal<string | null>(null);

  protected readonly rxSource = signal<'existing' | 'upload' | null>(null);
  protected readonly postal = signal('');
  protected readonly adjResult = signal<AdjResult>('pending');
  protected readonly selectedCart = signal<ProviderCart | null>(null);
  protected readonly mode = signal<'home' | 'centre' | null>(null);
  protected readonly address = signal('');
  protected readonly centre = signal('');
  protected readonly addresses = signal<string[]>([...SAVED_ADDRESSES]);
  protected readonly confirmed = signal(false);
  protected readonly stage = signal(0);

  protected readonly steps: Step[] = ['rx', 'queue', 'compare', 'fulfil', 'breakdown', 'pending', 'placed', 'progress'];
  protected readonly currentStep = computed<Step>(() => this.steps[this.step()] ?? 'rx');

  protected title = computed(() => (this.kind() === 'RADIOLOGY' ? 'Radiology & Cardiology' : 'Pathology'));
  protected readonly prescribed = computed(() => PRESCRIBED[this.kind()]);

  /** Postal-code providers first, then nearby by distance — as the member sees them. */
  protected readonly providerCarts = computed(() =>
    [...PROVIDER_CARTS[this.kind()]].sort((a, b) =>
      a.withinPostal === b.withinPostal ? a.distanceKm - b.distanceKm : a.withinPostal ? -1 : 1,
    ),
  );

  /** Home collection only where the selected provider services this postal code (scans are centre-only). */
  protected readonly homeAvailable = computed(() => this.kind() === 'PATHOLOGY' && !!this.selectedCart()?.homeCollection);
  protected readonly centres = computed(() => {
    const c = this.selectedCart();
    return c ? [`${c.name} — Central`, `${c.name} — Annexe`] : [];
  });

  protected readonly testValue = computed(() => (this.selectedCart()?.tests ?? []).reduce((s, t) => s + t.price, 0));
  protected readonly collectionCharge = computed(() => (this.mode() === 'home' ? COLLECTION_CHARGE : 0));
  protected readonly pay = computed(() => {
    const value = this.testValue() + this.collectionCharge();
    const covered = Math.min(value, PER_TXN_LIMIT);
    const copay = Math.round((covered * COPAY_PCT) / 100);
    const walletBlock = covered - copay;
    const excess = Math.max(0, value - PER_TXN_LIMIT);
    return { value, covered, copay, walletBlock, excess, selfPay: copay + excess };
  });

  protected cartTotal(c: ProviderCart): number { return c.tests.reduce((s, t) => s + t.price, 0); }

  protected primaryLabel(): string {
    switch (this.currentStep()) {
      case 'rx': return 'Submit';
      case 'compare': return this.adjResult() === 'rejected' ? 'Start over' : 'Select & continue';
      case 'breakdown': return `Pay ₹${this.pay().selfPay} via Razorpay`;
      case 'placed': return 'Track order';
      case 'progress': return this.stage() >= LIFECYCLE.length ? 'Done' : 'Continue';
      default: return 'Continue';
    }
  }

  protected start(): void { this.started.set(true); this.step.set(0); this.stepError.set(null); }
  protected advanceStage(): void { this.stage.set(Math.min(LIFECYCLE.length, this.stage() + 1)); }
  protected addAddress(): void {
    const next = `New address ${this.addresses().length - SAVED_ADDRESSES.length + 1}`;
    this.addresses.update((list) => [...list, next]);
    this.address.set(next);
  }

  private validate(): string | null {
    switch (this.currentStep()) {
      case 'rx':
        if (!this.rxSource()) return 'Upload a prescription or use an existing one.';
        return /^\d{6}$/.test(this.postal()) ? null : 'Enter a valid 6-digit postal code.';
      case 'queue': return this.adjResult() !== 'pending' ? null : 'Waiting on adjudication — use a button above.';
      case 'compare':
        if (this.adjResult() === 'rejected') return null;
        return this.selectedCart() ? null : 'Select a provider to continue.';
      case 'fulfil':
        if (!this.mode()) return 'Choose a mode of collection.';
        if (this.mode() === 'home') return this.address() ? null : 'Select or add an address.';
        return this.centre() ? null : 'Select a centre.';
      case 'pending': return this.confirmed() ? null : 'Waiting on confirmation — use the button above.';
      case 'progress': return this.stage() >= LIFECYCLE.length ? null : 'Advance the status to finish.';
      default: return null;
    }
  }

  protected next(): void {
    const err = this.validate();
    if (err) { this.stepError.set(err); return; }
    this.stepError.set(null);
    // Rejected orders never reach payment — start over from the compare screen.
    if (this.currentStep() === 'compare' && this.adjResult() === 'rejected') { this.finish(); return; }
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
    this.rxSource.set(null); this.postal.set('');
    this.adjResult.set('pending'); this.selectedCart.set(null);
    this.mode.set(null); this.address.set(''); this.centre.set('');
    this.addresses.set([...SAVED_ADDRESSES]);
    this.confirmed.set(false); this.stage.set(0);
  }
}
