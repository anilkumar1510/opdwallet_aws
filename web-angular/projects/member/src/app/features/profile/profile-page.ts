import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { relationshipLabel } from '../../core/domain/codes';
import { FamilyStore } from '../../core/family/family.store';
import { ProfileStore } from '../../core/member/profile.store';
import { EmptyView, LoadingView } from '../../shared/ui/state-views';
import { BackLink } from '../../shared/ui/back-link';
import { PageHeader } from '../../shared/ui/page-header';

const DATE = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

@Component({
  selector: 'opd-profile-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LoadingView, EmptyView, BackLink, PageHeader],
  template: `
    <opd-page-header title="Profile" subtitle="Your details and saved addresses" />

    <div class="mx-auto w-full max-w-[480px] px-5 pb-5 pt-6 lg:max-w-[1240px] lg:px-8 lg:py-6">
      <div class="hidden lg:block">
        <opd-back-link />
        <h1 class="text-2xl font-bold text-black lg:text-3xl">Profile</h1>
        <p class="mt-0.5 text-sm text-ink-500">Your details and saved addresses</p>
      </div>

      @if (member(); as person) {
        <section
          class="mt-5 rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white p-5"
          style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.24)"
        >
          <div class="flex items-center gap-3">
            <span
              class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-[#0E51A2]"
              style="background: linear-gradient(261.92deg, rgba(223,232,255,.75) 4.4%, rgba(189,209,255,.75) 91.97%); border: 1px solid #A4BFFE7A"
              aria-hidden="true"
              >{{ person.initials }}</span
            >
            <div class="min-w-0">
              <p class="truncate text-lg font-semibold text-[#034DA2]">{{ person.fullName }}</p>
              <p class="text-sm text-ink-500">{{ relationship() }}</p>
            </div>
          </div>

          <dl class="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            @for (row of details(); track row.label) {
              <div class="flex justify-between gap-3 border-b border-surface-border pb-2">
                <dt class="text-sm text-ink-500">{{ row.label }}</dt>
                <dd class="truncate text-sm font-medium text-ink-900">{{ row.value }}</dd>
              </div>
            }
          </dl>
        </section>

        <section class="mt-6">
          <h2 class="mb-3 text-[18px] font-medium text-[#1c1c1c]">Saved addresses</h2>

          @if (addresses.loading()) {
            <opd-loading label="Loading addresses" />
          } @else if (addresses.error()) {
            <opd-empty
              title="Addresses unavailable"
              detail="We could not load your saved addresses right now."
            />
          } @else if (addresses.addresses().length) {
            <ul class="grid gap-3 sm:grid-cols-2">
              @for (address of addresses.addresses(); track address.id) {
                <li
                  class="rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white p-4"
                  style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.24)"
                >
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold text-[#034DA2]">{{ address.typeLabel }}</span>
                    @if (address.isDefault) {
                      <span class="rounded-md bg-success-50 px-1.5 py-0.5 text-xs font-medium text-success-700"
                        >Default</span
                      >
                    }
                  </div>
                  <p class="mt-1 text-sm text-ink-700">{{ address.lines.join(', ') }}</p>
                </li>
              }
            </ul>
          } @else {
            <opd-empty title="No saved addresses" detail="Addresses you save appear here." />
          }
        </section>
      } @else {
        <opd-loading label="Loading profile" />
      }
    </div>
  `,
})
export class ProfilePage {
  private readonly family = inject(FamilyStore);
  protected readonly addresses = inject(ProfileStore);

  protected readonly member = computed(() => this.family.activeMember());

  protected readonly relationship = computed(() => {
    const person = this.member();
    return person ? relationshipLabel(person.relationship) : '';
  });

  protected readonly details = computed(() => {
    const person = this.member();
    if (!person) return [];
    return [
      { label: 'Member ID', value: person.memberId || '—' },
      { label: 'UHID', value: person.uhid ?? '—' },
      { label: 'Email', value: person.email ?? '—' },
      { label: 'Phone', value: person.phone ?? '—' },
      { label: 'Date of birth', value: person.dateOfBirth ? DATE.format(person.dateOfBirth) : '—' },
      { label: 'Gender', value: person.gender ? this.titleCase(person.gender) : '—' },
    ];
  });

  private titleCase(value: string): string {
    return value.charAt(0) + value.slice(1).toLowerCase();
  }
}
