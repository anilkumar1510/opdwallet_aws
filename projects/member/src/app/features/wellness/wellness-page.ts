import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { AHCStore, AhcCentre, AhcProvider, AhcServiceTile, AhcSlot, CollectionAddress } from './ahc.store';
import { UserInfoStore } from './../../core/session/userinfo.store';
import { LocationStore } from './../../core/location/location.store';
import { Place } from './../../core/location/location';

/**
 * Annual Health Check — DUMMY / STATIC journey, zero backend.
 *
 * A self-contained wizard that reproduces patient-flows Section 8 end to end so
 * the whole journey can be experienced without any API: the three entry options,
 * Route A (pathology first, then radiology) and Route B (full package), the
 * per-leg steps (postal code → mode → provider → address / centre → slot →
 * review → confirmed & billed), the grey-out rules, and the once-a-year limit.
 * A demo reset re-opens everything so every scenario is reachable. No network
 * calls are made. See REMOVED-APIS.md.
 */

type Leg = 'pathology' | 'radiology' | 'package';

/** Radiology still has no provider API wired; static until it does. */
const RADIOLOGY_PROVIDERS: AhcProvider[] = ['Medanta Diagnostics', 'Fortis Radiology', 'Max Imaging'].map((name) => ({
  id: name,
  name,
  code: '',
  centreCode: '',
  address: '',
  raw: null,
}));

/** A local date as the `yyyy-MM-dd` an `<input type="date">` reads and writes. */
function toDateInput(d: Date): string {
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()].map((n, i) => (i ? String(n).padStart(2, '0') : String(n))).join('-');
}

/** `yyyy-MM-dd` back to local midnight — `new Date('yyyy-MM-dd')` would be UTC. */
function fromDateInput(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

/** Tomorrow: the earliest bookable day — today and the past are not offered. */
function firstBookableDay(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toDateInput(d);
}

type AddressType = 'Home' | 'Work' | 'Other';

/** "2.4 km" — under 100 m the figure means nothing more precise than that. */
function formatDistance(km: number | null): string {
  if (km === null) return '';
  return km < 0.1 ? '< 0.1 km' : `${km.toFixed(1)} km`;
}

function formatAddress(a: CollectionAddress): string {
  return [a.line1, a.line2, a.landmark, [a.city, [a.state, a.pincode].filter(Boolean).join(' ')].filter(Boolean).join(', ')]
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
  imports: [],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
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

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        <!-- Demo-only note -->
        <!-- <p class="mb-4 rounded-xl border border-dashed border-warning-400 bg-warning-50 px-3 py-2 text-xs text-warning-700">
          🧪 Static demo journey — no data is saved. Use “Start over” to try every route again.
        </p> -->

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
          } @else {
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

          <div class="space-y-3">
            @if (ahcStore.packageLoading()) {
              <p class="rounded-2xl border border-[#EDF0F7] bg-white p-4 text-sm text-ink-500">Loading your health check package…</p>
            } @else if (!ahcStore.serviceTiles().length) {
              <p class="rounded-2xl border border-[#EDF0F7] bg-white p-4 text-sm text-ink-500">
                No Annual Health Check package is available on your plan right now.
              </p>
            }
            <!-- One button per leg of the package (data.benefits_package_service_tiles), in API order. -->
            @for (tile of ahcStore.serviceTiles(); track tile.id) {
              @if (tile.serviceType === 'PATHOLOGY') {
                <!-- Book Pathology -->
                <button
                  type="button"
                  class="flex w-full items-center justify-between gap-3 rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white p-4 text-left disabled:opacity-50"
                  style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.10)"
                  [disabled]="!canBook('pathology')"
                  (click)="startLeg('pathology', tile)"
                >
                  <span>
                    <span class="block font-semibold text-[#034DA2]">Book Pathology</span>
                    <span class="mt-0.5 block text-xs text-ink-500">Home collection or centre visit</span>
                  </span>
                  <span class="shrink-0 text-xs font-semibold" [class.text-success-700]="pathologyBooked()" [class.text-ink-400]="!pathologyBooked()">
                    {{ pathologyBooked() ? '✓ Booked' : 'Book →' }}
                  </span>
                </button>
              } @else if (tile.serviceType === 'RADIOLOGY') {
                <!-- Book Radiology (only after pathology, on the individual route) -->
                <button
                  type="button"
                  class="flex w-full items-center justify-between gap-3 rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white p-4 text-left disabled:opacity-50"
                  style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.10)"
                  [disabled]="!canBook('radiology')"
                  (click)="startLeg('radiology', tile)"
                >
                  <span>
                    <span class="block font-semibold text-[#034DA2]">Book Radiology</span>
                    <span class="mt-0.5 block text-xs text-ink-500">
                      {{ !hasPathology() || pathologyBooked() || radiologyBooked() ? 'Centre visit' : 'Book pathology first' }}
                    </span>
                  </span>
                  <span class="shrink-0 text-xs font-semibold" [class.text-success-700]="radiologyBooked()" [class.text-ink-400]="!radiologyBooked()">
                    {{ radiologyBooked() ? '✓ Booked' : 'Book →' }}
                  </span>
                </button>
              }
            }

            <!-- Book the entire package -->
            <!-- <button
              type="button"
              class="flex w-full items-center justify-between gap-3 rounded-2xl border-[1.5px] border-[#CDDDFE] bg-[#F3F7FF] p-4 text-left disabled:opacity-50"
              style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.10)"
              [disabled]="!canBook('package')"
              (click)="startLeg('package', null)"
            >
              <span>
                <span class="block font-semibold text-[#034DA2]">Book the entire package</span>
                <span class="mt-0.5 block text-xs text-ink-500">Pathology + radiology together, one booking</span>
              </span>
              <span class="shrink-0 text-xs font-semibold" [class.text-success-700]="packageBooked()" [class.text-ink-400]="!packageBooked()">
                {{ packageBooked() ? '✓ Booked' : 'Book →' }}
              </span>
            </button> -->
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
                  class="mt-3 min-h-touch w-full rounded-xl border border-dashed border-surface-border px-4 text-sm font-semibold text-ink-700 hover:bg-surface-sunk"
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

          <!-- @if (pathologyBooked() || radiologyBooked() || packageBooked()) {
            <button
              type="button"
              class="mt-6 text-sm font-medium text-brand-700 underline"
              (click)="reset()"
            >
              Start over (demo reset)
            </button>
          } -->
        }

        <!-- ── Wizard for the active leg ──────────────────────────────────── -->
        @else {
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-bold text-[#034DA2]">{{ legLabel() }}</h2>
            <span class="text-xs text-ink-500">Step {{ step() + 1 }} of {{ steps().length }}</span>
          </div>

          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
            @switch (currentStep()) {
              @case ('postal') {
                <label class="block text-sm font-medium text-ink-700">Your address</label>
                <p class="mb-2 text-xs text-ink-500">Drives which providers can serve you.</p>
                <button
                  type="button"
                  class="mb-3 flex min-h-touch w-full items-center justify-center gap-2 rounded-xl border border-[#0F5FDC] bg-blue-50 px-4 text-sm font-semibold text-[#0F5FDC]"
                  [disabled]="location.busy()"
                  (click)="detectLocation()"
                >
                  📍 {{ location.busy() ? 'Detecting your location…' : 'Auto-detect my location' }}
                </button>
                <input
                  class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm outline-none focus:border-brand-500"
                  placeholder="Search by pincode, area or street"
                  autocomplete="off"
                  [value]="addressQuery()"
                  (input)="onAddressQuery($any($event.target).value)"
                />
                @if (addressQuery().trim().length > 0 && addressQuery().trim().length < 3) {
                  <p class="mt-1 text-xs text-ink-500">Type at least 3 characters to search.</p>
                }

                @if (location.searching()) {
                  <p class="mt-3 text-xs text-ink-500">Searching addresses…</p>
                } @else if (location.matches().length) {
                  <p class="mt-4 mb-2 text-sm font-medium text-ink-700">Search results</p>
                  <div class="max-h-80 space-y-2 overflow-y-auto" role="listbox" aria-label="Search results">
                    @for (m of location.matches(); track $index) {
                      <button
                        type="button"
                        role="option"
                        class="flex w-full items-center gap-3 rounded-2xl border bg-white px-4 py-3 text-left hover:bg-surface-sunk"
                        style="box-shadow: 0 1px 6px 0 rgba(3,77,162,.06)"
                        [attr.aria-selected]="isSelected(m)"
                        [class.border-brand-500]="isSelected(m)"
                        [class.bg-blue-50]="isSelected(m)"
                        [class.border-surface-border]="!isSelected(m)"
                        (click)="selectAddress(m)"
                      >
                        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEF0F4] text-ink-500" aria-hidden="true">
                          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="currentColor">
                            <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
                          </svg>
                        </span>
                        <span class="min-w-0 flex-1">
                          <span class="block text-base font-medium text-ink-900">{{ m.pincode || m.city }}</span>
                          <span class="mt-0.5 block truncate text-sm text-ink-500">{{ m.label }}</span>
                        </span>
                        @if (isSelected(m)) { <span class="shrink-0 text-brand-700">✓</span> }
                      </button>
                    }
                  </div>
                }

                @if (location.place(); as sel) {
                  <div class="mt-3 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-3 py-2">
                    <span class="block text-[11px] font-semibold uppercase tracking-wide text-success-700">✓ Selected address</span>
                    <span class="block text-sm text-ink-900">{{ sel.pincode ? sel.pincode + ' · ' : '' }}{{ sel.label }}</span>
                    @if (location.locating()) {
                      <span class="mt-0.5 block text-xs text-ink-500">Getting the location of this address…</span>
                    }
                  </div>
                }

                @if (location.error(); as err) {
                  <p class="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-xs text-danger-700" role="alert">{{ err }}</p>
                }
              }
              @case ('mode') {
                <p class="mb-2 text-sm font-medium text-ink-700">Mode of collection</p>
                <div class="grid gap-3 sm:grid-cols-2">
                  @for (m of ['home','centre']; track m) {
                    <button
                      type="button"
                      class="min-h-touch rounded-xl border px-4 text-sm font-medium"
                      [class.border-brand-500]="mode() === m"
                      [class.bg-blue-50]="mode() === m"
                      [class.text-brand-700]="mode() === m"
                      [class.border-surface-border]="mode() !== m"
                      [class.text-ink-700]="mode() !== m"
                      (click)="mode.set($any(m))"
                    >
                      {{ m === 'home' ? 'Home collection' : 'Visit collection centre' }}
                    </button>
                  }
                </div>
              }
              @case ('provider') {
                <p class="mb-2 text-sm font-medium text-ink-700">Select provider</p>
                <p class="mb-3 text-xs text-ink-500">Serviceable at {{ postalCode() }}.</p>
                @if (activeLeg() === 'pathology' && ahcStore.providersLoading()) {
                  <p class="rounded-xl bg-surface-sunk px-3 py-3 text-sm text-ink-500">Finding providers near you…</p>
                } @else if (!providers().length) {
                  <p class="rounded-xl bg-surface-sunk px-3 py-3 text-sm text-ink-500">
                    No provider serves {{ postalCode() }} for this test yet. Try another address.
                  </p>
                }
                <div class="space-y-2">
                  @for (p of providers(); track p.id) {
                    <button
                      type="button"
                      class="flex min-h-touch w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm"
                      [class.border-brand-500]="provider()?.id === p.id"
                      [class.bg-blue-50]="provider()?.id === p.id"
                      [class.border-surface-border]="provider()?.id !== p.id"
                      (click)="selectProvider(p)"
                    >
                      <span class="min-w-0">
                        <span class="block font-medium text-ink-900">{{ p.name }}</span>
                        @if (p.address) { <span class="mt-0.5 block text-xs text-ink-500">{{ p.address }}</span> }
                      </span>
                      @if (provider()?.id === p.id) { <span class="shrink-0 text-brand-700">✓</span> }
                    </button>
                  }
                </div>
              }
              @case ('address') {
                <p class="text-sm font-medium text-ink-700">Collection address</p>
                <p class="mb-3 text-xs text-ink-500">Required for home collection.</p>

                @if (!addingAddress()) {
                  @if (ahcStore.collectionAddressLoading() && !savedAddresses().length) {
                    <p class="rounded-xl bg-surface-sunk px-3 py-3 text-sm text-ink-500">Loading your saved addresses…</p>
                  } @else if (!savedAddresses().length) {
                    <p class="rounded-xl bg-surface-sunk px-3 py-3 text-sm text-ink-500">No saved addresses yet. Add one below.</p>
                  }
                  <div class="space-y-2">
                    @for (addr of savedAddresses(); track addr.id) {
                      <button
                        type="button"
                        class="flex w-full items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left"
                        [class.border-brand-500]="selectedAddressId() === addr.id"
                        [class.bg-blue-50]="selectedAddressId() === addr.id"
                        [class.border-surface-border]="selectedAddressId() !== addr.id"
                        (click)="selectedAddressId.set(addr.id); selectedCollectionAddress(addr); "
                      >
                        <span class="min-w-0">
                          <span class="mb-0.5 inline-block rounded-md bg-[#EEF3FF] px-1.5 py-0.5 text-[11px] font-semibold text-[#034DA2]">{{ addr.type }}</span>
                          <span class="block text-sm text-ink-900">{{ formatAddress(addr) }}</span>
                        </span>
                        @if (selectedAddressId() === addr.id) { <span class="shrink-0 text-brand-700">✓</span> }
                      </button>
                    }
                  </div>
                  @if(mode() == 'home'){
                    <button
                    type="button"
                    class="mt-3 min-h-touch w-full rounded-xl border border-dashed border-[#0F5FDC] px-4 text-sm font-semibold text-[#0F5FDC]"
                    (click)="startAddAddress()"
                  >
                    + Add new address
                  </button>
                  }
                } @else {
                  <div class="rounded-2xl border border-surface-border p-4">
                    <p class="mb-2 text-sm font-medium text-ink-700">Address type</p>
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
                    <div class="grid gap-3">
                      <div>
                        <label class="mb-1 block text-xs font-medium text-ink-700">Address line 1 <span class="text-danger-700">*</span></label>
                        <input class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm outline-none focus:border-brand-500" placeholder="House / flat, building" [value]="naLine1()" (input)="naLine1.set($any($event.target).value)" />
                      </div>
                      <div>
                        <label class="mb-1 block text-xs font-medium text-ink-700">Address line 2</label>
                        <input class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm outline-none focus:border-brand-500" placeholder="Area, street, sector" [value]="naLine2()" (input)="naLine2.set($any($event.target).value)" />
                      </div>
                      <div>
                        <label class="mb-1 block text-xs font-medium text-ink-700">Landmark</label>
                        <input class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm outline-none focus:border-brand-500" placeholder="Nearby landmark (optional)" [value]="naLandmark()" (input)="naLandmark.set($any($event.target).value)" />
                      </div>
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="mb-1 block text-xs font-medium text-ink-700">City <span class="text-danger-700">*</span></label>
                          <input class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm outline-none focus:border-brand-500" [value]="naCity()" (input)="naCity.set($any($event.target).value)" />
                        </div>
                        <div>
                          <label class="mb-1 block text-xs font-medium text-ink-700">State <span class="text-danger-700">*</span></label>
                          <input class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm outline-none focus:border-brand-500" [value]="naState()" (input)="naState.set($any($event.target).value)" />
                        </div>
                      </div>
                      <div>
                        <label class="mb-1 block text-xs font-medium text-ink-700">Pincode <span class="text-danger-700">*</span></label>
                        <input class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm outline-none focus:border-brand-500" inputmode="numeric" [value]="naPincode()" (input)="naPincode.set($any($event.target).value)" />
                      </div>
                    </div>
                    @if (addressError(); as err) {
                      <p class="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700">{{ err }}</p>
                    }
                    <div class="mt-4 flex gap-3">
                      <button type="button" class="min-h-touch flex-1 rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900" (click)="addingAddress.set(false)">Cancel</button>
                      <button type="button" class="min-h-touch flex-1 rounded-xl bg-[#0F5FDC] px-4 text-sm font-semibold text-white disabled:opacity-60" [disabled]="savingAddress()" (click)="saveNewAddress()">{{ savingAddress() ? 'Saving…' : 'Save address' }}</button>
                    </div>
                  </div>
                }
              }
              @case ('centre') {
                <p class="mb-2 text-sm font-medium text-ink-700">Select centre</p>
                <p class="mb-3 text-xs text-ink-500">Must offer the required scans / package.</p>
                @if (ahcStore.centresLoading()) {
                  <p class="rounded-xl bg-surface-sunk px-3 py-3 text-sm text-ink-500">Finding centres near you…</p>
                } @else if (!ahcStore.AHCCentres().length) {
                  <p class="rounded-xl bg-surface-sunk px-3 py-3 text-sm text-ink-500">
                    No centre of this provider is near {{ postalCode() }}. Try another provider or address.
                  </p>
                }
                <div class="space-y-2">
                  @for (c of ahcStore.AHCCentres(); track c.id) {
                    <button
                      type="button"
                      class="flex min-h-touch w-full items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm"
                      [class.border-brand-500]="centre()?.id === c.id"
                      [class.bg-blue-50]="centre()?.id === c.id"
                      [class.border-surface-border]="centre()?.id !== c.id"
                      (click)="selectCentre(c)"
                    >
                      <span class="min-w-0">
                        <span class="block font-medium text-ink-900">{{ c.name }}</span>
                        @if (c.address) { <span class="mt-0.5 block text-xs text-ink-500">{{ c.address }}</span> }
                      </span>
                      <span class="flex shrink-0 items-center gap-2">
                        @if (c.distanceKm !== null) {
                          <span class="text-xs font-medium text-ink-500">{{ formatDistance(c.distanceKm) }}</span>
                        }
                        @if (centre()?.id === c.id) { <span class="text-brand-700">✓</span> }
                      </span>
                    </button>
                  }
                </div>
              }
              @case ('slot') {
                <p class="mb-2 text-sm font-medium text-ink-700">Select date and time</p>
                <label class="mb-1 block text-xs font-medium text-ink-700" for="ahc-slot-date">Date</label>
                <input
                  id="ahc-slot-date"
                  type="date"
                  class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm outline-none focus:border-brand-500 sm:w-64"
                  [min]="minSlotDate()"
                  [value]="slotDate()"
                  (change)="onSlotDate($any($event.target))"
                />
                <p class="mt-1 text-xs text-ink-500">From tomorrow onwards — today and past dates can't be booked.</p>

                <p class="mb-2 mt-4 text-xs font-medium text-ink-700">Available slots</p>
                @if (ahcStore.slotsLoading()) {
                  <p class="rounded-xl bg-surface-sunk px-3 py-3 text-sm text-ink-500">Loading slots…</p>
                } @else if (!ahcStore.AHCSlots().length) {
                  <p class="rounded-xl bg-surface-sunk px-3 py-3 text-sm text-ink-500">No slots on this day. Pick another date.</p>
                } @else {
                  <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    @for (t of ahcStore.AHCSlots(); track t.id) {
                      <button
                        type="button"
                        class="min-h-touch rounded-xl border px-3 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                        [disabled]="!t.available"
                        [class.border-brand-500]="slot()?.id === t.id"
                        [class.bg-blue-50]="slot()?.id === t.id"
                        [class.border-surface-border]="slot()?.id !== t.id"
                        (click)="slot.set(t);this.ahcStore.setSelectedSlot(t)"
                      >{{ t.label }}</button>
                      <!-- >{{ t.label }}</button> -->
                    }
                  </div>
                }
                @if (activeLeg() === 'pathology') {
                  <p class="mt-3 text-xs text-ink-500">ⓘ Please fast for 10–12 hours before your collection.</p>
                }
              }
              @case ('review') {
                <p class="mb-3 text-sm font-medium text-ink-700">Review your booking</p>
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
              }
            }

            @if (stepError(); as err) {
              <p class="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">{{ err }}</p>
            }
          </section>

          <div class="mt-5 flex gap-3">
            <button
              type="button"
              class="flex min-h-touch items-center rounded-xl border border-surface-border bg-white px-6 text-sm font-semibold text-ink-900 hover:border-[#A4BFFE7A]"
              (click)="back()"
            >
              Back
            </button>
            <button
              type="button"
              class="min-h-touch flex-1 rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white hover:bg-[#034DA2]"
              (click)="next()"
            >
              {{ currentStep() === 'review' ? 'Proceed to booking' : 'Continue' }}
            </button>
          </div>
        }
      </div>
    </div>
  `,
})
export class WellnessPage {
  protected readonly userStore = inject(UserInfoStore);
  protected readonly ahcStore = inject(AHCStore);
  protected readonly packageBooked = signal(false);
  protected readonly pathologyBooked = signal(false);
  protected readonly radiologyBooked = signal(false);
  protected readonly confirmation = signal<string | null>(null);
  
  protected readonly location = inject(LocationStore);
  
  // Post-booking order stage per leg (0 confirmed, 1 collection/scan, 2 report).
  protected readonly pathologyStage = signal(0);
  protected readonly radiologyStage = signal(0);
  protected readonly packageStage = signal(0);

  protected readonly activeLeg = signal<Leg | null>(null);
  protected readonly step = signal(0);
  protected readonly stepError = signal<string | null>(null);

  protected readonly postalCode = signal('');
  /** What the member types in the address search box: pincode, area or street. */
  protected readonly addressQuery = signal('');
  private searchTimer: ReturnType<typeof setTimeout> | undefined;
  protected readonly mode = signal<'home' | 'centre' | null>(null);
  protected readonly provider = signal<AhcProvider | null>(null);
  protected readonly centre = signal<AhcCentre | null>(null);
  /** The slot day as `yyyy-MM-dd`; never earlier than tomorrow. */
  protected readonly slotDate = signal('');
  protected readonly slot = signal<AhcSlot | null>(null);
  protected readonly minSlotDate = signal(firstBookableDay());

  // Address selection — the member's saved addresses, loaded by AHCStore.getCollectionAddress().
  protected readonly savedAddresses = computed(() => this.ahcStore.AHCCollectionAddress());
  protected readonly savingAddress = signal(false);
  protected readonly selectedAddressId = signal<string | null>(null);
  protected readonly addingAddress = signal(false);
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

  protected readonly formatDistance = formatDistance;

  protected readonly fullyUsed = computed(
    () => this.packageBooked() || (this.pathologyBooked() && this.radiologyBooked()),
  );
  userInfo = this.userStore.userInfo();
  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.searchTimer));
    if(this.userInfo && this.userInfo[0]?.user_id){
      this.ahcStore.getAHCList(this.userInfo[0]);
    }
    
  }
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
  selectedCollectionAddress(address: any){
    this.ahcStore.setSelectedCollectionAddress(address);
  }
  protected readonly providers = computed<AhcProvider[]>(() =>
    this.activeLeg() === 'pathology' ? this.ahcStore.AHCProviders() : RADIOLOGY_PROVIDERS,
  );

  /** The steps for the active leg; pathology adds an address step for home collection. */
  protected readonly steps = computed<string[]>(() => {
    const leg = this.activeLeg();
    if (leg === 'pathology') {
      const s = ['postal', 'mode', 'provider'];
      if (this.mode() === 'home'){
        s.push('address');
      } else{
         s.push('centre');
      }
      s.push('slot', 'review');
      return s;
    }
    if (leg === 'radiology' || leg === 'package') return ['postal', 'provider', 'centre', 'slot', 'review'];
    return [];
  });

  protected readonly currentStep = computed(() => this.steps()[this.step()] ?? 'postal');

  protected legLabel(): string {
    switch (this.activeLeg()) {
      case 'pathology': return 'Book Pathology';
      case 'radiology': return 'Book Radiology';
      case 'package': return 'Book the entire package';
      default: return '';
    }
  }

  /** Whether the member's package includes a pathology leg. */
  protected readonly hasPathology = computed(() =>
    this.ahcStore.serviceTiles().some((t) => t.serviceType === 'PATHOLOGY'),
  );

  /** Grey-out rules from the spec. */
  protected canBook(leg: Leg): boolean {
    if (this.packageBooked()) return false; // package taken → everything closed
    // if (leg === 'pathology') return !this.pathologyBooked();
    if (leg === 'pathology') return !this.ahcStore.IsPathologyServiceStatus();
    // Pathology first — unless the package has no pathology leg to book.
    if (leg === 'radiology') return (!this.hasPathology() || this.pathologyBooked()) && !this.radiologyBooked();
    // package: only if the individual route has not started
    return !this.pathologyBooked() && !this.radiologyBooked();
  }

  /** Stores the picked leg — its tile and the package — for the later steps. */
  protected startLeg(leg: Leg, tile: AhcServiceTile | null): void {
    if (!this.canBook(leg)) return;
    this.activeLeg.set(leg);
    this.step.set(0);
    this.stepError.set(null);
    this.confirmation.set(null);
    this.mode.set(null);
    this.provider.set(null);
    this.ahcStore.setSelectedProvider(null);
    this.centre.set(null);
    this.ahcStore.setSelectedCentre(null);
    this.slotDate.set('');
    this.slot.set(null);
    this.selectedAddressId.set(null);
    this.addingAddress.set(false);
    this.addressError.set(null);
    this.ahcStore.setAHCSelctedItem({ leg, tile, package: this.ahcStore.ahcPackage()});
  }

  /** Picks a provider and keeps it in the store (and sessionStorage) for the slot and booking calls. */
  protected selectProvider(p: AhcProvider): void {
    if (this.provider()?.id === p.id) return;
    this.provider.set(p);
    this.ahcStore.setSelectedProvider(p);
    // A slot picked for another provider no longer applies.
    this.slot.set(null);
    this.stepError.set(null);
  }

  protected selectCentre(c: AhcCentre): void {
    if (this.centre()?.id === c.id) return;
    this.centre.set(c);
    this.ahcStore.setSelectedCentre(c);
    // A slot picked for another centre no longer applies.
    this.slot.set(null);
    this.stepError.set(null);
  }

  /** Native date picker; anything before tomorrow — typed in by hand — snaps back. */
  protected onSlotDate(input: HTMLInputElement): void {
    const min = this.minSlotDate();
    const value = input.value && input.value >= min ? input.value : min;
    input.value = value;
    if (value === this.slotDate()) return;
    this.slotDate.set(value);
    this.loadSlots();
  }

  private loadSlots(): void {
    const day = fromDateInput(this.slotDate());
    if (!day || !this.userInfo?.length) return;
    this.slot.set(null);
    void this.ahcStore.getAHCDynamicSlots(this.userInfo[0], day, this.mode());
  }

  /** Fills the postal code from the browser location, reverse-geocoded via Google Maps. */
  protected async detectLocation(): Promise<void> {
    const place = await this.location.detect();
    if (!place) return; // location.error() carries the message shown on the step

    clearTimeout(this.searchTimer);
    this.postalCode.set(place.pincode);
    this.addressQuery.set(place.pincode);
    this.stepError.set(null);
  }

  /**
   * Debounced so the search runs when typing pauses, not on every key. The
   * store ignores anything under three characters and clears the list.
   */
  protected onAddressQuery(value: string): void {
    this.addressQuery.set(value);
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => void this.location.searchAddresses(value), 400);
  }

  /** Rows can share a locality across pincodes, so both are compared. */
  protected isSelected(place: Place): boolean {
    const sel = this.location.place();
    return !!sel && sel.label === place.label && sel.pincode === place.pincode;
  }

  /** Writes the pick to LocationStore — the same `place` auto-detect fills. */
  protected selectAddress(place: Place): void {
    clearTimeout(this.searchTimer);
    // Shown at once; coordinates are looked up in the background when the row has none.
    void this.location.choose(place);
    this.postalCode.set(place.pincode);
    this.stepError.set(null);
  }

  protected startAddAddress(): void {
    this.addressError.set(null);
    this.naType.set('Home');
    this.naLine1.set('');
    this.naLine2.set('');
    this.naLandmark.set('');
    this.naCity.set('');
    this.naState.set('');
    this.naPincode.set('');
    this.addingAddress.set(true);
  }

  protected async saveNewAddress(): Promise<void> {
    if (!this.naLine1().trim()) return this.addressError.set('Enter address line 1.');
    if (!this.naCity().trim()) return this.addressError.set('Enter the city.');
    if (!this.naState().trim()) return this.addressError.set('Enter the state.');
    if (!/^\d{6}$/.test(this.naPincode().trim())) return this.addressError.set('Enter a valid 6-digit pincode.');
    if (this.savingAddress() || !this.userInfo?.length) return;
    const draft = {
      type: this.naType(),
      line1: this.naLine1().trim(),
      line2: this.naLine2().trim(),
      landmark: this.naLandmark().trim(),
      city: this.naCity().trim(),
      state: this.naState().trim(),
      pincode: this.naPincode().trim(),
    };
    this.savingAddress.set(true);
    this.addressError.set(null);
    const saved = await this.ahcStore.addNewCollectionAddress(draft, this.userInfo[0]);
    this.savingAddress.set(false);
    if (!saved) {
      this.addressError.set('We could not save this address. Try again.');
      return;
    }
    // The reloaded list has the new row; pick it by what was typed.
    const added = [...this.savedAddresses()]
      .reverse()
      .find((a) => a.line1 === draft.line1 && a.pincode === draft.pincode);
    if (added) this.selectedAddressId.set(added.id);
    this.addingAddress.set(false);
  }

  private selectedAddress(): CollectionAddress | undefined {
    return this.savedAddresses().find((a) => a.id === this.selectedAddressId());
  }

  protected reviewRows(): { label: string; value: string }[] {
    const rows = [
      { label: 'Booking', value: this.legLabel() },
      { label: 'Postal code', value: this.postalCode() },
    ];
    const place = this.location.place();
    if (place) rows.push({ label: 'Location', value: place.label });
    if (this.activeLeg() === 'pathology') {
      rows.push({ label: 'Mode', value: this.mode() === 'home' ? 'Home collection' : 'Centre visit' });
    }
    rows.push({ label: 'Provider', value: this.provider()?.name ?? '' });
    const centre = this.centre();
    if (centre) rows.push({ label: 'Centre', value: [centre.name, centre.address].filter(Boolean).join(' · ') });
    const addr = this.selectedAddress();
    if (this.mode() === 'home' && addr) rows.push({ label: 'Address', value: `${addr.type} · ${formatAddress(addr)}` });
    const day = fromDateInput(this.slotDate());
    const dayText = day ? day.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '';
    rows.push({ label: 'Slot', value: [dayText, this.slot()?.label].filter(Boolean).join(' · ') });
    // rows.push({ label: 'Slot', value: [dayText, this.slot()?.label].filter(Boolean).join(' · ') });
    return rows;
  }

  private validate(): string | null {
    switch (this.currentStep()) {
      case 'postal':
        if (this.location.locating()) return 'Getting the location of this address — try again in a moment.';
        if (this.location.place()?.pincode) return null;
        if (this.location.matches().length) return 'Select an address from the list.';
        // Search found nothing or failed: a typed pincode alone is enough to go on.
        if (/^\d{6}$/.test(this.addressQuery().trim())) return null;
        return 'Search by pincode, area or street and select your address.';
      case 'mode': return this.mode() ? null : 'Choose a mode of collection.';
      case 'provider': return this.provider() ? null : 'Select a provider.';
      case 'centre': return this.centre() ? null : 'Select a centre.';
      case 'address':
        if (this.addingAddress()) return 'Save or cancel the new address first.';
        return this.selectedAddressId() ? null : 'Select a collection address.';
      case 'slot': return this.slotDate() && this.slot() ? null : 'Pick a date and a time slot.';
      default: return null;
    }
  }

  protected next(): void {
    const err = this.validate();
    if (err) { this.stepError.set(err); return; }
    this.stepError.set(null);
    if (this.currentStep() === 'review') { this.confirm(); return; }
    if (this.currentStep() === 'postal') {
      this.postalCode.set(this.location.place()?.pincode || this.addressQuery().trim());
    }
    this.step.set(this.step() + 1);
    console.log('next step', this.step(), ' current step', this.currentStep());
    if(this.currentStep() === 'provider' && this.activeLeg() === 'pathology' && this.userInfo?.length > 0){
      // A fresh list for this address and mode: an earlier pick may not be on it.
      this.provider.set(null);
      this.ahcStore.setSelectedProvider(null);
      this.ahcStore.getAHCProviders(this.userInfo[0], this.mode())
    }
    if(this.currentStep() === 'address' && this.userInfo?.length > 0){
      this.ahcStore.getCollectionAddress(this.userInfo[0])
    }
    if(this.currentStep() === 'centre' && this.userInfo?.length > 0){
      // A fresh list for this provider and address: an earlier pick may not be on it.
      this.centre.set(null);
      this.ahcStore.getCentreAddress(this.userInfo[0], this.mode())
    }
    if(this.currentStep() === 'slot' && this.userInfo?.length > 0){
      // Default to the first bookable day (tomorrow) and load its slots.
      this.minSlotDate.set(firstBookableDay());
      if (!this.slotDate() || this.slotDate() < this.minSlotDate()) this.slotDate.set(this.minSlotDate());
      this.loadSlots();
    }
    // if(this.currentStep() === 'review' && this.userInfo?.length > 0){
    //   this.ahcStore.ahcAddToCart(this.userInfo[0])
    // }
  }

  protected back(): void {
    this.stepError.set(null);
    if (this.step() === 0) { this.activeLeg.set(null); return; }
    this.step.set(this.step() - 1);
  }

  protected headerBack(): void {
    if (this.activeLeg()) { this.back(); return; }
    history.back();
  }

  private confirm(): void {
    const leg = this.activeLeg();
    this.ahcStore.ahcAddToCart(this.userInfo[0])
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
    this.step.set(0);
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
    this.step.set(0);
  }
}
