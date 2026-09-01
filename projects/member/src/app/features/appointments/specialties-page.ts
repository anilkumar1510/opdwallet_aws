import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { AppointmentBookingStore } from '../../core/appointments/booking.store';
import { ConsultMode } from '../../core/appointments/booking';
import { EmptyView, ErrorView, LoadingView } from '../../shared/ui/state-views';

/** Step 1: pick a specialty. Shared by in-clinic and online. */
@Component({
  selector: 'opd-specialties-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingView, ErrorView, EmptyView],
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
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">Select a Specialty</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">{{ subtitle() }}</p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[900px] px-5 py-6 lg:px-8">
        @if (store.loading()) {
          <opd-loading label="Loading specialties" />
        } @else if (store.error(); as error) {
          <opd-error [error]="error" (retry)="store.loadSpecialties(mode())" />
        } @else if (store.specialties().length) {
          <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            @for (specialty of store.specialties(); track specialty.id) {
              <li>
                <a
                  [routerLink]="['/member', basePath(), 'doctors']"
                  [queryParams]="{ specialtyId: specialty.id, specialtyName: specialty.name }"
                  class="block h-full rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm transition-colors hover:border-[#0F5FDC]"
                >
                  <h2 class="font-semibold text-[#034DA2]">{{ specialty.name }}</h2>
                  @if (specialty.description) {
                    <p class="mt-1 text-sm text-ink-700">{{ specialty.description }}</p>
                  }
                </a>
              </li>
            }
          </ul>
        } @else {
          <opd-empty title="No specialties" detail="No specialties are available right now." />
        }
      </div>
    </div>
  `,
})
export class SpecialtiesPage {
  readonly mode = input<ConsultMode>('IN_CLINIC');

  protected readonly store = inject(AppointmentBookingStore);

  constructor() {
    effect(() => this.store.loadSpecialties(this.mode()));
  }

  protected readonly basePath = computed(() =>
    this.mode() === 'ONLINE' ? 'online-consult' : 'appointments',
  );

  protected readonly subtitle = computed(() =>
    this.mode() === 'ONLINE'
      ? 'Choose a specialty for your video consultation'
      : 'Choose a specialty to see available doctors',
  );
}
