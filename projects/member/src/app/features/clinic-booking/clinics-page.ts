import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { CLINIC_BOOKING_API, ClinicArea } from '../../core/clinic-booking/clinic-booking';
import { ClinicBookingStore } from '../../core/clinic-booking/clinic-booking.store';
import { formatMoney } from '../../core/domain/money';
import { ProfileStore } from '../../core/member/profile.store';
import { EmptyView, ErrorView, LoadingView } from '../../shared/ui/state-views';

/**
 * Flow 4 step 2 — compare dentists.
 *
 * The sheet wants a comparison as the entry point, on four dimensions: fees,
 * availability, experience and distance. Two of them exist. The clinics
 * endpoint returns clinicId, clinicName, address, contactNumber, servicePrice
 * and availableSlots — no dentist, and no coordinates.
 *
 * So this compares what it can and NAMES the two it cannot, rather than
 * quietly showing a two-column comparison as though that were the whole thing.
 * "Not recorded" and "Not available" are different claims on purpose: one needs
 * a dentist to exist in the model, the other needs the endpoint to accept a
 * location it already knows how to use elsewhere.
 *
 * It is also still reached from a service picker rather than being the entry
 * point itself, because a fee is per service — there is nothing to compare
 * until a service is chosen.
 */
@Component({
  selector: 'opd-clinics-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, LoadingView, ErrorView, EmptyView],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[900px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            [routerLink]="['/member', basePath()]"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">Select a Clinic</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">Clinics offering this service near you</p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[900px] px-5 py-6 lg:px-8">
        <div class="mb-5 flex gap-2">
          <input
            name="pincode"
            inputmode="numeric"
            maxlength="6"
            placeholder="Search by pincode"
            class="min-h-touch flex-1 rounded-xl border border-surface-border bg-white px-3 text-sm focus:border-brand-500 focus:outline-none"
            [ngModel]="pincode()"
            (ngModelChange)="pincode.set($event)"
          />
          <button
            type="button"
            class="min-h-touch rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white hover:bg-[#034DA2]"
            (click)="search()"
          >
            Search
          </button>
        </div>

        @if (store.loading()) {
          <opd-loading label="Finding clinics" />
        } @else if (store.error(); as error) {
          <opd-error [error]="error" (retry)="search()" />
        } @else if (store.clinics().length) {
          <ul class="space-y-4">
            @for (clinic of store.clinics(); track clinic.id) {
              <li class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div class="min-w-0">
                    <h2 class="truncate text-lg font-bold text-[#0B2C63]">{{ clinic.name }}</h2>
                    <p class="mt-0.5 text-sm text-ink-700">{{ clinic.addressLine }}</p>
                    <p class="mt-0.5 text-xs text-ink-500">
                      {{ clinic.pincode }}
                      @if (clinic.contactNumber) {
                        · {{ clinic.contactNumber }}
                      }
                    </p>
                  </div>
                  @if (clinic.servicePrice.amount > 0) {
                    <p class="text-xl font-bold text-[#0B2C63]">{{ money(clinic.servicePrice) }}</p>
                  }
                </div>

                <!--
                  Flow 4 step 2 — "Fees, availability, experience and distance
                  are compared side by side."

                  Two of the four are real. The other two are shown as gaps
                  rather than left out, because a comparison silently missing
                  half its dimensions reads as a complete one:

                    experience — dental has no dentist record at all. The
                      booking stores a clinic and nothing else, which is the
                      same gap that stops step 24's "same dentist" rule working.
                    distance   — never requested. The API can measure it (it
                      does for flow 2's doctor list) but the dental clinics
                      endpoint neither takes a location nor returns one.
                -->
                <dl class="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-surface-border pt-4 text-sm sm:grid-cols-4">
                  <div>
                    <dt class="text-xs text-ink-500">Fee</dt>
                    <dd class="font-semibold text-ink-900">
                      {{ clinic.servicePrice.amount > 0 ? money(clinic.servicePrice) : 'Not priced' }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-xs text-ink-500">Availability</dt>
                    <dd class="font-semibold text-ink-900">
                      {{ clinic.availableSlots }} slot{{ clinic.availableSlots === 1 ? '' : 's' }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-xs text-ink-500">Experience</dt>
                    <dd class="font-medium text-ink-500">Not recorded</dd>
                  </div>
                  <div>
                    <dt class="text-xs text-ink-500">Distance</dt>
                    <dd class="font-medium text-ink-500">Not available</dd>
                  </div>
                </dl>

                <a
                  [routerLink]="['/member', basePath(), 'select-patient']"
                  [queryParams]="{ serviceCode: serviceCode(), clinicId: clinic.id }"
                  class="mt-4 flex min-h-touch w-full items-center justify-center rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white hover:bg-[#034DA2]"
                >
                  Select this clinic
                </a>
              </li>
            }
          </ul>
        } @else {
          <opd-empty
            title="No clinics found"
            detail="No clinic near you offers this service. Try a different pincode."
          />
        }
      </div>
    </div>
  `,
})
export class ClinicsPage {
  readonly area = input<ClinicArea>('VISION');
  readonly serviceCode = input<string>('');

  protected readonly store = inject(ClinicBookingStore);
  private readonly profile = inject(ProfileStore);

  protected readonly money = formatMoney;
  protected readonly pincode = signal('');

  protected readonly basePath = computed(() => CLINIC_BOOKING_API[this.area()].basePath);

  /** Seeds the pincode exactly once — see the effect below. */
  private pincodeSeeded = false;

  constructor() {
    void this.profile.load();

    // Seed the search with the member's own pincode, so the first result set
    // is local without them typing anything.
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

    effect(() => this.store.selectClinics(this.area(), this.serviceCode(), this.pincode()));
  }

  protected search(): void {
    this.store.retry(this.area(), this.serviceCode(), this.pincode());
  }
}
