import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

/**
 * Vision — DUMMY / STATIC journey, zero backend.
 *
 * The member's half of patient-flows Section 3 (steps 1–7), all mock. Vision is
 * unlike the paid service lines: there is NO wallet block and NO payment on the
 * portal. The portal only issues a coupon bound to an order id; the checkout and
 * adjudication run entirely on the partner (Lenskart) platform, and the member
 * has no further status visibility here. Flow: Vision card → policy coverage →
 * Start New Order → pick partner + mode → upload prescription → submit → coupon
 * code + partner link. No network calls. See REMOVED-APIS.md.
 */

const PARTNERS = ['Lenskart', 'Titan EyePlus', 'Specsmakers'];
const ELIGIBLE = 5000;
/** What the member "selected" on the partner site, pushed back to the portal. */
const CART_ITEMS = [
  { name: 'Vincent Chase — Full-rim frame', price: 3000 },
  { name: 'Anti-glare prescription lenses', price: 3500 },
];
const ORDER_VALUE = CART_ITEMS.reduce((s, i) => s + i.price, 0); // 6500

type Step = 'partner' | 'prescription' | 'review' | 'coupon' | 'cart' | 'payment' | 'paid';

@Component({
  selector: 'opd-vision-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none">
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <button type="button" class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50" aria-label="Back" (click)="headerBack()">&larr;</button>
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">Vision</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">Eyewear and lenses at a partner store</p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        <p class="mb-4 rounded-xl border border-dashed border-warning-400 bg-warning-50 px-3 py-2 text-xs text-warning-700">
          🧪 Static demo journey — no data is saved. No wallet block and no payment are taken on the portal.
        </p>

        <!-- ── Landing: policy coverage ────────────────────────────────────── -->
        @if (!started()) {
          <div class="rounded-2xl border border-[#CDDDFE] bg-[#F3F7FF] p-5">
            <p class="text-sm font-semibold text-[#034DA2]">Your vision coverage</p>
            <dl class="mt-3 space-y-2 text-sm">
              <div class="flex justify-between"><dt class="text-ink-700">Eligible amount</dt><dd class="font-medium text-ink-900">₹5,000</dd></div>
              <div class="flex justify-between"><dt class="text-ink-700">Frequency</dt><dd class="font-medium text-ink-900">Once a year</dd></div>
              <div class="flex justify-between"><dt class="text-ink-700">Covered</dt><dd class="text-right font-medium text-ink-900">Frames · prescription lenses · contact lenses</dd></div>
            </dl>
            <p class="mt-3 text-xs text-ink-500">
              You get a coupon to use at the partner — coverage is shown here instead of a payment
              breakdown, because nothing is charged on the portal. Anything above the coupon value is
              paid to the partner, and settlement happens after the order is processed.
            </p>
          </div>
          <button type="button" class="mt-5 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white hover:bg-[#034DA2]" (click)="start()">Start New Order →</button>
          <p class="mt-2 text-center text-xs text-ink-500">One open order at a time.</p>
        }

        <!-- ── Wizard ──────────────────────────────────────────────────────── -->
        @else {
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-bold text-[#034DA2]">New vision order</h2>
            @if (step() < 3) {
              <span class="text-xs text-ink-500">Step {{ step() + 1 }} of 3</span>
            }
          </div>

          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
            @switch (currentStep()) {
              @case ('partner') {
                <p class="mb-2 text-sm font-medium text-ink-700">Pick a partner</p>
                <div class="space-y-2">
                  @for (p of partners; track p) {
                    <button type="button" class="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm" [class.border-brand-500]="partner() === p" [class.bg-blue-50]="partner() === p" [class.border-surface-border]="partner() !== p" (click)="partner.set(p)">
                      <span class="font-medium text-ink-900">{{ p }}</span>
                      @if (partner() === p) { <span class="text-brand-700">✓</span> }
                    </button>
                  }
                </div>
                <p class="mb-2 mt-5 border-t border-surface-border pt-4 text-sm font-medium text-ink-700">Mode of purchase</p>
                <div class="grid gap-3 sm:grid-cols-2">
                  @for (m of ['Online','In-store']; track m) {
                    <button type="button" class="min-h-touch rounded-xl border px-4 text-sm font-medium" [class.border-brand-500]="mode() === m" [class.bg-blue-50]="mode() === m" [class.text-brand-700]="mode() === m" [class.border-surface-border]="mode() !== m" (click)="mode.set(m)">{{ m }}</button>
                  }
                </div>
              }
              @case ('prescription') {
                <p class="mb-1 text-sm font-medium text-ink-700">Upload eye prescription</p>
                <p class="mb-3 text-xs text-ink-500">Mandatory before the request can be submitted.</p>
                <input type="file" class="sr-only" accept="image/*,.pdf" id="rx" (change)="onPrescription($event)" />
                <label for="rx" class="block w-full cursor-pointer rounded-xl border-2 border-dashed border-[#CDDDFE] bg-[#F7FAFF] px-6 py-6 text-center">
                  <span class="block font-medium text-[#0B2C63]">{{ prescriptionFile() ? 'Replace prescription' : 'Upload prescription' }}</span>
                  <span class="mt-1 block text-xs text-ink-500">Photo or PDF</span>
                </label>
                @if (prescriptionFile(); as f) { <p class="mt-2 truncate text-sm text-ink-900">{{ f }}</p> }
              }
              @case ('review') {
                <p class="mb-3 text-sm font-medium text-ink-700">Review your request</p>
                <dl class="space-y-2 text-sm">
                  <div class="flex justify-between gap-3 border-b border-surface-border pb-2"><dt class="text-ink-500">Partner</dt><dd class="font-medium text-ink-900">{{ partner() }}</dd></div>
                  <div class="flex justify-between gap-3 border-b border-surface-border pb-2"><dt class="text-ink-500">Mode</dt><dd class="font-medium text-ink-900">{{ mode() }}</dd></div>
                  <div class="flex justify-between gap-3 border-b border-surface-border pb-2"><dt class="text-ink-500">Prescription</dt><dd class="truncate font-medium text-ink-900">{{ prescriptionFile() }}</dd></div>
                  <div class="flex justify-between gap-3"><dt class="text-ink-500">Eligible value</dt><dd class="font-medium text-ink-900">₹5,000</dd></div>
                </dl>
                <p class="mt-3 rounded-xl bg-[#F3F7FF] px-3 py-2 text-xs text-ink-600">
                  On submit your request is validated and a coupon is issued — no wallet block and no
                  payment here.
                </p>
              }
              @case ('coupon') {
                <div class="text-center">
                  <p class="text-3xl">🎟️</p>
                  <p class="mt-2 text-base font-bold text-[#034DA2]">Coupon issued</p>
                  <p class="mt-1 text-sm text-ink-700">Use this coupon at {{ partner() }} to buy your eyewear.</p>
                </div>
                <div class="mt-4 rounded-2xl border border-[#CDDDFE] bg-[#F3F7FF] p-4 text-center">
                  <p class="text-xs text-ink-500">Coupon code</p>
                  <p class="mt-1 text-xl font-bold tracking-wider text-[#034DA2]">{{ couponCode }}</p>
                  <p class="mt-2 text-xs text-ink-500">Order id {{ orderId }} · carries ₹5,000 eligible value</p>
                </div>
                <a class="mt-4 block min-h-touch w-full rounded-xl bg-[#0F5FDC] px-4 text-center text-sm font-semibold leading-[44px] text-white" href="https://www.lenskart.com" target="_blank" rel="noopener">
                  Buy on {{ partner() }} website ↗
                </a>
                <ul class="mt-4 space-y-1.5 text-xs text-ink-500">
                  <li>• Apply the coupon in the partner's coupon field at checkout.</li>
                  <li>• Anything above ₹5,000 is paid directly to the partner.</li>
                  <li>• Settlement happens after the partner processes the order.</li>
                  <li>• Order status, approval and fulfilment are handled by {{ partner() }}, not here.</li>
                </ul>
              }
              @case ('cart') {
                <p class="mb-3 text-sm font-medium text-ink-700">Your cart ({{ orderId }})</p>
                @if (!cartReported()) {
                  <div class="text-center">
                    <p class="text-3xl">⏳</p>
                    <p class="mt-2 text-base font-bold text-[#034DA2]">Waiting on {{ partner() }}</p>
                    <p class="mt-1 text-sm text-ink-700">
                      Once you pick your frame and lenses at {{ partner() }} with your coupon, the
                      cart is pushed back here for payment.
                    </p>
                  </div>
                  <button type="button" class="mt-4 min-h-touch w-full rounded-xl border border-dashed border-surface-border px-4 text-sm font-semibold text-ink-700 hover:bg-surface-sunk" (click)="reportCart()">
                    Simulate: {{ partner() }} pushes your cart
                  </button>
                } @else {
                  <p class="mb-2 text-xs text-ink-500">What you selected at {{ partner() }}:</p>
                  <ul class="space-y-2">
                    @for (item of cartItems; track item.name) {
                      <li class="flex justify-between rounded-xl border border-surface-border px-3 py-2 text-sm"><span class="text-ink-900">{{ item.name }}</span><span class="font-medium text-ink-900">₹{{ item.price }}</span></li>
                    }
                  </ul>
                  <div class="mt-3 flex justify-between border-t border-surface-border pt-3 text-sm"><span class="font-semibold text-ink-900">Order value</span><span class="font-bold text-ink-900">₹{{ orderValue }}</span></div>
                }
              }
              @case ('payment') {
                <p class="mb-3 text-sm font-medium text-ink-700">Payment breakdown</p>
                <dl class="space-y-2 text-sm">
                  <div class="flex justify-between"><dt class="text-ink-700">Order value</dt><dd class="font-medium text-ink-900">₹{{ orderValue }}</dd></div>
                  <div class="flex justify-between"><dt class="text-ink-700">Covered by wallet (eligible ₹{{ eligible }})</dt><dd class="font-medium text-success-700">₹{{ walletCovered }}</dd></div>
                  <div class="flex justify-between border-t border-surface-border pt-2"><dt class="font-semibold text-ink-900">You pay now (Razorpay)</dt><dd class="text-lg font-bold text-ink-900">₹{{ outOfPocket }}</dd></div>
                </dl>
                <p class="mt-3 text-xs text-ink-500">Vision is charged only now — after the partner reports the cart — not at booking. The wallet covers up to the eligible value; the rest goes through Razorpay.</p>
              }
              @case ('paid') {
                <div class="text-center">
                  <p class="text-3xl">✅</p>
                  <p class="mt-2 text-base font-bold text-[#034DA2]">Payment successful</p>
                  <p class="mt-1 text-sm text-ink-700">₹{{ walletCovered }} from wallet · ₹{{ outOfPocket }} via Razorpay.</p>
                </div>
                <p class="mt-3 rounded-xl bg-[#F0FDF4] px-3 py-2 text-sm text-success-700">Order settled — {{ partner() }} will fulfil your order. Invoice available under Health Records › Invoices.</p>
              }
            }

            @if (stepError(); as err) {
              <p class="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">{{ err }}</p>
            }
          </section>

          <div class="mt-5 flex gap-3">
            @if (currentStep() !== 'coupon' && currentStep() !== 'paid') {
              <button type="button" class="flex min-h-touch items-center rounded-xl border border-surface-border bg-white px-6 text-sm font-semibold text-ink-900 hover:border-[#A4BFFE7A]" (click)="back()">Back</button>
            }
            <button type="button" class="min-h-touch flex-1 rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white hover:bg-[#034DA2]" (click)="next()">{{ primaryLabel() }}</button>
          </div>
        }
      </div>
    </div>
  `,
})
export class VisionPage {
  protected readonly partners = PARTNERS;
  protected readonly couponCode = 'OPD-VIS-4827';
  protected readonly orderId = 'VIS-2026-0031';
  protected readonly eligible = ELIGIBLE;
  protected readonly cartItems = CART_ITEMS;
  protected readonly orderValue = ORDER_VALUE;
  protected readonly walletCovered = Math.min(ORDER_VALUE, ELIGIBLE);
  protected readonly outOfPocket = Math.max(0, ORDER_VALUE - ELIGIBLE);

  protected readonly started = signal(false);
  protected readonly step = signal(0);
  protected readonly stepError = signal<string | null>(null);

  protected readonly partner = signal('');
  protected readonly mode = signal('');
  protected readonly prescriptionFile = signal<string | null>(null);
  protected readonly cartReported = signal(false);

  protected readonly steps: Step[] = ['partner', 'prescription', 'review', 'coupon', 'cart', 'payment', 'paid'];
  protected readonly currentStep = computed<Step>(() => this.steps[this.step()] ?? 'partner');

  protected primaryLabel(): string {
    switch (this.currentStep()) {
      case 'review': return 'Submit request';
      case 'coupon': return 'View order status';
      case 'cart': return 'Continue to payment';
      case 'payment': return `Pay ₹${this.outOfPocket} via Razorpay`;
      case 'paid': return 'Done';
      default: return 'Continue';
    }
  }

  protected reportCart(): void {
    this.cartReported.set(true);
  }

  protected start(): void {
    this.started.set(true);
    this.step.set(0);
    this.stepError.set(null);
    this.partner.set('');
    this.mode.set('');
    this.prescriptionFile.set(null);
  }

  protected onPrescription(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    (event.target as HTMLInputElement).value = '';
    if (file) this.prescriptionFile.set(file.name);
  }

  private validate(): string | null {
    switch (this.currentStep()) {
      case 'partner':
        if (!this.partner()) return 'Pick a partner.';
        return this.mode() ? null : 'Choose Online or In-store.';
      case 'prescription':
        return this.prescriptionFile() ? null : 'Upload the eye prescription.';
      case 'cart':
        return this.cartReported() ? null : 'Waiting on the partner — use the button above to fetch your cart.';
      default: return null;
    }
  }

  protected next(): void {
    const err = this.validate();
    if (err) { this.stepError.set(err); return; }
    this.stepError.set(null);
    if (this.currentStep() === 'paid') { this.finish(); return; }
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
    this.cartReported.set(false);
  }
}
