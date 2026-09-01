import assert from 'node:assert/strict';

import { formatBookingWhen } from './booking-when.ts';

/**
 * Self-check for the one piece of booking logic with branches.
 * Run: node projects/member/src/app/core/bookings/booking.check.ts
 */

// Appointments: date-only, time carried as a display label. This is the case
// that regressed — three screens showed the day and dropped "1:30 PM".
assert.equal(
  formatBookingWhen({
    scheduledFor: new Date(2026, 7, 5),
    hasExactTime: false,
    timeLabel: '1:30 PM',
  }),
  'Wed, 5 Aug, 2026 at 1:30 PM',
);

// "Immediate" is a real timeSlot value in the seed data, not a clock time.
assert.equal(
  formatBookingWhen({
    scheduledFor: new Date(2026, 7, 4),
    hasExactTime: false,
    timeLabel: 'Immediate',
  }),
  'Tue, 4 Aug, 2026 at Immediate',
);

// Dental and vision: the mapper folded a real 24-hour time into the date.
assert.equal(
  formatBookingWhen({
    scheduledFor: new Date(2026, 5, 19, 15, 30),
    hasExactTime: true,
    timeLabel: '15:30',
  }),
  'Fri, 19 Jun, 2026 at 3:30 pm',
);

// No label and no exact time degrades to the day alone, never "at undefined".
assert.equal(
  formatBookingWhen({ scheduledFor: new Date(2026, 7, 5), hasExactTime: false, timeLabel: '' }),
  'Wed, 5 Aug, 2026',
);

// A booking with no date at all still renders something a member can read.
assert.equal(
  formatBookingWhen({ scheduledFor: null, hasExactTime: true, timeLabel: '1:30 PM' }),
  'Date not recorded',
);

console.log('booking.check: ok');
