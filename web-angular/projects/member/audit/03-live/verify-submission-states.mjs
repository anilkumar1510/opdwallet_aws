/**
 * The two refusal scenarios of the submission group, both kinds.
 *
 * **NON-MUTATING by nature** — each scenario's second clause is that no request
 * is sent, so a run that writes anything has already failed. Split from
 * `verify-submission.mjs`, which does write, so "which harness covers what" has
 * an answer.
 *
 * Every POST is counted, not just the upload one: "no request is sent" is a
 * claim about the whole page, and a narrower count could miss one.
 */
import { chromium } from 'playwright';
const APP = 'http://localhost:4200';
const R = [];
const rec = (n, p, note) => { R.push(p); console.log(`${p ? 'PASS' : 'FAIL'}  ${n}\n        ${note}`); };
const b = await chromium.launch();
const login = async (pg) => {
  await pg.goto(APP + '/login', { waitUntil: 'domcontentloaded' });
  await pg.waitForLoadState('networkidle');
  await pg.getByLabel(/email/i).fill('shivam@gmail.com');
  await pg.getByLabel(/password/i).fill('12345678');
  await pg.getByRole('button', { name: /sign in/i }).click();
  await pg.waitForURL('**/member**', { timeout: 20000 });
};
const txt = async (pg) => (await pg.locator('#main, body').first().innerText()).replace(/\s+/g, ' ').trim();

try {
  const p = await (await b.newContext()).newPage();
  const posts = [];
  p.on('response', (r) => {
    const u = new URL(r.url()).pathname;
    if (u.startsWith('/api') && r.request().method() === 'POST') posts.push(u);
  });
  await login(p);

  for (const route of ['lab-tests', 'diagnostics']) {
    const url = `${APP}/member/${route}/upload`;

    // ---- Scenario: Unsupported or oversized file
    {
      await p.goto(url, { waitUntil: 'domcontentloaded' });
      await p.waitForLoadState('networkidle');
      await p.waitForTimeout(1000);
      posts.length = 0;

      // Fill the rest of the form FIRST, so "the rest of the form is preserved"
      // is a real assertion rather than a check on an empty form.
      const addr = p.locator('select#address');
      const opts = await addr.locator('option').evaluateAll((e) => e.map((x) => x.value).filter(Boolean));
      if (opts.length) await addr.selectOption(opts[0]);
      await p.locator('input#date').fill('2026-08-01');
      await p.locator('input#date').dispatchEvent('change');
      await p.locator('textarea#notes').fill('keep me');
      await p.waitForTimeout(300);

      await p.locator('input[type=file]').setInputFiles({
        name: 'notes.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('not a prescription'),
      });
      await p.waitForTimeout(800);

      const t = await txt(p);
      const notes = await p.locator('textarea#notes').inputValue();
      const date = await p.locator('input#date').inputValue();
      rec(`${route} — an unsupported file is rejected with a message stating the restriction`,
        /PDF or a clear photo/i.test(t), t.match(/Upload a PDF[^.]*\./i)?.[0] ?? t.slice(0, 140));
      rec(`${route} — and the rest of the form is preserved`,
        notes === 'keep me' && date === '2026-08-01', `notes="${notes}" date="${date}"`);
      rec(`${route} — and no request is sent`, posts.length === 0, `posts: ${posts.join(' | ') || 'none'}`);
    }

    // ---- Scenario: Incomplete submission is refused
    //
    // Reachable as of session 41: the control is enabled and validates on
    // attempt, matching appointment-confirm-page and vendor-booking-page. Under
    // the old disabled-button model the scenario could not be driven at all —
    // "WHEN they attempt to submit" had no attempt.
    //
    // Each case leaves exactly ONE field missing and asserts the message names
    // THAT field. A check for "some message appeared" would pass on any of them
    // and would not test the clause, which is that what is missing is named.
    for (const [label, setup, names, notNames] of [
      ['the prescription date', async () => {
        await p.locator('input[type=file]').setInputFiles('presc.pdf');
        const addr = p.locator('select#address');
        const opts = await addr.locator('option').evaluateAll((e) => e.map((x) => x.value).filter(Boolean));
        if (opts.length) await addr.selectOption(opts[0]);
      }, /date/i, /address|file/i],
      // The address must be CLEARED, not merely left alone: an effect on the page
      // prefills the default one, so "not supplied" is unreachable by omission.
      // Selecting the blank option is a real thing a member can do — the select
      // renders it — and the first version of this case, which only skipped the
      // step, submitted a real prescription instead of being refused.
      ['the collection address', async () => {
        await p.locator('input[type=file]').setInputFiles('presc.pdf');
        await p.locator('input#date').fill('2026-08-01');
        await p.locator('input#date').dispatchEvent('change');
        await p.locator('select#address').selectOption('');
      }, /address/i, /date|file/i],
      ['the file', async () => {
        const addr = p.locator('select#address');
        const opts = await addr.locator('option').evaluateAll((e) => e.map((x) => x.value).filter(Boolean));
        if (opts.length) await addr.selectOption(opts[0]);
        await p.locator('input#date').fill('2026-08-01');
        await p.locator('input#date').dispatchEvent('change');
      }, /file/i, /address|date/i],
    ]) {
      await p.goto(url, { waitUntil: 'domcontentloaded' });
      await p.waitForLoadState('networkidle');
      await p.waitForTimeout(1000);
      posts.length = 0;

      await setup();
      await p.waitForTimeout(500);

      const submit = p.getByRole('button', { name: /upload prescription/i });
      const enabled = await submit.isEnabled();
      await submit.click();
      await p.waitForTimeout(1200);

      const alerts = (await p.locator('[role=alert]').allInnerTexts()).join(' ').replace(/\s+/g, ' ').trim();
      rec(`${route} — missing ${label}: the control is enabled, so the attempt is possible`,
        enabled, `enabled: ${enabled}`);
      rec(`${route} — missing ${label}: refused with a message naming it`,
        names.test(alerts) && !notNames.test(alerts),
        `alert text: "${alerts || 'NONE'}"`);
      rec(`${route} — missing ${label}: and no request is sent`,
        posts.length === 0, `posts: ${posts.join(' | ') || 'none'}`);
    }
  }
} finally {
  await b.close();
}
console.log(`\npass ${R.filter(Boolean).length}/${R.length}`);
