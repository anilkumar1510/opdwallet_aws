import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import { ClaimStatus } from '../../core/claims/claim.model';
import { StatusBadge } from '../../shared/ui/status-badge';

/**
 * Pharmacy — DUMMY / STATIC journey, zero backend.
 *
 * Prescription-led, per patient-flows Section 5. The member submits a
 * PRESCRIPTION, not a cart; an adjudicator (out of the portal) builds the cart
 * from the Tata 1mg catalogue and pushes it back. The member may only REDUCE the
 * cart (delete an item or reduce a quantity), never add or increase — the wallet
 * block recalculates on every reduction. Then checkout → wallet debit + Razorpay
 * co-payment → order placed → receipt (delivery + invoice-after-delivery noted).
 * No network calls. See REMOVED-APIS.md.
 */

interface CartItem {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
  isSubstitute: boolean;
  originalBrand: string;
}

const ADJUDICATED_CART: CartItem[] = [
  { id: 'm1', name: 'Crocin 500mg (Paracetamol)', qty: 2, unitPrice: 30, isSubstitute: false, originalBrand: '' },
  { id: 'm2', name: 'Novamox 500mg (Amoxicillin)', qty: 1, unitPrice: 120, isSubstitute: true, originalBrand: 'Mox 500mg' },
  { id: 'm3', name: 'Cetzine 10mg (Cetirizine)', qty: 1, unitPrice: 45, isSubstitute: false, originalBrand: '' },
  { id: 'm4', name: 'Pan-D (Pantoprazole)', qty: 1, unitPrice: 85, isSubstitute: false, originalBrand: '' },
];

const EXISTING_PRESCRIPTIONS = [
  { id: 'RX-2026-0012', label: 'Dr. A. Sharma · 2 Sep 2026' },
  { id: 'RX-2026-0008', label: 'Dr. N. Gupta · 20 Aug 2026' },
];

interface PastOrder {
  id: string;
  prescriptionId: string;
  date: string;
  itemCount: number;
  amount: number;
  status: ClaimStatus;
}

const DELIVERED: ClaimStatus = { label: 'Delivered', tone: 'positive', isFinal: true };
const OUT_FOR_DELIVERY: ClaimStatus = { label: 'Out for delivery', tone: 'progress', isFinal: false };
const CART_READY: ClaimStatus = { label: 'Cart ready', tone: 'progress', isFinal: false };
const QUEUED: ClaimStatus = { label: 'Prescription queued', tone: 'neutral', isFinal: false };
const CANCELLED: ClaimStatus = { label: 'Cancelled', tone: 'negative', isFinal: true };

const PAST_ORDERS: PastOrder[] = [
  { id: 'PH-2026-0024', prescriptionId: 'RX-2026-0030', date: '28 Sept 2026', itemCount: 2, amount: 0, status: QUEUED },
  { id: 'PH-2026-0023', prescriptionId: 'RX-2026-0029', date: '26 Sept 2026', itemCount: 3, amount: 265, status: CART_READY },
  { id: 'PH-2026-0021', prescriptionId: 'RX-2026-0027', date: '24 Sept 2026', itemCount: 4, amount: 310, status: OUT_FOR_DELIVERY },
  { id: 'PH-2026-0019', prescriptionId: 'RX-2026-0012', date: '18 Sept 2026', itemCount: 4, amount: 310, status: DELIVERED },
  { id: 'PH-2026-0017', prescriptionId: 'RX-2026-0025', date: '11 Sept 2026', itemCount: 2, amount: 150, status: DELIVERED },
  { id: 'PH-2026-0015', prescriptionId: 'RX-2026-0022', date: '3 Sept 2026', itemCount: 1, amount: 85, status: CANCELLED },
  { id: 'PH-2026-0013', prescriptionId: 'RX-2026-0008', date: '24 Aug 2026', itemCount: 3, amount: 420, status: DELIVERED },
  { id: 'PH-2026-0011', prescriptionId: 'RX-2026-0018', date: '12 Aug 2026', itemCount: 2, amount: 175, status: DELIVERED },
  { id: 'PH-2026-0009', prescriptionId: 'RX-2026-0015', date: '30 Jul 2026', itemCount: 5, amount: 495, status: DELIVERED },
  { id: 'PH-2026-0007', prescriptionId: 'RX-2026-0011', date: '15 Jul 2026', itemCount: 1, amount: 60, status: DELIVERED },
  { id: 'PH-2026-0005', prescriptionId: 'RX-2026-0007', date: '28 Jun 2026', itemCount: 2, amount: 230, status: CANCELLED },
  { id: 'PH-2026-0003', prescriptionId: 'RX-2026-0004', date: '9 Jun 2026', itemCount: 3, amount: 340, status: DELIVERED },
];

/** Past orders are revealed ORDERS_PAGE_SIZE at a time; "Load more" shows the next batch. */
const ORDERS_PAGE_SIZE = 5;

const PER_TXN_LIMIT = 500;
const COPAY_PCT = 20;

type Step = 'prescribe' | 'queued' | 'cart' | 'payment' | 'placed';

@Component({
  selector: 'opd-pharmacy-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusBadge],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none">
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <button type="button" class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50" aria-label="Back" (click)="headerBack()">&larr;</button>
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">Pharmacy</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">Upload a prescription — we build the cart</p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        <p class="mb-4 rounded-xl border border-dashed border-warning-400 bg-warning-50 px-3 py-2 text-xs text-warning-700">
          🧪 Static demo journey — no data is saved and no payment is taken.
        </p>

        @if (!started()) {
          <div class="rounded-2xl border border-[#CDDDFE] bg-[#F3F7FF] p-5">
            <p class="text-sm text-ink-700">Pharmacy coverage</p>
            <p class="mt-1 text-2xl font-bold text-[#034DA2]">₹5,000 <span class="text-sm font-normal text-ink-500">left this year</span></p>
            <p class="mt-1 text-xs text-ink-500">{{ copayPct }}% co-payment · you submit a prescription, our team builds the cart for you.</p>
          </div>
          <button type="button" class="mt-5 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white hover:bg-[#034DA2]" (click)="start()">Order medicines →</button>

          <h2 class="mt-8 text-lg font-bold text-[#034DA2]">Past orders</h2>
          <ul class="mt-3 space-y-3">
            @for (order of visibleOrders(); track order.id) {
              <li
                class="rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white p-4"
                style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.24)"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-base font-semibold text-[#034DA2]">Medicine order</p>
                    <p class="mt-0.5 truncate text-sm text-ink-700">Prescription {{ order.prescriptionId }}</p>
                    <p class="mt-1 text-xs text-ink-500">
                      {{ order.id }} · {{ order.date }} · {{ order.itemCount }} item{{ order.itemCount === 1 ? '' : 's' }}
                    </p>
                  </div>
                  <div class="shrink-0 text-right">
                    <opd-status-badge [status]="order.status" />
                    <p class="mt-2 text-lg font-semibold text-[#303030]">
                      {{ order.amount ? '₹' + order.amount : '—' }}
                    </p>
                  </div>
                </div>
              </li>
            }
          </ul>

          @if (hasMoreOrders()) {
            <button
              type="button"
              class="mt-3 min-h-touch w-full rounded-xl border border-surface-border bg-white text-sm font-medium text-brand-700"
              (click)="loadMoreOrders()"
            >
              Load more
            </button>
          }
        }

        @else {
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-bold text-[#034DA2]">Order medicines</h2>
          </div>

          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
            @switch (currentStep()) {
              @case ('prescribe') {
                <p class="mb-1 text-sm font-medium text-ink-700">Upload a new prescription</p>
                <p class="mb-2 text-xs text-ink-500">You submit a prescription only — you don't build the cart.</p>
                <input type="file" class="sr-only" accept="image/*,.pdf" id="rx" (change)="onPrescription($event)" />
                <label for="rx" class="block w-full cursor-pointer rounded-xl border-2 border-dashed border-[#CDDDFE] bg-[#F7FAFF] px-6 py-6 text-center" (click)="existingId.set('')">
                  <span class="block font-medium text-[#0B2C63]">{{ uploadedFile() ? 'Replace prescription' : 'Upload prescription' }}</span>
                  <span class="mt-1 block text-xs text-ink-500">Photo or PDF</span>
                </label>
                @if (uploadedFile(); as f) { <p class="mt-2 truncate text-sm text-ink-900">{{ f }}</p> }

                <p class="mb-2 mt-5 border-t border-surface-border pt-4 text-sm font-medium text-ink-700">Or use an existing prescription</p>
                <div class="space-y-2">
                  @for (rx of existingPrescriptions; track rx.id) {
                    <button type="button" class="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm" [class.border-brand-500]="existingId() === rx.id" [class.bg-blue-50]="existingId() === rx.id" [class.border-surface-border]="existingId() !== rx.id" (click)="pickExisting(rx.id)">
                      <span><span class="font-medium text-ink-900">{{ rx.id }}</span> <span class="text-xs text-ink-500">· {{ rx.label }}</span></span>
                      @if (existingId() === rx.id) { <span class="text-brand-700">✓</span> }
                    </button>
                  }
                </div>
              }
              @case ('queued') {
                <div class="text-center">
                  <p class="text-3xl">⏳</p>
                  <p class="mt-2 text-base font-bold text-[#034DA2]">Prescription queued</p>
                  <p class="mt-1 text-sm text-ink-700">Saved as <strong>{{ prescriptionId() }}</strong> and queued for digitisation. Our team reads it and builds your cart from the catalogue.</p>
                </div>
                <p class="mt-3 rounded-xl bg-warning-50 px-3 py-2 text-xs text-warning-700">You'll get a WhatsApp and push notification once the cart is ready.</p>
                <button type="button" class="mt-4 min-h-touch w-full rounded-xl border border-dashed border-surface-border px-4 text-sm font-semibold text-ink-700 hover:bg-surface-sunk" (click)="pushCart()">
                  Simulate: adjudicator builds &amp; pushes the cart
                </button>
              }
              @case ('cart') {
                <p class="mb-1 rounded-xl bg-[#F0FDF4] px-3 py-2 text-sm text-success-700">🔔 Your cart is ready.</p>
                <p class="mb-3 text-xs text-ink-500">You can remove an item or reduce a quantity — you can't add or increase, since the cart is adjudicated against your prescription.</p>
                <ul class="space-y-2">
                  @for (item of cart(); track item.id) {
                    <li class="rounded-xl border border-surface-border px-3 py-2">
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                          <p class="text-sm font-medium text-ink-900">{{ item.name }}</p>
                          @if (item.isSubstitute) {
                            <p class="text-xs text-warning-700">Substitute for {{ item.originalBrand }}</p>
                          }
                          <p class="text-xs text-ink-500">₹{{ item.unitPrice }} each</p>
                        </div>
                        <div class="shrink-0 text-right">
                          <p class="text-sm font-semibold text-ink-900">₹{{ item.qty * item.unitPrice }}</p>
                          <div class="mt-1 flex items-center justify-end gap-2">
                            <button type="button" class="flex h-6 w-6 items-center justify-center rounded-full border border-surface-border text-ink-700" (click)="decrement(item.id)" aria-label="Reduce quantity">−</button>
                            <span class="text-sm text-ink-900">{{ item.qty }}</span>
                          </div>
                          <button type="button" class="mt-1 text-xs font-medium text-danger-700 underline" (click)="removeItem(item.id)">Remove</button>
                        </div>
                      </div>
                    </li>
                  }
                  @if (!cart().length) {
                    <li class="rounded-xl bg-surface-sunk px-3 py-3 text-sm text-ink-500">You've removed everything. Add nothing back — reduce only. Restore the cart to continue.</li>
                  }
                </ul>
                <div class="mt-3 space-y-1 border-t border-surface-border pt-3 text-sm">
                  <div class="flex justify-between"><span class="text-ink-700">Cart value</span><span class="font-medium text-ink-900">₹{{ pay().cartValue }}</span></div>
                  <div class="flex justify-between"><span class="text-ink-700">Wallet blocked</span><span class="font-medium text-success-700">₹{{ pay().walletBlock }}</span></div>
                </div>
              }
              @case ('payment') {
                <p class="mb-3 text-sm font-medium text-ink-700">Checkout — payment breakdown</p>
                <dl class="space-y-2 text-sm">
                  <div class="flex justify-between"><dt class="text-ink-700">Cart value</dt><dd class="font-medium text-ink-900">₹{{ pay().cartValue }}</dd></div>
                  <div class="flex justify-between"><dt class="text-ink-700">Wallet eligible (limit ₹{{ perTxn }})</dt><dd class="font-medium text-ink-900">₹{{ pay().covered }}</dd></div>
                  <div class="flex justify-between"><dt class="text-ink-700">Co-payment ({{ copayPct }}%)</dt><dd class="font-medium text-danger-700">− ₹{{ pay().copay }}</dd></div>
                  <div class="flex justify-between border-t border-surface-border pt-2"><dt class="text-ink-700">Wallet deducted</dt><dd class="font-medium text-success-700">₹{{ pay().walletBlock }}</dd></div>
                  @if (pay().excess > 0) {
                    <div class="flex justify-between"><dt class="text-ink-700">Above per-transaction limit</dt><dd class="font-medium text-ink-900">₹{{ pay().excess }}</dd></div>
                  }
                  <div class="flex justify-between border-t border-surface-border pt-2"><dt class="font-semibold text-ink-900">You pay now (Razorpay)</dt><dd class="text-lg font-bold text-ink-900">₹{{ pay().selfPay }}</dd></div>
                </dl>
                <p class="mt-3 text-xs text-ink-500">Wallet is deducted and the co-payment goes through Razorpay. The wallet block becomes a debit on delivery.</p>
              }
              @case ('placed') {
                <div class="text-center">
                  <p class="text-3xl">✅</p>
                  <p class="mt-2 text-base font-bold text-[#034DA2]">Order placed</p>
                  <p class="mt-1 text-sm text-ink-700">₹{{ pay().walletBlock }} from wallet · ₹{{ pay().selfPay }} via Razorpay.</p>
                </div>
                <p class="mt-3 rounded-xl bg-[#F0FDF4] px-3 py-2 text-sm text-success-700">🧾 Receipt issued. The partner will pick, pack and deliver — the invoice is raised after delivery.</p>
              }
            }

            @if (stepError(); as err) {
              <p class="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">{{ err }}</p>
            }
          </section>

          <div class="mt-5 flex gap-3">
            @if (currentStep() !== 'placed') {
              <button type="button" class="flex min-h-touch items-center rounded-xl border border-surface-border bg-white px-6 text-sm font-semibold text-ink-900 hover:border-[#A4BFFE7A]" (click)="back()">Back</button>
            }
            <button type="button" class="min-h-touch flex-1 rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white hover:bg-[#034DA2]" (click)="next()">{{ primaryLabel() }}</button>
          </div>
        }
      </div>
    </div>
  `,
})
export class PharmacyPage {
  protected readonly existingPrescriptions = EXISTING_PRESCRIPTIONS;
  protected readonly perTxn = PER_TXN_LIMIT;
  protected readonly copayPct = COPAY_PCT;

  private readonly visibleOrderCount = signal(ORDERS_PAGE_SIZE);
  protected readonly visibleOrders = computed(() => PAST_ORDERS.slice(0, this.visibleOrderCount()));
  protected readonly hasMoreOrders = computed(() => PAST_ORDERS.length > this.visibleOrderCount());

  protected loadMoreOrders(): void {
    this.visibleOrderCount.update((n) => n + ORDERS_PAGE_SIZE);
  }

  protected readonly started = signal(false);
  protected readonly step = signal(0);
  protected readonly stepError = signal<string | null>(null);

  protected readonly uploadedFile = signal<string | null>(null);
  protected readonly existingId = signal('');
  protected readonly cartPushed = signal(false);
  protected readonly cart = signal<CartItem[]>([]);

  protected readonly steps: Step[] = ['prescribe', 'queued', 'cart', 'payment', 'placed'];
  protected readonly currentStep = computed<Step>(() => this.steps[this.step()] ?? 'prescribe');

  protected prescriptionId(): string {
    return this.existingId() || 'RX-2026-0031';
  }

  /** Wallet share + co-payment on the current (reducible) cart. */
  protected readonly pay = computed(() => {
    const cartValue = this.cart().reduce((s, i) => s + i.qty * i.unitPrice, 0);
    const covered = Math.min(cartValue, PER_TXN_LIMIT);
    const copay = Math.round((covered * COPAY_PCT) / 100);
    const walletBlock = covered - copay;
    const excess = Math.max(0, cartValue - PER_TXN_LIMIT);
    return { cartValue, covered, copay, walletBlock, excess, selfPay: copay + excess };
  });

  protected primaryLabel(): string {
    switch (this.currentStep()) {
      case 'prescribe': return 'Submit prescription';
      case 'queued': return 'Continue to cart';
      case 'cart': return 'Proceed to checkout';
      case 'payment': return `Pay ₹${this.pay().selfPay} via Razorpay`;
      case 'placed': return 'Done';
      default: return 'Continue';
    }
  }

  protected start(): void {
    this.started.set(true);
    this.step.set(0);
    this.stepError.set(null);
    this.uploadedFile.set(null);
    this.existingId.set('');
    this.cartPushed.set(false);
    this.cart.set([]);
  }

  protected onPrescription(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    (event.target as HTMLInputElement).value = '';
    if (file) { this.uploadedFile.set(file.name); this.existingId.set(''); }
  }

  protected pickExisting(id: string): void {
    this.existingId.set(id);
    this.uploadedFile.set(null);
  }

  protected pushCart(): void {
    this.cart.set(ADJUDICATED_CART.map((i) => ({ ...i })));
    this.cartPushed.set(true);
  }

  protected decrement(id: string): void {
    this.cart.set(
      this.cart()
        .map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i))
        .filter((i) => i.qty > 0),
    );
  }

  protected removeItem(id: string): void {
    this.cart.set(this.cart().filter((i) => i.id !== id));
  }

  private validate(): string | null {
    switch (this.currentStep()) {
      case 'prescribe':
        return this.uploadedFile() || this.existingId() ? null : 'Upload a prescription or pick an existing one.';
      case 'queued':
        return this.cartPushed() ? null : 'Waiting on the adjudicator — use the button above to build the cart.';
      case 'cart':
        return this.cart().length ? null : 'Your cart is empty — restore an item to continue.';
      default: return null;
    }
  }

  protected next(): void {
    const err = this.validate();
    if (err) { this.stepError.set(err); return; }
    this.stepError.set(null);
    if (this.currentStep() === 'placed') { this.finish(); return; }
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
    this.uploadedFile.set(null);
    this.existingId.set('');
    this.cartPushed.set(false);
    this.cart.set([]);
  }
}
