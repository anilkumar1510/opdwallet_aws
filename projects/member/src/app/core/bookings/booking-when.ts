const DAY = new Intl.DateTimeFormat('en-IN', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const TIME = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

/**
 * When a booking is, as one line.
 *
 * The two sources carry time differently and neither can be read off
 * `scheduledFor` alone: appointments send a date-only string plus a display
 * label ("1:30 PM", or "Immediate"), while dental and vision send a real
 * 24-hour time the mapper has already folded into the date.
 *
 * Own file, no imports, so booking.check.ts can run it under plain node —
 * booking.model.ts pulls in ClaimStatus, which node cannot resolve.
 *
 * Takes the three fields structurally rather than a whole Booking, so the
 * screens that render a booking-shaped row can use it too. Three of them had
 * drifted to date-only and were silently dropping the time.
 */
export function formatBookingWhen(booking: {
  scheduledFor: Date | null;
  hasExactTime: boolean;
  timeLabel: string;
}): string {
  if (!booking.scheduledFor) return 'Date not recorded';
  const day = DAY.format(booking.scheduledFor);
  if (booking.hasExactTime) return `${day} at ${TIME.format(booking.scheduledFor)}`;
  return booking.timeLabel ? `${day} at ${booking.timeLabel}` : day;
}
