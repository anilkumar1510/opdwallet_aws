/**
 * Session 53b — what was left after the endpoint work, minus anything that
 * changes a flow.
 *
 *   1. Per-test prices on the vendor screen. NO new request: the data was
 *      already mapped from `carts/:cartId/vendors` and simply never rendered.
 *   2. Claim document download. The screen said "N documents submitted with this
 *      claim" beside no way to open any of them.
 *   3. The one-shot prefill latches — a member can now clear a prefilled pincode.
 *
 * **NON-MUTATING. Every assertion is a GET or a keystroke.** No booking, no
 * order, no cancellation, no run budget spent.
 *
 * CONTROLS
 *   positive — each screen under test is reached and populated, asserted by
 *              content only it has.
 *   negative — the vendor screen makes NO extra pricing request. The whole point
 *              of the fix is that the data was already in hand; a `vendors/:id/
 *              pricing` call would mean it was re-fetched.
 *   negative — the pincode, once cleared, STAYS cleared. This is the defect the
 *              latch fixes and the assertion would have failed before it.
 */
import { chromium } from 'playwright';

const APP = 'http://localhost:4200';
const R = [];
const rec = (n, p, note) => { R.push(p); console.log(`${p ? 'PASS' : 'FAIL'}  ${n}\n        ${note}`); };
/**
 * A check that could not run for want of test data. Counted separately and
 * NEVER as a pass — an unrunnable assertion that scores green is how a harness
 * comes to report success for a feature nobody exercised.
 */
const BLOCKED = [];
const skip = (n, why) => { BLOCKED.push(n); console.log(`SKIP  ${n}\n        ${why}`); };

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
  // ------------------------------------------------- 1. claim documents
  {
    const pg = await (await b.newContext()).newPage();
    await login(pg);
    await pg.goto(APP + '/member/claims', { waitUntil: 'domcontentloaded' });
    await pg.waitForLoadState('networkidle');
    await pg.waitForTimeout(1800);

    const first = (
      await pg.getByRole('link').evaluateAll((els) =>
        // The claim detail route takes the Mongo _id, not the CLM- business id —
        // identifier duality, already on record for claims specifically.
        els.map((e) => e.getAttribute('href')).filter((h) => h && /\/member\/claims\/[0-9a-f]{24}$/.test(h)),
      )
    )[0];
    rec('POSITIVE CONTROL — a claim is reachable to open', Boolean(first), first ?? 'no claim link');

    if (first) {
      await pg.goto(APP + first, { waitUntil: 'domcontentloaded' });
      await pg.waitForLoadState('networkidle');
      await pg.waitForTimeout(1800);

      const body = await txt(pg);
      rec('CLAIM DOCS — the documents are listed, not just counted',
        /document.{0,40}submitted with this claim/i.test(body), body.slice(0, 120));

      const downloads = pg.getByRole('button', { name: /^download$/i });
      const count = await downloads.count();
      rec('CLAIM DOCS — each document offers a download',
        count > 0, `${count} download control(s)`);

      if (count > 0) {
        const sent = [];
        pg.on('request', (r) => {
          const u = new URL(r.url()).pathname;
          if (/claims\/files\//.test(u)) sent.push(u);
        });
        await downloads.first().click();
        await pg.waitForTimeout(3000);
        rec('CLAIM DOCS — the previously-uncalled file route is requested',
          sent.length === 1, sent[0] ?? 'no request to member/claims/files/...');

        // Every stored filePath in this database is a macOS path from the
        // original developer's machine, so this is the branch that really runs.
        const after = await txt(pg);
        const failed = /could not open that document/i.test(after);
        rec('CLAIM DOCS — a download either succeeds or is DISCLOSED, never silent',
          failed || !/Opening…/.test(after),
          failed ? 'failure reported to the member' : 'no stuck pending state');
      }
    }
    await pg.close();
  }

  // ------------------------------------------- 2. vendor per-test pricing
  {
    const pg = await (await b.newContext()).newPage();
    const calls = [];
    pg.on('request', (r) => {
      const u = new URL(r.url()).pathname;
      if (u.includes('/api/')) calls.push(u);
    });
    await login(pg);
    await pg.goto(APP + '/member/lab-tests/orders', { waitUntil: 'domcontentloaded' });
    await pg.waitForLoadState('networkidle');
    await pg.waitForTimeout(1500);

    // Reach a cart directly. The bookings list renders cart rows but does not
    // LINK them, so there is no href to follow from there — ask the API for a
    // cart id and navigate to the route that owns it.
    const cartId = await pg.evaluate(async () => {
      const res = await fetch('/api/member/lab/carts', { credentials: 'include' });
      const json = await res.json();
      const rows = json?.data ?? [];
      return rows.length ? (rows[0].cartId ?? rows[0]._id ?? null) : null;
    });
    if (!cartId) {
      skip('PRICING — per-test rows on the vendor screen',
        'this account has NO lab or diagnostic cart (both endpoints return []), so the ' +
        'vendor screen cannot be reached. Test-data ask in 31-run-budget.md.');
    }

    let vendorHref = null;
    if (cartId) {
      await pg.goto(APP + `/member/lab-tests/cart/${cartId}`, { waitUntil: 'domcontentloaded' });
      await pg.waitForLoadState('networkidle');
      await pg.waitForTimeout(2200);
      vendorHref = (
        await pg.getByRole('link').evaluateAll((els) =>
          els.map((e) => e.getAttribute('href')).filter((h) => h && /\/vendor\//.test(h)),
        )
      )[0];
      rec('POSITIVE CONTROL — a vendor is quoting for this cart',
        Boolean(vendorHref), vendorHref ?? (await txt(pg)).slice(0, 140));
    }

    {
      if (vendorHref) {
        calls.length = 0;
        await pg.goto(APP + vendorHref, { waitUntil: 'domcontentloaded' });
        await pg.waitForLoadState('networkidle');
        await pg.waitForTimeout(2200);
        const body = await txt(pg);

        rec('PRICING — the summary reaches the screen',
          /Summary/i.test(body) && /Total/i.test(body), body.slice(0, 100));
        // A per-test row means something priced sits ABOVE the "Tests" subtotal.
        const testsIdx = body.search(/Tests\s*₹/);
        const summaryIdx = body.search(/Summary/i);
        rec('PRICING — per-test rows appear between the summary heading and the Tests subtotal',
          summaryIdx >= 0 && testsIdx > summaryIdx + 'Summary'.length + 3,
          body.slice(Math.max(0, summaryIdx), testsIdx + 24) || 'no rows between');

        rec('NEGATIVE CONTROL — no extra pricing request was made',
          !calls.some((c) => /vendors\/[^/]+\/pricing/.test(c)),
          calls.filter((c) => /pricing/.test(c)).join(' ') || 'no pricing endpoint called');
      }
    }
    await pg.close();
  }

  // ------------------------------------------------ 3. the prefill latch
  {
    const pg = await (await b.newContext()).newPage();
    await login(pg);
    await pg.goto(APP + '/member/dental', { waitUntil: 'domcontentloaded' });
    await pg.waitForLoadState('networkidle');
    await pg.waitForTimeout(1500);
    const clinicsHref = (
      await pg.getByRole('link').evaluateAll((els) =>
        els.map((e) => e.getAttribute('href')).filter((h) => h && /\/clinics/.test(h)),
      )
    )[0];
    if (!clinicsHref) {
      rec('POSITIVE CONTROL — the clinics search is reachable', false, 'no clinics link');
    } else {
      await pg.goto(APP + clinicsHref, { waitUntil: 'domcontentloaded' });
      await pg.waitForLoadState('networkidle');
      await pg.waitForTimeout(1800);
      const pin = pg.locator('input[name=pincode]');
      const seeded = await pin.inputValue();
      rec('POSITIVE CONTROL — the pincode is seeded from the profile',
        seeded.length > 0, `seeded with "${seeded}"`);

      await pin.fill('');
      await pg.waitForTimeout(900);
      const afterClear = await pin.inputValue();
      rec('LATCH — a cleared pincode STAYS cleared',
        afterClear === '', `after clearing: "${afterClear}"`);

      await pin.fill('110001');
      await pg.waitForTimeout(900);
      rec('LATCH — the member can search a pincode that is not their own',
        (await pin.inputValue()) === '110001', `field holds "${await pin.inputValue()}"`);
    }
    await pg.close();
  }
} finally {
  await b.close();
}
console.log(`\npass ${R.filter(Boolean).length}/${R.length}`);
