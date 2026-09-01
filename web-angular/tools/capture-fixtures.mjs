#!/usr/bin/env node
/**
 * Captures raw API responses to projects/member/src/testing/fixtures/.
 *
 *   node tools/capture-fixtures.mjs            # needs the API on :4000
 *
 * These are real captured responses, never hand-written — they are what the
 * mapper checks run against, so an invented field cannot survive them.
 *
 * Two accounts are used because no single seeded member has data everywhere:
 * shivam@ has cover in force, all@ has the only lab cart and digital
 * prescription. Which account produced a fixture is recorded in _meta.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API = process.env.API_URL ?? 'http://localhost:4000/api';
const OUT = join(
  fileURLToPath(new URL('.', import.meta.url)),
  '..',
  'projects',
  'member',
  'src',
  'testing',
  'fixtures',
);

const ACCOUNTS = {
  shivam: { email: 'shivam@gmail.com', password: '12345678' },
  all: { email: 'all@gmail.com', password: 'User@123' },
};

async function login(account) {
  const response = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(account),
  });
  if (!response.ok) throw new Error(`login ${account.email}: ${response.status}`);
  const cookie = (response.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ');
  return { cookie, body: await response.json() };
}

/** Every GET the member portal makes. `body` marks a POST dry run. */
function endpoints({ userId, memberId, cartId, vendorId, claimRef, txnRef, paymentRef, pincode, policyId }) {
  return [
    ['auth-me', 'auth/me'],
    ['member-profile', 'member/profile'],
    ['member-family', 'member/family'],
    ['member-addresses', 'member/addresses'],
    ['assignments-my-policy', 'assignments/my-policy'],
    policyId && ['policies-current', `policies/${policyId}/current`],
    ['wallet-balance', 'wallet/balance'],
    ['wallet-transactions', 'wallet/transactions'],
    ['transactions', 'transactions'],
    ['transactions-summary', 'transactions/summary'],
    txnRef && ['transactions-by-id', `transactions/${txnRef}`],
    ['member-claims', 'member/claims'],
    ['member-claims-summary', 'member/claims/summary'],
    ['member-claims-available-categories', 'member/claims/available-categories'],
    claimRef && ['member-claims-timeline', `member/claims/${claimRef}/timeline`],
    claimRef && ['member-claims-tpa-notes', `member/claims/${claimRef}/tpa-notes`],
    ['lab-orders', 'member/lab/orders'],
    ['lab-prescriptions', 'member/lab/prescriptions'],
    ['lab-carts', 'member/lab/carts'],
    cartId && ['lab-cart-by-id', `member/lab/carts/${cartId}`],
    cartId && ['lab-cart-vendors', `member/lab/carts/${cartId}/vendors`],
    vendorId && ['lab-vendor-slots', `member/lab/vendors/${vendorId}/slots?pincode=${pincode}&date=2026-06-25`],
    ['diagnostics-orders', 'member/diagnostics/orders'],
    ['diagnostics-prescriptions', 'member/diagnostics/prescriptions'],
    ['diagnostics-carts', 'member/diagnostics/carts'],
    ['member-prescriptions', 'member/prescriptions'],
    ['member-digital-prescriptions', 'member/digital-prescriptions'],
    ['doctors', 'doctors?specialtyId=SPEC001'],
    ['doctor-slots', 'doctors/DOC10007/slots?clinicId=CLN00005'],
    ['benefits-services-vision', 'member/benefits/CAT007/services'],
    ['benefits-services-dental', 'member/benefits/CAT006/services'],
    ['benefits-specialties-inclinic', 'member/benefits/CAT001/specialties'],
    ['vision-clinics', 'vision-bookings/clinics?serviceCode=CONTACT_LENS_FITTING'],
    ['dental-clinics', 'dental-bookings/clinics?serviceCode=DENTAL_CHECKUP'],
    ['vision-slots', 'vision-bookings/slots?clinicId=CLN00008&date=2026-06-20'],
    ['dental-slots', 'dental-bookings/slots?clinicId=CLN00008&date=2026-06-20'],
    userId && ['appointments-by-user', `appointments/user/${userId}`],
    userId && ['appointments-ongoing', `appointments/user/${userId}/ongoing`],
    userId && ['dental-bookings-by-user', `dental-bookings/user/${userId}`],
    userId && ['vision-bookings-by-user', `vision-bookings/user/${userId}`],
    ['ahc-eligibility', 'member/ahc/eligibility'],
    ['ahc-package', 'member/ahc/package'],
    ['ahc-orders', 'member/ahc/orders'],
    ['notifications', 'notifications?limit=10'],
    ['notifications-unread-count', 'notifications/unread-count'],
    ['payments', 'payments'],
    paymentRef && ['payments-by-id', `payments/${paymentRef}`],
  ].filter(Boolean);
}

/** POST dry runs — validation only, nothing is created. */
function dryRuns({ memberId, cartId, vendorId }) {
  return [
    [
      'appointments-validate-booking',
      'appointments/validate-booking',
      {
        patientId: memberId,
        doctorId: 'DOC10007',
        specialty: 'General Physician',
        consultationFee: 800,
        appointmentType: 'IN_CLINIC',
      },
    ],
    [
      'dental-bookings-validate',
      'dental-bookings/validate',
      {
        patientId: memberId,
        clinicId: 'CLN00008',
        serviceCode: 'DENTAL_CHECKUP',
        slotId: 'SLOT-UNKNOWN',
        price: 500,
      },
    ],
    cartId &&
      vendorId && [
        'lab-orders-validate',
        'member/lab/orders/validate',
        { patientId: memberId, vendorId, cartId, slotId: 'SLOT-UNKNOWN', totalAmount: 400 },
      ],
  ].filter(Boolean);
}

async function capture(name, path, cookie, account, init) {
  const response = await fetch(`${API}/${path}`, {
    ...init,
    headers: { cookie, ...(init?.body ? { 'Content-Type': 'application/json' } : {}) },
  });
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  writeFileSync(
    join(OUT, `${name}.json`),
    `${JSON.stringify({ _meta: { path, status: response.status, account }, body }, null, 2)}\n`,
  );
  return response.status;
}

mkdirSync(OUT, { recursive: true });

const sessions = {};
for (const [name, account] of Object.entries(ACCOUNTS)) sessions[name] = await login(account);

const me = await fetch(`${API}/auth/me`, { headers: { cookie: sessions.shivam.cookie } }).then((r) =>
  r.json(),
);
const claims = await fetch(`${API}/member/claims`, {
  headers: { cookie: sessions.shivam.cookie },
}).then((r) => r.json());
const txns = await fetch(`${API}/transactions`, {
  headers: { cookie: sessions.shivam.cookie },
}).then((r) => r.json());
const payments = await fetch(`${API}/payments`, {
  headers: { cookie: sessions.all.cookie },
}).then((r) => r.json());
const carts = await fetch(`${API}/member/lab/carts`, {
  headers: { cookie: sessions.all.cookie },
}).then((r) => r.json());
const cart = (carts.data ?? [])[0];
const vendors = cart
  ? await fetch(`${API}/member/lab/carts/${cart.cartId}/vendors`, {
      headers: { cookie: sessions.all.cookie },
    }).then((r) => r.json())
  : { data: [] };

const myPolicy = await fetch(`${API}/assignments/my-policy`, {
  headers: { cookie: sessions.shivam.cookie },
}).then((r) => r.json());

const context = {
  // `policyId` comes back populated, not as a string — the id is one level in.
  policyId: myPolicy?.policyId?._id,
  userId: me._id,
  memberId: me._id,
  cartId: cart?.cartId,
  vendorId: (vendors.data ?? [])[0]?.vendorId,
  pincode: cart?.pincode,
  claimRef: (claims.claims ?? [])[0]?.claimId,
  txnRef: (txns.transactions ?? [])[0]?.transactionId,
  paymentRef: (payments.payments ?? [])[0]?.paymentId,
};

// Lab and payment data lives on all@; everything else on shivam@.
const useAll = new Set([
  'lab-cart-by-id',
  'lab-cart-vendors',
  'lab-vendor-slots',
  'payments',
  'payments-by-id',
  'member-digital-prescriptions',
]);

let ok = 0;
let failed = 0;
for (const [name, path] of endpoints(context)) {
  const which = useAll.has(name) ? 'all' : 'shivam';
  try {
    const status = await capture(name, path, sessions[which].cookie, which);
    console.log(`  ${String(status).padEnd(4)} ${name}`);
    status < 400 ? ok++ : failed++;
  } catch (error) {
    console.log(`  ERR  ${name} — ${error.message}`);
    failed++;
  }
}

for (const [name, path, body] of dryRuns(context)) {
  const which = name.startsWith('lab-') ? 'all' : 'shivam';
  try {
    const status = await capture(name, path, sessions[which].cookie, which, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    console.log(`  ${String(status).padEnd(4)} ${name} (POST dry run)`);
    status < 400 ? ok++ : failed++;
  } catch (error) {
    console.log(`  ERR  ${name} — ${error.message}`);
    failed++;
  }
}

console.log(`\ncaptured ${ok} ok, ${failed} non-2xx -> ${OUT}`);
