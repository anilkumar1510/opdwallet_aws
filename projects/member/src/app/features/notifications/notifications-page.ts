import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { Notification, timeAgo } from '../../core/notifications/notification';
import { NotificationsStore } from '../../core/notifications/notifications.store';
import { Icon } from '../../shared/ui/icon';

/**
 * The full-screen notification list at /member/notifications.
 *
 * web-member has no such page — it only has the shell's bell dropdown, which
 * this app already carries. The route exists because web-member-rn does have a
 * screen, and a dropdown anchored to a 9x9 button is a poor list on a phone.
 *
 * Same store as the dropdown, so the badge, the read flags and this list can
 * never disagree.
 */
@Component({
  selector: 'opd-notifications-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header class="sticky top-0 z-10 border-b border-surface-border bg-white shadow-sm">
        <div class="mx-auto flex max-w-[1240px] items-center gap-4 px-5 py-4 lg:px-8">
          <a
            routerLink="/member"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#0E51A2] hover:bg-gray-100"
            aria-label="Back to home"
            >&larr;</a
          >
          <div class="min-w-0 flex-1">
            <h1 class="text-lg font-bold text-[#0E51A2] lg:text-xl">Notifications</h1>
            <p class="truncate text-xs text-ink-600 lg:text-sm">
              @if (notifications.unread(); as unread) {
                {{ unread }} unread
              } @else {
                You're all caught up
              }
            </p>
          </div>
          @if (notifications.unread()) {
            <button
              type="button"
              class="min-h-touch shrink-0 rounded-xl px-3 text-xs font-semibold text-[#0F5FDC] hover:bg-gray-100 lg:text-sm"
              (click)="notifications.markAllRead()"
            >
              Mark all as read
            </button>
          }
        </div>
      </header>

      <div class="mx-auto max-w-[720px] px-5 py-6 lg:px-8 lg:py-10">
        @if (notifications.loading()) {
          <p class="py-12 text-center text-sm text-ink-500">Loading&hellip;</p>
        } @else if (notifications.notifications().length) {
          <ul class="overflow-hidden rounded-2xl border border-surface-border bg-white shadow-sm">
            @for (item of notifications.notifications(); track item.id) {
              <li class="border-b border-surface-border last:border-b-0">
                <button
                  type="button"
                  class="w-full px-4 py-4 text-left transition-colors hover:bg-gray-50 lg:px-5"
                  [class.bg-blue-50]="!item.isRead"
                  (click)="open(item)"
                >
                  <p class="text-sm font-medium lg:text-base" [class]="item.priorityClass">
                    {{ item.title }}
                  </p>
                  <p class="mt-0.5 text-xs text-ink-700 lg:text-sm">{{ item.message }}</p>
                  <p class="mt-1 text-[11px] text-ink-500">{{ ago(item.createdAt) }}</p>
                </button>
              </li>
            }
          </ul>
        } @else {
          <section
            class="rounded-2xl border-2 border-[#86ACD8] p-8 text-center shadow-md lg:p-12"
            style="background: linear-gradient(135deg, rgba(224,233,255,0.48) 0%, rgba(200,216,255,0.48) 100%)"
          >
            <span
              class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full text-[#0F5FDC]"
              style="background: linear-gradient(180deg,#CDDDFE 0%,#E4EBFE 100%); border: 1px solid #A4BFFE7A"
              aria-hidden="true"
            >
              <opd-icon name="bell" [size]="36" />
            </span>
            <p class="text-base text-ink-700 lg:text-lg">You have no notifications.</p>
          </section>
        }
      </div>
    </div>
  `,
})
export class NotificationsPage implements OnInit {
  private readonly router = inject(Router);

  protected readonly notifications = inject(NotificationsStore);
  protected readonly ago = timeAgo;

  ngOnInit(): void {
    void this.notifications.load();
  }

  protected async open(item: Notification): Promise<void> {
    await this.notifications.markRead(item.id);
    if (item.actionUrl) void this.router.navigateByUrl(item.actionUrl);
  }
}
