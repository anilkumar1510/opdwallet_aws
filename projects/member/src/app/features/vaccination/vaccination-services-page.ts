import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { VaccinationStore } from '../../core/vaccination/vaccination.store';
import { EmptyView, ErrorView, LoadingView } from '../../shared/ui/state-views';

/** Step 1: pick a vaccine from the member's covered catalogue. */
@Component({
  selector: 'opd-vaccination-services-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingView, ErrorView, EmptyView],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[900px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            routerLink="/member"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">Vaccination</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">Choose a vaccine</p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[900px] px-5 py-6 lg:px-8">
        @if (store.servicesLoading()) {
          <opd-loading label="Loading vaccines" />
        } @else if (store.servicesError(); as error) {
          <opd-error [error]="error" (retry)="store.retryServices()" />
        } @else if (store.services().length) {
          <ul class="space-y-4">
            @for (service of store.services(); track service.id) {
              <li class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div class="min-w-0">
                    <h2 class="truncate text-lg font-bold text-[#0B2C63]">{{ service.name }}</h2>
                    @if (service.description) {
                      <p class="mt-0.5 text-sm text-ink-700">{{ service.description }}</p>
                    }
                    <p class="mt-0.5 text-xs text-ink-500">
                      @if (service.manufacturer) {
                        {{ service.manufacturer }}
                      }
                      @if (service.dosesRequired) {
                        · {{ service.dosesRequired }} dose{{ service.dosesRequired > 1 ? 's' : '' }}
                      }
                      @if (service.ageGroup) {
                        · Age {{ service.ageGroup }}
                      }
                    </p>
                  </div>
                </div>

                <a
                  [routerLink]="['/member/vaccination/vendors']"
                  [queryParams]="{ serviceId: service.id }"
                  class="mt-4 flex min-h-touch w-full items-center justify-center rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white hover:bg-[#034DA2]"
                >
                  Select this vaccine
                </a>
              </li>
            }
          </ul>
        } @else {
          <opd-empty title="No vaccines available" detail="Vaccination is not part of your active plan." />
        }
      </div>
    </div>
  `,
})
export class VaccinationServicesPage {
  protected readonly store = inject(VaccinationStore);

  constructor() {
    this.store.loadServices();
  }
}
