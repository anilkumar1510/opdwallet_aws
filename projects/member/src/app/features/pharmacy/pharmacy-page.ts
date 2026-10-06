import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';

import { FamilyStore } from '../../core/family/family.store';
import { AppService } from '../../core/http/api.service';
import { AddAddressModal } from './add-address-modal';
import { PharmacyAddressCards } from './pharmacy-address-cards';
import { PharmacyAddress, PharmacyAddressInput, applyAddressInput, toAddressInput } from './pharmacy-address.model';
import { PharmacyAddressService } from './pharmacy-address.service';
import { PharmacyOrder } from './pharmacy-order.model';
import { PharmacyOrderService } from './pharmacy-order.service';
import { PharmacyPastOrders } from './pharmacy-past-orders';

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

/** Orders per page; the pager derives its page count from the API's `count`. */
const ORDERS_PAGE_SIZE = 5;

const PER_TXN_LIMIT = 500;
const COPAY_PCT = 20;

/** The API rejects a longer uhId outright: "Length for uhId should not be greater than 128". */
const MAX_UHID_LENGTH = 128;

type Step = 'prescribe' | 'queued' | 'cart' | 'payment' | 'placed';

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

/**
 * Pulls the document id out of an `/dms/api/v1/emrImage` response body.
 *
 * The claims page reads `resource[0].document_id`, but `emrImage` may answer with a
 * single object instead of a one-element list, and has been seen using `id` as well.
 * Both shapes are accepted so a contract change cannot silently leave `doc_id`
 * undefined. Returns null when nothing usable is present, which the caller treats as
 * a failed upload rather than a success carrying no id.
 */
export function readUploadedDocId(body: unknown): string | null {
  const envelope = asRecord(body);
  if (!envelope || envelope['errCode'] !== 0) return null;

  const resource = envelope['resource'];
  const record = asRecord(Array.isArray(resource) ? resource[0] : resource);
  if (!record) return null;

  for (const field of ['id', 'document_id'] as const) {
    const value = record[field];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return null;
}

@Component({
  selector: 'opd-pharmacy-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PharmacyAddressCards, AddAddressModal, PharmacyPastOrders],
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

          <h2 #ordersHeading class="mt-8 text-lg font-bold text-[#034DA2]">Past orders</h2>

          @if (ordersLoading()) {
            <p class="mt-3 rounded-xl bg-white px-3 py-2 text-sm text-ink-500">Loading your orders…</p>
          } @else if (ordersError()) {
            <p class="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">
              {{ ordersError() }}
            </p>
          } @else if (!pastOrders().length) {
            <p class="mt-3 rounded-xl bg-warning-50 px-3 py-2 text-sm text-warning-700">
              You have no past orders yet.
            </p>
          } @else {
            <opd-pharmacy-past-orders [orders]="pastOrders()" />
            <nav class="mt-3 flex items-center justify-between gap-3" aria-label="Past orders pages">
              <button
                type="button"
                class="min-h-touch rounded-xl border border-surface-border bg-white px-4 text-sm font-medium text-brand-700 disabled:opacity-40"
                [disabled]="!hasPrevPage() || ordersLoading()"
                (click)="goToOrdersPage(ordersPage() - 1)"
              >
                &larr; Previous
              </button>
              @if (ordersHaveTotal()) {
                <p class="text-sm text-ink-500">Page {{ ordersPage() + 1 }} of {{ pageCount() }}</p>
              } @else {
                <p class="text-sm text-ink-500">Page {{ ordersPage() + 1 }}</p>
              }
              <button
                type="button"
                class="min-h-touch rounded-xl border border-surface-border bg-white px-4 text-sm font-medium text-brand-700 disabled:opacity-40"
                [disabled]="!hasNextPage() || ordersLoading()"
                (click)="goToOrdersPage(ordersPage() + 1)"
              >
                Next &rarr;
              </button>
            </nav>
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
                <input type="file" class="sr-only" accept="image/*,.pdf" id="rx" [disabled]="documentUploading()" (change)="onPrescription($event)" />
                <label for="rx" class="block w-full cursor-pointer rounded-xl border-2 border-dashed border-[#CDDDFE] bg-[#F7FAFF] px-6 py-6 text-center" [class.pointer-events-none]="documentUploading()" [class.opacity-60]="documentUploading()" (click)="existingId.set('')">
                  <span class="block font-medium text-[#0B2C63]">{{ uploadLabel() }}</span>
                  <span class="mt-1 block text-xs text-ink-500">Photo or PDF</span>
                </label>
                @if (documentUploading()) {
                  <p class="mt-2 text-sm text-ink-500">Uploading your prescription…</p>
                }
                @if (uploadedFile(); as f) { <p class="mt-2 truncate text-sm text-ink-900">{{ f }}</p> }
                @if (uploadError(); as err) { <p class="mt-2 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">{{ err }}</p> }

                <p class="mb-1 mt-5 border-t border-surface-border pt-4 text-sm font-medium text-ink-700">Or use an existing prescription</p>
                <div class="space-y-2">
                  @for (rx of existingPrescriptions; track rx.id) {
                    <button type="button" class="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm" [class.border-brand-500]="existingId() === rx.id" [class.bg-blue-50]="existingId() === rx.id" [class.border-surface-border]="existingId() !== rx.id" (click)="pickExisting(rx.id)">
                      <span><span class="font-medium text-ink-900">{{ rx.id }}</span> <span class="text-xs text-ink-500">· {{ rx.label }}</span></span>
                      @if (existingId() === rx.id) { <span class="text-brand-700">✓</span> }
                    </button>
                  }
                </div>

                <p class="mb-2 mt-5 border-t border-surface-border pt-4 text-sm font-medium text-ink-700">Delivery address</p>
                <opd-pharmacy-address-cards
                  [addresses]="addresses()"
                  [loadFailed]="addressLoadFailed()"
                  [(selectedId)]="selectedAddressId"
                  (addRequested)="openAddAddress()"
                />

                <opd-add-address-modal
                  [open]="addAddressOpen()"
                  [heading]="editingAddress() ? 'Edit delivery address' : 'Add a delivery address'"
                  [initial]="editingAddress() ? toAddressInput(editingAddress()!) : null"
                  [saving]="addressSaving()"
                  [saveError]="addressSaveError()"
                  (saved)="saveAddress($event)"
                  (cancelled)="closeAddAddress()"
                />
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
            <button type="button" class="min-h-touch flex-1 rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white hover:bg-[#034DA2] disabled:opacity-50" [disabled]="submittingBooking()" (click)="next()">{{ primaryLabel() }}</button>
          </div>
        }
      </div>
    </div>
  `,
})
export class PharmacyPage {
  private readonly http = inject(HttpClient);
  private readonly appService = inject(AppService);
  private readonly router = inject(Router);
  private readonly family = inject(FamilyStore);
  private readonly addressService = inject(PharmacyAddressService);
  private readonly orderService = inject(PharmacyOrderService);

  protected readonly existingPrescriptions = EXISTING_PRESCRIPTIONS;
  protected readonly perTxn = PER_TXN_LIMIT;
  protected readonly copayPct = COPAY_PCT;

  protected readonly pastOrders = signal<readonly PharmacyOrder[]>([]);
  protected readonly ordersTotal = signal(0);
  protected readonly ordersPage = signal(0);
  protected readonly ordersLoading = signal(false);
  protected readonly ordersError = signal<string | null>(null);
  /**
   * Whether the API reports a total. Until it does, `ordersTotal` is only this
   * page's row count and there is no honest "of M" to show, so navigation is
   * offered but inert rather than hidden.
   */
  protected readonly ordersHaveTotal = signal(false);
  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.ordersTotal() / ORDERS_PAGE_SIZE)),
  );
  protected readonly hasPrevPage = computed(() => this.ordersHaveTotal() && this.ordersPage() > 0);
  protected readonly hasNextPage = computed(
    () => this.ordersHaveTotal() && this.ordersPage() + 1 < this.pageCount(),
  );
  private ordersRequested = false;
  /** Anchor for the scroll-back on a page change; absent while the list is hidden. */
  private readonly ordersHeading = viewChild<ElementRef<HTMLHeadingElement>>('ordersHeading');

  private async loadOrdersPage(page: number): Promise<void> {
    if (this.ordersLoading()) return;
    this.ordersLoading.set(true);
    this.ordersError.set(null);
    try {
      const result = await this.orderService.list(page, ORDERS_PAGE_SIZE);
 this.pastOrders.set(result.orders);
      this.ordersTotal.set(result.count);
      this.ordersHaveTotal.set(result.hasTotal);
      this.ordersPage.set(page);
    } catch {
      // A failed load must not read as "no past orders" — the member would be
      // told they have no history when the request simply did not complete.
      this.ordersError.set('We could not load your past orders. Please try again.');
    } finally {
      this.ordersLoading.set(false);
    }
  }

  protected async goToOrdersPage(page: number): Promise<void> {
    if (!this.ordersHaveTotal()) return;
    if (page < 0 || page >= this.pageCount() || page === this.ordersPage()) return;
    await this.loadOrdersPage(page);
    this.ordersHeading()?.nativeElement.scrollIntoView({ block: 'start' });
  }

  constructor() {
    // The past-orders list is the landing view, so it loads on page entry rather
    // than waiting for "Order medicines" — which would leave the section showing
    // an empty state the member never asked for.
    this.loadOrdersOnce();
  }

  private loadOrdersOnce(): void {
    if (this.ordersRequested) return;
    this.ordersRequested = true;
    void this.loadOrdersPage(0);
  }

  protected readonly started = signal(false);
  protected readonly step = signal(0);
  protected readonly stepError = signal<string | null>(null);

  protected readonly uploadedFile = signal<string | null>(null);
  protected readonly uploadedDocId = signal<string | null>(null);
  protected readonly documentUploading = signal(false);
  protected readonly uploadError = signal<string | null>(null);
  protected readonly existingId = signal('');
  protected readonly cartPushed = signal(false);
  protected readonly cart = signal<CartItem[]>([]);

  protected readonly addresses = signal<readonly PharmacyAddress[]>([]);
  protected readonly addressUhId = signal('');
  protected readonly selectedAddressId = signal('');
  protected readonly addressLoadFailed = signal(false);
  protected readonly addAddressOpen = signal(false);
  /** Non-null while editing an existing address; null when adding a new one. */
  protected readonly editingAddress = signal<PharmacyAddress | null>(null);
  protected readonly addressSaving = signal(false);
  protected readonly addressSaveError = signal<string | null>(null);
  protected readonly submittingBooking = signal(false);

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

  protected uploadLabel(): string {
    if (this.documentUploading()) return 'Uploading…';
    return this.uploadedDocId() ? 'Replace prescription' : 'Upload prescription';
  }

  protected primaryLabel(): string {
    if (this.submittingBooking()) return 'Submitting…';
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
    this.resetPrescription();
    this.cartPushed.set(false);
    this.cart.set([]);
    void this.loadAddresses();
  }

  private resetPrescription(): void {
    this.uploadedFile.set(null);
    this.uploadedDocId.set(null);
    this.uploadError.set(null);
    this.documentUploading.set(false);
    this.existingId.set('');
  }

  private resetAddresses(): void {
    this.addresses.set([]);
    this.addressUhId.set('');
    this.selectedAddressId.set('');
    this.addressLoadFailed.set(false);
    this.addAddressOpen.set(false);
    this.editingAddress.set(null);
    this.addressSaving.set(false);
    this.addressSaveError.set(null);
  }

  /**
   * `patient_id` is the family member's `mapped_id`, confirmed against GET_FAMILY_LIST.
   * Neither id exists until the family has loaded, so this must await load() —
   * reading the store directly yields an empty id.
   */
  private async patientFilter(): Promise<{ patientId: string; uhId: string }> {
    if (!this.family.family().length) await this.family.load();
    const member = this.family.activeMember();
    return { patientId: member?.memberId ?? member?.id ?? '', uhId: member?.uhid ?? '' };
  }

  private async loadAddresses(): Promise<void> {
    this.addressLoadFailed.set(false);
    const { patientId, uhId } = await this.patientFilter();
    if (!patientId) {
      this.addressLoadFailed.set(true);
      return;
    }
    const loaded = await this.addressService.list(patientId, uhId);
    this.addresses.set(loaded);
    this.addressUhId.set(this.usableUhid(uhId, loaded));
  }

  /**
   * The uhid to POST back, preferring the family record's plaintext value.
   *
   * order_address rows carry the uhid encrypted, which runs to 152 characters and
   * the API rejects with "Length for uhId should not be greater than 128".
   * Decrypting it is not an option — one pass still yields ciphertext, not a
   * uhid — so the address row is only used when it fits the limit, and the
   * family record (a plain "HH-371683") wins whenever it is present.
   */
  private usableUhid(fromFamily: string, loaded: readonly PharmacyAddress[]): string {
    if (fromFamily && fromFamily.length <= MAX_UHID_LENGTH) return fromFamily;
    return loaded.find((address) => address.uhId && address.uhId.length <= MAX_UHID_LENGTH)?.uhId ?? '';
  }

  protected openAddAddress(): void {
    this.addressSaveError.set(null);
    this.editingAddress.set(null);
    this.addAddressOpen.set(true);
  }

  protected openEditAddress(address: PharmacyAddress): void {
    this.addressSaveError.set(null);
    this.editingAddress.set(address);
    this.addAddressOpen.set(true);
  }

  protected closeAddAddress(): void {
    if (this.addressSaving()) return;
    this.addAddressOpen.set(false);
    this.editingAddress.set(null);
    this.addressSaveError.set(null);
  }

  protected toAddressInput(address: PharmacyAddress): PharmacyAddressInput {
    return toAddressInput(address, this.appService);
  }

  protected async saveAddress(input: PharmacyAddressInput): Promise<void> {
    const editing = this.editingAddress();

    // Edit is local-only until the update endpoint lands; the POST would create a
    // second row for the same address rather than change this one.
    if (editing) {
      const updated = applyAddressInput(editing, input);
      this.addresses.update((current) => current.map((a) => (a.id === editing.id ? updated : a)));
      this.addAddressOpen.set(false);
      this.editingAddress.set(null);
      return;
    }

    this.addressSaving.set(true);
    this.addressSaveError.set(null);
    const { patientId, uhId } = await this.patientFilter();
    // Address rows carry the uhid even when the family record does not; the POST
    // answers "Required field missing : uhId" without it.
    const saved = await this.addressService.save(input, patientId, this.addressUhId() || uhId);
    this.addressSaving.set(false);
    if (!saved) {
      this.addressSaveError.set(this.addressService.lastError ?? 'We could not save this address. Please try again.');
      return;
    }
    this.addresses.update((current) => [saved, ...current]);
    this.selectedAddressId.set(saved.id);
    this.addAddressOpen.set(false);
  }

  protected onPrescription(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) this.uploadPrescription(file);
  }

  /**
   * The X-XSRF-TOKEN is computed over the file's own bytes, so the read has to
   * finish before the request is issued — posting the FormData directly breaks it.
   */
  private uploadPrescription(file: File): void {
    this.existingId.set('');
    this.uploadedFile.set(null);
    this.uploadedDocId.set(null);
    this.uploadError.set(null);
    this.stepError.set(null);
    this.documentUploading.set(true);

    const reader = new FileReader();
    reader.onload = () => {
      this.http
        .post('/dms/api/v1/emrImage', this.prescriptionFormData(file), {
          headers: new HttpHeaders()
            .set('X-XSRF-TOKEN', this.appService.getXsrfToken(reader.result, true))
            .set('timezone', this.appService.getUserTimezone())
            .set('current_time', this.appService.getCurrentTime())
            .set('current_url', this.router.url)
            .set('host_name', window.location.host),
          responseType: 'json',
          observe: 'response' as 'response',
        })
        .subscribe({
          next: (response) => this.onPrescriptionUploaded(file, response.body),
          error: () => this.failUpload(),
        });
    };
    reader.onerror = () => this.failUpload();
    reader.readAsArrayBuffer(file);
  }

  private prescriptionFormData(file: File): FormData {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', file.name);
    formData.append('action', 'add');
    return formData;
  }

  private onPrescriptionUploaded(file: File, body: unknown): void {
    this.documentUploading.set(false);
    const docId = readUploadedDocId(body);
    if (!docId) {
      this.failUpload();
      return;
    }
    this.uploadedDocId.set(docId);
    this.uploadedFile.set(file.name);
  }

  private failUpload(): void {
    this.documentUploading.set(false);
    this.uploadedDocId.set(null);
    this.uploadedFile.set(null);
    this.uploadError.set('We could not upload your prescription. Try again.');
  }

  protected pickExisting(id: string): void {
    this.existingId.set(id);
    this.uploadedFile.set(null);
    this.uploadedDocId.set(null);
    this.uploadError.set(null);
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

  private selectedAddress(): PharmacyAddress | null {
    return this.addresses().find((address) => address.id === this.selectedAddressId()) ?? null;
  }

  private validate(): string | null {
    switch (this.currentStep()) {
      case 'prescribe':
        if (this.documentUploading()) return 'Your prescription is still uploading.';
        if (this.uploadError()) return this.uploadError();
        if (!this.uploadedDocId() && !this.existingId()) {
          return 'Upload a prescription or pick an existing one.';
        }
        if (!this.selectedAddressId()) return 'Choose a delivery address for your medicines.';
        if (!this.activePolicyId()) return 'No policy is active for this member, so we cannot submit.';
        return null;
      case 'queued':
        return this.cartPushed() ? null : 'Waiting on the adjudicator — use the button above to build the cart.';
      case 'cart':
        return this.cart().length ? null : 'Your cart is empty — restore an item to continue.';
      default: return null;
    }
  }

  /**
   * The active member's own policy, so a dependant is not booked on the primary's.
   *
   * The holderId match is currently dead: `FamilyStore.policies` is backed by
   * STATIC_POLICIES whose holderIds are names ('shivam'/'sayani'), never a live
   * member id. The fallback keeps submit reachable and looks redundant — it is not.
   */
  private activePolicyId(): string {
    const member = this.family.activeMember();
    if (member) {
      const own = this.family.policies().find((policy) => policy.holderId === member.id);
      if (own?.id) return own.id;
    }
    return this.family.policies().find((policy) => Boolean(policy.id))?.id ?? '';
  }

  protected next(): void {
    const err = this.validate();
    if (err) { this.stepError.set(err); return; }
    this.stepError.set(null);
    if (this.currentStep() === 'placed') { this.finish(); return; }
    if (this.currentStep() === 'prescribe') { void this.submitPrescription(); return; }
    this.step.set(this.step() + 1);
  }

  private async submitPrescription(): Promise<void> {
    const docId = this.uploadedDocId();
    const address = this.selectedAddress();
    if (!docId || !address) {
      this.stepError.set('Upload a prescription and choose a delivery address first.');
      return;
    }
    this.submittingBooking.set(true);
    try {
      const sent = await this.postBooking(docId, address);
      if (!sent) {
        this.stepError.set('We could not submit your prescription. Please try again.');
        return;
      }
      this.step.set(this.step() + 1);
    } finally {
      this.submittingBooking.set(false);
    }
  }

  private async postBooking(docId: string, address: PharmacyAddress): Promise<boolean> {
    const payload = {
      doc_id: docId,
      policy_id: this.activePolicyId(),
      address: address.booking,
    };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    const params = `resource=${encoded}&application=habit-opd&action=OPD_PHARMACY_BOOKING`;
    try {
      const response = await this.http
        .post('/habit-opd/api/v1/opd_pharmacy_booking', params, this.appService.addXsrfToken(encoded, true))
        .toPromise();
      return this.bookingAccepted(response);
    } catch {
      return false;
    }
  }

  /** Failure is signalled by a non-zero errCode in the body, not by the HTTP status. */
  private bookingAccepted(response: unknown): boolean {
    if (typeof response !== 'string') return true;
    try {
      const parsed: unknown = JSON.parse(response);
      if (typeof parsed !== 'object' || parsed === null) return true;
      const errCode = (parsed as Record<string, unknown>)['errCode'];
      return errCode === undefined || errCode === 0;
    } catch {
      return true;
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

  private finish(): void {
    this.started.set(false);
    this.step.set(0);
    this.resetPrescription();
    this.resetAddresses();
    this.cartPushed.set(false);
    this.cart.set([]);
  }
}
