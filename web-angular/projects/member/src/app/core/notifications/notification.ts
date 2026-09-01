import { toDate } from '../domain/codes';

/**
 * The notification bell in the shell.
 *
 * Small read-only resource, so endpoints, shapes and mapping live together —
 * same as address.ts and cover-check.ts.
 *
 * The list uses the `{ message, <name>, total, page }` envelope family and also
 * carries `unreadCount`, so opening the dropdown refreshes the badge without a
 * second request.
 */
export const NOTIFICATIONS_API = {
  list: 'notifications',
  unreadCount: 'notifications/unread-count',
  /** PATCH. Takes the Mongo `_id`. */
  markRead: (id: string) => `notifications/${id}/read`,
  /** PATCH, no body. */
  markAllRead: 'notifications/mark-all-read',
} as const;

/** web-member requests 10 and shows exactly those. */
export const NOTIFICATION_PAGE_SIZE = 10;

export interface NotificationDto {
  _id?: string;
  type?: string;
  title?: string;
  message?: string;
  priority?: string;
  isRead?: boolean;
  actionUrl?: string;
  createdAt?: string;
}

export interface NotificationsResponseDto {
  notifications?: NotificationDto[];
  total?: number;
  unreadCount?: number;
}

export interface UnreadCountDto {
  unreadCount?: number;
}

export interface Notification {
  readonly id: string;
  readonly title: string;
  readonly message: string;
  readonly isRead: boolean;
  /** Where tapping it goes, when the API supplies a route. */
  readonly actionUrl: string | null;
  readonly createdAt: Date | null;
  /** Tailwind text colour for the title, by priority — as web-member does. */
  readonly priorityClass: string;
}

const PRIORITY_CLASSES: Readonly<Record<string, string>> = {
  URGENT: 'text-danger-700',
  HIGH: 'text-warning-700',
  MEDIUM: 'text-[#0F5FDC]',
};

export function toNotification(dto: NotificationDto): Notification {
  const priority = dto.priority?.trim().toUpperCase() ?? '';
  return {
    id: dto._id ?? '',
    title: dto.title?.trim() || 'Notification',
    message: dto.message?.trim() || '',
    isRead: dto.isRead === true,
    // Only in-app routes are followed; anything else is ignored rather than
    // trusted as a destination.
    actionUrl: dto.actionUrl?.trim().startsWith('/') ? dto.actionUrl.trim() : null,
    createdAt: toDate(dto.createdAt),
    priorityClass: PRIORITY_CLASSES[priority] ?? 'text-ink-700',
  };
}

/** "Just now", "5m ago", "3h ago", "2d ago", then a date — matching web-member. */
export function timeAgo(value: Date | null, now: Date = new Date()): string {
  if (!value) return '';
  const seconds = Math.floor((now.getTime() - value.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return value.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}
