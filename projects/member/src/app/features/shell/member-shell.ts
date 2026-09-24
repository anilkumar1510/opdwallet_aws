import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { FamilyStore } from '../../core/family/family.store';
import { CartStore } from '../../core/lab/cart.store';
import { Notification, timeAgo } from '../../core/notifications/notification';
import { NotificationsStore } from '../../core/notifications/notifications.store';
import { SessionStore } from '../../core/session/session.store';
import { DESTINATIONS, SECONDARY_DESTINATIONS } from './destinations';
import { ProfileMenu } from './profile-menu';

/**
 * One layout for every viewport width, matching web-member: a navy top bar at
 * lg and above, a floating frosted pill at the bottom below it.
 *
 * Both surfaces render from DESTINATIONS and both are always in the DOM,
 * shown or hidden by CSS — so a resize never navigates and never drops state.
 */
@Component({
  selector: 'opd-member-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ProfileMenu],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <a
        href="#main"
        class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2"
        >Skip to content</a
      >

      <!-- No desktop top bar at all: the greeting header each page renders is
           the top of the page. Removed on request after the navy bar had already
           been reduced to a white logo strip — so there is no fixed chrome left
           to reserve height for, and this spacer went with it. -->

      <!-- Desktop navigation. It lived in the navy bar, then briefly inside the
           home page's header — which left every OTHER desktop screen with no way
           to reach Bookings or Wallet at all. Navigation belongs to the shell. -->
      @if (session.isAuthenticated()) {
        <div class="mx-auto hidden w-full max-w-[1240px] px-8 pt-3 lg:block">
          <!-- The greeting header, on every desktop screen. It is the phone
               header promoted: same profile menu, same three buttons. The page
               keeps its own on phones, where it sits on the blue hero. -->
          <div class="mb-3 flex items-center justify-between gap-4">
            <opd-profile-menu [showName]="true" />
            <div class="flex items-center gap-3">
              <a
                routerLink="/member/notifications"
                class="relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
                [attr.aria-label]="
                  notifications.unread()
                    ? 'Notifications, ' + notifications.unread() + ' unread'
                    : 'Notifications'
                "
              >
                <img
                  src="images/icons/notification-bell.svg"
                  alt=""
                  width="16"
                  height="18"
                  class="h-[18px] w-4 object-contain brightness-0"
                />
                @if (notifications.unread(); as unread) {
                  <span
                    class="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#F58220] px-1 text-[11px] font-bold text-white"
                    >{{ unread > 9 ? '9+' : unread }}</span
                  >
                }
              </a>
              <a
                routerLink="/member/wallet"
                class="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
                aria-label="Wallet"
              >
                <img
                  src="images/icons/wallet-icon.svg"
                  alt=""
                  width="19"
                  height="16"
                  class="h-4 w-[19px] object-contain brightness-0"
                />
              </a>
              <a
                routerLink="/member/lab-tests"
                class="relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
                [attr.aria-label]="carts.openCount() ? 'Cart, ' + carts.openCount() + ' open' : 'Cart'"
              >
                <img
                  src="images/icons/cart-icon.svg"
                  alt=""
                  width="18"
                  height="18"
                  class="h-[18px] w-[18px] object-contain brightness-0"
                />
                @if (carts.openCount(); as open) {
                  <span
                    class="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#F58220] px-1 text-[11px] font-bold text-white"
                    >{{ open > 9 ? '9+' : open }}</span
                  >
                }
              </a>
            </div>
          </div>

          <nav class="flex gap-8 border-b border-surface-border" aria-label="Main">
            @for (destination of destinations; track destination.path) {
              <a
                [routerLink]="destination.path"
                routerLinkActive="!border-[#0F5FDC] !text-[#0F5FDC]"
                [routerLinkActiveOptions]="{ exact: destination.exact }"
                ariaCurrentWhenActive="page"
                class="-mb-px border-b-2 border-transparent pb-2 text-base font-medium leading-[1.2] text-[#383838] transition-colors hover:text-[#0F5FDC]"
                >{{ destination.label }}</a
              >
            }
          </nav>
        </div>
      }

      <main id="main" class="overflow-y-auto pb-32 lg:pb-0" role="main">
        <!-- Render nothing once the session has ended.
             SessionStore.terminate() clears state and navigates, but the
             navigation is a
             tick behind, and gated stores return empty rather than unfetched -
             so without this the member sees confident falsehoods in the gap
             ("No claims yet" over data they still have). A spinner would be no
             better: it asserts a pending fetch when nothing is pending and the
             outcome is already decided. The reference never reaches this state
             because it does not gate on auth; it fires and takes the 401. -->
        @if (session.isAuthenticated()) {
          <router-outlet />
        }
      </main>

      <!-- Mobile: floating frosted pill -->
      <div class="pointer-events-none fixed inset-x-0 bottom-0 z-50 h-[159px] lg:hidden">
        <div
          class="absolute inset-0 -scale-y-100"
          style="background: linear-gradient(to bottom, #b8c4d0, rgba(184,196,208,0))"
        ></div>

        <nav
          class="pointer-events-auto absolute bottom-5 left-1/2 flex h-[63px] -translate-x-1/2 items-center justify-center gap-1 rounded-[49px] border border-white/50 bg-white/25 p-1 backdrop-blur-[20px]"
          style="box-shadow: 0 8px 32px rgba(0,0,0,.1), inset 0 1px 0 rgba(255,255,255,.4)"
          aria-label="Main"
        >
          <a
            routerLink="/member"
            routerLinkActive
            [routerLinkActiveOptions]="{ exact: true }"
            ariaCurrentWhenActive="page"
            class="flex h-[55px] flex-col items-center justify-center gap-[3px] rounded-[46px] px-5 text-white no-underline"
            style="background: linear-gradient(180deg,#1a6fd4 0%,#034da2 100%); box-shadow: 0 4px 12px rgba(3,77,162,.3)"
          >
            <!-- The source art is already white, so no filter here. -->
            <img
              src="images/icons/home-icon.png"
              alt=""
              width="18"
              height="18"
              class="object-contain"
            />
            <span class="whitespace-nowrap text-xs font-semibold">Home</span>
          </a>

          <div
            class="flex h-full items-center justify-center gap-2 rounded-[26.5px] border border-white/20 bg-white/30 px-2 backdrop-blur-[10px]"
          >
            @for (destination of secondaryDestinations; track destination.path) {
              <a
                [routerLink]="destination.path"
                routerLinkActive="bg-[#034da2]/15 font-bold"
                ariaCurrentWhenActive="page"
                class="flex flex-col items-center gap-[3px] rounded-full px-3 py-1 text-[#034da2] no-underline transition-all"
              >
                <img
                  [src]="destination.iconSrc"
                  alt=""
                  width="18"
                  height="18"
                  class="object-contain"
                />
                <span class="whitespace-nowrap text-xs font-semibold">{{ destination.label }}</span>
              </a>
            }
          </div>
        </nav>
      </div>
    </div>
  `,
})
export class MemberShell {
  protected readonly session = inject(SessionStore);
  private readonly router = inject(Router);

  protected readonly family = inject(FamilyStore);
  protected readonly destinations = DESTINATIONS;
  protected readonly carts = inject(CartStore);
  protected readonly secondaryDestinations = SECONDARY_DESTINATIONS;
  protected readonly notificationsOpen = signal(false);
  protected readonly notifications = inject(NotificationsStore);
  protected readonly ago = timeAgo;

  /** The list is fetched on open, not polled — only the badge polls. */
  protected toggleNotifications(): void {
    const open = !this.notificationsOpen();
    this.notificationsOpen.set(open);
    if (open) void this.notifications.load();
  }

  protected async openNotification(item: Notification): Promise<void> {
    await this.notifications.markRead(item.id);
    if (item.actionUrl) {
      this.notificationsOpen.set(false);
      await this.router.navigate([item.actionUrl]);
    }
  }

  protected async signOut(): Promise<void> {
    // No navigate here: SessionStore.terminate() owns it, so sign-out and a
    // rejected session end identically.
    await this.session.logout();
  }
}
