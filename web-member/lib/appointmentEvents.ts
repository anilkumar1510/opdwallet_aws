/**
 * Appointment Event System
 *
 * Event-driven updates for active appointment nudge/widget.
 * Triggers updates only when necessary (user actions, tab focus).
 * No polling - zero overhead when idle.
 */

export const AppointmentEvents = {
  BOOKING_CREATED: 'appointment:created',
  BOOKING_UPDATED: 'appointment:updated',
  BOOKING_CANCELLED: 'appointment:cancelled',
  PRESCRIPTION_AVAILABLE: 'appointment:prescription',
} as const

export type AppointmentEventType = typeof AppointmentEvents[keyof typeof AppointmentEvents]

/**
 * Emit an appointment event to notify components of changes
 * @param event - Event type from AppointmentEvents
 */
export const emitAppointmentEvent = (event: AppointmentEventType) => {
  if (typeof window !== 'undefined') {
    console.log('[AppointmentEvents] Emitting event:', event)
    window.dispatchEvent(new CustomEvent(event))
  }
}

/**
 * Listen for appointment events
 * @param event - Event type to listen for
 * @param callback - Function to call when event is emitted
 * @returns Cleanup function to remove listener
 */
export const onAppointmentEvent = (
  event: AppointmentEventType,
  callback: () => void
): (() => void) => {
  if (typeof window !== 'undefined') {
    window.addEventListener(event, callback)
    return () => window.removeEventListener(event, callback)
  }
  return () => {}
}
