import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { AHCStore, AhcBooking, AhcCentre, AhcProvider, AhcServiceTile, AhcSlot, CollectionAddress } from './ahc.store';
import { UserInfoStore } from './../../core/session/userinfo.store';
import { LocationStore } from './../../core/location/location.store';
import { Place } from './../../core/location/location';

import { BenefitCategory } from '../../core/domain/codes';
import { ClaimModeStore } from '../../core/member/claim-mode.store';
import { ClaimOption } from '../../shared/ui/claim-option';

import { FamilyStore } from '../../core/family/family.store';
import { Router } from '@angular/router';

/**
 * Annual Health Check booking.
 *
 * Reproduces patient-flows Section 8: Route A (pathology first, then radiology)
 * and Route B (full package), the grey-out rules and the once-a-year limit.
 * Each booking is one page of accordion steps — pincode → mode → address or
 * clinic → provider (home collection) → slot — followed by a review. The
 * package, providers, saved addresses, centres, slots and the booking status
 * of booked legs come from AHCStore.
 */

type Leg = 'pathology' | 'radiology' | 'package';
type StepKey = 'pincode' | 'mode' | 'location' | 'provider' | 'slot';
type Mode = 'home' | 'clinic';

interface SlotDate {
  /** `yyyy-MM-dd`, local. */
  key: string;
  label: string;
}

/** A local date as `yyyy-MM-dd`. */
function toDateInput(d: Date): string {
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()].map((n, i) => (i ? String(n).padStart(2, '0') : String(n))).join('-');
}

/** `yyyy-MM-dd` back to local midnight — `new Date('yyyy-MM-dd')` would be UTC. */
function fromDateInput(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

/** Seven bookable days from tomorrow — today and the past are not offered. */
function bookableDays(): SlotDate[] {
  const fmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });
  const weekday = new Intl.DateTimeFormat('en-IN', { weekday: 'short' });
  const out: SlotDate[] = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const prefix = i === 1 ? 'Tomorrow' : weekday.format(d);
    out.push({ key: toDateInput(d), label: `${prefix}, ${fmt.format(d)}` });
  }
  return out;
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

const RUPEES = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

/** The booking status timeline; a row's `stage` names where it is. */
const BOOKING_STEPS = ['Booked', 'Inprogress', 'Completed'];

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
        @if (confirmation(); as msg) {
          <div class="mb-5 rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] p-4">
            <p class="text-sm font-semibold text-success-700">{{ msg }}</p>
          </div>
        }

        <!-- ── Landing: one option per leg of the package ─────────────────── -->
        @if (!activeLeg()) {
          @if (fullyUsed()) {
            <div class="mb-5 rounded-2xl border border-[#CDDDFE] bg-[#F3F7FF] p-5">
              <p class="text-base font-semibold text-[#034DA2]">Annual Health Check used for this year</p>
              <p class="mt-1 text-sm text-ink-700">
                This benefit can be taken only once a year. Both pathology and radiology are booked.
              </p>
            </div>
          } @else if (canBookCashless()) {
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

          @if (canBookCashless()) {
          <div class="space-y-3">
            @if (ahcStore.packageLoading()) {
              <p class="rounded-2xl border border-[#EDF0F7] bg-white p-4 text-sm text-ink-500">Loading your health check package…</p>
            } @else if (!ahcStore.serviceTiles().length) {
              <p class="rounded-2xl border border-[#EDF0F7] bg-white p-4 text-sm text-ink-500">
                No Annual Health Check package is available on your plan right now.
              </p>
            } @else {
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
          }
          <div class="mt-4">
            <opd-claim-option [category]="BenefitCategory.HealthPackages" [label]="'the annual health check'" [cashlessAvailable]="canBookCashless()" />
          </div>


          <!-- Booked legs (packageServiceItemsStatusInfo rows with stage 'Booked'), with their status. -->
          @if (!ahcStore.packageLoading()) {
          @for (b of ahcStore.AHCBookings(); track b.id) {
            <section class="mt-4 rounded-2xl border border-[#EDF0F7] bg-white p-4 shadow-sm lg:p-5">
              <div class="flex flex-col gap-4 sm:flex-row">
                <div class="flex shrink-0 flex-col items-center text-center sm:w-[200px]">
                  <span class="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#EDF0F7]">
                    <img class="h-8 w-8" alt="" [src]="b.leg === 'radiology' ? 'images/icons/home/benefit-radiology.svg' : 'images/icons/home/benefit-pathology.svg'" />
                  </span>
                  <p class="mt-2 text-sm font-semibold text-ink-900">{{ b.serviceItemName || legTitle(b.leg) }}</p>
                  @if (b.instructions) {
                    <p class="mt-0.5 text-xs text-success-700">{{ b.instructions }}</p>
                  }
                </div>
                <div class="min-w-0 flex-1">
                  @if (b.providerName) {
                    <span class="inline-block rounded-full bg-[#EEF3FF] px-3 py-1 text-xs font-medium text-ink-900">{{ b.providerName }}</span>
                  }
                  @if (b.address) {
                    <p class="mt-2 flex gap-1.5 text-xs text-ink-700">
                      <span aria-hidden="true">📍</span><span class="min-w-0 break-words">{{ b.address }}</span>
                    </p>
                  }
                  <div class="mt-2 flex items-center justify-between gap-3">
                    @if (b.mode) {
                      <span class="text-sm font-medium text-[#034DA2]">{{ b.mode === 'home' ? 'Home Collection' : 'Center Visit' }}</span>
                    }
                    @if (b.amount !== null) {
                      <span class="ml-auto text-sm font-bold text-ink-900">INR {{ b.amount }}</span>
                    }
                  </div>
                </div>
              </div>

              <div class="mt-4 border-t border-surface-border pt-4">
                <p class="mb-3 text-sm font-semibold text-ink-900">Booking Status</p>
                <ol>
                  @for (s of bookingSteps; track s; let i = $index; let last = $last) {
                    <li class="relative flex gap-3" [class.pb-5]="!last">
                      @if (!last) {
                        <span class="absolute left-[7px] top-4 h-full w-0.5 bg-[#2E6B4F]" aria-hidden="true"></span>
                      }
                      <span
                        class="relative mt-0.5 h-4 w-4 shrink-0 rounded-full"
                        [class.bg-[#2E6B4F]]="i <= stageIndex(b)"
                        [class.bg-[#D9D9D9]]="i > stageIndex(b)"
                        aria-hidden="true"
                      ></span>
                      <span>
                        <span class="block text-sm text-[#2E6B4F]">{{ s }}</span>
                        @if (i === 0 && b.bookedAt !== null) {
                          <span class="block text-xs text-ink-500">{{ formatBookedAt(b.bookedAt) }}</span>
                        }
                      </span>
                    </li>
                  }
                </ol>
              </div>
            </section>
          }
          }

          @if (pathologyBooked() && !radiologyBooked() && !packageBooked()) {
            <p class="mt-4 rounded-xl bg-warning-50 px-3 py-2 text-sm text-warning-700">
              Pathology is booked and billed. Complete the radiology leg — the benefit is billed
              either way, so an unbooked radiology leg is paid for and not used.
            </p>
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
                          {{ location.place()?.pincode }} <span class="text-ink-500">· {{ location.place()?.label }}</span>
                        }
                        @case ('mode') {
                          <span aria-hidden="true">{{ mode() === 'home' ? '🏠' : '🏥' }}</span> {{ mode() === 'home' ? 'Home Collection' : 'In Clinic' }}
                        }
                        @case ('location') {
                          @if (mode() === 'home') {
                            @if (selectedAddress(); as addr) {
                              <span class="font-medium">{{ addr.type }}</span>
                              <span class="mt-0.5 block text-ink-700">{{ formatAddress(addr) }}</span>
                            }
                          } @else {
                            @if (centre(); as c) {
                              <span class="font-medium">{{ c.name }}</span>
                              @if (provider(); as p) {
                                <span class="ml-1 rounded-full bg-[#034DA2] px-2 py-0.5 text-[11px] font-medium text-white">{{ p.name }}</span>
                              }
                              <span class="mt-0.5 block text-ink-700">{{ c.address }}</span>
                            }
                          }
                        }
                        @case ('provider') {
                          {{ provider()?.name }}
                        }
                        @case ('slot') {
                          {{ slotDate()?.label }} · {{ slot()?.label }}
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
                        <!-- 1 · Pincode, area or street -->
                        <label for="ahc-pin" class="sr-only">Pincode, area or street</label>
                        <div class="flex min-h-touch items-center gap-2 rounded-xl border border-surface-border bg-[#F2F4F8] px-3 focus-within:border-brand-500">
                          <span aria-hidden="true">📍</span>
                          <input
                            id="ahc-pin"
                            class="min-w-0 flex-1 bg-transparent text-sm outline-none"
                            autocomplete="off"
                            placeholder="Search by pincode, area or street"
                            [value]="addressQuery()"
                            (input)="onAddressQuery($any($event.target).value)"
                          />
                        </div>
                        <button
                          type="button"
                          class="mt-3 flex items-center gap-2 text-sm font-medium text-[#0F5FDC] disabled:opacity-60"
                          [disabled]="location.busy()"
                          (click)="detectLocation()"
                        >
                          <span aria-hidden="true">◎</span> {{ location.busy() ? 'Detecting your location…' : 'Use my current location' }}
                        </button>
                        @if (addressQuery().trim().length > 0 && addressQuery().trim().length < 3) {
                          <p class="mt-2 text-xs text-ink-500">Type at least 3 characters to search.</p>
                        }

                        @if (location.searching()) {
                          <p class="mt-4 text-xs text-ink-500">Searching addresses…</p>
                        } @else if (location.matches().length) {
                          <div class="mt-4 border-t border-surface-border pt-3">
                            <p class="mb-2 text-xs font-medium text-ink-700">Search results</p>
                            <div class="scrollbar-hide -mr-4 flex gap-3 overflow-x-auto pb-1 pr-4 lg:mr-0 lg:pr-0" role="listbox" aria-label="Search results">
                              @for (m of location.matches(); track $index) {
                                <button
                                  type="button"
                                  role="option"
                                  class="w-[210px] shrink-0 rounded-xl border px-3 py-2.5 text-left"
                                  [attr.aria-selected]="isSelected(m)"
                                  [class.border-[#0F5FDC]]="isSelected(m)"
                                  [class.border-surface-border]="!isSelected(m)"
                                  (click)="selectPlace(m)"
                                >
                                  <span class="block text-sm font-medium text-ink-900">📍 {{ m.pincode || m.city }}</span>
                                  <span class="mt-0.5 line-clamp-2 block text-xs text-ink-500">{{ m.label }}</span>
                                </button>
                              }
                            </div>
                          </div>
                        }

                        @if (location.locating()) {
                          <p class="mt-3 text-xs text-ink-500">Getting the location of this address…</p>
                        }
                        @if (location.error(); as err) {
                          <p class="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-xs text-danger-700" role="alert">{{ err }}</p>
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
                            @if (ahcStore.collectionAddressLoading() && !savedAddresses().length) {
                              <p class="text-sm text-ink-500">Loading your saved addresses…</p>
                            } @else if (!savedAddresses().length) {
                              <p class="text-sm text-ink-500">No saved addresses yet.</p>
                            }
                            <div class="scrollbar-hide -mr-4 flex gap-3 overflow-x-auto pb-1 pr-4 lg:mr-0 lg:pr-0">
                              @for (addr of savedAddresses(); track addr.id) {
                                <button
                                  type="button"
                                  class="flex w-[250px] shrink-0 flex-col rounded-xl border-[1.5px] bg-white p-3 text-left"
                                  [class.border-[#0F5FDC]]="selectedAddressId() === addr.id"
                                  [class.border-surface-border]="selectedAddressId() !== addr.id"
                                  (click)="chooseAddress(addr)"
                                >
                                  <span class="block text-sm font-medium text-ink-900">🏠 {{ addr.type }}</span>
                                  <span class="mt-1 line-clamp-3 block text-xs text-ink-700">{{ formatAddress(addr) }}</span>
                                </button>
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
                              <p class="mb-2 text-sm font-medium text-ink-700">New address</p>
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
                                <button
                                  type="button"
                                  class="min-h-touch flex-1 rounded-xl bg-[#0F5FDC] px-4 text-sm font-semibold text-white disabled:opacity-60"
                                  [disabled]="savingAddress()"
                                  (click)="saveAddress()"
                                >{{ savingAddress() ? 'Saving…' : 'Save address' }}</button>
                              </div>
                            </div>
                          }
                        } @else {
                          <!-- In clinic: pick a provider, then one of its centres. -->
                          <p class="mb-2 text-sm text-ink-900">Select provider</p>
                          @if (providersLoading()) {
                            <p class="rounded-xl bg-[#F2F4F8] px-3 py-3 text-sm text-ink-500">Finding providers near you…</p>
                          } @else if (!providers().length) {
                            <p class="rounded-xl bg-[#F2F4F8] px-3 py-3 text-sm text-ink-500">
                              No provider serves {{ location.place()?.pincode }} for this test yet. Try another pincode.
                            </p>
                          } @else {
                            <div class="scrollbar-hide -mr-4 flex gap-2 overflow-x-auto rounded-xl bg-[#F2F4F8] p-2 pr-4 lg:mr-0">
                              @for (p of providers(); track p.id) {
                                <button
                                  type="button"
                                  class="flex shrink-0 items-center gap-2.5 rounded-xl border-[1.5px] bg-white px-3 py-2 text-left"
                                  [class.border-[#0F5FDC]]="provider()?.id === p.id"
                                  [class.border-transparent]="provider()?.id !== p.id"
                                  (click)="chooseProvider(p)"
                                >
                                  <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEF3FF] text-[11px] font-bold text-[#034DA2]" aria-hidden="true">{{ initials(p.name) }}</span>
                                  <span class="block whitespace-nowrap text-sm font-medium text-ink-900">{{ p.name }}</span>
                                </button>
                              }
                            </div>
                          }

                          <p class="mb-2 mt-4 border-b border-surface-border pb-2 text-sm text-ink-900">Choose centre</p>
                          @if (!provider()) {
                            <p class="text-sm text-ink-500">Pick a provider to see its centres.</p>
                          } @else if (ahcStore.centresLoading()) {
                            <p class="text-sm text-ink-500">Finding centres near you…</p>
                          } @else if (!ahcStore.AHCCentres().length) {
                            <p class="text-sm text-ink-500">No centre of this provider near {{ location.place()?.pincode }}.</p>
                          } @else {
                            <div class="scrollbar-hide -mr-4 flex gap-3 overflow-x-auto pb-1 pr-4 lg:mr-0 lg:pr-0">
                              @for (c of ahcStore.AHCCentres(); track c.id) {
                                <button
                                  type="button"
                                  class="flex w-[280px] shrink-0 flex-col rounded-xl border-[1.5px] bg-white p-3 text-left"
                                  [class.border-[#0F5FDC]]="centre()?.id === c.id"
                                  [class.border-surface-border]="centre()?.id !== c.id"
                                  (click)="chooseCentre(c)"
                                >
                                  <span class="flex items-start justify-between gap-2">
                                    <span class="text-sm font-medium text-ink-900">📍 {{ c.name }}</span>
                                    @if (c.distanceKm !== null) {
                                      <span class="shrink-0 rounded-full bg-[#034DA2] px-2 py-0.5 text-[11px] font-medium text-white">{{ formatDistance(c.distanceKm) }}</span>
                                    }
                                  </span>
                                  @if (c.address) {
                                    <span class="mt-1.5 block text-xs leading-snug text-ink-500">{{ c.address }}</span>
                                  }
                                </button>
                              }
                            </div>
                          }
                        }
                      }

                      @case ('provider') {
                        <!-- 4 · Provider (home collection only) -->
                        @if (providersLoading()) {
                          <p class="rounded-xl bg-[#F2F4F8] px-3 py-3 text-sm text-ink-500">Finding providers near you…</p>
                        } @else if (!providers().length) {
                          <p class="rounded-xl bg-[#F2F4F8] px-3 py-3 text-sm text-ink-500">
                            No provider serves {{ location.place()?.pincode }} for this test yet. Try another pincode.
                          </p>
                        } @else {
                          <div class="scrollbar-hide -mr-4 flex gap-3 overflow-x-auto rounded-xl bg-[#F2F4F8] p-3 pr-4 lg:mr-0">
                            @for (p of providers(); track p.id) {
                              <button
                                type="button"
                                class="w-[180px] shrink-0 rounded-xl border-[1.5px] bg-white p-3 text-left"
                                [class.border-[#0F5FDC]]="provider()?.id === p.id"
                                [class.border-transparent]="provider()?.id !== p.id"
                                (click)="chooseProvider(p)"
                              >
                                <span class="flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF3FF] text-[11px] font-bold text-[#034DA2]" aria-hidden="true">{{ initials(p.name) }}</span>
                                <span class="mt-2 block text-sm font-medium text-ink-900">{{ p.name }}</span>
                                @if (p.address) {
                                  <span class="mt-0.5 line-clamp-2 block text-xs text-ink-500">{{ p.address }}</span>
                                }
                              </button>
                            }
                          </div>
                        }
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
                          @if (!slotDate()) {
                            <p class="text-xs text-ink-500">Pick a date to see its slots.</p>
                          } @else if (ahcStore.slotsLoading()) {
                            <p class="text-xs text-ink-500">Loading slots…</p>
                          } @else if (!ahcStore.AHCSlots().length) {
                            <p class="text-xs text-ink-500">No slots on this day. Pick another date.</p>
                          } @else {
                            <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                              @for (t of ahcStore.AHCSlots(); track t.id) {
                                <button
                                  type="button"
                                  class="min-h-[40px] rounded-xl border-[1.5px] bg-white px-2 text-sm disabled:cursor-not-allowed disabled:text-ink-400 disabled:line-through"
                                  [class.border-[#0F5FDC]]="slot()?.id === t.id"
                                  [class.border-transparent]="slot()?.id !== t.id"
                                  [disabled]="!t.available"
                                  (click)="chooseSlot(t)"
                                >{{ t.label }}</button>
                              }
                            </div>
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
              (click)="reviewBooking()"
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
              class="min-h-touch flex-1 rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white hover:bg-[#034DA2] disabled:opacity-50"
              [disabled]="!ahcStore.AHCIsProceedToBooking() || ahcStore.checkoutLoading() || booking()"
              (click)="confirm()"
            >
              {{ proceedLabel() }}
            </button>
          </div>
          @if (!ahcStore.checkoutLoading() && !ahcStore.AHCIsProceedToBooking()) {
            <p class="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">
              We could not prepare this booking. Go back and review it again.
            </p>
          }
          @if (bookingError(); as err) {
            <p class="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">{{ err }}</p>
          }
        }
      </div>
    </div>
  `,
})
export class WellnessPage {
  protected readonly userStore = inject(UserInfoStore);
  protected readonly ahcStore = inject(AHCStore);
  protected readonly location = inject(LocationStore);
  protected readonly claimModes = inject(ClaimModeStore);
  protected readonly BenefitCategory = BenefitCategory;
  private readonly router = inject(Router);
  private readonly family = inject(FamilyStore);

  // Booked in this visit, before AHC_PACKAGE_DETAIL is read again and lists it.
  private readonly pathologyBookedNow = signal(false);
  private readonly radiologyBookedNow = signal(false);
  protected readonly packageBooked = signal(false);
  protected readonly pathologyBooked = computed(
    () => this.pathologyBookedNow() || this.ahcStore.AHCBookings().some((b) => b.leg === 'pathology'),
  );
  protected readonly radiologyBooked = computed(
    () => this.radiologyBookedNow() || this.ahcStore.AHCBookings().some((b) => b.leg === 'radiology'),
  );
  protected readonly confirmation = signal<string | null>(null);
  protected readonly bookingSteps = BOOKING_STEPS;
  /** True while book_appointment, and any payment after it, is under way. */
  protected readonly booking = signal(false);
  protected readonly bookingError = signal<string | null>(null);

  protected readonly activeLeg = signal<Leg | null>(null);
  /** The accordion of steps, or the review that follows it. */
  protected readonly view = signal<'steps' | 'review'>('steps');
  protected readonly openStep = signal<StepKey | null>('pincode');

  // Step answers. The place itself lives in LocationStore, which the provider,
  // centre and booking calls read.
  /** What the member types in the search box: pincode, area or street. */
  protected readonly addressQuery = signal('');
  private searchTimer: ReturnType<typeof setTimeout> | undefined;
  protected readonly mode = signal<Mode | null>(null);
  protected readonly selectedAddressId = signal<string | null>(null);
  protected readonly provider = signal<AhcProvider | null>(null);
  protected readonly centre = signal<AhcCentre | null>(null);
  protected readonly slotDate = signal<SlotDate | null>(null);
  protected readonly slot = signal<AhcSlot | null>(null);

  // Address book — the member's saved addresses, loaded by AHCStore.getCollectionAddress().
  protected readonly savedAddresses = computed(() => this.ahcStore.AHCCollectionAddress());
  protected readonly addressFormOpen = signal(false);
  protected readonly savingAddress = signal(false);
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

  protected readonly slotDates = signal<SlotDate[]>(bookableDays());

  protected readonly fullyUsed = computed(
    () => this.packageBooked() || (this.pathologyBooked() && this.radiologyBooked()),
  );

  userInfo = this.userStore.userInfo();

  /**
   * Whether the booking tiles are offered. The policy's cashless flag decides,
   * unless AHC_PACKAGE_DETAIL hands the member a package with bookable legs —
   * a package the API offers is bookable whatever the claim mode says. While
   * the package loads, its loading state shows rather than a claims-only note.
   */
  protected readonly canBookCashless = computed(
    () =>
      this.claimModes.allowsCashless(BenefitCategory.HealthPackages) ||
      this.ahcStore.packageLoading() ||
      this.ahcStore.serviceTiles().length > 0,
  );

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.searchTimer));
    // A fresh start on every visit: nothing from an earlier one is shown while
    // the package is read again.
    this.ahcStore.resetForEntry();
    if (this.userInfo && this.userInfo[0]?.user_id) {
      this.ahcStore.getAHCList(this.userInfo[0]);
    }
  }

  protected legTitle(leg: string): string {
    return leg === 'radiology' ? 'Radiology' : leg === 'pathology' ? 'Pathology' : 'Health Check';
  }

  /** Where the row's `stage` sits on the timeline; unknown stages count as Booked. */
  protected stageIndex(b: AhcBooking): number {
    const stage = b.stage.toLowerCase().replace(/[\s_-]/g, '');
    return Math.max(0, BOOKING_STEPS.findIndex((s) => s.toLowerCase() === stage));
  }

  /** "14/10/2026 06:34 pm". */
  protected formatBookedAt(ms: number): string {
    const d = new Date(ms);
    return `${d.toLocaleDateString('en-GB')} ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
  }

  // ── Steps ──────────────────────────────────────────────────────────────

  /** Scans are done at a centre, so only pathology can be collected at home. */
  protected readonly homeAllowed = computed(() => this.activeLeg() === 'pathology');

  /** In clinic, the provider is picked inside the clinic step, so there is no provider step. */
  protected readonly visibleSteps = computed<StepKey[]>(() =>
    this.mode() === 'home'
      ? ['pincode', 'mode', 'location', 'provider', 'slot']
      : ['pincode', 'mode', 'location', 'slot'],
  );

  protected isDone(key: StepKey): boolean {
    switch (key) {
      case 'pincode': return !!this.location.place()?.pincode && !this.location.locating();
      case 'mode': return this.mode() !== null;
      case 'location': return this.mode() === 'home' ? this.selectedAddress() !== undefined : this.centre() !== null;
      case 'provider': return this.provider() !== null;
      case 'slot': return this.slotDate() !== null && this.slot() !== null;
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
    const next = this.openStep() === key ? null : key;
    this.openStep.set(next);
    if (next) this.opened(next);
  }

  /** After an answer, open the first step still waiting for one. */
  private advance(): void {
    const next = this.visibleSteps().find((k) => !this.isDone(k)) ?? null;
    this.openStep.set(next);
    if (next) this.opened(next);
  }

  /** The slot step opens on the first bookable day, with its slots loaded. */
  private opened(key: StepKey): void {
    if (key === 'slot' && !this.slotDate() && this.slotDates().length) this.chooseDate(this.slotDates()[0]);
  }

  // Pincode
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

  /** Writes the pick to LocationStore; coordinates are looked up when the row has none. */
  protected async selectPlace(place: Place): Promise<void> {
    clearTimeout(this.searchTimer);
    const changed = !this.isSelected(place);
    await this.location.choose(place);
    if (changed) this.onPlaceChanged();
    this.advance();
  }

  /** Fills the place from the browser location, reverse-geocoded via Google Maps. */
  protected async detectLocation(): Promise<void> {
    const place = await this.location.detect();
    if (!place) return; // location.error() carries the message shown on the step
    clearTimeout(this.searchTimer);
    this.addressQuery.set(place.pincode);
    this.onPlaceChanged();
    this.advance();
  }

  /** Who can serve you, and when, depends on where. */
  private onPlaceChanged(): void {
    this.clearProvider();
    void this.loadProviders();
  }

  // Mode
  protected chooseMode(m: Mode): void {
    if (m === 'home' && !this.homeAllowed()) return;
    if (this.mode() !== m) {
      this.mode.set(m);
      this.clearProvider();
      void this.loadProviders();
      if (m === 'home') this.loadAddresses();
    }
    this.advance();
  }

  // Address (home)
  protected selectedAddress(): CollectionAddress | undefined {
    return this.savedAddresses().find((a) => a.id === this.selectedAddressId());
  }

  protected chooseAddress(addr: CollectionAddress): void {
    // Home slots are looked up for the collection address.
    if (this.selectedAddressId() !== addr.id) this.clearSlot();
    this.selectedAddressId.set(addr.id);
    this.ahcStore.setSelectedCollectionAddress(addr);
    this.advance();
  }

  private loadAddresses(): void {
    if (this.userInfo?.length) void this.ahcStore.getCollectionAddress(this.userInfo[0]);
  }

  protected startAddAddress(): void {
    this.addressError.set(null);
    this.naType.set('Home');
    this.naLine1.set('');
    this.naLine2.set('');
    this.naLandmark.set('');
    this.naCity.set(this.location.place()?.city ?? '');
    this.naState.set(this.location.place()?.state ?? '');
    this.naPincode.set(this.location.place()?.pincode ?? '');
    this.addressFormOpen.set(true);
  }

  protected cancelAddressForm(): void {
    this.addressFormOpen.set(false);
    this.addressError.set(null);
  }

  protected async saveAddress(): Promise<void> {
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
    this.addressFormOpen.set(false);
    // The reloaded list has the new row; pick it by what was typed.
    const added = [...this.savedAddresses()]
      .reverse()
      .find((a) => a.line1 === draft.line1 && a.pincode === draft.pincode);
    if (added) this.chooseAddress(added);
  }

  // Provider — the home-collection step, or the first half of the clinic step.
  protected readonly providers = computed(() => this.ahcStore.AHCProviders());
  protected readonly providersLoading = computed(() => this.ahcStore.providersLoading());

  /** A fresh list for this place and mode: an earlier pick may not be on it. */
  private async loadProviders(): Promise<void> {
    const mode = this.mode();
    if (!mode || !this.location.place()?.pincode || !this.userInfo?.length) return;
    await this.ahcStore.getAHCProviders(this.userInfo[0], mode);
    // In clinic with a single provider there is nothing to choose: go straight to its centres.
    const list = this.providers();
    if (this.mode() === 'clinic' && list.length === 1 && !this.provider()) this.chooseProvider(list[0]);
  }

  protected chooseProvider(p: AhcProvider): void {
    if (this.provider()?.id !== p.id) {
      this.provider.set(p);
      // The store keeps it (and sessionStorage) for the slot and booking calls.
      this.ahcStore.setSelectedProvider(p);
      this.clearCentre();
      this.clearSlot();
      if (this.mode() === 'clinic' && this.userInfo?.length) {
        void this.ahcStore.getCentreAddress(this.userInfo[0], this.mode());
      }
    }
    this.advance();
  }

  private clearProvider(): void {
    this.provider.set(null);
    this.ahcStore.setSelectedProvider(null);
    this.clearCentre();
    this.clearSlot();
  }

  // Clinic (in clinic)
  protected chooseCentre(c: AhcCentre): void {
    if (this.centre()?.id !== c.id) this.clearSlot();
    this.centre.set(c);
    this.ahcStore.setSelectedCentre(c);
    this.advance();
  }

  private clearCentre(): void {
    this.centre.set(null);
    this.ahcStore.setSelectedCentre(null);
  }

  // Slot
  protected chooseDate(d: SlotDate): void {
    if (this.slotDate()?.key === d.key) return;
    this.slotDate.set(d);
    this.slot.set(null);
    this.ahcStore.setSelectedSlot(null);
    const day = fromDateInput(d.key);
    if (day && this.userInfo?.length) void this.ahcStore.getAHCDynamicSlots(this.userInfo[0], day, this.mode());
  }

  protected chooseSlot(t: AhcSlot): void {
    this.slot.set(t);
    this.ahcStore.setSelectedSlot(t);
    this.advance();
  }

  private clearSlot(): void {
    this.slotDate.set(null);
    this.slot.set(null);
    this.ahcStore.setSelectedSlot(null);
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
    const place = this.location.place();
    const rows = [
      { label: 'Booking', value: this.legLabel() },
      { label: 'Pincode', value: place?.pincode ?? '' },
    ];
    if (place?.label) rows.push({ label: 'Location', value: place.label });
    rows.push({ label: 'Mode', value: this.mode() === 'home' ? 'Home collection' : 'In clinic' });
    if (this.mode() === 'home') {
      const addr = this.selectedAddress();
      if (addr) rows.push({ label: 'Address', value: `${addr.type} · ${formatAddress(addr)}` });
      rows.push({ label: 'Provider', value: this.provider()?.name ?? '' });
    } else {
      rows.push({ label: 'Provider', value: this.provider()?.name ?? '' });
      const c = this.centre();
      if (c) rows.push({ label: 'Centre', value: [c.name, c.address].filter(Boolean).join(', ') });
    }
    rows.push({ label: 'Slot', value: [this.slotDate()?.label, this.slot()?.label].filter(Boolean).join(' · ') });
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

  /** Whether the member's package includes a pathology leg. */
  protected readonly hasPathology = computed(() =>
    this.ahcStore.serviceTiles().some((t) => t.serviceType === 'PATHOLOGY'),
  );

  /** Grey-out rules from the spec. */
  protected canBook(leg: Leg): boolean {
    if (this.packageBooked()) return false; // package taken → everything closed
    if (leg === 'pathology') return !this.ahcStore.IsPathologyServiceStatus();
    // Pathology first — unless the package has no pathology leg to book.
    if (leg === 'radiology') return (!this.hasPathology() || this.pathologyBooked()) && !this.radiologyBooked();
    // package: only if the individual route has not started
    return !this.pathologyBooked() && !this.radiologyBooked();
  }

  /** Stores the picked leg — its tile and the package — for the later steps. */
  protected startLeg(leg: Leg, tile: AhcServiceTile | null): void {
    if (!this.canBook(leg)) return;
    this.ahcStore.setAHCSelctedItem({ leg, tile, package: this.ahcStore.ahcPackage() });
    this.activeLeg.set(leg);
    this.view.set('steps');
    this.confirmation.set(null);
    this.addressQuery.set('');
    // Scans happen at a centre, so those legs start in clinic.
    this.mode.set(leg === 'pathology' ? null : 'clinic');
    this.selectedAddressId.set(null);
    this.ahcStore.setSelectedCollectionAddress(null);
    this.clearProvider();
    this.slotDates.set(bookableDays());
    this.addressFormOpen.set(false);
    this.addressError.set(null);
    // A place chosen earlier is kept, so the pincode step may already be done.
    this.advance();
    void this.loadProviders();
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

  /**
   * Books the leg; when the member has a share to pay, the store opens the
   * payment gateway before this resolves.
   */
  protected async confirm(): Promise<void> {
    if (this.booking() || !this.userInfo?.length) return;
    const leg = this.activeLeg();
    this.booking.set(true);
    this.bookingError.set(null);
    const outcome = await this.ahcStore.ahcBookAppointment(this.userInfo[0]);
    this.booking.set(false);

    if (outcome.status === 'failed') {
      this.bookingError.set('We could not book this. Please try again.');
      return;
    }
    // Off to Razorpay; the member comes back on the payment-status page.
    if (outcome.status === 'redirecting') return;

    if (leg === 'pathology') this.pathologyBookedNow.set(true);
    else if (leg === 'radiology') this.radiologyBookedNow.set(true);
    else if (leg === 'package') this.packageBooked.set(true);

    const what = leg === 'pathology' ? 'Pathology' : leg === 'radiology' ? 'Radiology' : 'Package';
    switch (outcome.status) {
      case 'payment-cancelled':
        this.confirmation.set(`${what} is booked, but the payment was not completed. Your booking stays pending until it is paid.`);
        break;
      case 'payment-failed':
        this.confirmation.set(`${what} is booked, but the payment failed: ${outcome.reason} Your booking stays pending until it is paid.`);
        break;
      default:
        if (leg === 'pathology') this.confirmation.set('Pathology booked and billed. You can now book the radiology leg.');
        else if (leg === 'radiology') this.confirmation.set('Radiology booked and confirmed. Your annual health check is complete.');
        else this.confirmation.set('Package booked and billed — pathology and radiology are both confirmed.');
    }
    this.activeLeg.set(null);
    this.view.set('steps');
  }

  protected reset(): void {
    this.packageBooked.set(false);
    this.pathologyBookedNow.set(false);
    this.radiologyBookedNow.set(false);
    this.confirmation.set(null);
    this.activeLeg.set(null);
  }
  /** Opens the review and prices the booking (cart_add, then checkout) for it. */
  protected reviewBooking(): void {
    this.view.set('review');
    const user = this.userStore.userInfo()?.[0];
    if (user) void this.ahcStore.ahcAddToCart(user);
  }

  /** The member's share from checkout; the API may send it as text ("1200.0"). */
  protected readonly copayAmount = computed(() => Number(this.ahcStore.AHCCopayAmount()) || 0);

  /** The review's main button — it books, and takes the payment when there is a share to pay. */
  protected readonly proceedLabel = computed(() => {
    if (this.booking()) return 'Booking…';
    if (this.ahcStore.checkoutLoading()) return 'Preparing your booking…';
    const copay = this.copayAmount();
    return copay > 0 ? `Pay ${RUPEES.format(copay)} via Razorpay` : 'Proceed to booking';
  });
}
