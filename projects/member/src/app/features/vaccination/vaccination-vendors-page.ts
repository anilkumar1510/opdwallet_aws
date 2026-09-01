import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { formatMoney } from '../../core/domain/money';
import { ProfileStore } from '../../core/member/profile.store';
import { VaccinationStore } from '../../core/vaccination/vaccination.store';
import { EmptyView, ErrorView, LoadingView } from '../../shared/ui/state-views';

/** Step 2: vendors offering the chosen vaccine. */
@Component({
  selector: 'opd-vaccination-vendors-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, LoadingView, ErrorView, EmptyView],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[900px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            routerLink="/member/vaccination"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to vaccines"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">Select a Provider</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">Vendors offering this vaccine near you</p>
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

        @if (store.vendorsLoading()) {
          <opd-loading label="Finding providers" />
        } @else if (store.vendorsError(); as error) {
          <opd-error [error]="error" (retry)="search()" />
        } @else if (store.vendors().length) {
          <ul class="space-y-4">
            @for (vendor of store.vendors(); track vendor.id) {
              <li class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div class="min-w-0">
                    <h2 class="truncate text-lg font-bold text-[#0B2C63]">{{ vendor.name }}</h2>
                    <p class="mt-0.5 text-sm text-ink-700">{{ vendor.address }}</p>
                    @if (vendor.phone) {
                      <p class="mt-0.5 text-xs text-ink-500">{{ vendor.phone }}</p>
                    }
                  </div>
                  @if (vendor.price.amount > 0) {
                    <p class="text-xl font-bold text-[#0B2C63]">{{ money(vendor.price) }}</p>
                  }
                </div>

                <a
                  [routerLink]="['/member/vaccination/select-patient']"
                  [queryParams]="{ serviceId: serviceId(), vendorId: vendor.id }"
                  class="mt-4 flex min-h-touch w-full items-center justify-center rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white hover:bg-[#034DA2]"
                  [class.pointer-events-none]="!vendor.hasSlots"
                  [class.opacity-40]="!vendor.hasSlots"
                >
                  {{ vendor.hasSlots ? 'Select this provider' : 'No slots available' }}
                </a>
              </li>
            }
          </ul>
        } @else {
          <opd-empty
            title="No providers found"
            detail="No vendor near you offers this vaccine. Try a different pincode."
          />
        }
      </div>
    </div>
  `,
})
export class VaccinationVendorsPage {
  readonly serviceId = input<string>('');

  protected readonly store = inject(VaccinationStore);
  private readonly profile = inject(ProfileStore);

  protected readonly money = formatMoney;
  protected readonly pincode = signal('');

  /** Seeds the pincode exactly once — same latch as the clinic-booking pages. */
  private pincodeSeeded = false;

  constructor() {
    void this.profile.load();

    effect(() => {
      const own = this.profile.pincode();
      if (!own || this.pincodeSeeded) return;
      this.pincodeSeeded = true;
      if (!untracked(() => this.pincode())) this.pincode.set(own);
    });

    effect(() => this.store.loadVendors(this.serviceId(), this.pincode()));
  }

  protected search(): void {
    this.store.retryVendors(this.serviceId(), this.pincode());
  }
}
