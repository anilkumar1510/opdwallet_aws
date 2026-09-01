/**
 * The ruled copay continuation — both navigation branches, FORCED.
 *
 * **NON-MUTATING and it spends NO booking run.** The create POST is intercepted
 * and fulfilled, so no appointment is ever written and CAT001/CAT005 are
 * untouched. That is deliberate: the branch logic can be proven for free, which
 * leaves the real budget for the one thing interception cannot show — that the
 * amount on the payment screen matches what the API actually computed.
 *
 * Branches under test (`appointment-confirm-page.ts`, after `create()`):
 *   paymentId present -> /member/payments/:paymentId
 *   paymentId absent  -> /member/bookings?tab=doctors
 *
 * The fixture uses a REAL payment id (`PAY-20260808-0188`) so the destination
 * actually resolves. That id is also every criterion-6 positive control, which is
 * why `31-run-budget.md` carries a condition that it survive any reseed.
 */
import { chromium } from 'playwright';
const APP = 'http://localhost:4200';
const REAL_PAYMENT = 'PAY-20260808-0188';
const R = [];
const rec = (n, p, note) => { R.push(p); console.log(`${p ? 'PASS' : 'FAIL'}  ${n}\n        ${note}`); };
const b = await chromium.launch();

const drive = async (createResponse) => {
  const pg = await (await b.newContext()).newPage();
  let createCalls = 0;
  await pg.route('**/api/appointments', (r) => {
    if (r.request().method() !== 'POST') return r.continue();
    createCalls++;
    return r.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(createResponse) });
  });
  await pg.goto(APP + '/login', { waitUntil: 'domcontentloaded' });
  await pg.waitForLoadState('networkidle');
  await pg.getByLabel(/email/i).fill('shivam@gmail.com');
  await pg.getByLabel(/password/i).fill('12345678');
  await pg.getByRole('button', { name: /sign in/i }).click();
  await pg.waitForURL('**/member**', { timeout: 20000 });

  await pg.goto(APP + '/member/online-consult/specialties', { waitUntil: 'domcontentloaded' });
  await pg.waitForLoadState('networkidle');
  await pg.waitForTimeout(900);
  const toDoctors = (
    await pg.getByRole('link').evaluateAll((e) =>
      e.map((x) => x.getAttribute('href')).filter((h) => h && h.includes('/doctors')),
    )
  )[0];
  await pg.goto(APP + toDoctors, { waitUntil: 'domcontentloaded' });
  await pg.waitForLoadState('networkidle');
  await pg.waitForTimeout(1400);
  const confirmHref = (
    await pg.getByRole('link').evaluateAll((e) =>
      e.map((x) => x.getAttribute('href')).filter((h) => h && h.includes('confirm')),
    )
  )[0];
  await pg.goto(APP + confirmHref, { waitUntil: 'domcontentloaded' });
  await pg.waitForLoadState('networkidle');
  await pg.waitForTimeout(1600);

  // ONLINE requires a contact number before it will commit.
  const contact = pg.locator('#contactNumber');
  if (await contact.count()) await contact.fill('9571066564');
  await pg.waitForTimeout(400);
  await pg.getByRole('button', { name: /confirm appointment/i }).click().catch(() => {});
  await pg.waitForTimeout(3500);
  return { pg, url: pg.url().replace(APP, ''), createCalls };
};

try {
  // ---- Branch 1: something is owed -> the payment screen
  {
    const { pg, url, createCalls } = await drive({
      appointment: { appointmentId: 'APT-FORCED-001' },
      paymentId: REAL_PAYMENT,
      paymentRequired: true,
    });
    rec('POSITIVE CONTROL — the create was intercepted, so nothing was booked',
      createCalls === 1, `${createCalls} create call(s), all fulfilled by the harness`);
    rec('OWED — the journey navigates to the payment the API returned',
      url.includes(`/member/payments/${REAL_PAYMENT}`), `landed on ${url}`);

    const text = (await pg.locator('#main, body').first().innerText()).replace(/\s+/g, ' ').trim();
    rec('OWED — the destination is the payment screen and names that payment',
      new RegExp(REAL_PAYMENT).test(text), text.slice(0, 140));
    await pg.close();
  }

  // ---- Branch 2: nothing owed -> the bookings list, unchanged
  {
    const { pg, url } = await drive({ appointment: { appointmentId: 'APT-FORCED-002' } });
    rec('NOTHING OWED — the journey still ends on the bookings list',
      url.includes('/member/bookings') && url.includes('tab=doctors'), `landed on ${url}`);
    rec('NEGATIVE CONTROL — it does NOT divert to a payment screen',
      !url.includes('/member/payments'), `landed on ${url}`);
    await pg.close();
  }

  // ---- Branch 3: a non-business payment id must not be treated as a destination
  // `toAppointmentBookingResult` guards on the PAY- prefix because
  // GET payments/:paymentId resolves via findOne({ paymentId }); a Mongo _id
  // would 404. Identifier duality, guarded rather than assumed.
  {
    const { pg, url } = await drive({
      appointment: { appointmentId: 'APT-FORCED-003' },
      paymentId: '6a34c98e4e45325c5a7c06b5',
    });
    rec('GUARD — a Mongo _id is not treated as a payment destination',
      !url.includes('/member/payments') && url.includes('/member/bookings'), `landed on ${url}`);
    await pg.close();
  }
} finally {
  await b.close();
}
console.log(`\npass ${R.filter(Boolean).length}/${R.length}`);
