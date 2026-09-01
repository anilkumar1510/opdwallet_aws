import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { AppointmentBookingStore } from '../../core/appointments/booking.store';
import { ConsultDay } from '../../core/appointments/booking';
import { LoadingView } from '../../shared/ui/state-views';

const DAY = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

/** Step 4, in-clinic only: pick a day and time at the chosen clinic. */
@Component({
  selector: 'opd-appointment-slot-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingView],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[900px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            [routerLink]="['/member/appointments/select-patient']"
            [queryParams]="{
              doctorId: doctorId(),
              clinicId: clinicId(),
              specialtyId: specialtyId(),
              specialtyName: specialtyName(),
            }"
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
          @for (day of days(); track day.date) {
            <button
              type="button"
              class="min-h-touch shrink-0 rounded-xl border px-4 text-sm font-medium transition-colors"
              [class]="
                day.date === date()
                  ? 'border-[#034DA2] bg-[#034DA2] text-white'
                  : 'border-[#E5E7EB] bg-white text-ink-700'
              "
              (click)="date.set(day.date)"
            >
              {{ label(day.date) }}
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
                  [routerLink]="['/member/appointments/confirm']"
                  [queryParams]="{
                    doctorId: doctorId(),
                    clinicId: clinicId(),
                    specialtyId: specialtyId(),
                    specialtyName: specialtyName(),
                    patientId: patientId(),
                    slotId: slot.id,
                    appointmentDate: date(),
                    timeSlot: slot.label,
                  }"
                  class="flex min-h-touch items-center justify-center rounded-xl border border-[#E5E7EB] bg-white px-3 text-sm font-medium text-ink-700 transition-colors hover:border-[#0F5FDC] hover:text-[#034DA2]"
                  [class.pointer-events-none]="!slot.isAvailable"
                  [class.opacity-40]="!slot.isAvailable"
                >
                  {{ slot.label }}
                </a>
              </li>
            }
          </ul>
        } @else {
          <div class="rounded-2xl border border-[#EDF0F7] bg-white p-6 text-center shadow-sm">
            <p class="font-medium text-ink-900">No slots on this day</p>
            <p class="mt-1 text-sm text-ink-500">
              This doctor may not consult at this clinic on this weekday. Try another date.
            </p>
          </div>
        }
      </div>
    </div>
  `,
})
export class AppointmentSlotPage {
  readonly doctorId = input<string>('');
  readonly clinicId = input<string>('');
  readonly specialtyId = input<string>('');
  readonly specialtyName = input<string>('');
  readonly patientId = input<string>('');

  private readonly store = inject(AppointmentBookingStore);

  protected readonly loading = signal(false);

  /**
   * Only the days the API returns. It answers with the doctor's actual
   * schedule, so a fixed strip of the next fourteen dates would offer days
   * this doctor never consults on.
   */
  protected readonly days = signal<readonly ConsultDay[]>([]);
  protected readonly date = signal('');

  protected readonly slots = computed(
    () => this.days().find((day) => day.date === this.date())?.slots ?? [],
  );

  constructor() {
    effect(() => {
      const doctor = this.doctorId();
      const clinic = this.clinicId();
      if (!doctor) return;
      void this.fetch(doctor, clinic);
    });
  }

  protected label(iso: string): string {
    const day = new Date(iso);
    if (Number.isNaN(day.getTime())) return iso;
    return iso === new Date().toISOString().slice(0, 10) ? 'Today' : DAY.format(day);
  }

  private async fetch(doctorId: string, clinicId: string): Promise<void> {
    this.loading.set(true);
    try {
      const days = await this.store.days(doctorId, clinicId);
      this.days.set(days);
      // Keep the chosen day if it survived the refetch, else open on the first.
      if (!days.some((day) => day.date === this.date())) this.date.set(days[0]?.date ?? '');
    } finally {
      this.loading.set(false);
    }
  }
}
