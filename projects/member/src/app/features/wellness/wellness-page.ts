import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { BenefitCategory } from '../../core/domain/codes';
import { ClaimModeStore } from '../../core/member/claim-mode.store';
import { ClaimOption } from '../../shared/ui/claim-option';

import { FamilyStore } from '../../core/family/family.store';

/**
 * Annual Health Check — DUMMY / STATIC journey, zero backend.
 *
 * Reproduces patient-flows Section 8 end to end so the whole journey can be
 * experienced without any API: the three entry options, Route A (pathology
 * first, then radiology) and Route B (full package), the grey-out rules and the
 * once-a-year limit. Each booking is one page of accordion steps — pincode →
 * mode → address or clinic → provider (home collection) → slot — followed by a
 * review. A demo reset re-opens everything so every scenario is
 * reachable. No network calls are made. See REMOVED-APIS.md.
 */

type Leg = 'pathology' | 'radiology' | 'package';
type StepKey = 'pincode' | 'mode' | 'location' | 'provider' | 'slot';
type Mode = 'home' | 'clinic';

interface PinArea {
  pin: string;
  area: string;
  district: string;
  state: string;
}

/** Serviceable pincodes — placeholder for the pincode-lookup API. */
const PIN_AREAS: PinArea[] = [
  { pin: '122001', area: 'Gurugram City', district: 'Gurugram', state: 'Haryana' },
  { pin: '122002', area: 'DLF Phase 2', district: 'Gurugram', state: 'Haryana' },
  { pin: '122003', area: 'Sector 45', district: 'Gurugram', state: 'Haryana' },
  { pin: '122018', area: 'Sohna Road', district: 'Gurugram', state: 'Haryana' },
  { pin: '110001', area: 'Connaught Place', district: 'New Delhi', state: 'Delhi' },
  { pin: '110017', area: 'Malviya Nagar', district: 'South Delhi', state: 'Delhi' },
  { pin: '201301', area: 'Noida Sector 18', district: 'Gautam Buddha Nagar', state: 'Uttar Pradesh' },
  { pin: '201014', area: 'Indirapuram', district: 'Ghaziabad', state: 'Uttar Pradesh' },
];

/** "Use my current location" — placeholder geolocation. */
const CURRENT_LOCATION_PIN = '122018';

interface HomeProvider {
  name: string;
  available: boolean;
}

/** Home-collection labs; one is shown unavailable to exercise that state. */
const HOME_PROVIDERS: HomeProvider[] = [
  { name: 'Metropolis Labs', available: true },
  { name: 'Dr Lal PathLabs', available: true },
  { name: 'Thyrocare', available: true },
  { name: 'SRL Diagnostics', available: false },
];

interface Centre {
  id: string;
  name: string;
  provider: string;
  address: string;
  /** Which legs the centre can take. */
  legs: Leg[];
}

/** Collection and scan centres, with their full address — placeholder data. */
const CENTRES: Centre[] = [
  { id: 'c1', name: 'Metropolis Sector 44', provider: 'Metropolis Labs', address: 'Plot 12, Sector 44, Near HUDA City Centre Metro, Gurugram, Haryana 122003', legs: ['pathology'] },
  { id: 'c2', name: 'Dr Lal PathLabs Cyber City', provider: 'Dr Lal PathLabs', address: 'Shop G-14, Ground Floor, Building 8, DLF Cyber City, Phase 2, Gurugram, Haryana 122002', legs: ['pathology'] },
  { id: 'c3', name: 'Thyrocare Sohna Road', provider: 'Thyrocare', address: 'SCO 27, First Floor, Sohna Road, Sector 48, Gurugram, Haryana 122018', legs: ['pathology'] },
  { id: 'c4', name: 'Medanta Diagnostics', provider: 'Medanta Diagnostics', address: 'Medanta – The Medicity, CH Baktawar Singh Road, Sector 38, Gurugram, Haryana 122001', legs: ['radiology', 'package'] },
  { id: 'c5', name: 'Fortis Radiology Sector 44', provider: 'Fortis Radiology', address: 'Fortis Memorial Research Institute, Sector 44, Opposite HUDA City Centre, Gurugram, Haryana 122002', legs: ['radiology', 'package'] },
  { id: 'c6', name: 'Max Imaging Sohna Road', provider: 'Max Imaging', address: 'Unit 3, Vatika Business Park, Sohna Road, Sector 49, Gurugram, Haryana 122018', legs: ['radiology', 'package'] },
];

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

interface SlotDate {
  key: string;
  label: string;
}

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

type AddressType = 'Home' | 'Work' | 'Other';

interface SavedAddress {
  id: string;
  type: AddressType;
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
}

/** Static, in-memory saved addresses — placeholder for the profile addresses API. */
const SEED_ADDRESSES: SavedAddress[] = [
  { id: 'a1', type: 'Home', line1: 'B-402, Green Avenue', line2: 'Sector 45', landmark: 'Near City Park', city: 'Gurugram', state: 'Haryana', pincode: '122003' },
  { id: 'a2', type: 'Work', line1: 'DLF Cyber City, Tower B', line2: 'Phase 2', landmark: '', city: 'Gurugram', state: 'Haryana', pincode: '122002' },
];

function formatAddress(a: SavedAddress): string {
  return [a.line1, a.line2, a.landmark, `${a.city}, ${a.state} ${a.pincode}`]
    .filter((p) => p && p.trim())
    .join(', ');
}

interface OrderStep {
  label: string;
  note: string;
}

/** Post-booking lifecycle (spec steps 13–15), per leg. */
const CONFIRMED_STEP: OrderStep = {
  label: 'Order confirmed with the provider',
  note: 'Integrated partners confirm in real time; others are confirmed by operations.',
};
const REPORT_STEP: OrderStep = {
  label: 'Report delivered to Health Records',
  note: 'Pushed by integrated partners, uploaded by operations for the rest.',
};
const ORDER_STEPS: Record<Leg, OrderStep[]> = {
  pathology: [
    CONFIRMED_STEP,
    { label: 'Sample collected', note: 'Home collection or a visit to the centre by the partner field team.' },
    REPORT_STEP,
  ],
  radiology: [
    CONFIRMED_STEP,
    { label: 'Scan completed', note: 'Performed at the selected centre.' },
    REPORT_STEP,
  ],
  package: [
    CONFIRMED_STEP,
    { label: 'Collection & scan completed', note: 'Both legs done — pathology collection and the radiology scan.' },
    { label: 'Reports delivered to Health Records', note: 'Both reports are stored together.' },
  ],
};

@Component({
  selector: 'opd-wellness-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ClaimOption],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[1040px] items-center gap-4 px-5 py-5 lg:px-8">
          <button
            type="button"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back"
            (click)="headerBack()"
          >
            &larr;
          </button>
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">Annual Health Check</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">
              Once a year — pathology and radiology
            </p>
          </div>
        </div>
      </header>

      <div class="mx-auto px-5 pb-32 pt-6 lg:px-8 lg:pb-10" [class.max-w-[820px]]="!activeLeg()" [class.max-w-[1040px]]="!!activeLeg()">
        <!-- Demo-only note -->
        <p class="mb-4 rounded-xl border border-dashed border-warning-400 bg-warning-50 px-3 py-2 text-xs text-warning-700">
          🧪 Static demo journey — no data is saved. Use “Start over” to try every route again.
        </p>

        @if (confirmation(); as msg) {
          <div class="mb-5 rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] p-4">
            <p class="text-sm font-semibold text-success-700">{{ msg }}</p>
          </div>
        }

        <!-- ── Landing: three options ─────────────────────────────────────── -->
        @if (!activeLeg()) {
          @if (fullyUsed()) {
            <div class="mb-5 rounded-2xl border border-[#CDDDFE] bg-[#F3F7FF] p-5">
              <p class="text-base font-semibold text-[#034DA2]">Annual Health Check used for this year</p>
              <p class="mt-1 text-sm text-ink-700">
                This benefit can be taken only once a year. Both pathology and radiology are booked.
              </p>
            </div>
          } @else if (claimModes.allowsCashless(BenefitCategory.HealthPackages)) {
            <h2 class="mb-1 text-lg font-bold text-[#034DA2]">Choose how to book</h2>
            <p class="mb-3 text-sm text-ink-700">
              Book pathology and radiology individually, or the entire package in one go. Choosing a
              route closes the other.
            </p>
            @if (!pathologyBooked() && !radiologyBooked() && !packageBooked()) {
              <p class="mb-4 rounded-xl border border-[#CDDDFE] bg-[#F3F7FF] px-3 py-2 text-xs text-[#034DA2]">
                ⓘ On the individual route, <strong>pathology must be booked first</strong> — radiology
                opens only after the pathology booking is done.
              </p>
            }
          }

          @if (claimModes.allowsCashless(BenefitCategory.HealthPackages)) {
          <div class="space-y-3">
            <!-- Book Pathology -->
            <button
              type="button"
              class="flex w-full items-center justify-between gap-3 rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white p-4 text-left disabled:opacity-50"
              style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.10)"
              [disabled]="!canBook('pathology')"
              (click)="startLeg('pathology')"
            >
              <span>
                <span class="block font-semibold text-[#034DA2]">Book Pathology</span>
                <span class="mt-0.5 block text-xs text-ink-500">Home collection or centre visit</span>
              </span>
              <span class="shrink-0 text-xs font-semibold" [class.text-success-700]="pathologyBooked()" [class.text-ink-400]="!pathologyBooked()">
                {{ pathologyBooked() ? '✓ Booked' : 'Book →' }}
              </span>
            </button>

            <!-- Book Radiology (only after pathology, on the individual route) -->
            <button
              type="button"
              class="flex w-full items-center justify-between gap-3 rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white p-4 text-left disabled:opacity-50"
              style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.10)"
              [disabled]="!canBook('radiology')"
              (click)="startLeg('radiology')"
            >
              <span>
                <span class="block font-semibold text-[#034DA2]">Book Radiology</span>
                <span class="mt-0.5 block text-xs text-ink-500">
                  {{ pathologyBooked() || radiologyBooked() ? 'Centre visit' : 'Book pathology first' }}
                </span>
              </span>
              <span class="shrink-0 text-xs font-semibold" [class.text-success-700]="radiologyBooked()" [class.text-ink-400]="!radiologyBooked()">
                {{ radiologyBooked() ? '✓ Booked' : 'Book →' }}
              </span>
            </button>

            <!-- Book the entire package -->
            <button
              type="button"
              class="flex w-full items-center justify-between gap-3 rounded-2xl border-[1.5px] border-[#CDDDFE] bg-[#F3F7FF] p-4 text-left disabled:opacity-50"
              style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.10)"
              [disabled]="!canBook('package')"
              (click)="startLeg('package')"
            >
              <span>
                <span class="block font-semibold text-[#034DA2]">Book the entire package</span>
                <span class="mt-0.5 block text-xs text-ink-500">Pathology + radiology together, one booking</span>
              </span>
              <span class="shrink-0 text-xs font-semibold" [class.text-success-700]="packageBooked()" [class.text-ink-400]="!packageBooked()">
                {{ packageBooked() ? '✓ Booked' : 'Book →' }}
              </span>
            </button>
          </div>
          }
          <div class="mt-4">
            <opd-claim-option [category]="BenefitCategory.HealthPackages" [label]="'the annual health check'" />
          </div>


          <!-- Post-booking lifecycle (spec steps 13–15): order confirmed with the
               provider → sample collection / scan → report delivered to Health
               Records. Demo-advances through the states, static. -->
          @for (order of bookedOrders(); track order.key) {
            <section class="mt-4 rounded-2xl border border-[#EDF0F7] bg-white p-4 shadow-sm">
              <p class="mb-3 text-sm font-semibold text-[#034DA2]">{{ order.title }} — order status</p>
              <ol class="space-y-3">
                @for (s of order.steps; track s.label; let i = $index) {
                  <li class="flex gap-3">
                    <span
                      class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                      [class.bg-success-600]="i < order.stage"
                      [class.text-white]="i <= order.stage"
                      [class.bg-[#0F5FDC]]="i === order.stage"
                      [class.bg-surface-border]="i > order.stage"
                      [class.text-ink-400]="i > order.stage"
                    >{{ i < order.stage ? '✓' : (i + 1) }}</span>
                    <span class="min-w-0">
                      <span class="block text-sm" [class.font-semibold]="i === order.stage" [class.text-ink-900]="i <= order.stage" [class.text-ink-400]="i > order.stage">{{ s.label }}</span>
                      @if (i === order.stage) {
                        <span class="mt-0.5 block text-xs text-ink-500">{{ s.note }}</span>
                      }
                    </span>
                  </li>
                }
              </ol>
              @if (order.stage < order.steps.length - 1) {
                <button
                  type="button"
                  class="mt-3 min-h-touch w-full rounded-xl border border-dashed border-surface-border px-4 text-sm font-semibold text-ink-700 hover:bg-[#F2F4F8]"
                  (click)="advanceStage(order.key)"
                >
                  Advance status (demo)
                </button>
              } @else {
                <p class="mt-3 rounded-xl bg-[#F0FDF4] px-3 py-2 text-sm font-medium text-success-700">
                  ✓ Report available in your Health Records.
                </p>
              }
            </section>
          }

          @if (pathologyBooked() && !radiologyBooked() && !packageBooked()) {
            <p class="mt-4 rounded-xl bg-warning-50 px-3 py-2 text-sm text-warning-700">
              Pathology is booked and billed. Complete the radiology leg — the benefit is billed
              either way, so an unbooked radiology leg is paid for and not used.
            </p>
          }

          @if (pathologyBooked() || radiologyBooked() || packageBooked()) {
            <button
              type="button"
              class="mt-6 text-sm font-medium text-brand-700 underline"
              (click)="reset()"
            >
              Start over (demo reset)
            </button>
          }
        }

        <!-- ── Booking for the active leg: one page of accordion steps ──────
             Each step opens the next as soon as it is answered, and shows its
             answer once done; a done step can be reopened to change it. -->
        @else if (view() === 'steps') {
          <div class="mb-5">
            <h2 class="text-lg font-bold text-[#034DA2] lg:text-xl">{{ legLabel() }}</h2>
            <p class="text-sm text-ink-500">Complete the steps below to proceed</p>
            <div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#E4EBFE]" aria-hidden="true">
              <div class="h-full rounded-full bg-[#0F5FDC] transition-all duration-300" [style.width.%]="progress()"></div>
            </div>
          </div>

          <div class="space-y-3">
            @for (key of visibleSteps(); track key; let i = $index) {
              <section
                class="rounded-2xl border bg-white"
                [class.border-[#9BDBAE]]="isDone(key) && openStep() !== key"
                [class.border-[#EDF0F7]]="!isDone(key) || openStep() === key"
                style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.08)"
              >
                <!-- Header -->
                <button
                  type="button"
                  class="flex w-full items-center gap-3 px-4 py-3.5 text-left disabled:cursor-not-allowed lg:px-6 lg:py-4"
                  [disabled]="isLocked(key)"
                  [attr.aria-expanded]="openStep() === key"
                  (click)="toggleStep(key)"
                >
                  @if (isDone(key) && openStep() !== key) {
                    <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#34A853] text-xs font-bold text-white" aria-hidden="true">✓</span>
                  } @else {
                    <span
                      class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                      [class.bg-[#0F5FDC]]="openStep() === key"
                      [class.bg-[#9CA3AF]]="openStep() !== key"
                      >{{ i + 1 }}</span
                    >
                  }
                  <span
                    class="min-w-0 flex-1 text-[15px] lg:text-base"
                    [class.text-ink-900]="!isLocked(key)"
                    [class.text-ink-500]="isLocked(key)"
                    >{{ stepTitle(key) }}</span
                  >
                  <span
                    class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-surface-border text-ink-700"
                    [class.rotate-180]="openStep() === key"
                    aria-hidden="true"
                    ><svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 8l5 5 5-5" stroke-linecap="round" stroke-linejoin="round" /></svg
                  ></span>
                </button>

                <!-- Answer, once done and closed -->
                @if (isDone(key) && openStep() !== key) {
                  <div class="px-4 pb-4 lg:pl-[60px] lg:pr-6">
                    <div class="rounded-xl bg-[#F2F4F8] px-4 py-2.5 text-sm text-ink-900">
                      @switch (key) {
                        @case ('pincode') {
                          {{ selectedPin()?.pin }} <span class="text-ink-500">· {{ selectedPin()?.area }}, {{ selectedPin()?.district }}</span>
                        }
                        @case ('mode') {
                          <span aria-hidden="true">{{ mode() === 'home' ? '🏠' : '🏥' }}</span> {{ mode() === 'home' ? 'Home Collection' : 'In Clinic' }}
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
                              <span class="ml-1 rounded-full bg-[#034DA2] px-2 py-0.5 text-[11px] font-medium text-white">{{ c.provider }}</span>
                              <span class="mt-0.5 block text-ink-700">{{ c.address }}</span>
                            }
                          }
                        }
                        @case ('provider') {
                          {{ provider() }}
                        }
                        @case ('slot') {
                          {{ slotDate()?.label }} · {{ slotTime() }}
                        }
                      }
                    </div>
                  </div>
                }

                <!-- Body, while open -->
                @if (openStep() === key) {
                  <div class="border-t border-surface-border px-4 pb-5 pt-4 lg:pl-[60px] lg:pr-6">
                    @switch (key) {
                      @case ('pincode') {
                        <!-- 1 · Pincode -->
                        <label for="ahc-pin" class="sr-only">Pincode</label>
                        <div class="flex min-h-touch items-center gap-2 rounded-xl border border-surface-border bg-[#F2F4F8] px-3 focus-within:border-brand-500">
                          <span aria-hidden="true">📍</span>
                          <input
                            id="ahc-pin"
                            class="min-w-0 flex-1 bg-transparent text-sm outline-none"
                            inputmode="numeric"
                            maxlength="6"
                            placeholder="Enter pincode"
                            [value]="pinQuery()"
                            (input)="onPinInput($event)"
                          />
                        </div>
                        <button type="button" class="mt-3 flex items-center gap-2 text-sm font-medium text-[#0F5FDC]" (click)="useCurrentLocation()">
                          <span aria-hidden="true">◎</span> Use my current location
                        </button>

                        @if (pinQuery().length >= 2) {
                          <div class="mt-4 border-t border-surface-border pt-3">
                            <p class="mb-2 text-xs font-medium text-ink-700">Search results</p>
                            @if (pinResults().length) {
                              <div class="scrollbar-hide -mr-4 flex gap-3 overflow-x-auto pb-1 pr-4 lg:mr-0 lg:pr-0">
                                @for (p of pinResults(); track p.pin + p.area) {
                                  <button
                                    type="button"
                                    class="w-[210px] shrink-0 rounded-xl border px-3 py-2.5 text-left"
                                    [class.border-[#0F5FDC]]="selectedPin()?.pin === p.pin && selectedPin()?.area === p.area"
                                    [class.border-surface-border]="!(selectedPin()?.pin === p.pin && selectedPin()?.area === p.area)"
                                    (click)="selectPin(p)"
                                  >
                                    <span class="block text-sm font-medium text-ink-900">📍 {{ p.pin }}</span>
                                    <span class="mt-0.5 block text-xs text-ink-500">{{ p.area }}, {{ p.district }}, {{ p.state }}</span>
                                  </button>
                                }
                              </div>
                            } @else if (pinQuery().length === 6) {
                              <p class="rounded-xl bg-warning-50 px-3 py-2 text-sm text-warning-700">We don't serve {{ pinQuery() }} yet. Try a nearby pincode.</p>
                            } @else {
                              <p class="text-xs text-ink-500">No matching pincode.</p>
                            }
                          </div>
                        }
                      }

                      @case ('mode') {
                        <!-- 2 · Mode of collection -->
                        <p class="mb-3 text-sm text-ink-900">Select mode of collection</p>
                        <div class="grid gap-3 rounded-xl bg-[#F2F4F8] p-2 sm:grid-cols-2">
                          <button
                            type="button"
                            class="flex min-h-[52px] items-center gap-3 rounded-xl border-[1.5px] bg-white px-4 text-sm font-medium text-ink-900 disabled:cursor-not-allowed disabled:opacity-50"
                            [class.border-[#0F5FDC]]="mode() === 'home'"
                            [class.border-transparent]="mode() !== 'home'"
                            [disabled]="!homeAllowed()"
                            (click)="chooseMode('home')"
                          >
                            <span class="text-xl" aria-hidden="true">🏠</span> Home Collection
                          </button>
                          <button
                            type="button"
                            class="flex min-h-[52px] items-center gap-3 rounded-xl border-[1.5px] bg-white px-4 text-sm font-medium text-ink-900"
                            [class.border-[#0F5FDC]]="mode() === 'clinic'"
                            [class.border-transparent]="mode() !== 'clinic'"
                            (click)="chooseMode('clinic')"
                          >
                            <span class="text-xl" aria-hidden="true">🏥</span> In Clinic
                          </button>
                        </div>
                        @if (!homeAllowed()) {
                          <p class="mt-2 text-xs text-ink-500">Scans are done at the centre, so this booking is in clinic only.</p>
                        }
                      }

                      @case ('location') {
                        <!-- 3 · Address (home) or clinic -->
                        @if (mode() === 'home') {
                          @if (!addressFormOpen()) {
                            <p class="mb-3 text-sm text-ink-900">Select address</p>
                            <div class="scrollbar-hide -mr-4 flex gap-3 overflow-x-auto pb-1 pr-4 lg:mr-0 lg:pr-0">
                              @for (addr of savedAddresses(); track addr.id) {
                                <div
                                  class="flex w-[250px] shrink-0 flex-col rounded-xl border-[1.5px] bg-white p-3"
                                  [class.border-[#0F5FDC]]="selectedAddressId() === addr.id"
                                  [class.border-surface-border]="selectedAddressId() !== addr.id"
                                >
                                  <button type="button" class="flex-1 text-left" (click)="chooseAddress(addr.id)">
                                    <span class="block text-sm font-medium text-ink-900">
                                      🏠 {{ addr.type }}@if (addr.id === defaultAddressId()) {<span class="font-normal text-ink-500"> (Default)</span>}
                                    </span>
                                    <span class="mt-1 line-clamp-3 block text-xs text-ink-700">{{ formatAddress(addr) }}</span>
                                  </button>
                                  <div class="mt-2 flex justify-between text-xs font-medium">
                                    <button type="button" class="text-[#0F5FDC]" (click)="editAddress(addr)">✎ Edit</button>
                                    <button type="button" class="text-danger-700" (click)="deleteAddress(addr.id)">🗑 Delete</button>
                                  </div>
                                </div>
                              }
                              @if (!savedAddresses().length) {
                                <p class="text-sm text-ink-500">No saved addresses yet.</p>
                              }
                            </div>
                            <button
                              type="button"
                              class="mt-3 min-h-touch w-full rounded-full border border-surface-border bg-white px-4 text-sm font-medium text-ink-900 hover:border-[#0F5FDC]"
                              (click)="startAddAddress()"
                            >
                              Add Address
                            </button>
                          } @else {
                            <div class="rounded-2xl border border-surface-border p-4">
                              <p class="mb-2 text-sm font-medium text-ink-700">{{ editingAddressId() ? 'Edit address' : 'New address' }}</p>
                              <div class="mb-4 flex gap-2">
                                @for (t of addressTypes; track t) {
                                  <button
                                    type="button"
                                    class="min-h-touch flex-1 rounded-xl border px-3 text-sm font-medium"
                                    [class.border-brand-500]="naType() === t"
                                    [class.bg-blue-50]="naType() === t"
                                    [class.text-brand-700]="naType() === t"
                                    [class.border-surface-border]="naType() !== t"
                                    (click)="naType.set(t)"
                                  >{{ t }}</button>
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
                                <div>
                                  <label class="mb-1 block text-xs font-medium text-ink-700">Pincode <span class="text-danger-700">*</span></label>
                                  <input class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm outline-none focus:border-brand-500" inputmode="numeric" maxlength="6" [value]="naPincode()" (input)="naPincode.set($any($event.target).value)" />
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
                          <!-- In clinic: filter by provider, then pick a centre. -->
                          <p class="mb-2 text-sm text-ink-900">Select provider</p>
                          <div class="scrollbar-hide -mr-4 flex gap-2 overflow-x-auto rounded-xl bg-[#F2F4F8] p-2 pr-4 lg:mr-0">
                            <button
                              type="button"
                              class="flex shrink-0 items-center rounded-xl border-[1.5px] bg-white px-4 py-2 text-sm font-medium"
                              [class.border-[#0F5FDC]]="clinicFilter() === ''"
                              [class.border-transparent]="clinicFilter() !== ''"
                              (click)="clinicFilter.set('')"
                            >All providers</button>
                            @for (p of clinicProviders(); track p.name) {
                              <button
                                type="button"
                                class="flex shrink-0 items-center gap-2.5 rounded-xl border-[1.5px] bg-white px-3 py-2 text-left"
                                [class.border-[#0F5FDC]]="clinicFilter() === p.name"
                                [class.border-transparent]="clinicFilter() !== p.name"
                                (click)="clinicFilter.set(p.name)"
                              >
                                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEF3FF] text-[11px] font-bold text-[#034DA2]" aria-hidden="true">{{ initials(p.name) }}</span>
                                <span>
                                  <span class="block whitespace-nowrap text-sm font-medium text-ink-900">{{ p.name }}</span>
                                </span>
                              </button>
                            }
                          </div>

                          <p class="mb-2 mt-4 border-b border-surface-border pb-2 text-sm text-ink-900">Choose centre</p>
                          @if (filteredCentres().length) {
                            <div class="scrollbar-hide -mr-4 flex gap-3 overflow-x-auto pb-1 pr-4 lg:mr-0 lg:pr-0">
                              @for (c of filteredCentres(); track c.id) {
                                <button
                                  type="button"
                                  class="flex w-[280px] shrink-0 flex-col rounded-xl border-[1.5px] bg-white p-3 text-left"
                                  [class.border-[#0F5FDC]]="centreId() === c.id"
                                  [class.border-surface-border]="centreId() !== c.id"
                                  (click)="chooseCentre(c.id)"
                                >
                                  <span class="flex items-start justify-between gap-2">
                                    <span class="text-sm font-medium text-ink-900">📍 {{ c.name }}</span>
                                    <span class="shrink-0 rounded-full bg-[#034DA2] px-2 py-0.5 text-[11px] font-medium text-white">{{ c.provider }}</span>
                                  </span>
                                  <span class="mt-1.5 block text-xs leading-snug text-ink-500">{{ c.address }}</span>
                                </button>
                              }
                            </div>
                          } @else {
                            <p class="text-sm text-ink-500">No centre for this provider near {{ selectedPin()?.pin }}.</p>
                          }
                        }
                      }

                      @case ('provider') {
                        <!-- 4 · Provider (home collection only) -->
                        <div class="scrollbar-hide -mr-4 flex gap-3 overflow-x-auto rounded-xl bg-[#F2F4F8] p-3 pr-4 lg:mr-0">
                          @for (p of homeProviders(); track p.name) {
                            <button
                              type="button"
                              class="relative w-[150px] shrink-0 rounded-xl border-[1.5px] bg-white p-3 pt-4 text-left disabled:cursor-not-allowed disabled:opacity-60"
                              [class.border-[#0F5FDC]]="provider() === p.name"
                              [class.border-transparent]="provider() !== p.name"
                              [disabled]="!p.available"
                              (click)="chooseProvider(p.name)"
                            >
                              <span
                                class="absolute right-2 top-2 rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
                                [class.bg-[#34A853]]="p.available"
                                [class.bg-danger-700]="!p.available"
                                >{{ p.available ? 'Available' : 'Not Available' }}</span
                              >
                              <span class="flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF3FF] text-[11px] font-bold text-[#034DA2]" aria-hidden="true">{{ initials(p.name) }}</span>
                              <span class="mt-2 block text-sm font-medium text-ink-900">{{ p.name }}</span>
                            </button>
                          }
                        </div>
                      }

                      @case ('slot') {
                        <!-- 5 · Date and time -->
                        <div class="rounded-xl bg-[#F2F4F8] p-3 lg:p-4">
                          <p class="mb-2 text-sm text-ink-900">Pick date</p>
                          <div class="scrollbar-hide -mr-3 flex gap-2 overflow-x-auto pb-1 pr-3">
                            @for (d of slotDates(); track d.key) {
                              <button
                                type="button"
                                class="min-h-[40px] shrink-0 rounded-xl border-[1.5px] bg-white px-4 text-sm"
                                [class.border-[#0F5FDC]]="slotDate()?.key === d.key"
                                [class.border-transparent]="slotDate()?.key !== d.key"
                                (click)="chooseDate(d)"
                              >{{ d.label }}</button>
                            }
                          </div>
                          <p class="mb-2 mt-4 text-sm text-ink-900">Your available slots</p>
                          @if (slotDate()) {
                            <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                              @for (t of slotTimes; track t; let j = $index) {
                                <button
                                  type="button"
                                  class="min-h-[40px] rounded-xl border-[1.5px] bg-white px-2 text-sm disabled:cursor-not-allowed disabled:text-ink-400 disabled:line-through"
                                  [class.border-[#0F5FDC]]="slotTime() === t"
                                  [class.border-transparent]="slotTime() !== t"
                                  [disabled]="isSlotTaken(j)"
                                  (click)="chooseTime(t)"
                                >{{ t }}</button>
                              }
                            </div>
                          } @else {
                            <p class="text-xs text-ink-500">Pick a date to see its slots.</p>
                          }
                        </div>
                        @if (activeLeg() !== 'radiology') {
                          <p class="mt-3 text-xs text-ink-500">ⓘ Please fast for 10–12 hours before your collection.</p>
                        }
                      }
                    }
                  </div>
                }
              </section>
            }
          </div>

          <div class="mt-5 flex gap-3">
            <button
              type="button"
              class="flex min-h-touch items-center rounded-xl border border-surface-border bg-white px-6 text-sm font-semibold text-ink-900 hover:border-[#A4BFFE7A]"
              (click)="closeLeg()"
            >
              Back
            </button>
            <button
              type="button"
              class="min-h-touch flex-1 rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white hover:bg-[#034DA2] disabled:opacity-50"
              [disabled]="!allDone()"
              (click)="view.set('review')"
            >
              Review booking
            </button>
          </div>
        }

        <!-- ── Review ─────────────────────────────────────────────────────── -->
        @else {
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-bold text-[#034DA2]">{{ legLabel() }}</h2>
          </div>

          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
            <div class="mb-3 flex items-center justify-between">
              <p class="text-sm font-medium text-ink-700">Review your booking</p>
              <button type="button" class="text-sm font-medium text-[#0F5FDC]" (click)="editSchedule()">Change slot</button>
            </div>
            <dl class="space-y-2 text-sm">
              @for (row of reviewRows(); track row.label) {
                <div class="flex justify-between gap-3 border-b border-surface-border pb-2">
                  <dt class="text-ink-500">{{ row.label }}</dt>
                  <dd class="text-right font-medium text-ink-900">{{ row.value }}</dd>
                </div>
              }
            </dl>
            <p class="mt-3 rounded-xl bg-[#F3F7FF] px-3 py-2 text-xs text-ink-600">
              Annual Health Check is a once-a-year benefit — checked against the yearly frequency
              limit, not a money limit. Billing is done on confirmation.
            </p>
          </section>

          <div class="mt-5 flex gap-3">
            <button
              type="button"
              class="flex min-h-touch items-center rounded-xl border border-surface-border bg-white px-6 text-sm font-semibold text-ink-900 hover:border-[#A4BFFE7A]"
              (click)="view.set('steps')"
            >
              Back
            </button>
            <button
              type="button"
              class="min-h-touch flex-1 rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white hover:bg-[#034DA2]"
              (click)="confirm()"
            >
              Proceed to booking
            </button>
          </div>
        }
      </div>
    </div>
  `,
})
export class WellnessPage {
  protected readonly claimModes = inject(ClaimModeStore);
  protected readonly BenefitCategory = BenefitCategory;
  private readonly family = inject(FamilyStore);

  protected readonly packageBooked = signal(false);
  protected readonly pathologyBooked = signal(false);
  protected readonly radiologyBooked = signal(false);
  protected readonly confirmation = signal<string | null>(null);

  // Post-booking order stage per leg (0 confirmed, 1 collection/scan, 2 report).
  protected readonly pathologyStage = signal(0);
  protected readonly radiologyStage = signal(0);
  protected readonly packageStage = signal(0);

  protected readonly activeLeg = signal<Leg | null>(null);
  /** The accordion of steps, or the review that follows it. */
  protected readonly view = signal<'steps' | 'review'>('steps');
  protected readonly openStep = signal<StepKey | null>('pincode');

  // Step answers.
  protected readonly pinQuery = signal('');
  protected readonly selectedPin = signal<PinArea | null>(null);
  protected readonly mode = signal<Mode | null>(null);
  protected readonly selectedAddressId = signal<string | null>(null);
  protected readonly clinicFilter = signal('');
  protected readonly centreId = signal<string | null>(null);
  protected readonly provider = signal('');
  protected readonly slotDate = signal<SlotDate | null>(null);
  protected readonly slotTime = signal('');

  // Address book (static placeholder — no profile-addresses API).
  protected readonly savedAddresses = signal<SavedAddress[]>([...SEED_ADDRESSES]);
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
  protected readonly naPincode = signal('');
  protected readonly formatAddress = formatAddress;

  protected readonly slotTimes = SLOT_TIMES;
  protected readonly slotDates = signal<SlotDate[]>(nextSevenDays());

  protected readonly memberName = computed(
    () => this.family.activeMember()?.fullName?.split(' ')[0] ?? 'You',
  );

  protected readonly fullyUsed = computed(
    () => this.packageBooked() || (this.pathologyBooked() && this.radiologyBooked()),
  );

  /** Booked legs with their post-booking lifecycle state. */
  protected readonly bookedOrders = computed(() => {
    const out: { key: Leg; title: string; stage: number; steps: OrderStep[] }[] = [];
    if (this.pathologyBooked()) out.push({ key: 'pathology', title: 'Pathology', stage: this.pathologyStage(), steps: ORDER_STEPS.pathology });
    if (this.radiologyBooked()) out.push({ key: 'radiology', title: 'Radiology', stage: this.radiologyStage(), steps: ORDER_STEPS.radiology });
    if (this.packageBooked()) out.push({ key: 'package', title: 'Health Check Package', stage: this.packageStage(), steps: ORDER_STEPS.package });
    return out;
  });

  protected advanceStage(key: Leg): void {
    const sig = key === 'pathology' ? this.pathologyStage : key === 'radiology' ? this.radiologyStage : this.packageStage;
    const max = ORDER_STEPS[key].length - 1;
    sig.set(Math.min(max, sig() + 1));
  }

  // ── Steps ──────────────────────────────────────────────────────────────

  /** Scans are done at a centre, so only pathology can be collected at home. */
  protected readonly homeAllowed = computed(() => this.activeLeg() === 'pathology');

  /** In clinic, the centre names its provider, so there is no provider step. */
  protected readonly visibleSteps = computed<StepKey[]>(() =>
    this.mode() === 'home'
      ? ['pincode', 'mode', 'location', 'provider', 'slot']
      : ['pincode', 'mode', 'location', 'slot'],
  );

  protected isDone(key: StepKey): boolean {
    switch (key) {
      case 'pincode': return this.selectedPin() !== null;
      case 'mode': return this.mode() !== null;
      case 'location': return this.mode() === 'home' ? this.selectedAddress() !== undefined : this.selectedCentre() !== undefined;
      case 'provider': return this.provider() !== '';
      case 'slot': return this.slotDate() !== null && this.slotTime() !== '';
    }
  }

  /** A step opens only once every step before it is answered. */
  protected isLocked(key: StepKey): boolean {
    const steps = this.visibleSteps();
    return steps.slice(0, steps.indexOf(key)).some((k) => !this.isDone(k));
  }

  protected readonly allDone = computed(() => this.visibleSteps().every((k) => this.isDone(k)));

  protected readonly progress = computed(() => {
    const steps = this.visibleSteps();
    return Math.max(4, (steps.filter((k) => this.isDone(k)).length / steps.length) * 100);
  });

  protected stepTitle(key: StepKey): string {
    switch (key) {
      case 'pincode': return 'Service consumption pincode';
      case 'mode': return 'Mode of collection';
      case 'location': return this.mode() === 'clinic' ? 'Select clinic' : 'Select address';
      case 'provider': return 'Select provider';
      case 'slot': return 'Select date and time slot';
    }
  }

  protected toggleStep(key: StepKey): void {
    if (this.isLocked(key)) return;
    this.openStep.set(this.openStep() === key ? null : key);
  }

  /** After an answer, open the first step still waiting for one. */
  private advance(): void {
    this.openStep.set(this.visibleSteps().find((k) => !this.isDone(k)) ?? null);
  }

  // Pincode
  protected readonly pinResults = computed(() => {
    const q = this.pinQuery();
    return q.length >= 2 ? PIN_AREAS.filter((p) => p.pin.startsWith(q)) : [];
  });

  protected onPinInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 6);
    input.value = digits;
    this.pinQuery.set(digits);
  }

  protected useCurrentLocation(): void {
    const here = PIN_AREAS.find((p) => p.pin === CURRENT_LOCATION_PIN);
    if (here) this.selectPin(here);
  }

  protected selectPin(p: PinArea): void {
    const changed = this.selectedPin()?.pin !== p.pin;
    this.pinQuery.set(p.pin);
    this.selectedPin.set(p);
    // Who can serve you, and when, depends on where.
    if (changed) {
      this.centreId.set(null);
      this.provider.set('');
      this.clearSlot();
    }
    this.advance();
  }

  // Mode
  protected chooseMode(m: Mode): void {
    if (m === 'home' && !this.homeAllowed()) return;
    if (this.mode() !== m) {
      this.mode.set(m);
      this.centreId.set(null);
      this.provider.set('');
      this.clearSlot();
    }
    this.advance();
  }

  // Address (home)
  protected readonly defaultAddressId = computed(() => this.savedAddresses()[0]?.id ?? null);

  protected selectedAddress(): SavedAddress | undefined {
    return this.savedAddresses().find((a) => a.id === this.selectedAddressId());
  }

  protected chooseAddress(id: string): void {
    this.selectedAddressId.set(id);
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
    this.savedAddresses.set(this.savedAddresses().filter((a) => a.id !== id));
    if (this.selectedAddressId() === id) this.selectedAddressId.set(null);
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
    this.naPincode.set(addr?.pincode ?? this.selectedPin()?.pin ?? '');
  }

  protected saveAddress(): void {
    if (!this.naLine1().trim()) return this.addressError.set('Enter address line 1.');
    if (!this.naCity().trim()) return this.addressError.set('Enter the city.');
    if (!this.naState().trim()) return this.addressError.set('Enter the state.');
    if (!/^\d{6}$/.test(this.naPincode().trim())) return this.addressError.set('Enter a valid 6-digit pincode.');
    const editing = this.editingAddressId();
    const addr: SavedAddress = {
      id: editing ?? `a${Date.now()}`,
      type: this.naType(),
      line1: this.naLine1().trim(),
      line2: this.naLine2().trim(),
      landmark: this.naLandmark().trim(),
      city: this.naCity().trim(),
      state: this.naState().trim(),
      pincode: this.naPincode().trim(),
    };
    this.savedAddresses.set(
      editing
        ? this.savedAddresses().map((a) => (a.id === editing ? addr : a))
        : [...this.savedAddresses(), addr],
    );
    this.addressFormOpen.set(false);
    this.addressError.set(null);
    this.chooseAddress(addr.id);
  }

  // Clinic (in clinic)
  private readonly legCentres = computed(() => {
    const leg = this.activeLeg();
    return leg ? CENTRES.filter((c) => c.legs.includes(leg)) : [];
  });

  protected readonly clinicProviders = computed(() => {
    const names = [...new Set(this.legCentres().map((c) => c.provider))];
    return names.map((name) => ({ name }));
  });

  protected readonly filteredCentres = computed(() => {
    const f = this.clinicFilter();
    return f ? this.legCentres().filter((c) => c.provider === f) : this.legCentres();
  });

  protected selectedCentre(): Centre | undefined {
    return CENTRES.find((c) => c.id === this.centreId());
  }

  protected chooseCentre(id: string): void {
    if (this.centreId() !== id) this.clearSlot();
    this.centreId.set(id);
    this.advance();
  }

  // Provider (home collection)
  protected readonly homeProviders = computed(() => HOME_PROVIDERS);

  protected chooseProvider(name: string): void {
    if (this.provider() !== name) this.clearSlot();
    this.provider.set(name);
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

  protected initials(name: string): string {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  // ── Review ─────────────────────────────────────────────────────────────

  protected reviewRows(): { label: string; value: string }[] {
    const rows = [
      { label: 'Booking', value: this.legLabel() },
      { label: 'Pincode', value: this.selectedPin()?.pin ?? '' },
      { label: 'Mode', value: this.mode() === 'home' ? 'Home collection' : 'In clinic' },
    ];
    if (this.mode() === 'home') {
      const addr = this.selectedAddress();
      if (addr) rows.push({ label: 'Address', value: `${addr.type} · ${formatAddress(addr)}` });
      rows.push({ label: 'Provider', value: this.provider() });
    } else {
      const c = this.selectedCentre();
      if (c) {
        rows.push({ label: 'Provider', value: c.provider });
        rows.push({ label: 'Centre', value: `${c.name}, ${c.address}` });
      }
    }
    rows.push({ label: 'Slot', value: `${this.slotDate()?.label ?? ''} · ${this.slotTime()}` });
    return rows;
  }

  protected editSchedule(): void {
    this.view.set('steps');
    this.openStep.set('slot');
  }

  // ── Legs ───────────────────────────────────────────────────────────────

  protected legLabel(): string {
    switch (this.activeLeg()) {
      case 'pathology': return 'Book Pathology';
      case 'radiology': return 'Book Radiology';
      case 'package': return 'Book the entire package';
      default: return '';
    }
  }

  /** Grey-out rules from the spec. */
  protected canBook(leg: Leg): boolean {
    if (this.packageBooked()) return false; // package taken → everything closed
    if (leg === 'pathology') return !this.pathologyBooked();
    if (leg === 'radiology') return this.pathologyBooked() && !this.radiologyBooked();
    // package: only if the individual route has not started
    return !this.pathologyBooked() && !this.radiologyBooked();
  }

  protected startLeg(leg: Leg): void {
    if (!this.canBook(leg)) return;
    this.activeLeg.set(leg);
    this.view.set('steps');
    this.confirmation.set(null);
    this.pinQuery.set('');
    this.selectedPin.set(null);
    // Scans happen at a centre, so those legs start in clinic.
    this.mode.set(leg === 'pathology' ? null : 'clinic');
    this.selectedAddressId.set(null);
    this.clinicFilter.set('');
    this.centreId.set(null);
    this.provider.set('');
    this.clearSlot();
    this.slotDates.set(nextSevenDays());
    this.addressFormOpen.set(false);
    this.addressError.set(null);
    this.openStep.set('pincode');
  }

  protected closeLeg(): void {
    this.activeLeg.set(null);
  }

  protected headerBack(): void {
    if (this.activeLeg()) {
      if (this.view() === 'review') this.view.set('steps');
      else this.closeLeg();
      return;
    }
    history.back();
  }

  protected confirm(): void {
    const leg = this.activeLeg();
    if (leg === 'pathology') {
      this.pathologyBooked.set(true);
      this.confirmation.set('Pathology booked and billed. You can now book the radiology leg.');
    } else if (leg === 'radiology') {
      this.radiologyBooked.set(true);
      this.confirmation.set('Radiology booked and confirmed. Your annual health check is complete.');
    } else if (leg === 'package') {
      this.packageBooked.set(true);
      this.confirmation.set('Package booked and billed — pathology and radiology are both confirmed.');
    }
    this.activeLeg.set(null);
    this.view.set('steps');
  }

  protected reset(): void {
    this.packageBooked.set(false);
    this.pathologyBooked.set(false);
    this.radiologyBooked.set(false);
    this.pathologyStage.set(0);
    this.radiologyStage.set(0);
    this.packageStage.set(0);
    this.confirmation.set(null);
    this.activeLeg.set(null);
  }
}
