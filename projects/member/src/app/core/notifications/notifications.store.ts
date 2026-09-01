import { HttpClient, HttpParams } from '@angular/common/http';
import { DestroyRef, Injectable, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { SessionStore } from '../session/session.store';
import {
  NOTIFICATIONS_API,
  NOTIFICATION_PAGE_SIZE,
  Notification,
  NotificationsResponseDto,
  UnreadCountDto,
  toNotification,
} from './notification';

/** web-member re-checks the badge on this cadence. */
const POLL_MS = 30_000;

/**
 * The shell's notification bell.
 *
 * Session-scoped, with no userId parameter — unlike the wallet, notifications
 * do not follow the active family member.
 *
 * The badge polls; the list is fetched only when the dropdown opens, which is
 * what web-member does and keeps the idle cost to one small request a minute.
 */
@Injectable({ providedIn: 'root' })
export class NotificationsStore {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionStore);

  private readonly _notifications = signal<readonly Notification[]>([]);
  private readonly _unread = signal(0);
  private readonly _loading = signal(false);

  readonly notifications = this._notifications.asReadonly();
  readonly unread = this._unread.asReadonly();
  readonly loading = this._loading.asReadonly();

  constructor() {
    let timer: ReturnType<typeof setInterval> | null = null;

    effect(() => {
      if (!this.session.isAuthenticated()) {
        this.reset();
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
        return;
      }
      void this.refreshBadge();
      timer ??= setInterval(() => void this.refreshBadge(), POLL_MS);
    });

    // Without this the interval outlives the app in tests and on teardown.
    inject(DestroyRef).onDestroy(() => {
      if (timer) clearInterval(timer);
    });
  }

  /** Badge only. Silent on failure — a stale count is better than an error. */
  async refreshBadge(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<UnreadCountDto>(NOTIFICATIONS_API.unreadCount),
      );
      this._unread.set(response?.unreadCount ?? 0);
    } catch {
      /* keep the previous count */
    }
  }

  /** The dropdown's list. The response also refreshes the badge. */
  async load(): Promise<void> {
    this._loading.set(true);
    try {
      const response = await firstValueFrom(
        this.http.get<NotificationsResponseDto>(NOTIFICATIONS_API.list, {
          params: new HttpParams().set('limit', NOTIFICATION_PAGE_SIZE),
        }),
      );
      this._notifications.set((response?.notifications ?? []).map(toNotification));
      if (typeof response?.unreadCount === 'number') this._unread.set(response.unreadCount);
    } catch {
      this._notifications.set([]);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Marks one as read, updating the row and the badge immediately so the
   * dropdown does not have to close and reopen to look right.
   */
  async markRead(id: string): Promise<void> {
    const row = this._notifications().find((candidate) => candidate.id === id);
    if (!row || row.isRead) return;

    this._notifications.update((rows) =>
      rows.map((candidate) => (candidate.id === id ? { ...candidate, isRead: true } : candidate)),
    );
    this._unread.update((count) => Math.max(0, count - 1));

    try {
      await firstValueFrom(this.http.patch(NOTIFICATIONS_API.markRead(id), {}));
    } catch {
      // Put it back rather than showing it read when the server disagrees.
      this._notifications.update((rows) =>
        rows.map((candidate) =>
          candidate.id === id ? { ...candidate, isRead: false } : candidate,
        ),
      );
      this._unread.update((count) => count + 1);
    }
  }

  async markAllRead(): Promise<void> {
    try {
      await firstValueFrom(this.http.patch(NOTIFICATIONS_API.markAllRead, {}));
      this._notifications.update((rows) => rows.map((row) => ({ ...row, isRead: true })));
      this._unread.set(0);
    } catch {
      /* leave them unread */
    }
  }

  private reset(): void {
    this._notifications.set([]);
    this._unread.set(0);
  }
}
