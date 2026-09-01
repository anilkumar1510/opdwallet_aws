import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { relationshipLabel } from '../../core/domain/codes';
import { FamilyStore } from '../../core/family/family.store';
import { Member } from '../../core/member/member.model';

/**
 * Shows which family member the portal is acting for, and switches it.
 * Renders nothing when there is nobody to switch to.
 */
@Component({
  selector: 'opd-member-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (family.canSwitch()) {
      <div class="relative">
        <button
          type="button"
          class="flex min-h-touch w-full items-center gap-2 rounded-xl px-3 text-left hover:bg-brand-50"
          [attr.aria-expanded]="open()"
          aria-haspopup="listbox"
          (click)="open.set(!open())"
        >
          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white"
            aria-hidden="true"
            >{{ active()?.initials }}</span
          >
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-medium text-ink-900">{{
              active()?.fullName
            }}</span>
            <span class="block truncate text-xs text-ink-500">{{ activeRelationship() }}</span>
          </span>
          <span class="text-ink-500" aria-hidden="true">▾</span>
        </button>

        @if (open()) {
          <ul
            class="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-surface-border bg-surface shadow-medium"
            role="listbox"
          >
            @for (member of family.family(); track member.id) {
              <li role="option" [attr.aria-selected]="member.id === active()?.id">
                <button
                  type="button"
                  class="flex min-h-touch w-full items-center gap-2 px-3 text-left text-sm hover:bg-brand-50"
                  [class.bg-brand-50]="member.id === active()?.id"
                  (click)="choose(member)"
                >
                  <span class="min-w-0 flex-1 truncate">{{ member.fullName }}</span>
                  <span class="shrink-0 text-xs text-ink-500">{{ label(member) }}</span>
                </button>
              </li>
            }
          </ul>
        }
      </div>
    } @else if (active(); as member) {
      <div class="flex min-h-touch items-center gap-2 px-3">
        <span
          class="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white"
          aria-hidden="true"
          >{{ member.initials }}</span
        >
        <span class="truncate text-sm font-medium text-ink-900">{{ member.fullName }}</span>
      </div>
    }
  `,
})
export class MemberSwitcher {
  protected readonly family = inject(FamilyStore);
  protected readonly open = signal(false);

  protected readonly active = computed(() => this.family.activeMember());
  protected readonly activeRelationship = computed(() => {
    const member = this.active();
    return member ? this.label(member) : '';
  });

  protected label(member: Member): string {
    return relationshipLabel(member.relationship);
  }

  protected choose(member: Member): void {
    this.family.setActiveMember(member);
    this.open.set(false);
  }
}
