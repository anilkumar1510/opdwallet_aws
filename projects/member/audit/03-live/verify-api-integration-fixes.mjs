/**
 * Session 53 — the three endpoints that were wired, and the six that were deleted.
 *
 * Covers, in one run:
 *   1. `appointments/user/:id/ongoing` — the active-appointment nudge, ported
 *      from `web-member/components/ActiveAppointmentNudge.tsx`. REAL DATA: the
 *      member has 16 active appointments.
 *   2. `member/{lab,diagnostics}/prescriptions/:id/cancel` — REAL DATA and, for
 *      one assertion, a REAL CANCEL. See the mutation note below.
 *   3. AHC copay payment creation — INTERCEPTED. The AHC allowance is once per
 *      member per policy year and this account's is consumed, so the branch is
 *      forced rather than run. No payment record is created.
 *
 * ⚠ THIS HARNESS PERFORMS ONE REAL MUTATION, deliberately, and it is the only
 * one. It cancels a single UPLOADED lab prescription. Justification: the member
 * holds SEVEN of them, a prescription is replenishable through the upload flow
 * (unlike a CAT allowance, which is not), and interception cannot prove the
 * three things that actually matter here — that the API accepts the body shape,
 * that the 10-character reason rule is satisfied, and that the row disappears.
 * Those are precisely the class of defect that killed three lab-order attempts
 * in session 38. Nothing touches policy, assignment or wallet data.
 *
 * CONTROLS
 *   positive — the pre-count of cancellable prescriptions is > 0, so the gate
 *              assertions are not passing on an empty list.
 *   negative — a DIGITIZED prescription offers no cancel control. The API allows
 *              UPLOADED only (`lab-prescription.service.ts:322`), and this
 *              account holds DIGITIZED rows to prove the gate with.
 *   negative — the nudge does not appear on a desktop viewport, matching the
 *              reference's `lg:hidden` mount.
 *   negative — the six deleted declarations are absent from the built source.
 */
import { chromium } from 'playwright';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const APP = 'http://localhost:4200';
const R = [];
const rec = (n, p, note) => { R.push(p); console.log(`${p ? 'PASS' : 'FAIL'}  ${n}\n        ${note}`); };

const login = async (pg) => {
  await pg.goto(APP + '/login', { waitUntil: 'domcontentloaded' });
  await pg.waitForLoadState('networkidle');
  await pg.getByLabel(/email/i).fill('shivam@gmail.com');
  await pg.getByLabel(/password/i).fill('12345678');
  await pg.getByRole('button', { name: /sign in/i }).click();
  await pg.waitForURL('**/member**', { timeout: 20000 });
};
const txt = async (pg) => (await pg.locator('#main, body').first().innerText()).replace(/\s+/g, ' ').trim();

const b = await chromium.launch();
try {
  // ---------------------------------------------------------------- 1. nudge
  {
    const pg = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
    const calls = [];
    pg.on('request', (r) => {
      const u = new URL(r.url()).pathname;
      if (u.includes('/api/')) calls.push(u);
    });
    await login(pg);
    await pg.waitForTimeout(2500);

    const ongoing = calls.filter((c) => /\/ongoing$/.test(c));
    rec('NUDGE — the dead endpoint is now called',
      ongoing.length > 0, ongoing[0] ?? 'appointments/user/:id/ongoing never requested');
    rec('NUDGE — it is called ONCE despite the store being shared',
      ongoing.length === 1, `${ongoing.length} call(s)`);

    const banner = pg.locator('app-active-appointment-nudge button');
    const shown = await banner.count();
    rec('NUDGE — the banner renders on mobile for a member with an active appointment',
      shown === 1, `${shown} banner(s); ${await txt(pg).then((t) => t.slice(0, 80))}`);

    if (shown === 1) {
      await banner.first().click();
      await pg.waitForTimeout(2000);
      rec('NUDGE — it lands on the doctors tab of the bookings list',
        pg.url().includes('/member/bookings') && pg.url().includes('tab=doctors'),
        pg.url().replace(APP, ''));
    }
    await pg.close();
  }

  // NEGATIVE: desktop must not show it — the reference mounts it lg:hidden.
  {
    const pg = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    await login(pg);
    await pg.waitForTimeout(2500);
    const visible = await pg.locator('app-active-appointment-nudge button').isVisible().catch(() => false);
    rec('NEGATIVE CONTROL — the nudge is hidden on desktop, as in the reference',
      !visible, visible ? 'banner visible at 1440px' : 'not visible at 1440px');
    await pg.close();
  }

  // ------------------------------------------------- 2. prescription cancel
  {
    const pg = await (await b.newContext()).newPage();
    await login(pg);
    await pg.goto(APP + '/member/bookings?tab=lab', { waitUntil: 'domcontentloaded' });
    await pg.waitForLoadState('networkidle');
    await pg.waitForTimeout(2000);

    const controls = pg.getByRole('button', { name: /^cancel prescription$/i });
    const before = await controls.count();
    rec('POSITIVE CONTROL — cancellable prescriptions are on screen to test with',
      before > 0, `${before} cancel control(s)`);

    // The gate, measured against the API rather than against rendered text. A
    // DIGITIZED prescription becomes a cart and renders as a cart row, so
    // counting PRES- on screen counts only the uploaded ones and would make this
    // control pass by construction — which is exactly what it did on the first
    // run (7 of 7). Ask the source instead.
    const counts = await pg.evaluate(async () => {
      const res = await fetch('/api/member/lab/prescriptions', { credentials: 'include' });
      const json = await res.json();
      const rows = json?.data ?? [];
      return { total: rows.length, uploaded: rows.filter((p) => p.status === 'UPLOADED').length };
    });
    rec('NEGATIVE CONTROL — the account holds prescriptions that must NOT be cancellable',
      counts.total > counts.uploaded, `${counts.total} lab prescriptions, ${counts.uploaded} UPLOADED`);
    rec('GATE — exactly the UPLOADED ones offer a cancel control',
      before === counts.uploaded, `${before} controls for ${counts.uploaded} UPLOADED of ${counts.total}`);

    // The reason rule, before any request is made.
    await controls.first().click();
    await pg.waitForTimeout(600);
    // A DISTINCT label. Both the trigger and the commit used to read "Cancel
    // prescription", so `.last()` matched a different ROW's trigger — which is
    // enabled — and the disabled-below-10-characters control failed while the
    // code was correct. An ambiguous accessible name is a harness trap and a
    // usability one; the commit now reads "Yes, cancel it", matching the
    // booking-cancel block right above it.
    const submit = pg.getByRole('button', { name: /^yes, cancel it$/i });
    const area = pg.locator('textarea').first();
    await area.fill('too short');
    await pg.waitForTimeout(400);
    rec('REASON RULE — the commit is refused below 10 characters, before any request',
      await submit.isDisabled(), 'submit disabled at 9 characters');

    await area.fill('Cancelled by the parity audit, session 53, verifying the cancel leg.');
    await pg.waitForTimeout(400);
    rec('REASON RULE — a valid reason enables the commit',
      !(await submit.isDisabled()), 'submit enabled at >= 10 characters');

    // THE ONE REAL MUTATION.
    const sent = [];
    pg.on('request', (r) => {
      if (/\/cancel$/.test(new URL(r.url()).pathname) && r.method() === 'POST') {
        sent.push({ url: new URL(r.url()).pathname, body: r.postData() });
      }
    });
    await submit.click();
    await pg.waitForTimeout(4000);

    rec('CANCEL — the POST goes to the prescription cancel route with the reason',
      sent.length === 1 && /prescriptions\/.+\/cancel$/.test(sent[0].url) && /reason/.test(sent[0].body ?? ''),
      sent[0] ? `${sent[0].url} ${sent[0].body}` : 'no cancel request observed');
    rec('IDENTIFIER — it carries the business PRES-… reference, not a Mongo _id',
      sent.length === 1 && !/[0-9a-f]{24}/.test(sent[0].url), sent[0]?.url ?? '-');

    const after = await pg.getByRole('button', { name: /^cancel prescription$/i }).count();
    rec('CANCEL — the list re-read and the row is gone',
      after === before - 1, `${before} cancellable before, ${after} after`);
    await pg.close();
  }

  // ------------------------------------------------------- 3. AHC copay leg
  {
    const pg = await (await b.newContext()).newPage();
    let created = null;
    await pg.route('**/api/member/ahc/orders', (r) => {
      if (r.request().method() !== 'POST') return r.continue();
      return r.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            orderId: 'AHC-ORD-FORCED-001',
            packageName: 'Harness Checkup',
            copayAmount: 240,
            finalPayable: 240,
          },
        }),
      });
    });
    await pg.route('**/api/payments', (r) => {
      if (r.request().method() !== 'POST') return r.continue();
      created = r.request().postDataJSON();
      return r.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, paymentId: 'PAY-20260808-0188' }),
      });
    });

    await login(pg);

    // The payment step renders its commit only when the journey has CHOSEN
    // vendors, and that choice lives in a signal store. So click through — do
    // NOT goto() between steps: a full reload re-boots the store and discards
    // the selection, which is why the first version of this harness reached
    // "Nothing to confirm". Every step to here is a GET; the only write is the
    // order POST, intercepted above.
    await pg.goto(APP + '/member/ahc/booking', { waitUntil: 'domcontentloaded' });
    await pg.waitForLoadState('networkidle');
    await pg.waitForTimeout(1800);
    for (const step of ['lab', 'diagnostic']) {
      const next = pg.getByRole('button', { name: /select and continue/i }).first();
      if (await next.count()) {
        await next.click();
        await pg.waitForTimeout(2200);
      } else {
        rec(`AHC — step ${step} offered a vendor to select`, false, (await txt(pg)).slice(0, 120));
      }
    }
    await pg.waitForTimeout(1200);

    const confirm = pg.getByRole('button', { name: /confirm booking/i }).first();
    const reachable = await confirm.count();
    rec('POSITIVE CONTROL — the AHC journey reached a committable payment step',
      reachable === 1, reachable ? 'confirm control present' : (await txt(pg)).slice(0, 140));
    if (reachable) {
      await confirm.click();
      await pg.waitForTimeout(3500);
    }

    rec('AHC — the copay payment is created, which nothing did before',
      created !== null && created.amount === 240 && created.serviceType === 'AHC',
      created ? JSON.stringify(created) : 'no POST payments observed');
    rec('AHC — the payment references the ORDER, so the debt is attributable',
      created?.serviceReferenceId === 'AHC-ORD-FORCED-001', created?.serviceReferenceId ?? '-');
    rec('AHC — the journey continues to that payment',
      pg.url().includes('/member/payments/PAY-'), pg.url().replace(APP, ''));
    await pg.close();
  }

  // ------------------------------------------- 4. the deletions, statically
  {
    const root = 'C:/Users/singh/OneDrive/Desktop/opdwallet_aws/web-angular/projects/member/src/app';
    const walk = (dir) =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.ts') ? [join(dir, e.name)] : [],
      );
    const source = walk(root).map((f) => readFileSync(f, 'utf8')).join('\n');
    // Declaration sites only — the removal notes name these paths on purpose.
    const gone = [
      ["activeCart:", 'LAB_API.activeCart'],
      ["vendorPricing:", 'LAB_API.vendorPricing'],
      ["myPolicy:", 'MEMBER_API.myPolicy'],
      ["refresh: 'auth/refresh'", 'AUTH_API.refresh'],
      ["dentalClinics:", 'BOOKINGS_API.dentalClinics'],
      ["visionClinics:", 'BOOKINGS_API.visionClinics'],
    ];
    for (const [needle, label] of gone) {
      rec(`DELETED — ${label} is no longer declared`,
        !source.includes(needle), needle);
    }
    rec('POSITIVE CONTROL — the scanner can see declarations that DO exist',
      source.includes('markPaid:') && source.includes('cancelPrescription:'),
      'markPaid and cancelPrescription both found');
  }
} finally {
  await b.close();
}
console.log(`\npass ${R.filter(Boolean).length}/${R.length}`);
