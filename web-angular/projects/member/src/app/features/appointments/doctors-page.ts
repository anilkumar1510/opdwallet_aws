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
import { ConsultMode, Doctor } from '../../core/appointments/booking';
import { LocationStore } from '../../core/location/location.store';
import { formatMoney } from '../../core/domain/money';
import { EmptyView, ErrorView, LoadingView } from '../../shared/ui/state-views';

/**
 * Step 2: pick a doctor.
 *
 * In-clinic continues to patient selection with a chosen clinic; online goes
 * straight to confirm, since there is no clinic or slot to pick.
 */
@Component({
  selector: 'opd-doctors-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingView, ErrorView, EmptyView],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[900px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            [routerLink]="['/member', basePath(), 'specialties']"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to specialties"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">Select a Doctor</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">{{ specialtyName() }}</p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[900px] px-5 py-6 lg:px-8">
        <!-- Sheet flow 2, step 3. In-clinic only: an online consultation has no
             clinic to be near, and the API ignores location for type=ONLINE. -->
        @if (!isOnline()) {
          <section class="mb-5 rounded-2xl border border-[#EDF0F7] bg-white p-4 shadow-sm">
            <div class="flex flex-wrap items-center gap-2">
              <label class="min-w-0 flex-1">
                <span class="sr-only">Postal code or area</span>
                <input
                  type="text"
                  inputmode="text"
                  [value]="query()"
                  (input)="query.set($any($event.target).value)"
                  (keydown.enter)="applyTyped()"
                  placeholder="Postal code or area"
                  class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm text-ink-900 outline-none focus:border-[#0F5FDC]"
                />
              </label>
              <button
                type="button"
                class="min-h-touch shrink-0 rounded-xl bg-[#0F5FDC] px-4 text-sm font-semibold text-white disabled:opacity-60"
                [disabled]="location.busy() || !query().trim()"
                (click)="applyTyped()"
              >
                Search
              </button>
              <button
                type="button"
                class="min-h-touch shrink-0 rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900 disabled:opacity-60"
                [disabled]="location.busy()"
                (click)="useMyLocation()"
              >
                {{ location.busy() ? 'Locating…' : 'Use my location' }}
              </button>
            </div>

            @if (location.error(); as problem) {
              <p class="mt-2 text-sm text-danger-700" role="status">{{ problem }}</p>
            }

            @if (location.place(); as here) {
              <p class="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-700">
                <span class="min-w-0 truncate">Near {{ here.label }}</span>
                <button
                  type="button"
                  class="shrink-0 font-medium text-[#034DA2] underline underline-offset-2"
                  (click)="clearLocation()"
                >
                  Clear
                </button>
              </p>
              <!-- Not "nearest first" unconditionally: a doctor whose clinics
                   all fell outside the radius comes back through the API's
                   fallback with no distance at all. -->
              <p class="mt-1 text-xs text-ink-500">
                Clinics we could measure are listed closest first. Any without a
                distance could not be placed.
              </p>
            }
          </section>
        }

        @if (store.loading()) {
          <opd-loading label="Loading doctors" />
        } @else if (store.error(); as error) {
          <opd-error [error]="error" (retry)="reload()" />
        } @else if (store.doctors().length) {
          <ul class="space-y-4">
            @for (doctor of store.doctors(); track doctor.id) {
              <li class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div class="min-w-0">
                    <h2 class="truncate text-lg font-bold text-[#0B2C63]">{{ doctor.name }}</h2>
                    <p class="mt-0.5 text-sm text-ink-700">
                      {{ doctor.specialty }}
                      @if (doctor.qualifications) {
                        · {{ doctor.qualifications }}
                      }
                    </p>
                    @if (doctor.experienceYears) {
                      <p class="mt-0.5 text-xs text-ink-500">
                        {{ doctor.experienceYears }} years experience
                        @if (doctor.languages.length) {
                          · {{ doctor.languages.join(', ') }}
                        }
                      </p>
                    } @else if (doctor.languages.length) {
                      <p class="mt-0.5 text-xs text-ink-500">{{ doctor.languages.join(', ') }}</p>
                    }
                    @if (isOnline() && doctor.nextAvailableLabel) {
                      <p class="mt-0.5 text-xs font-medium text-success-700">
                        Next available: {{ doctor.nextAvailableLabel }}
                      </p>
                    }
                  </div>
                  @if (fee(doctor).amount > 0) {
                    <p class="text-xl font-bold text-[#0B2C63]">{{ money(fee(doctor)) }}</p>
                  }
                </div>

                @if (isOnline()) {
                  <a
                    [routerLink]="['/member/online-consult/confirm']"
                    [queryParams]="{
                      doctorId: doctor.id,
                      specialtyId: specialtyId(),
                      specialtyName: specialtyName(),
                    }"
                    class="mt-4 flex min-h-touch w-full items-center justify-center rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white hover:bg-[#034DA2]"
                    >Consult online</a
                  >
                } @else if (doctor.clinics.length) {
                  <ul class="mt-4 space-y-2 border-t border-surface-border pt-4">
                    @for (clinic of doctor.clinics; track clinic.id) {
                      <li>
                        <a
                          [routerLink]="['/member/appointments/select-patient']"
                          [queryParams]="{
                            doctorId: doctor.id,
                            clinicId: clinic.id,
                            specialtyId: specialtyId(),
                            specialtyName: specialtyName(),
                          }"
                          class="flex items-center justify-between gap-3 rounded-xl border border-surface-border px-4 py-3 transition-colors hover:border-[#0F5FDC]"
                        >
                          <span class="min-w-0">
                            <span class="block truncate text-sm font-medium text-ink-900">{{
                              clinic.name
                            }}</span>
                            <span class="block truncate text-xs text-ink-500">{{
                              clinic.addressLine
                            }}</span>
                            @if (clinic.distanceKm !== null) {
                              <span class="mt-0.5 block text-xs font-medium text-[#034DA2]"
                                >{{ clinic.distanceKm }} km away</span
                              >
                            }
                          </span>
                          <span class="shrink-0 text-sm font-semibold text-[#034DA2]">{{
                            money(clinic.fee)
                          }}</span>
                        </a>
                      </li>
                    }
                  </ul>
                } @else {
                  <p class="mt-4 text-sm text-ink-500">No clinics listed for this doctor.</p>
                }
              </li>
            }
          </ul>
        } @else {
          <opd-empty
            title="No doctors available"
            detail="No doctor in this specialty is available right now."
          />
        }

        <!-- The side journey the sheet opens from this list: a member who cannot
             find their doctor is a network gap worth capturing, not a dead end.
             Shown whether or not the list is empty, because the doctor a member
             wants can be missing from a list of twenty. -->
        <a
          routerLink="/member/appointments/suggest-doctor"
          class="mt-6 flex min-h-touch w-full items-center justify-center rounded-xl border border-dashed border-[#0F5FDC] px-5 text-sm font-medium text-[#0F5FDC] hover:bg-blue-50"
          >Can't find your doctor? Suggest one</a
        >
      </div>
    </div>
  `,
})
export class DoctorsPage {
  readonly mode = input<ConsultMode>('IN_CLINIC');
  readonly specialtyId = input<string>('');
  readonly specialtyName = input<string>('');

  protected readonly store = inject(AppointmentBookingStore);
  protected readonly location = inject(LocationStore);
  protected readonly money = formatMoney;

  protected readonly query = signal('');

  constructor() {
    // Reads location.place(), so choosing or clearing a location re-runs the
    // search on its own. selectDoctors is keyed on the location too, so this
    // does not refetch when nothing relevant changed.
    effect(() => {
      const here = this.location.place();
      this.store.selectDoctors(this.specialtyId(), this.mode(), this.near(here));
    });
  }

  protected readonly isOnline = computed(() => this.mode() === 'ONLINE');
  protected readonly basePath = computed(() =>
    this.isOnline() ? 'online-consult' : 'appointments',
  );

  /**
   * Prefers the postal code when the lookup produced one: the API geocodes a
   * pincode itself, and a pincode survives a page reload in a way a transient
   * fix does not. Falls back to coordinates for a place with no postal code,
   * which is common for a town-level match.
   */
  private near(here: ReturnType<LocationStore['place']>) {
    if (!here) return undefined;
    return here.pincode
      ? { pincode: here.pincode }
      : { latitude: here.latitude, longitude: here.longitude };
  }

  protected async applyTyped(): Promise<void> {
    const typed = this.query().trim();
    if (typed) await this.location.resolve(typed);
  }

  protected async useMyLocation(): Promise<void> {
    const found = await this.location.detect();
    // Show what was detected, so the member can see and correct it.
    if (found) this.query.set(found.pincode || found.city);
  }

  protected clearLocation(): void {
    this.query.set('');
    this.location.clear();
  }

  protected fee(doctor: Doctor) {
    return this.isOnline() ? doctor.onlineFee : (doctor.clinics[0]?.fee ?? doctor.onlineFee);
  }

  protected reload(): void {
    this.store.retryDoctors(this.specialtyId(), this.mode(), this.near(this.location.place()));
  }
}
