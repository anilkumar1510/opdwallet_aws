import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { relationshipLabel } from '../../core/domain/codes';
import { FamilyStore } from '../../core/family/family.store';
import { Member } from '../../core/member/member.model';
import { SessionStore } from '../../core/session/session.store';
import { Icon } from '../../shared/ui/icon';

/**
 * Avatar in the top bar. Doubles as the family-member switcher, so switching
 * lives where the reference portal puts it rather than in a separate control.
 */
@Component({
  selector: 'opd-profile-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon],
  template: `
    <div class="relative">
      @if (showName()) {
        <!-- Home header on a phone: avatar, greeting and the same menu. -->
        <button
          type="button"
          class="flex items-center gap-[9px] text-left"
          [attr.aria-expanded]="open()"
          aria-haspopup="menu"
          [attr.aria-label]="'Account menu for ' + (active()?.fullName ?? 'member')"
          (click)="open.set(!open())"
        >
          <span
            class="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-white/25 text-[11px] font-medium text-white lg:h-10 lg:w-10 lg:bg-[#0F5FDC] lg:text-[13px] lg:text-white"
            >{{ active()?.initials }}</span
          >
          <span class="flex flex-col gap-[2px]">
            <span class="flex items-center gap-[5px] text-[16px] font-medium leading-[1.2] text-white lg:text-xl lg:font-medium lg:leading-[1.2] lg:text-[#1c1c1c]">
              Hi {{ firstName() }}!
              <span
                class="transition-transform duration-200"
                [class]="open() ? 'rotate-180' : 'rotate-90'"
                aria-hidden="true"
                ><opd-icon name="chevronRight" [size]="14" [strokeWidth]="1.8"
              /></span>
            </span>
            <span class="text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-[#656565]">welcome to OPD Wallet</span>
          </span>
        </button>
      } @else {
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-white transition-colors hover:bg-white/25"
          [attr.aria-expanded]="open()"
          aria-haspopup="menu"
          [attr.aria-label]="'Account menu for ' + (active()?.fullName ?? 'member')"
          (click)="open.set(!open())"
        >
          {{ active()?.initials }}
        </button>
      }

      @if (open()) {
        <!-- Click-away layer; sits under the menu but over the page. -->
        <button
          type="button"
          class="fixed inset-0 z-40 cursor-default"
          tabindex="-1"
          aria-hidden="true"
          (click)="open.set(false)"
        ></button>

        <div
          class="absolute z-50 mt-2 w-60 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
          [class]="showName() ? 'left-0' : 'right-0'"
          role="menu"
        >
          <div class="px-4 py-3">
            <p class="truncate text-sm font-semibold text-[#1c1c1c]">{{ active()?.fullName }}</p>
            <p class="truncate text-xs text-[#656565]">{{ active()?.memberId }}</p>
          </div>

          @if (family.canSwitch()) {
            <div class="border-t border-gray-100 py-1">
              <p class="px-4 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-[#9ca3af]">
                Switch profile
              </p>
              @for (member of family.family(); track member.id) {
                <button
                  type="button"
                  role="menuitem"
                  class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50"
                  [class.bg-blue-50]="member.id === active()?.id"
                  (click)="choose(member)"
                >
                  <span
                    class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-[#0E51A2]"
                    style="background: linear-gradient(261.92deg, rgba(223,232,255,.75) 4.4%, rgba(189,209,255,.75) 91.97%); border: 1px solid #A4BFFE7A"
                    >{{ member.initials }}</span
                  >
                  <span class="min-w-0 flex-1 truncate text-[#383838]">{{ member.fullName }}</span>
                  <span class="shrink-0 text-xs text-[#9ca3af]">{{ label(member) }}</span>
                </button>
              }
            </div>
          }

          <div class="border-t border-gray-100 py-1">
            <a
              routerLink="/member/profile"
              role="menuitem"
              class="block px-4 py-3 text-sm text-[#383838] transition-colors hover:bg-gray-50"
              (click)="open.set(false)"
              >Profile</a
            >
            <a
              routerLink="/member/services"
              role="menuitem"
              class="block px-4 py-3 text-sm text-[#383838] transition-colors hover:bg-gray-50"
              (click)="open.set(false)"
              >All Services</a
            >
            <a
              routerLink="/member/settings"
              role="menuitem"
              class="block px-4 py-3 text-sm text-[#383838] transition-colors hover:bg-gray-50"
              (click)="open.set(false)"
              >Settings</a
            >
            <button
              type="button"
              role="menuitem"
              class="w-full px-4 py-3 text-left text-sm text-[#EF4444] transition-colors hover:bg-red-50"
              (click)="signOut()"
            >
              Log Out
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class ProfileMenu {
  private readonly session = inject(SessionStore);

  /** Home header variant: avatar plus "Hi <first name>!" and the greeting. */
  readonly showName = input(false);

  protected readonly family = inject(FamilyStore);
  protected readonly open = signal(false);
  protected readonly active = computed(() => this.family.activeMember());
  protected readonly firstName = computed(
    () => this.active()?.fullName.split(' ')[0] ?? 'there',
  );

  protected label(member: Member): string {
    return relationshipLabel(member.relationship);
  }

  protected choose(member: Member): void {
    this.family.setActiveMember(member);
    this.open.set(false);
  }

  protected async signOut(): Promise<void> {
    this.open.set(false);
    // No navigate here: SessionStore.terminate() owns it, so sign-out and a
    // rejected session end identically.
    await this.session.logout();
  }
}
