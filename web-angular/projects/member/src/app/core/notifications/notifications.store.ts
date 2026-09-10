import { Injectable, computed, signal } from '@angular/core';

import { Notification } from './notification';

/**
 * Notifications — DUMMY / STATIC, zero backend.
 *
 * Replaces `notifications`, `notifications/unread-count` and the mark-read
 * endpoints (this also feeds the header bell badge). Held in memory. Public
 * surface unchanged. See REMOVED-APIS.md.
 */

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

const SEED: Notification[] = [
  { id: 'n1', title: 'Your cart is ready', message: 'Your pharmacy cart has been built and is ready for payment.', isRead: false, actionUrl: '/member/pharmacy', createdAt: daysAgo(0), priorityClass: 'text-[#0F5FDC]' },
  { id: 'n2', title: 'Claim approved', message: 'Claim CLM-2026-0004 was approved. ₹400 is being credited to your bank account.', isRead: false, actionUrl: '/member/claims', createdAt: daysAgo(1), priorityClass: 'text-warning-700' },
  { id: 'n3', title: 'Documents needed', message: 'Claim CLM-2026-0006 needs a clearer invoice to continue.', isRead: true, actionUrl: '/member/claims', createdAt: daysAgo(4), priorityClass: 'text-ink-700' },
  { id: 'n4', title: 'Appointment confirmed', message: 'Your in-clinic appointment is confirmed. Your cart is ready.', isRead: true, actionUrl: '/member/bookings', createdAt: daysAgo(6), priorityClass: 'text-ink-700' },
];

@Injectable({ providedIn: 'root' })
export class NotificationsStore {
  private readonly _notifications = signal<readonly Notification[]>([...SEED]);

  readonly notifications = this._notifications.asReadonly();
  readonly unread = computed(() => this._notifications().filter((n) => !n.isRead).length);
  readonly loading = signal(false).asReadonly();

  async refreshBadge(): Promise<void> {
    /* static — the badge derives from the in-memory list */
  }

  async load(): Promise<void> {
    /* static — already seeded */
  }

  async markRead(id: string): Promise<void> {
    this._notifications.set(this._notifications().map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }

  async markAllRead(): Promise<void> {
    this._notifications.set(this._notifications().map((n) => ({ ...n, isRead: true })));
  }
}
