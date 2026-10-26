import { ChangeDetectionStrategy, Component, computed, input, signal, inject } from '@angular/core';

import { MOCK_WALLET_BALANCE, splitPayment, percentCopay } from '../../core/domain/payment-split';
import { PolicyStore } from '../../core/member/policy.store';
import { PaymentSplitView } from '../../shared/ui/payment-split';

import { BenefitCategory } from '../../core/domain/codes';
import { ClaimModeStore } from '../../core/member/claim-mode.store';
import { ClaimOption } from '../../shared/ui/claim-option';
import { CoverageBannerComponent } from '../../shared/ui/coverage-banner';

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
 *   → cart ready (WhatsApp + push) → one page of accordion steps: postal code
 *     (locked) → select provider (price per test + total, postal-code providers
 *     first, then nearby radius with distance; discards the others) → mode of
 *     collection (home / centre) → address or centre within same postal → date
 *     and time slot
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

interface PinArea { pin: string; area: string; district: string; state: string; }

/** Serviceable postal codes — placeholder for the pincode-lookup API. */
const PIN_AREAS: PinArea[] = [
  { pin: '560103', area: 'Bellandur', district: 'Bengaluru Urban', state: 'Karnataka' },
  { pin: '560102', area: 'HSR Layout', district: 'Bengaluru Urban', state: 'Karnataka' },
  { pin: '560037', area: 'Marathahalli', district: 'Bengaluru Urban', state: 'Karnataka' },
  { pin: '560066', area: 'Whitefield', district: 'Bengaluru Urban', state: 'Karnataka' },
  { pin: '560034', area: 'Koramangala', district: 'Bengaluru Urban', state: 'Karnataka' },
  { pin: '560001', area: 'MG Road', district: 'Bengaluru Urban', state: 'Karnataka' },
];

/** "Use my current location" — placeholder geolocation. */
const CURRENT_LOCATION_PIN = '560103';

type AddressType = 'Home' | 'Work' | 'Other';
interface SavedAddress { id: string; type: AddressType; line1: string; line2: string; landmark: string; city: string; state: string; }

/** Static saved addresses — placeholder for the profile addresses API. They take
 *  the order's postal code, since collection must be within it. */
const SEED_ADDRESSES: SavedAddress[] = [
  { id: 'a1', type: 'Home', line1: '402, Prestige Palms', line2: 'Outer Ring Road', landmark: 'Near Central Mall', city: 'Bengaluru', state: 'Karnataka' },
  { id: 'a2', type: 'Work', line1: '12, Green Meadows', line2: 'Sarjapur Road', landmark: '', city: 'Bengaluru', state: 'Karnataka' },
];

interface Centre { name: string; address: string; }

/** Each provider's centres near the postal code, with their full address. */
const CENTRES: Record<string, Centre[]> = {
  p1: [
    { name: 'Metropolis Labs — Bellandur', address: 'Ground Floor, 14 Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103' },
    { name: 'Metropolis Labs — HSR Layout', address: '27th Main, Sector 2, HSR Layout, Bengaluru, Karnataka 560102' },
  ],
  p2: [
    { name: 'Dr Lal PathLabs — Bellandur', address: 'Shop 3, Green Glen Layout, Bellandur, Bengaluru, Karnataka 560103' },
    { name: 'Dr Lal PathLabs — Marathahalli', address: '1st Floor, 88 Marathahalli Bridge Road, Bengaluru, Karnataka 560037' },
  ],
  p3: [
    { name: 'SRL Diagnostics — Koramangala', address: '80 Feet Road, 4th Block, Koramangala, Bengaluru, Karnataka 560034' },
  ],
  r1: [
    { name: 'Star Imaging Centre — Bellandur', address: '2nd Floor, 33 Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103' },
  ],
  r2: [
    { name: 'Vijaya Diagnostics — HSR Layout', address: '14th Main, Sector 5, HSR Layout, Bengaluru, Karnataka 560102' },
    { name: 'Vijaya Diagnostics — Whitefield', address: 'ITPL Main Road, Whitefield, Bengaluru, Karnataka 560066' },
  ],
  r3: [
    { name: 'Aarthi Scans — Marathahalli', address: '45 Varthur Road, Marathahalli, Bengaluru, Karnataka 560037' },
  ],
};

type FulfilStep = 'pincode' | 'provider' | 'mode' | 'location' | 'slot';

const SLOT_TIMES = [
  '06:00 – 07:00 AM',
  '07:00 – 08:00 AM',
  '08:00 – 09:00 AM',
  '09:00 – 10:00 AM',
  '10:00 – 11:00 AM',
  '11:00 – 12:00 PM',
  '02:00 – 03:00 PM',
  '04:00 – 05:00 PM',
];

interface SlotDate { key: string; label: string; }

/** The next seven days from today, labelled Today / Tomorrow / weekday. */
function nextSevenDays(): SlotDate[] {
  const fmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });
  const weekday = new Intl.DateTimeFormat('en-IN', { weekday: 'short' });
  const out: SlotDate[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const prefix = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : weekday.format(d);
    out.push({ key: d.toISOString().slice(0, 10), label: `${prefix}, ${fmt.format(d)}` });
  }
  return out;
}
const COLLECTION_CHARGE = 150;
const PER_TXN_LIMIT = 500;
const COPAY_PCT = 20;

/** Member-visible fulfilment stages after payment (backend flow 3 stays admin-side). */
const LIFECYCLE = ['Order confirmed with provider', 'Sample collection / scan', 'Report uploaded to Health Records'];

type Step = 'rx' | 'queue' | 'compare' | 'breakdown' | 'pending' | 'placed' | 'progress';
type AdjResult = 'pending' | 'ready' | 'rejected';

@Component({
  selector: 'opd-diagnostics-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ClaimOption, CoverageBannerComponent, PaymentSplitView],
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

        @if (!started()) {
          <opd-coverage-banner [category]="claimCategory()" [customTitle]="title() + ' coverage'" />
          @if (claimModes.allowsCashless(claimCategory())) {
            <button type="button" class="mt-5 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white hover:bg-[#034DA2]" (click)="start()">Start new order →</button>
          }
          <opd-claim-option [category]="claimCategory()" [label]="title()" />
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

                <label for="dx-pin" class="mb-1 mt-4 block text-sm font-medium text-ink-700">Postal code <span class="text-danger-600">*</span></label>
                <div class="flex min-h-touch items-center gap-2 rounded-xl border border-surface-border bg-[#F2F4F8] px-3 focus-within:border-brand-500">
                  <span aria-hidden="true">📍</span>
                  <input id="dx-pin" class="min-w-0 flex-1 bg-transparent text-sm outline-none" inputmode="numeric" maxlength="6" placeholder="Enter postal code" [value]="pinQuery()" (input)="onPinInput($event)" />
                </div>
                <button type="button" class="mt-3 flex items-center gap-2 text-sm font-medium text-[#0F5FDC]" (click)="useCurrentLocation()"><span aria-hidden="true">◎</span> Use my current location</button>
                @if (pinQuery().length >= 2) {
                  <div class="mt-4 border-t border-surface-border pt-3">
                    <p class="mb-2 text-xs font-medium text-ink-700">Search results</p>
                    @if (pinResults().length) {
                      <div class="scrollbar-hide -mr-5 flex gap-3 overflow-x-auto pb-1 pr-5 lg:mr-0 lg:pr-0">
                        @for (p of pinResults(); track p.pin) {
                          <button type="button" class="w-[210px] shrink-0 rounded-xl border-[1.5px] px-3 py-2.5 text-left" [class.border-[#0F5FDC]]="postal() === p.pin" [class.border-surface-border]="postal() !== p.pin" (click)="selectPin(p)">
                            <span class="block text-sm font-medium text-ink-900">📍 {{ p.pin }}</span>
                            <span class="mt-0.5 block text-xs text-ink-500">{{ p.area }}, {{ p.district }}, {{ p.state }}</span>
                          </button>
                        }
                      </div>
                    } @else if (pinQuery().length === 6) {
                      <p class="rounded-xl bg-warning-50 px-3 py-2 text-sm text-warning-700">We don't serve {{ pinQuery() }} yet. Try a nearby postal code.</p>
                    } @else {
                      <p class="text-xs text-ink-500">No matching postal code.</p>
                    }
                  </div>
                }
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
                  <!-- Cart ready: one page of accordion steps, as on the Annual
                       Health Check. Each step opens the next once answered. -->
                  <p class="mb-4 rounded-xl bg-[#F0FDF4] px-3 py-2 text-sm text-success-700">🔔 Cart ready. Complete the steps below to proceed.</p>

                  <div class="space-y-3">
                    @for (key of fulfilSteps(); track key; let i = $index) {
                      <div
                        class="rounded-2xl border bg-white"
                        [class.border-[#9BDBAE]]="isDone(key) && openStep() !== key"
                        [class.border-[#EDF0F7]]="!isDone(key) || openStep() === key"
                        style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.08)"
                      >
                        <button
                          type="button"
                          class="flex w-full items-center gap-3 px-4 py-3.5 text-left disabled:cursor-not-allowed"
                          [disabled]="isLocked(key) || key === 'pincode'"
                          [attr.aria-expanded]="openStep() === key"
                          (click)="toggleStep(key)"
                        >
                          @if (isDone(key) && openStep() !== key) {
                            <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#34A853] text-xs font-bold text-white" aria-hidden="true">✓</span>
                          } @else {
                            <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" [class.bg-[#0F5FDC]]="openStep() === key" [class.bg-[#9CA3AF]]="openStep() !== key">{{ i + 1 }}</span>
                          }
                          <span class="min-w-0 flex-1 text-[15px]" [class.text-ink-900]="!isLocked(key)" [class.text-ink-500]="isLocked(key)">{{ stepTitle(key) }}</span>
                          @if (key === 'pincode') {
                            <span class="shrink-0 rounded-full bg-[#F2F4F8] px-2 py-0.5 text-[11px] text-ink-500">Locked</span>
                          } @else {
                            <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-surface-border text-ink-700" [class.rotate-180]="openStep() === key" aria-hidden="true"
                              ><svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 8l5 5 5-5" stroke-linecap="round" stroke-linejoin="round" /></svg
                            ></span>
                          }
                        </button>

                        <!-- Answer, once done and closed -->
                        @if (isDone(key) && openStep() !== key) {
                          <div class="px-4 pb-4 lg:pl-[52px]">
                            <div class="rounded-xl bg-[#F2F4F8] px-4 py-2.5 text-sm text-ink-900">
                              @switch (key) {
                                @case ('pincode') {
                                  {{ postal() }} @if (pinArea(); as a) { <span class="text-ink-500">· {{ a.area }}, {{ a.district }}</span> }
                                  <span class="mt-0.5 block text-xs text-ink-500">Fixed for this order — providers were matched to it.</span>
                                }
                                @case ('provider') {
                                  <span class="font-medium">{{ selectedCart()?.name }}</span> <span class="text-ink-500">· ₹{{ cartTotal(selectedCart()!) }}</span>
                                }
                                @case ('mode') {
                                  <span aria-hidden="true">{{ mode() === 'home' ? '🏠' : '🏥' }}</span> {{ mode() === 'home' ? 'Home Collection' : 'Visit centre' }}
                                }
                                @case ('slot') {
                                  {{ slotDate()?.label }} · {{ slotTime() }}
                                }
                                @case ('location') {
                                  @if (mode() === 'home') {
                                    @if (selectedAddress(); as addr) {
                                      <span class="font-medium">{{ addr.type }}</span>
                                      @if (addr.id === defaultAddressId()) { <span class="text-ink-500"> (Default)</span> }
                                      <span class="mt-0.5 block text-ink-700">{{ formatAddress(addr) }}</span>
                                    }
                                  } @else {
                                    @if (selectedCentre(); as c) {
                                      <span class="font-medium">{{ c.name }}</span>
                                      <span class="mt-0.5 block text-ink-700">{{ c.address }}</span>
                                    }
                                  }
                                }
                              }
                            </div>
                          </div>
                        }

                        <!-- Body, while open -->
                        @if (openStep() === key) {
                          <div class="border-t border-surface-border px-4 pb-5 pt-4 lg:pl-[52px]">
                            @switch (key) {
                              @case ('slot') {
                                <div class="rounded-xl bg-[#F2F4F8] p-3">
                                  <p class="mb-2 text-sm text-ink-900">Pick date</p>
                                  <div class="scrollbar-hide -mr-3 flex gap-2 overflow-x-auto pb-1 pr-3">
                                    @for (d of slotDates(); track d.key) {
                                      <button type="button" class="min-h-[40px] shrink-0 rounded-xl border-[1.5px] bg-white px-4 text-sm" [class.border-[#0F5FDC]]="slotDate()?.key === d.key" [class.border-transparent]="slotDate()?.key !== d.key" (click)="chooseDate(d)">{{ d.label }}</button>
                                    }
                                  </div>
                                  <p class="mb-2 mt-4 text-sm text-ink-900">Your available slots</p>
                                  @if (slotDate()) {
                                    <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                                      @for (t of slotTimes; track t; let j = $index) {
                                        <button type="button" class="min-h-[40px] rounded-xl border-[1.5px] bg-white px-2 text-sm disabled:cursor-not-allowed disabled:text-ink-400 disabled:line-through" [class.border-[#0F5FDC]]="slotTime() === t" [class.border-transparent]="slotTime() !== t" [disabled]="isSlotTaken(j)" (click)="chooseTime(t)">{{ t }}</button>
                                      }
                                    </div>
                                  } @else {
                                    <p class="text-xs text-ink-500">Pick a date to see its slots.</p>
                                  }
                                </div>
                                @if (kind() === 'PATHOLOGY') {
                                  <p class="mt-3 text-xs text-ink-500">ⓘ Please fast for 10–12 hours before your collection.</p>
                                }
                              }
                              @case ('provider') {
                                <p class="mb-3 text-xs text-ink-500">Compare providers on the same prescription and pick one. Providers at your postal code appear first, then nearby within the radius.</p>
                                <div class="space-y-3">
                                  @for (c of providerCarts(); track c.id) {
                                    <button type="button" class="w-full rounded-xl border-[1.5px] px-4 py-3 text-left" [class.border-[#0F5FDC]]="selectedCart()?.id === c.id" [class.bg-blue-50]="selectedCart()?.id === c.id" [class.border-surface-border]="selectedCart()?.id !== c.id" (click)="chooseProvider(c)">
                                      <div class="flex items-start justify-between gap-3">
                                        <div class="min-w-0">
                                          <p class="text-sm font-semibold text-ink-900">{{ c.name }}</p>
                                          <p class="text-xs text-ink-500">{{ c.accreditation }} · report {{ c.tat }} · {{ c.distanceKm }} km</p>
                                          <span class="mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium" [class.bg-blue-50]="c.withinPostal" [class.text-brand-700]="c.withinPostal" [class.bg-[#F2F4F8]]="!c.withinPostal" [class.text-ink-500]="!c.withinPostal">{{ c.withinPostal ? 'At your postal code' : 'Nearby' }}</span>
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
                              @case ('mode') {
                                <p class="mb-3 text-sm text-ink-900">Select mode of collection</p>
                                <div class="grid gap-3 rounded-xl bg-[#F2F4F8] p-2 sm:grid-cols-2">
                                  <button type="button" class="flex min-h-[52px] items-center gap-3 rounded-xl border-[1.5px] bg-white px-4 text-sm font-medium text-ink-900 disabled:cursor-not-allowed disabled:opacity-50" [class.border-[#0F5FDC]]="mode() === 'home'" [class.border-transparent]="mode() !== 'home'" [disabled]="!homeAvailable()" (click)="chooseMode('home')">
                                    <span class="text-xl" aria-hidden="true">🏠</span> Home Collection
                                  </button>
                                  <button type="button" class="flex min-h-[52px] items-center gap-3 rounded-xl border-[1.5px] bg-white px-4 text-sm font-medium text-ink-900" [class.border-[#0F5FDC]]="mode() === 'centre'" [class.border-transparent]="mode() !== 'centre'" (click)="chooseMode('centre')">
                                    <span class="text-xl" aria-hidden="true">🏥</span> Visit centre
                                  </button>
                                </div>
                                @if (!homeAvailable()) {
                                  <p class="mt-2 text-xs text-ink-500">{{ kind() === 'RADIOLOGY' ? 'Scans are done at the centre.' : 'Home collection is not serviced by ' + selectedCart()?.name + ' at this postal code.' }}</p>
                                }
                              }
                              @case ('location') {
                                @if (mode() === 'home') {
                                  @if (!addressFormOpen()) {
                                    <p class="mb-3 text-sm text-ink-900">Select address <span class="text-xs text-ink-500">(within {{ postal() }})</span></p>
                                    <div class="scrollbar-hide -mr-4 flex gap-3 overflow-x-auto pb-1 pr-4 lg:mr-0 lg:pr-0">
                                      @for (addr of addresses(); track addr.id) {
                                        <div class="flex w-[250px] shrink-0 flex-col rounded-xl border-[1.5px] bg-white p-3" [class.border-[#0F5FDC]]="addressId() === addr.id" [class.border-surface-border]="addressId() !== addr.id">
                                          <button type="button" class="flex-1 text-left" (click)="chooseAddress(addr.id)">
                                            <span class="block text-sm font-medium text-ink-900">🏠 {{ addr.type }}@if (addr.id === defaultAddressId()) {<span class="font-normal text-ink-500"> (Default)</span>}</span>
                                            <span class="mt-1 line-clamp-3 block text-xs text-ink-700">{{ formatAddress(addr) }}</span>
                                          </button>
                                          <div class="mt-2 flex justify-between text-xs font-medium">
                                            <button type="button" class="text-[#0F5FDC]" (click)="editAddress(addr)">✎ Edit</button>
                                            <button type="button" class="text-danger-700" (click)="deleteAddress(addr.id)">🗑 Delete</button>
                                          </div>
                                        </div>
                                      }
                                      @if (!addresses().length) { <p class="text-sm text-ink-500">No saved addresses yet.</p> }
                                    </div>
                                    <button type="button" class="mt-3 min-h-touch w-full rounded-full border border-surface-border bg-white px-4 text-sm font-medium text-ink-900 hover:border-[#0F5FDC]" (click)="startAddAddress()">Add Address</button>
                                  } @else {
                                    <div class="rounded-2xl border border-surface-border p-4">
                                      <p class="mb-2 text-sm font-medium text-ink-700">{{ editingAddressId() ? 'Edit address' : 'New address' }}</p>
                                      <div class="mb-4 flex gap-2">
                                        @for (t of addressTypes; track t) {
                                          <button type="button" class="min-h-touch flex-1 rounded-xl border px-3 text-sm font-medium" [class.border-brand-500]="naType() === t" [class.bg-blue-50]="naType() === t" [class.text-brand-700]="naType() === t" [class.border-surface-border]="naType() !== t" (click)="naType.set(t)">{{ t }}</button>
                                        }
                                      </div>
                                      <div class="grid gap-3 sm:grid-cols-2">
                                        <div class="sm:col-span-2">
                                          <label class="mb-1 block text-xs font-medium text-ink-700">Address line 1 <span class="text-danger-700">*</span></label>
                                          <input class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm outline-none focus:border-brand-500" placeholder="House / flat, building" [value]="naLine1()" (input)="naLine1.set($any($event.target).value)" />
                                        </div>
                                        <div class="sm:col-span-2">
                                          <label class="mb-1 block text-xs font-medium text-ink-700">Address line 2</label>
                                          <input class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm outline-none focus:border-brand-500" placeholder="Area, street, sector" [value]="naLine2()" (input)="naLine2.set($any($event.target).value)" />
                                        </div>
                                        <div class="sm:col-span-2">
                                          <label class="mb-1 block text-xs font-medium text-ink-700">Landmark</label>
                                          <input class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm outline-none focus:border-brand-500" placeholder="Nearby landmark (optional)" [value]="naLandmark()" (input)="naLandmark.set($any($event.target).value)" />
                                        </div>
                                        <div>
                                          <label class="mb-1 block text-xs font-medium text-ink-700">City <span class="text-danger-700">*</span></label>
                                          <input class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm outline-none focus:border-brand-500" [value]="naCity()" (input)="naCity.set($any($event.target).value)" />
                                        </div>
                                        <div>
                                          <label class="mb-1 block text-xs font-medium text-ink-700">State <span class="text-danger-700">*</span></label>
                                          <input class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm outline-none focus:border-brand-500" [value]="naState()" (input)="naState.set($any($event.target).value)" />
                                        </div>
                                        <div class="sm:col-span-2">
                                          <label class="mb-1 block text-xs font-medium text-ink-700">Postal code</label>
                                          <input class="min-h-touch w-full rounded-xl border border-surface-border bg-[#F2F4F8] px-3 text-sm text-ink-500" [value]="postal()" readonly />
                                        </div>
                                      </div>
                                      @if (addressError(); as err) {
                                        <p class="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">{{ err }}</p>
                                      }
                                      <div class="mt-4 flex gap-3">
                                        <button type="button" class="min-h-touch flex-1 rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900" (click)="cancelAddressForm()">Cancel</button>
                                        <button type="button" class="min-h-touch flex-1 rounded-xl bg-[#0F5FDC] px-4 text-sm font-semibold text-white" (click)="saveAddress()">Save address</button>
                                      </div>
                                    </div>
                                  }
                                } @else {
                                  <p class="mb-3 text-sm text-ink-900">Choose centre</p>
                                  <div class="scrollbar-hide -mr-4 flex gap-3 overflow-x-auto pb-1 pr-4 lg:mr-0 lg:pr-0">
                                    @for (c of centres(); track c.name) {
                                      <button type="button" class="flex w-[260px] shrink-0 flex-col rounded-xl border-[1.5px] bg-white p-3 text-left" [class.border-[#0F5FDC]]="centre() === c.name" [class.border-surface-border]="centre() !== c.name" (click)="chooseCentre(c.name)">
                                        <span class="text-sm font-medium text-ink-900">📍 {{ c.name }}</span>
                                        <span class="mt-1.5 block text-xs leading-snug text-ink-500">{{ c.address }}</span>
                                      </button>
                                    }
                                  </div>
                                }
                              }
                            }
                          </div>
                        }
                      </div>
                    }
                  </div>

                  @if (selectedCart()) {
                    <p class="mt-4 rounded-xl bg-blue-50 px-3 py-2 text-sm text-brand-700">Wallet covers ₹{{ pay().walletBlock }} · you pay ₹{{ pay().selfPay }} on {{ selectedCart()?.name }}</p>
                  }
                }
              }

              @case ('breakdown') {
                <p class="mb-2 text-sm font-medium text-ink-700">Payment breakdown — {{ selectedCart()?.name }}</p>
                <p class="mb-3 text-xs text-ink-500">📅 {{ slotDate()?.label }} · {{ slotTime() }}</p>
                <opd-payment-split [split]="pay().split" billLabel="Total bill" [billLines]="billLines()" />
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
  protected readonly claimModes = inject(ClaimModeStore);
  /** The benefit this page books, for the policy's claim mode. */
  protected readonly claimCategory = computed(() => (this.kind() === 'RADIOLOGY' ? BenefitCategory.Radiology : BenefitCategory.Pathology));
  /**
   * Wallet balance this benefit can draw on. Fixed mock for now; the live
   * pool-or-total balance is PolicyStore.availableBalanceFor(benefit).
   */
  protected readonly walletBalance = computed(() => MOCK_WALLET_BALANCE);
  protected readonly BenefitCategory = BenefitCategory;
  /** Bound from route data via withComponentInputBinding(). */
  readonly kind = input<Kind>('PATHOLOGY');

  protected readonly perTxn = PER_TXN_LIMIT;
  protected readonly copayPct = COPAY_PCT;
  protected readonly lifecycle = LIFECYCLE;

  protected readonly started = signal(false);
  protected readonly step = signal(0);
  protected readonly stepError = signal<string | null>(null);

  protected readonly rxSource = signal<'existing' | 'upload' | null>(null);
  protected readonly postal = signal('');
  protected readonly adjResult = signal<AdjResult>('pending');
  protected readonly selectedCart = signal<ProviderCart | null>(null);
  protected readonly mode = signal<'home' | 'centre' | null>(null);
  protected readonly centre = signal('');

  // Postal code search.
  protected readonly pinQuery = signal('');

  // Date and time slot.
  protected readonly slotTimes = SLOT_TIMES;
  protected readonly slotDates = signal<SlotDate[]>(nextSevenDays());
  protected readonly slotDate = signal<SlotDate | null>(null);
  protected readonly slotTime = signal('');

  // Accordion after the cart is ready.
  protected readonly openStep = signal<FulfilStep | null>('provider');

  // Address book (static placeholder — no profile-addresses API).
  protected readonly addresses = signal<SavedAddress[]>([...SEED_ADDRESSES]);
  protected readonly addressId = signal<string | null>(null);
  protected readonly addressFormOpen = signal(false);
  protected readonly editingAddressId = signal<string | null>(null);
  protected readonly addressError = signal<string | null>(null);
  protected readonly addressTypes: AddressType[] = ['Home', 'Work', 'Other'];
  protected readonly naType = signal<AddressType>('Home');
  protected readonly naLine1 = signal('');
  protected readonly naLine2 = signal('');
  protected readonly naLandmark = signal('');
  protected readonly naCity = signal('');
  protected readonly naState = signal('');
  protected readonly confirmed = signal(false);
  protected readonly stage = signal(0);

  protected readonly steps: Step[] = ['rx', 'queue', 'compare', 'breakdown', 'pending', 'placed', 'progress'];
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
  protected readonly centres = computed(() => CENTRES[this.selectedCart()?.id ?? ''] ?? []);

  protected readonly testValue = computed(() => (this.selectedCart()?.tests ?? []).reduce((s, t) => s + t.price, 0));
  protected readonly collectionCharge = computed(() => (this.mode() === 'home' ? COLLECTION_CHARGE : 0));
  protected readonly pay = computed(() => {
    const value = this.testValue() + this.collectionCharge();
    // Co-payment first, then the per-transaction limit, then the wallet balance.
    const split = splitPayment(value, percentCopay(COPAY_PCT), PER_TXN_LIMIT, this.walletBalance());
    return { value, split, copay: split.copayAmount, walletBlock: split.walletPays, excess: split.aboveLimit, selfPay: split.memberPays };
  });

  /** What makes up the bill on the payment step. */
  protected readonly billLines = computed(() => {
    const lines = [{ label: 'Test value', amount: this.testValue() }];
    if (this.collectionCharge() > 0) lines.push({ label: 'Home collection charge', amount: this.collectionCharge() });
    return lines;
  });

  protected cartTotal(c: ProviderCart): number { return c.tests.reduce((s, t) => s + t.price, 0); }

  protected primaryLabel(): string {
    switch (this.currentStep()) {
      case 'rx': return 'Submit';
      case 'compare': return this.adjResult() === 'rejected' ? 'Start over' : 'Continue';
      case 'breakdown': return `Pay ₹${this.pay().selfPay} via Razorpay`;
      case 'placed': return 'Track order';
      case 'progress': return this.stage() >= LIFECYCLE.length ? 'Done' : 'Continue';
      default: return 'Continue';
    }
  }

  protected start(): void { this.started.set(true); this.step.set(0); this.stepError.set(null); }
  protected advanceStage(): void { this.stage.set(Math.min(LIFECYCLE.length, this.stage() + 1)); }

  // ── Postal code ────────────────────────────────────────────────────────

  protected readonly pinResults = computed(() => {
    const q = this.pinQuery();
    return q.length >= 2 ? PIN_AREAS.filter((p) => p.pin.startsWith(q)) : [];
  });

  protected readonly pinArea = computed(() => PIN_AREAS.find((p) => p.pin === this.postal()) ?? null);

  protected onPinInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 6);
    input.value = digits;
    this.pinQuery.set(digits);
    // A postal code counts only once it is picked from the results.
    if (digits !== this.postal()) this.postal.set('');
  }

  protected useCurrentLocation(): void {
    const here = PIN_AREAS.find((p) => p.pin === CURRENT_LOCATION_PIN);
    if (here) this.selectPin(here);
  }

  protected selectPin(p: PinArea): void {
    this.pinQuery.set(p.pin);
    this.postal.set(p.pin);
  }

  // ── Accordion: provider → mode → address / centre ──────────────────────

  /** The postal code leads, done and locked: providers were matched to it. */
  protected readonly fulfilSteps = computed<FulfilStep[]>(() => ['pincode', 'provider', 'mode', 'location', 'slot']);

  protected isDone(key: FulfilStep): boolean {
    switch (key) {
      case 'pincode': return /^\d{6}$/.test(this.postal());
      case 'provider': return this.selectedCart() !== null;
      case 'mode': return this.mode() !== null;
      case 'location': return this.mode() === 'home' ? this.selectedAddress() !== undefined : this.selectedCentre() !== undefined;
      case 'slot': return this.slotDate() !== null && this.slotTime() !== '';
    }
  }

  protected isLocked(key: FulfilStep): boolean {
    const steps = this.fulfilSteps();
    return steps.slice(0, steps.indexOf(key)).some((k) => !this.isDone(k));
  }

  protected stepTitle(key: FulfilStep): string {
    switch (key) {
      case 'pincode': return 'Postal code';
      case 'provider': return 'Select provider';
      case 'mode': return 'Mode of collection';
      case 'location': return this.mode() === 'centre' ? 'Select centre' : 'Select address';
      case 'slot': return 'Select date and time slot';
    }
  }

  protected toggleStep(key: FulfilStep): void {
    if (key === 'pincode' || this.isLocked(key)) return;
    this.openStep.set(this.openStep() === key ? null : key);
  }

  /** After an answer, open the first step still waiting for one. */
  private advance(): void {
    this.openStep.set(this.fulfilSteps().find((k) => !this.isDone(k)) ?? null);
  }

  protected chooseProvider(c: ProviderCart): void {
    // Centres and slots belong to a provider.
    if (this.selectedCart()?.id !== c.id) { this.centre.set(''); this.clearSlot(); }
    this.selectedCart.set(c);
    // No home collection here (or scans) — the only way is a centre visit.
    if (!this.homeAvailable()) this.mode.set('centre');
    this.advance();
  }

  protected chooseMode(m: 'home' | 'centre'): void {
    if (m === 'home' && !this.homeAvailable()) return;
    this.mode.set(m);
    this.advance();
  }

  protected selectedCentre(): Centre | undefined {
    return this.centres().find((c) => c.name === this.centre());
  }

  protected chooseCentre(name: string): void {
    if (this.centre() !== name) this.clearSlot();
    this.centre.set(name);
    this.advance();
  }

  // Slot
  protected chooseDate(d: SlotDate): void {
    if (this.slotDate()?.key !== d.key) this.slotTime.set('');
    this.slotDate.set(d);
  }

  protected chooseTime(t: string): void {
    this.slotTime.set(t);
    this.advance();
  }

  /** A few slots show as taken, varying by day, so that state is visible. */
  protected isSlotTaken(index: number): boolean {
    const day = this.slotDates().findIndex((d) => d.key === this.slotDate()?.key);
    return (index + day) % 4 === 1;
  }

  private clearSlot(): void {
    this.slotDate.set(null);
    this.slotTime.set('');
  }

  // Address (home collection)
  protected readonly defaultAddressId = computed(() => this.addresses()[0]?.id ?? null);

  protected formatAddress(a: SavedAddress): string {
    return [a.line1, a.line2, a.landmark, `${a.city}, ${a.state} ${this.postal()}`].filter((x) => x && x.trim()).join(', ');
  }

  protected selectedAddress(): SavedAddress | undefined {
    return this.addresses().find((a) => a.id === this.addressId());
  }

  protected chooseAddress(id: string): void {
    this.addressId.set(id);
    this.advance();
  }

  protected startAddAddress(): void {
    this.fillAddressForm(null);
    this.addressFormOpen.set(true);
  }

  protected editAddress(addr: SavedAddress): void {
    this.fillAddressForm(addr);
    this.addressFormOpen.set(true);
  }

  protected deleteAddress(id: string): void {
    this.addresses.set(this.addresses().filter((a) => a.id !== id));
    if (this.addressId() === id) this.addressId.set(null);
  }

  protected cancelAddressForm(): void {
    this.addressFormOpen.set(false);
    this.addressError.set(null);
  }

  private fillAddressForm(addr: SavedAddress | null): void {
    this.addressError.set(null);
    this.editingAddressId.set(addr?.id ?? null);
    this.naType.set(addr?.type ?? 'Home');
    this.naLine1.set(addr?.line1 ?? '');
    this.naLine2.set(addr?.line2 ?? '');
    this.naLandmark.set(addr?.landmark ?? '');
    this.naCity.set(addr?.city ?? '');
    this.naState.set(addr?.state ?? '');
  }

  protected saveAddress(): void {
    if (!this.naLine1().trim()) return this.addressError.set('Enter address line 1.');
    if (!this.naCity().trim()) return this.addressError.set('Enter the city.');
    if (!this.naState().trim()) return this.addressError.set('Enter the state.');
    const editing = this.editingAddressId();
    const addr: SavedAddress = {
      id: editing ?? `a${Date.now()}`,
      type: this.naType(),
      line1: this.naLine1().trim(),
      line2: this.naLine2().trim(),
      landmark: this.naLandmark().trim(),
      city: this.naCity().trim(),
      state: this.naState().trim(),
    };
    this.addresses.set(editing ? this.addresses().map((a) => (a.id === editing ? addr : a)) : [...this.addresses(), addr]);
    this.addressFormOpen.set(false);
    this.chooseAddress(addr.id);
  }

  private validate(): string | null {
    switch (this.currentStep()) {
      case 'rx':
        if (!this.rxSource()) return 'Upload a prescription or use an existing one.';
        return /^\d{6}$/.test(this.postal()) ? null : 'Pick your postal code from the search results.';
      case 'queue': return this.adjResult() !== 'pending' ? null : 'Waiting on adjudication — use a button above.';
      case 'compare':
        if (this.adjResult() === 'rejected') return null;
        if (!this.selectedCart()) return 'Select a provider to continue.';
        if (!this.mode()) return 'Choose a mode of collection.';
        if (this.mode() === 'home' && !this.selectedAddress()) return 'Select or add an address.';
        if (this.mode() === 'centre' && !this.selectedCentre()) return 'Select a centre.';
        return this.slotDate() && this.slotTime() ? null : 'Pick a date and time slot.';
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
    this.rxSource.set(null); this.postal.set(''); this.pinQuery.set('');
    this.adjResult.set('pending'); this.selectedCart.set(null);
    this.mode.set(null); this.centre.set('');
    this.addresses.set([...SEED_ADDRESSES]); this.addressId.set(null);
    this.addressFormOpen.set(false); this.openStep.set('provider');
    this.clearSlot(); this.slotDates.set(nextSevenDays());
    this.confirmed.set(false); this.stage.set(0);
  }
}
