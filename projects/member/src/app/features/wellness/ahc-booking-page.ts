import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AhcBookingStore, AhcVendor } from '../../core/ahc/ahc-booking.store';
import { AhcStore } from '../../core/ahc/ahc.store';
import { formatMoney } from '../../core/domain/money';
import { FamilyStore } from '../../core/family/family.store';
import { LAB_API } from '../../core/lab/lab.mapper';
import { LabEnvelopeDto } from '../../core/lab/lab.dto';
import { Slot, SlotDto, toSlot } from '../../core/lab/cart';
import { LabKind } from '../../core/lab/lab.model';
import { ProfileStore } from '../../core/member/profile.store';
import { AddressPicker } from '../../shared/ui/address-picker';
import { EmptyView, LoadingView } from '../../shared/ui/state-views';

const DAY = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

/** A centre of one vendor. See `centres()` for where these come from. */
interface AhcCentre {
  readonly id: string;
  readonly name: string;
  readonly area: string;
}

/**
 * AHC booking legs, following Patient Flows section 8.
 *
 * `leg` = 'lab' is the pathology leg: pincode -> mode of collection -> provider
 * -> collection address (home only) -> date and time. `leg` = 'diagnostic' is
 * the radiology leg: pincode -> provider -> centre -> date and time, with no
 * mode step because radiology is always a centre visit.
 *
 * Where it continues depends on the route the member took on the wellness
 * screen: the package route runs both legs, the individual routes run one.
 */
@Component({
  selector: 'opd-ahc-booking-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, LoadingView, EmptyView, AddressPicker],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[900px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            [routerLink]="backLink()"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">{{ title() }}</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">
              {{ stepLabel() }}
            </p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[900px] px-5 py-6 lg:px-8">
        <!-- Step: postal code -->
        <div class="mb-5 flex gap-2">
          <input
            name="pincode"
            inputmode="numeric"
            maxlength="6"
            placeholder="Enter your pincode"
            class="min-h-touch flex-1 rounded-xl border border-surface-border bg-white px-3 text-sm focus:border-brand-500 focus:outline-none"
            [ngModel]="pincode()"
            (ngModelChange)="pincode.set($event)"
          />
          <button
            type="button"
            class="min-h-touch rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white hover:bg-[#034DA2]"
            (click)="find()"
          >
            Find
          </button>
        </div>

        <!-- Step: mode of collection (pathology only) -->
        @if (isLab()) {
          <section class="mb-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
            <h2 class="mb-1 text-base font-semibold text-[#0E51A2]">Mode of collection</h2>
            <p class="mb-3 text-xs text-ink-500">
              Home collection sends a phlebotomist to your address. A centre visit means you go to
              the lab.
            </p>
            <div class="flex gap-2">
              <button
                type="button"
                class="min-h-touch flex-1 rounded-xl border px-4 text-sm font-medium transition-colors"
                [class]="
                  collectionType() === 'HOME_COLLECTION'
                    ? 'border-[#034DA2] bg-[#034DA2] text-white'
                    : 'border-[#E5E7EB] bg-white text-ink-700'
                "
                (click)="setCollectionType('HOME_COLLECTION')"
              >
                Home collection
              </button>
              <button
                type="button"
                class="min-h-touch flex-1 rounded-xl border px-4 text-sm font-medium transition-colors"
                [class]="
                  collectionType() === 'CENTER_VISIT'
                    ? 'border-[#034DA2] bg-[#034DA2] text-white'
                    : 'border-[#E5E7EB] bg-white text-ink-700'
                "
                (click)="setCollectionType('CENTER_VISIT')"
              >
                Centre visit
              </button>
            </div>
          </section>

          <!-- Step: collection address, required for home collection -->
          @if (collectionType() === 'HOME_COLLECTION') {
            <section class="mb-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
              <h2 class="mb-3 text-base font-semibold text-[#0E51A2]">Collection address</h2>
              <opd-address-picker [(selectedId)]="addressId" />
            </section>
          }
        }

        @if (isLab() && !collectionType()) {
          <p class="rounded-xl bg-blue-50 px-3 py-2 text-sm text-[#034DA2]">
            Choose home collection or a centre visit to see the labs that offer it.
          </p>
        } @else if (store.loading()) {
          <opd-loading label="Finding vendors" />
        } @else if (vendors().length) {
          <ul class="space-y-4">
            @for (vendor of vendors(); track vendor.id) {
              <li class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div class="min-w-0">
                    <h2 class="truncate text-lg font-bold text-[#0B2C63]">{{ vendor.name }}</h2>
                    <p class="mt-0.5 text-xs text-ink-500">
                      {{ vendor.offersHomeCollection ? 'Home collection' : '' }}
                      {{ vendor.offersHomeCollection && vendor.offersCenterVisit ? '·' : '' }}
                      {{ vendor.offersCenterVisit ? 'Centre visit' : '' }}
                    </p>
                  </div>
                  @if (vendor.price.amount > 0) {
                    <p class="text-xl font-bold text-[#0B2C63]">{{ money(vendor.price) }}</p>
                  }
                </div>

                @if (expandedVendorId() === vendor.id) {
                  <!-- Step: centre (radiology, and a lab centre visit) -->
                  @if (needsCentre()) {
                    <div class="mt-4">
                      <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
                        Select a centre
                      </p>
                      <ul class="space-y-2">
                        @for (centre of centres(vendor); track centre.id) {
                          <li>
                            <button
                              type="button"
                              class="w-full rounded-xl border p-3 text-left transition-colors"
                              [style.border-color]="centre.id === centreId() ? '#0F5FDC' : '#E5E7EB'"
                              [style.background]="centre.id === centreId() ? '#EFF4FF' : 'transparent'"
                              [attr.aria-pressed]="centre.id === centreId()"
                              (click)="centreId.set(centre.id); centreName.set(centre.name)"
                            >
                              <p class="text-sm font-medium text-ink-900">{{ centre.name }}</p>
                              <p class="mt-0.5 text-xs text-ink-500">{{ centre.area }}</p>
                            </button>
                          </li>
                        }
                      </ul>
                      <p class="mt-2 text-xs text-ink-500">
                        Placeholder centres — the vendor API exposes no branch list yet.
                      </p>
                    </div>
                  }
                }

                <div class="scrollbar-hide mt-4 flex gap-2 overflow-x-auto pb-1">
                  @for (day of days; track day.iso) {
                    <button
                      type="button"
                      class="min-h-touch shrink-0 rounded-xl border px-4 text-sm font-medium transition-colors"
                      [class]="
                        day.iso === date()
                          ? 'border-[#034DA2] bg-[#034DA2] text-white'
                          : 'border-[#E5E7EB] bg-white text-ink-700'
                      "
                      (click)="pickDay(vendor, day.iso)"
                    >
                      {{ day.label }}
                    </button>
                  }
                </div>

                @if (expandedVendorId() === vendor.id) {
                  @if (slotsLoading()) {
                    <p class="mt-4 text-xs text-ink-500">Loading times&hellip;</p>
                  } @else if (slots().length) {
                    <ul class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      @for (slot of slots(); track slot.id) {
                        <li>
                          <button
                            type="button"
                            class="flex min-h-touch w-full items-center justify-center rounded-xl border border-[#E5E7EB] bg-white px-2 text-sm font-medium text-ink-700 transition-colors hover:border-[#0F5FDC] hover:text-[#034DA2] disabled:pointer-events-none disabled:opacity-40"
                            [disabled]="!slot.isAvailable"
                            (click)="choose(vendor, slot)"
                          >
                            {{ slot.label }}
                          </button>
                        </li>
                      }
                    </ul>
                  } @else {
                    <p class="mt-4 text-xs text-ink-500">
                      No times listed for this day — the vendor will confirm one directly.
                    </p>
                    <button
                      type="button"
                      class="mt-2 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white hover:bg-[#034DA2]"
                      (click)="choose(vendor)"
                    >
                      Continue without a time
                    </button>
                  }

                  @if (problem(); as text) {
                    <p class="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">
                      {{ text }}
                    </p>
                  }
                } @else {
                  <button
                    type="button"
                    class="mt-4 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white hover:bg-[#034DA2]"
                    (click)="pickDay(vendor, date())"
                  >
                    View available times
                  </button>
                }
              </li>
            }
          </ul>
        } @else {
          <opd-empty
            title="No vendors available"
            detail="No {{ isLab() ? 'lab' : 'diagnostic centre' }} near this pincode is set up for your health checkup package."
          />
        }
      </div>
    </div>
  `,
})
export class AhcBookingPage {
  /** 'lab' or 'diagnostic', from route data. */
  readonly leg = input<'lab' | 'diagnostic'>('lab');

  protected readonly store = inject(AhcBookingStore);
  private readonly ahc = inject(AhcStore);
  private readonly family = inject(FamilyStore);
  private readonly profile = inject(ProfileStore);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  protected readonly money = formatMoney;
  protected readonly pincode = signal('');
  /** Pathology only; radiology is always a centre visit. */
  protected readonly collectionType = signal<'HOME_COLLECTION' | 'CENTER_VISIT' | ''>('');
  protected readonly addressId = signal('');
  protected readonly centreId = signal('');
  protected readonly centreName = signal('');
  protected readonly problem = signal<string | null>(null);

  protected readonly days = Array.from({ length: 7 }, (_, offset) => {
    const day = new Date();
    day.setDate(day.getDate() + offset);
    return {
      iso: day.toISOString().slice(0, 10),
      label: offset === 0 ? 'Today' : DAY.format(day),
    };
  });

  protected readonly date = signal(this.days[0].iso);

  /** Which vendor's times are showing, and what they are. One at a time. */
  protected readonly expandedVendorId = signal<string | null>(null);
  protected readonly slots = signal<readonly Slot[]>([]);
  protected readonly slotsLoading = signal(false);

  /** Seeds the pincode exactly once — see the effect below. */
  private pincodeSeeded = false;

  constructor() {
    void this.profile.load();
    void this.ahc.load();

    // Landing here directly, without picking one of the three options, still
    // has to mean something: the lab leg alone is the pathology route and the
    // diagnostic leg alone is the radiology route.
    if (!this.store.route()) {
      this.store.setRoute(this.leg() === 'lab' ? 'PATHOLOGY' : 'RADIOLOGY');
    }

    // Seed from the member's own address so the first search is local.
    //
    // ONE-SHOT. Reading `pincode()` inside the effect made it a dependency, so
    // clearing the field re-ran the effect, saw it empty, and put the pincode
    // straight back — the member could not search anywhere but home. The latch
    // seeds once; `untracked` keeps the read from re-arming it.
    effect(() => {
      const own = this.profile.pincode();
      if (!own || this.pincodeSeeded) return;
      this.pincodeSeeded = true;
      if (!untracked(() => this.pincode())) this.pincode.set(own);
    });

    effect(() => {
      const pin = this.pincode();
      if (pin) void this.store.loadVendors(this.leg(), pin);
    });

    // The address the member picks here is the one the order is placed with —
    // the review screen no longer guesses at their default.
    effect(() => this.store.setAddressId(this.addressId()));
  }

  protected readonly isLab = computed(() => this.leg() === 'lab');
  protected readonly title = computed(() =>
    this.isLab() ? 'Book Pathology' : 'Book Radiology',
  );

  protected readonly stepLabel = computed(() => {
    const total = this.store.route() === 'PACKAGE' ? 3 : 2;
    const step = this.isLab() ? 1 : this.store.route() === 'PACKAGE' ? 2 : 1;
    return `Step ${step} of ${total} — ${this.isLab() ? 'choose a lab' : 'choose a diagnostic centre'}`;
  });

  protected readonly backLink = computed(() =>
    this.isLab() || this.store.route() !== 'PACKAGE' ? '/member/wellness' : '/member/ahc/booking',
  );

  /** Radiology always visits a centre; pathology only when it is not at home. */
  protected readonly needsCentre = computed(
    () => !this.isLab() || this.collectionType() === 'CENTER_VISIT',
  );

  /** Vendors that actually offer the chosen mode (sheet step 6). */
  protected readonly vendors = computed(() => {
    const all = this.store.vendors();
    const mode = this.collectionType();
    if (!this.isLab() || !mode) return all;
    return all.filter((vendor) =>
      mode === 'HOME_COLLECTION' ? vendor.offersHomeCollection : vendor.offersCenterVisit,
    );
  });

  protected setCollectionType(type: 'HOME_COLLECTION' | 'CENTER_VISIT'): void {
    this.collectionType.set(type);
    this.expandedVendorId.set(null);
    this.centreId.set('');
    this.centreName.set('');
    this.problem.set(null);
  }

  /**
   * ponytail: placeholder centres. Nothing in the AHC or lab vendor APIs
   * exposes branches — a vendor is the deepest addressable unit — so the sheet's
   * "select centre" step is filled from the vendor's own name. Swap the body for
   * the real list when a centres endpoint exists; nothing else has to change.
   */
  protected centres(vendor: AhcVendor): readonly AhcCentre[] {
    return [
      { suffix: 'Main Centre', area: 'Nearest to your pincode' },
      { suffix: 'City Branch', area: 'Central, longer opening hours' },
      { suffix: 'Suburb Branch', area: 'Quieter, easier parking' },
    ].map((centre, index) => ({
      id: `${vendor.id}-C${index + 1}`,
      name: `${vendor.name} — ${centre.suffix}`,
      area: centre.area,
    }));
  }

  protected find(): void {
    void this.store.loadVendors(this.leg(), this.pincode());
  }

  /**
   * Picking a day expands (or re-fetches) that vendor's real times, from the
   * same `member/{lab,diagnostics}/vendors/:id/slots` endpoint the regular
   * lab/diagnostic booking flow uses — the AHC vendor list itself carries no
   * slot data, but its vendor ids are the same lab/diagnostic vendor records.
   */
  protected pickDay(vendor: AhcVendor, iso: string): void {
    this.date.set(iso);
    if (this.expandedVendorId() !== vendor.id) {
      this.centreId.set('');
      this.centreName.set('');
    }
    this.expandedVendorId.set(vendor.id);
    this.problem.set(null);
    void this.loadSlots(vendor.id, iso);
  }

  private async loadSlots(vendorId: string, date: string): Promise<void> {
    this.slotsLoading.set(true);
    try {
      const kind = this.isLab() ? LabKind.Lab : LabKind.Diagnostic;
      const pincode = this.pincode();
      const response = await firstValueFrom(
        this.http.get<LabEnvelopeDto<SlotDto[]>>(LAB_API[kind].vendorSlots(vendorId), {
          params: pincode ? { pincode, date } : { date },
        }),
      );
      if (this.expandedVendorId() !== vendorId || this.date() !== date) return;
      this.slots.set(response.success === false ? [] : (response.data ?? []).map(toSlot));
    } catch {
      if (this.expandedVendorId() === vendorId && this.date() === date) this.slots.set([]);
    } finally {
      if (this.expandedVendorId() === vendorId && this.date() === date) this.slotsLoading.set(false);
    }
  }

  protected async choose(vendor: AhcVendor, slot?: Slot): Promise<void> {
    const problem = this.missingStep();
    this.problem.set(problem);
    if (problem) return;

    const leg = {
      vendorId: vendor.id,
      vendorName: vendor.name,
      // A real slot when one was picked; blank only for a vendor whose day had
      // no times listed, where the vendor confirms an exact time directly.
      slotId: slot?.id ?? '',
      date: this.date(),
      time: slot?.timeSlot ?? '',
      price: vendor.price,
      ...(this.isLab() ? { collectionType: this.collectionType() } : {}),
      ...(this.centreName() ? { centreName: this.centreName() } : {}),
    };

    if (this.isLab()) {
      this.store.setLab(leg);
      await this.router.navigate([
        this.store.route() === 'PACKAGE' ? '/member/ahc/booking/diagnostic' : '/member/ahc/booking/payment',
      ]);
    } else {
      this.store.setDiagnostic(leg);
      await this.router.navigate(['/member/ahc/booking/payment']);
    }
  }

  /** The sheet's steps in order, so the member is told what is still missing. */
  private missingStep(): string | null {
    if (this.isLab() && !this.collectionType()) return 'Choose home collection or a centre visit.';
    if (this.isLab() && this.collectionType() === 'HOME_COLLECTION' && !this.addressId()) {
      return 'Choose the address the sample should be collected from.';
    }
    if (this.needsCentre() && !this.centreId()) return 'Choose a centre.';
    return null;
  }
}
