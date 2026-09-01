import assert from 'node:assert/strict';

import {
  advance,
  allowedEvents,
  attachPrescription,
  awaitingPayment,
  needsGateway,
  receiptNumber,
  invoiceNumber,
  startJourney,
  walletState,
} from './inclinic-flow.ts';

/**
 * Self-check for the in-clinic journey. No framework.
 *
 *   node projects/member/src/app/core/appointments/inclinic-flow.check.ts
 *
 * This guards the one rule the whole journey exists to express: the wallet is
 * held from the request, not spent — and it only becomes a debit at the far
 * end, after the clinic confirmed, the member paid, attended, and filed the
 * prescription. Every shortcut through that sequence must be refused.
 */

const base = startJourney({
  appointmentId: 'APT-1',
  doctorName: 'Dr. Priya Sharma',
  specialty: 'General Physician',
  clinicName: 'Apollo Clinic',
  clinicAddress: 'Sector 44, Gurugram',
  patientName: 'Rajesh Kumar',
  appointmentDate: '2026-08-20',
  timeSlot: '11:30 AM',
  fee: 500,
  blocked: 450,
  selfPay: 50,
  copayPercentage: 10,
  paymentId: 'PAY-20260817-0235',
  at: '2026-08-17T10:00:00.000Z',
});

// The request is raised with the wallet held, not debited, and nothing collected.
assert.equal(base.stage, 'REQUESTED');
assert.equal(walletState(base), 'HELD');
assert.equal(base.paidAt, null);
assert.equal(receiptNumber(base), null);

// Payment is not reachable before the clinic confirms. This is the whole point
// of the corrected sequence: no card is touched until the slot is agreed.
assert.equal(advance(base, 'PAY', 'x'), null);
assert.equal(advance(base, 'VISIT', 'x'), null);
assert.deepEqual([...allowedEvents(base)].sort(), ['CANCEL', 'CONFIRM', 'DECLINE']);

// A clinic that declines releases the block, and no refund is involved.
const declined = advance(base, 'DECLINE', '2026-08-17T11:00:00.000Z');
assert.ok(declined);
assert.equal(walletState(declined), 'RELEASED');
assert.equal(declined.paidAt, null);
assert.deepEqual(allowedEvents(declined), []);

// Confirmation opens the cart, and only then is the self-payment owed.
const confirmed = advance(base, 'CONFIRM', '2026-08-17T11:00:00.000Z');
assert.ok(confirmed);
assert.equal(confirmed.stage, 'CONFIRMED');
assert.equal(confirmed.confirmedAt, '2026-08-17T11:00:00.000Z');
assert.equal(awaitingPayment(confirmed), true);
assert.equal(needsGateway(confirmed), true);
assert.equal(walletState(confirmed), 'HELD');

// Wallet still held after payment — the debit is not here.
const paid = advance(confirmed, 'PAY', '2026-08-17T11:05:00.000Z');
assert.ok(paid);
assert.equal(walletState(paid), 'HELD');
assert.equal(receiptNumber(paid), 'RCPT-APT-1');
assert.equal(invoiceNumber(paid), null, 'the tax invoice is not the receipt');
assert.equal(awaitingPayment(paid), false);

// A consultation cannot be closed without the prescription the sheet requires.
const visited = advance(paid, 'VISIT', '2026-08-20T12:00:00.000Z');
assert.ok(visited);
assert.equal(advance(visited, 'COMPLETE', 'x'), null);
assert.deepEqual(allowedEvents(visited), []);

const withPrescription = attachPrescription(visited, 'prescription.jpg');
assert.deepEqual(allowedEvents(withPrescription), ['COMPLETE']);

// The debit happens here and nowhere earlier, and the invoice comes with it.
const completed = advance(withPrescription, 'COMPLETE', '2026-08-20T12:30:00.000Z');
assert.ok(completed);
assert.equal(walletState(completed), 'DEBITED');
assert.equal(invoiceNumber(completed), 'INV-APT-1');
assert.deepEqual(allowedEvents(completed), []);

// A no-show releases the block: penalisation is still an open policy question,
// so holding the money against it would be inventing the answer.
const noShow = advance(paid, 'NO_SHOW', '2026-08-20T12:00:00.000Z');
assert.ok(noShow);
assert.equal(walletState(noShow), 'RELEASED');

// Wallet covering the whole fee skips the gateway step entirely.
const fullyCovered = startJourney({
  appointmentId: 'APT-2',
  doctorName: 'Dr. A',
  specialty: 'Dermatology',
  clinicName: 'Clinic',
  clinicAddress: 'Address',
  patientName: 'Member',
  appointmentDate: '2026-08-21',
  timeSlot: '9:00 AM',
  fee: 500,
  blocked: 500,
  selfPay: 0,
  copayPercentage: 0,
  // No copay, so the API raises no payment the journey wants to keep.
  paymentId: null,
  at: '2026-08-17T10:00:00.000Z',
});
assert.equal(needsGateway(fullyCovered), false);

console.log('inclinic-flow.check.ts: all assertions passed');
