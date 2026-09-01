import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ClinicSlot } from '../../core/clinic-booking/clinic-booking';
import { VaccinationStore } from '../../core/vaccination/vaccination.store';
import { LoadingView } from '../../shared/ui/state-views';

const DAY = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

/** Step 4: pick a day and a time. */
@Component({
  selector: 'opd-vaccination-slot-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingView],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[900px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            [routerLink]="['/member/vaccination/select-patient']"
            [queryParams]="{ serviceId: serviceId(), vendorId: vendorId() }"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to patient"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">Select a Slot</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">Choose a date and time</p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[900px] px-5 py-6 lg:px-8">
        <div class="scrollbar-hide mb-5 flex gap-2 overflow-x-auto pb-1">
          @for (day of days; track day.iso) {
            <button
              type="button"
              class="min-h-touch shrink-0 rounded-xl border px-4 text-sm font-medium transition-colors"
              [class]="
                day.iso === date()
                  ? 'border-[#034DA2] bg-[#034DA2] text-white'
                  : 'border-[#E5E7EB] bg-white text-ink-700'
              "
              (click)="date.set(day.iso)"
            >
              {{ day.label }}
            </button>
          }
        </div>

        @if (loading()) {
          <opd-loading label="Loading slots" />
        } @else if (slots().length) {
          <ul class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            @for (slot of slots(); track slot.id) {
              <li>
                <a
                  [routerLink]="['/member/vaccination/confirm']"
                  [queryParams]="{
                    serviceId: serviceId(),
                    vendorId: vendorId(),
                    patientId: patientId(),
                    slotId: slot.slotId,
                    appointmentDate: slot.date,
                    appointmentTime: slot.startTime,
                  }"
                  class="flex min-h-touch items-center justify-center rounded-xl border border-[#E5E7EB] bg-white px-3 text-sm font-medium text-ink-700 transition-colors hover:border-[#0F5FDC] hover:text-[#034DA2]"
                  [class.pointer-events-none]="!slot.isAvailable"
                  [class.opacity-40]="!slot.isAvailable"
                >
                  {{ slot.startTime }}
                </a>
              </li>
            }
          </ul>
        } @else {
          <div class="rounded-2xl border border-[#EDF0F7] bg-white p-6 text-center shadow-sm">
            <p class="font-medium text-ink-900">No slots on this day</p>
            <p class="mt-1 text-sm text-ink-500">Try another date.</p>
          </div>
        }
      </div>
    </div>
  `,
})
export class VaccinationSlotPage {
  readonly serviceId = input<string>('');
  readonly vendorId = input<string>('');
  readonly patientId = input<string>('');

  private readonly store = inject(VaccinationStore);

  protected readonly slots = signal<readonly ClinicSlot[]>([]);
  protected readonly loading = signal(false);

  /** Fourteen bookable days; the API takes one date at a time. */
  protected readonly days = Array.from({ length: 14 }, (_, offset) => {
    const day = new Date();
    day.setDate(day.getDate() + offset);
    return {
      iso: day.toISOString().slice(0, 10),
      label: offset === 0 ? 'Today' : DAY.format(day),
    };
  });

  protected readonly date = signal(this.days[0].iso);

  constructor() {
    effect(() => {
      const vendor = this.vendorId();
      const day = this.date();
      if (!vendor) return;
      void this.fetch(vendor, day);
    });
  }

  private async fetch(vendorId: string, date: string): Promise<void> {
    this.loading.set(true);
    try {
      this.slots.set(await this.store.slots(vendorId, date));
    } finally {
      this.loading.set(false);
    }
  }
}
