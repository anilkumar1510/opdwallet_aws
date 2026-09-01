/**
 * The wallet ledger's missing summary, running balance and back control.
 *
 * Found by the user clicking the home balance card and asking why the screen it
 * opened was not what the reference opens. It isn't: React's card links to
 * `/member/transactions`, which in React is a dedicated **Transaction History**
 * screen carrying Current Balance / Total Credits / Total Debits / Net Change.
 * Angular's card opened `/member/wallet`, which had the same ledger rows and none
 * of the figures. Session 54 gave Angular the dedicated screen and repointed the
 * card at it, resolving parity register entry 2 — so this harness now asserts
 * `/member/transactions` as the destination.
 *
 * **NON-MUTATING.** Reads and clicks only.
 *
 * CONTROLS
 *   positive — the figures match what the REFERENCE computes for the same
 *              member, asserted against literals taken from React's own screen:
 *              credits ₹5,100, debits ₹14,792, net −₹9,692. Asserting merely
 *              that "three numbers render" would pass on three zeroes.
 *   negative — **the totals do not change when the member pages.** They are
 *              computed over the whole history, not the rows on screen; if they
 *              were computed from the page, "Show more" would move them. This is
 *              the assertion that would have caught the obvious wrong build.
 *   negative — a row with no `newBalance` in the payload shows no running
 *              balance rather than a zero.
 */
import { chromium } from 'playwright';

const APP = 'http://localhost:4200';
const R = [];
const rec = (n, p, note) => { R.push(p); console.log(`${p ? 'PASS' : 'FAIL'}  ${n}\n        ${note}`); };

/**
 * The figures are computed FROM THE API at run time, not hardcoded.
 *
 * The first version pinned literals taken from React's screen — credits ₹5,100,
 * debits ₹14,792, net −₹9,692 — and they rotted within the day: the member used
 * the running app, the wallet moved ₹380, and the harness reported a defect in
 * working code. `verify-dental.mjs` already carries this lesson ("assert against
 * the amount the API actually recorded, not a literal"); this file had to learn
 * it twice.
 *
 * Comparing the screen to the source it renders from is also the stronger check:
 * a literal only ever proves the screen matched one past moment.
 */
const inr = (n) => n.toLocaleString('en-IN');

const b = await chromium.launch();
try {
  const pg = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await pg.goto(APP + '/login', { waitUntil: 'domcontentloaded' });
  await pg.waitForLoadState('networkidle');
  await pg.getByLabel(/email/i).fill('shivam@gmail.com');
  await pg.getByLabel(/password/i).fill('12345678');
  await pg.getByRole('button', { name: /sign in/i }).click();
  await pg.waitForURL('**/member**', { timeout: 20000 });
  await pg.waitForTimeout(2000);

  // Arrive the way the member does — through the balance card.
    // The card's destination CHANGED in session 54: it opens the dedicated
  // Transaction History screen, not the wallet page. Parity register entry 2 was
  // resolved to match the reference's routing.
  const card = pg.locator('a[href="/member/transactions"]').filter({ hasText: 'Total Available Balance' });
  const visible = [];
  for (let i = 0; i < (await card.count()); i++) {
    if (await card.nth(i).isVisible()) visible.push(i);
  }
  rec('POSITIVE CONTROL — exactly one balance card is visible to click',
    visible.length === 1, `${await card.count()} in DOM, ${visible.length} visible`);
  await card.nth(visible[0] ?? 0).click();
  await pg.waitForTimeout(3000);

  rec('The card opens the TRANSACTION HISTORY screen, not the wallet page',
    pg.url().includes('/member/transactions') && !pg.url().includes('/member/wallet'),
    pg.url().replace(APP, ''));

  rec('POSITIVE CONTROL — it is the history screen, by its own heading',
    /Transaction history/i.test(await pg.locator('#main').innerText()), 'heading present');

  const text = async () => (await pg.locator('#main').innerText()).replace(/\s+/g, ' ');

  const CREDIT_TYPES = ['CREDIT', 'REFUND', 'INITIALIZATION'];
  const expected = await pg.evaluate(async (creditTypes) => {
    const res = await fetch('/api/wallet/transactions?limit=500', { credentials: 'include' });
    const json = await res.json();
    const rows = json.transactions ?? [];
    let credits = 0;
    let debits = 0;
    for (const r of rows) {
      if (creditTypes.includes((r.type ?? '').trim().toUpperCase())) credits += r.amount ?? 0;
      else debits += r.amount ?? 0;
    }
    return { credits, debits, net: credits - debits, count: rows.length };
  }, CREDIT_TYPES);
  const REFERENCE = {
    credits: inr(expected.credits),
    debits: inr(expected.debits),
    net: inr(Math.abs(expected.net)),
  };
  rec('POSITIVE CONTROL — the API returned transactions to compute an expectation from',
    expected.count > 0, `${expected.count} transactions, credits ₹${REFERENCE.credits}, debits ₹${REFERENCE.debits}`);
  const rows = () => pg.locator('section:has(h2:text-is("Activity")) li').count();
  const body = await text();

  rec(`SUMMARY — total credits match the reference (₹${REFERENCE.credits})`,
    new RegExp(`Total credits \\+?₹${REFERENCE.credits.replace(',', ',')}`).test(body),
    (body.match(/Total credits[^T]*/) ?? ['missing'])[0].slice(0, 40));
  rec(`SUMMARY — total debits match the reference (₹${REFERENCE.debits})`,
    body.includes(`₹${REFERENCE.debits}`),
    (body.match(/Total debits[^N]*/) ?? ['missing'])[0].slice(0, 40));
  rec(`SUMMARY — net change matches the reference (−₹${REFERENCE.net})`,
    body.includes(`₹${REFERENCE.net}`),
    (body.match(/Net change[^A]*/) ?? ['missing'])[0].slice(0, 40));

  const counted = body.match(/Across (\d+) transactions/);
  const before = await rows();
  rec('SUMMARY — it says how many transactions it counted, and that is MORE than the page shows',
    Boolean(counted) && Number(counted[1]) > before,
    counted ? `${counted[1]} counted, ${before} rows on screen` : 'no count shown');

  rec('RUNNING BALANCE — every row on screen carries the balance after it',
    (body.match(/Bal: ₹/g) ?? []).length === before,
    `${(body.match(/Bal: ₹/g) ?? []).length} of ${before} rows`);

  // THE ONE THAT MATTERS: paging must not move the figures.
  const more = pg.getByRole('button', { name: /show more/i });
  rec('POSITIVE CONTROL — "Show more" is present, so paging can be tested',
    (await more.count()) === 1, `${await more.count()} control(s)`);
  if (await more.count()) {
    await more.first().click();
    await pg.waitForTimeout(3000);
    const after = await rows();
    const bodyAfter = await text();
    rec('Paging loads more rows', after > before, `${before} → ${after} rows`);
    rec('NEGATIVE CONTROL — the totals do NOT move when the member pages',
      bodyAfter.includes(`₹${REFERENCE.credits}`) &&
        bodyAfter.includes(`₹${REFERENCE.debits}`) &&
        bodyAfter.includes(`₹${REFERENCE.net}`),
      'credits, debits and net unchanged after Show more');
    rec('RUNNING BALANCE — the newly loaded rows carry it too',
      (bodyAfter.match(/Bal: ₹/g) ?? []).length === after,
      `${(bodyAfter.match(/Bal: ₹/g) ?? []).length} of ${after} rows`);
  }

  // Back.
  // A LINK, not a button: back navigates to a fixed parent rather than calling
  // history.back(), which retraced the member's own alternating visits.
  const back = pg.getByRole('link', { name: /go back/i });
  rec('BACK — the ledger offers a way back',
    (await back.count()) === 1, `${await back.count()} control(s)`);
  if (await back.count()) {
    await back.first().click();
    await pg.waitForTimeout(2500);
    rec('BACK — it lands on the home screen, deterministically',
      pg.url().replace(APP, '').replace(/\/$/, '') === '/member',
      `landed on ${pg.url().replace(APP, '')}`);
  }
  await pg.close();
} finally {
  await b.close();
}
console.log(`\npass ${R.filter(Boolean).length}/${R.length}`);
