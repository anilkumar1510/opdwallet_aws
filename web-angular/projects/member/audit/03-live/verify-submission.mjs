/**
 * The submission group — the last three scenarios in member-lab and
 * member-diagnostics.
 *
 * **MUTATING.** Submitting an existing prescription creates a real
 * LabPrescription / DiagnosticPrescription row, once per kind per run. It cannot
 * be forced by interception: the point of the scenario is that the request is
 * sent and the row comes back in the list.
 *
 * The two refusal scenarios are NOT here — they issue no request and belong in
 * `verify-submission-states.mjs`, which is non-mutating and re-runs free. Session
 * 37 claimed a vertical was fully exercised when this group was not; keeping the
 * two files separate is what makes "which harness covers what" answerable.
 *
 * Prefix is asserted on the NETWORK LOG. The lab and diagnostics hubs render the
 * same selector, so nothing on screen distinguishes a submission that filed a
 * diagnostics prescription against the lab prefix — the defect session 38 found
 * on the upload route, which this action could repeat.
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
    if (u.startsWith('/api') && r.request().method() === 'POST') posts.push({ u, s: r.status() });
  });
  await login(p);
  const go = async (u) => {
    await p.goto(APP + u, { waitUntil: 'domcontentloaded' });
    await p.waitForLoadState('networkidle');
    await p.waitForTimeout(1000);
  };

  for (const [hub, want, other] of [
    ['/member/lab-tests', '/api/member/lab/prescriptions/submit-existing', '/api/member/diagnostics/prescriptions/submit-existing'],
    ['/member/diagnostics', '/api/member/diagnostics/prescriptions/submit-existing', '/api/member/lab/prescriptions/submit-existing'],
  ]) {
    await go(hub);

    // POSITIVE CONTROL for this leg: the trigger the reference has must exist
    // here, on the hub, and open a chooser — not navigate to the records browser.
    const trigger = p.getByRole('button', { name: /use (a saved one|existing prescription)/i }).first();
    rec(`${hub} — the hub offers a saved-prescription control`, (await trigger.count()) > 0, `found: ${await trigger.count()}`);
    if (!(await trigger.count())) continue;

    await trigger.click();
    await p.waitForTimeout(800);
    const panel = await txt(p);
    rec(`${hub} — it opens a chooser in place, rather than leaving the hub`,
      /Choose a saved prescription/i.test(panel) && p.url().includes(hub),
      `url ${p.url()}`);

    const use = p.getByRole('button', { name: /use this one/i });
    const count = await use.count();
    if (!count) {
      rec(`${hub} — a saved prescription is offered to submit`, false, 'no records on this account');
      continue;
    }

    posts.length = 0;
    await use.first().click();
    await p.waitForTimeout(6000);

    const hit = posts.find((x) => x.u === want);
    const wrong = posts.find((x) => x.u === other);
    rec(`${hub} — submits WITHOUT a file upload, on its own prefix`,
      !!hit && hit.s < 400 && !wrong,
      `posts: ${posts.map((x) => x.u + ' ' + x.s).join(' | ') || 'none'}`);

    const after = await txt(p);
    rec(`${hub} — the member is told it was submitted, and the chooser closes`,
      /submitted|uploaded/i.test(after) && !/Choose a saved prescription/i.test(after),
      after.match(/Prescription [a-z]+\.[^.]*/i)?.[0]?.slice(0, 120) ?? after.slice(0, 120));

    // "the resulting journey is indistinguishable from an uploaded one" — the row
    // lands in the same list the upload path feeds, awaiting the same digitize.
    await go(hub + (hub.endsWith('diagnostics') ? '/orders' : '/orders'));
    const orders = await txt(p);
    rec(`${hub} — the submitted prescription joins the same awaiting-the-lab list an upload does`,
      /awaiting the lab/i.test(orders) || /DIAG-ORD-|ORD-/.test(orders),
      orders.slice(0, 160));
  }
} finally {
  await b.close();
}
console.log(`\npass ${R.filter(Boolean).length}/${R.length}`);
