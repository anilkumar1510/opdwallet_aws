import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { relationshipLabel } from '../../core/domain/codes';
import { FamilyStore } from '../../core/family/family.store';
import { ProfileStore } from '../../core/member/profile.store';
import { SessionStore } from '../../core/session/session.store';

const DATE = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const TABS = [
  { id: 'profile', name: 'Profile' },
  { id: 'notifications', name: 'Notifications' },
  { id: 'security', name: 'Security' },
  { id: 'preferences', name: 'Preferences' },
] as const;

type TabId = (typeof TABS)[number]['id'];

/**
 * Ported from web-member's app/member/settings/page.tsx.
 *
 * The reference renders these fields as static inputs with no save endpoint;
 * they are shown read-only here rather than as inputs that silently discard
 * edits. The member's own values come from stores already loaded.
 */
@Component({
  selector: 'opd-settings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[900px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            routerLink="/member"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to home"
            >&larr;</a
          >
          <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">Settings</h1>
        </div>
      </header>

      <div class="mx-auto max-w-[900px] px-5 py-6 lg:px-8">
        <div class="scrollbar-hide mb-5 flex gap-2 overflow-x-auto pb-1">
          @for (tab of tabs; track tab.id) {
            <button
              type="button"
              class="min-h-touch shrink-0 rounded-full border px-4 text-sm font-medium transition-colors"
              [class]="
                tab.id === active()
                  ? 'border-[#034DA2] bg-[#034DA2] text-white'
                  : 'border-[#E5E7EB] bg-white text-ink-700'
              "
              [attr.aria-pressed]="tab.id === active()"
              (click)="active.set(tab.id)"
            >
              {{ tab.name }}
            </button>
          }
        </div>

        @switch (active()) {
          @case ('profile') {
            <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
              <h2 class="mb-4 text-base font-semibold text-[#0E51A2] lg:text-lg">
                Personal Information
              </h2>
              <dl class="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                @for (row of personal(); track row.label) {
                  <div class="flex justify-between gap-3 border-b border-surface-border pb-2">
                    <dt class="text-sm text-ink-500">{{ row.label }}</dt>
                    <dd class="truncate text-sm font-medium text-ink-900">{{ row.value }}</dd>
                  </div>
                }
              </dl>
            </section>

            <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
              <h2 class="mb-4 text-base font-semibold text-[#0E51A2] lg:text-lg">
                Address Information
              </h2>
              @if (profile.addresses().length) {
                <ul class="space-y-3">
                  @for (address of profile.addresses(); track address.id) {
                    <li class="rounded-xl border border-surface-border px-4 py-3">
                      <p class="text-sm font-medium text-ink-900">{{ address.typeLabel }}</p>
                      <p class="mt-0.5 text-sm text-ink-700">{{ address.lines.join(', ') }}</p>
                    </li>
                  }
                </ul>
              } @else {
                <p class="text-sm text-ink-500">No addresses saved.</p>
              }
            </section>

            <p class="mt-4 text-xs text-ink-500">
              To change these details, contact your administrator — the member portal has no
              endpoint to update them.
            </p>
          }

          @case ('notifications') {
            <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
              <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">Notifications</h2>
              <p class="mt-2 text-sm text-ink-700">
                Notification preferences are not configurable from the member portal.
              </p>
            </section>
          }

          @case ('security') {
            <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
              <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">Security</h2>
              <p class="mt-2 text-sm text-ink-700">
                Your session uses a secure, http-only cookie. Password changes are handled by your
                administrator.
              </p>
            </section>
          }

          @case ('preferences') {
            <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
              <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">Preferences</h2>
              <p class="mt-2 text-sm text-ink-700">
                Amounts show in Indian rupees and dates in your local format.
              </p>
            </section>
          }
        }
      </div>
    </div>
  `,
})
export class SettingsPage {
  private readonly session = inject(SessionStore);
  private readonly family = inject(FamilyStore);
  protected readonly profile = inject(ProfileStore);

  protected readonly tabs = TABS;
  protected readonly active = signal<TabId>('profile');

  constructor() {
    void this.profile.load();
  }

  protected readonly personal = computed(() => {
    const member = this.session.member() ?? this.family.activeMember();
    if (!member) return [];
    return [
      { label: 'Full Name', value: member.fullName },
      { label: 'Email', value: member.email ?? '—' },
      { label: 'Phone', value: member.phone ?? '—' },
      {
        label: 'Date of Birth',
        value: member.dateOfBirth ? DATE.format(member.dateOfBirth) : '—',
      },
      { label: 'Member ID', value: member.memberId || '—' },
      { label: 'Relationship', value: relationshipLabel(member.relationship) },
    ];
  });
}
