import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { consultationService } from '../../core/services/benefit-services';
import { BenefitServicesStore } from '../../core/services/benefit-services.store';
import { ClinicBookingStore } from '../../core/clinic-booking/clinic-booking.store';
import { CLINIC_AREA } from '../../core/clinic-booking/clinic-booking';
import { ProfileStore } from '../../core/member/profile.store';
import { formatMoney } from '../../core/domain/money';
import { EmptyView, LoadingView } from '../../shared/ui/state-views';

/**
 * Flow 4 step 2 — "Compare dentists", as the entry point the sheet describes:
 * *"Fees, availability, experience and distance are compared side by side.
 * Comparison view is the entry point, not a plain list."*
 *
 * The service picker lives INSIDE the comparison rather than before it. That is
 * what makes an entry point possible at all: a fee is per service, so the fee
 * column is empty until one is chosen — but choosing it here keeps the
 * comparison as the first screen instead of the third.
 *
 * Two of the four dimensions cannot be filled, and both are shown as explicit
 * placeholders rather than dropped:
 *
 *   experience — dental holds NO dentist. A booking records a clinic and
 *     nothing else, so these are clinics compared side by side, not
 *     practitioners. The same gap stops step 24's "same dentist who
 *     recommended the procedure" from being enforceable, so one schema change
 *     closes both.
 *   distance   — the clinics endpoint neither accepts a location nor returns
 *     one. The API already measures distance for flow 2's doctor list, so this
 *     is wiring rather than new capability.
 *
 * A comparison quietly missing half its columns reads as a complete one. These
 * say what is absent and why.
 */
@Component({
  selector: 'opd-compare-dentists-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, LoadingView, EmptyView],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[1100px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            routerLink="/member/dental"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to dental"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1
              class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]"
            >
              Compare dentists
            </h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">
              Consultation fees, side by side
            </p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[1100px] px-5 py-6 lg:px-8">
        <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
          <!--
            No treatment picker. Flow 4 books a consultation: the dentist looks,
            writes a prescription, and only then does a filling or an X-ray
            become a thing to price — through the estimate and the adjudication
            in steps 18 to 21. So the fee being compared is one fee, the
            consultation's, and the member is told where the rest comes from.
          -->
          <p class="text-sm font-medium text-ink-900">Consultation fee near you</p>
          <p class="mt-0.5 text-sm text-ink-500">
            Book the visit first. If the dentist recommends treatment, they give you an estimate and
            we check it against your plan before anything is charged.
          </p>

          <label class="mt-4 block">
            <span class="text-sm text-ink-700">Postal code</span>
            <div class="mt-1 flex gap-2">
              <input
                type="text"
                inputmode="numeric"
                [value]="pincode()"
                (input)="pincode.set($any($event.target).value)"
                placeholder="e.g. 201301"
                class="min-h-touch min-w-0 flex-1 rounded-xl border border-surface-border px-3 text-sm text-ink-900 outline-none focus:border-[#0F5FDC]"
              />
              <button
                type="button"
                class="min-h-touch shrink-0 rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white disabled:opacity-60"
                [disabled]="!serviceCode() || !pincode().trim()"
                (click)="search()"
              >
                Compare
              </button>
            </div>
          </label>
        </section>

        @if (!serviceCode()) {
          <p class="mt-5 text-sm text-ink-500">Pick a treatment to compare fees.</p>
        } @else if (store.loading()) {
          <opd-loading label="Comparing clinics" />
        } @else if (store.clinics().length) {
          <div class="mt-5 overflow-x-auto">
            <table class="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr class="border-b border-surface-border text-left">
                  <th class="px-3 py-2 font-semibold text-ink-900">Clinic</th>
                  <th class="px-3 py-2 font-semibold text-ink-900">Fee</th>
                  <th class="px-3 py-2 font-semibold text-ink-900">Availability</th>
                  <th class="px-3 py-2 font-semibold text-ink-900">Experience</th>
                  <th class="px-3 py-2 font-semibold text-ink-900">Distance</th>
                  <th class="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                @for (clinic of store.clinics(); track clinic.id) {
                  <tr class="border-b border-rule-soft align-top">
                    <td class="px-3 py-3">
                      <span class="block font-medium text-ink-900">{{ clinic.name }}</span>
                      <span class="block text-xs text-ink-500">{{ clinic.addressLine }}</span>
                    </td>
                    <td class="px-3 py-3 font-semibold text-ink-900">
                      {{ clinic.servicePrice.amount > 0 ? money(clinic.servicePrice) : '—' }}
                    </td>
                    <td class="px-3 py-3 text-ink-900">{{ clinic.availableSlots }} slots</td>
                    <!-- Placeholder: dental holds no dentist to have experience. -->
                    <td class="px-3 py-3 text-ink-500">Not recorded</td>
                    <!-- Placeholder: the endpoint neither takes nor returns a location. -->
                    <td class="px-3 py-3 text-ink-500">Not available</td>
                    <td class="px-3 py-3">
                      <a
                        [routerLink]="['/member/dental/select-patient']"
                        [queryParams]="{ serviceCode: serviceCode(), clinicId: clinic.id }"
                        class="inline-flex min-h-touch items-center rounded-xl bg-[#0F5FDC] px-4 text-sm font-semibold text-white hover:bg-[#034DA2]"
                        >Book visit</a
                      >
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <p class="mt-4 rounded-xl bg-surface-sunk px-4 py-3 text-sm text-ink-500">
            These are clinics, not individual dentists — we do not hold a dentist on a dental
            booking yet, so experience cannot be compared. Distance needs the clinic list to accept
            your location, which it does not do today.
          </p>
        } @else {
          <opd-empty
            title="No clinics found"
            detail="No clinic near that postal code offers this treatment."
          />
        }
      </div>
    </div>
  `,
})
export class CompareDentistsPage {
  protected readonly services = inject(BenefitServicesStore);
  protected readonly store = inject(ClinicBookingStore);
  private readonly profile = inject(ProfileStore);
  protected readonly money = formatMoney;

  /** The plan's dental consultation — the only thing this journey books. */
  protected readonly serviceCode = computed(
    () => consultationService(this.services.services())?.code ?? '',
  );
  protected readonly pincode = signal('');

  constructor() {
    this.services.select('CAT006');
    // Start from the member's own postal code, so the comparison is useful
    // before they type anything. Still editable — they may be shopping
    // somewhere else.
    effect(() => {
      // ProfileStore already derives this from the member's default address.
      const known = this.profile.pincode();
      if (known && !this.pincode()) this.pincode.set(known);
    });
  }

  protected search(): void {
    const code = this.serviceCode();
    if (!code) return;
    this.store.selectClinics(CLINIC_AREA.Dental, code, this.pincode().trim() || undefined);
  }
}
