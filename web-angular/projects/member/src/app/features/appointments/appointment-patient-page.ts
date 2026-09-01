import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { relationshipLabel } from '../../core/domain/codes';
import { FamilyStore } from '../../core/family/family.store';
import { Member } from '../../core/member/member.model';
import { EmptyView, LoadingView } from '../../shared/ui/state-views';

/** Step 3, in-clinic only: who is this appointment for. */
@Component({
  selector: 'opd-appointment-patient-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingView, EmptyView],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[900px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            [routerLink]="['/member/appointments/doctors']"
            [queryParams]="{ specialtyId: specialtyId(), specialtyName: specialtyName() }"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to doctors"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">Select Patient</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">Who is this appointment for?</p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[900px] px-5 py-6 lg:px-8">
        @if (family.loading()) {
          <opd-loading label="Loading family" />
        } @else if (family.family().length) {
          <ul class="grid gap-4 sm:grid-cols-2">
            @for (member of family.family(); track member.id) {
              <li>
                <a
                  [routerLink]="['/member/appointments/select-slot']"
                  [queryParams]="{
                    doctorId: doctorId(),
                    clinicId: clinicId(),
                    specialtyId: specialtyId(),
                    specialtyName: specialtyName(),
                    patientId: member.id,
                  }"
                  class="block rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm transition-colors hover:border-[#0F5FDC]"
                  [class.bg-blue-50]="isActive(member)"
                >
                  <div class="flex items-center gap-3">
                    <span
                      class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-[#0E51A2]"
                      style="background: linear-gradient(261.92deg, rgba(223,232,255,.75) 4.4%, rgba(189,209,255,.75) 91.97%); border: 1px solid #A4BFFE7A"
                      aria-hidden="true"
                      >{{ member.initials }}</span
                    >
                    <div class="min-w-0">
                      <p class="truncate font-semibold text-[#034DA2]">{{ member.fullName }}</p>
                      <p class="text-sm text-ink-500">{{ relationship(member) }}</p>
                      <!-- Marks who the portal is currently acting for. Marker
                           only: tapping any member still books for that member,
                           so there is no default and no extra step. -->
                      @if (isActive(member)) {
                        <p class="mt-1 text-xs font-medium text-[#0F5FDC]">Currently viewing</p>
                      }
                    </div>
                  </div>
                </a>
              </li>
            }
          </ul>
        } @else {
          <opd-empty title="No family members" detail="We could not load who to book for." />
        }
      </div>
    </div>
  `,
})
export class AppointmentPatientPage {
  readonly doctorId = input<string>('');
  readonly clinicId = input<string>('');
  readonly specialtyId = input<string>('');
  readonly specialtyName = input<string>('');

  protected readonly family = inject(FamilyStore);

  protected relationship(member: Member): string {
    return relationshipLabel(member.relationship);
  }

  /** The member the portal is acting for, per FamilyStore. Marker only. */
  protected isActive(member: Member): boolean {
    return member.id === this.family.activeMember()?.id;
  }
}
