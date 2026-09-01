/**
 * Patient-flows flow 9, "additional documents requested" — the branch the
 * member could see and not act on until `CLAIMS_API.resubmitDocuments` was
 * wired.
 *
 * Asserts the section appears ONLY on DOCUMENTS_REQUIRED, and that the type
 * control is a select over the schema's five enum values. That second point is
 * the one worth a regression check: `documentType` is an enum on
 * `memberclaim.schema.ts:113-116`, and anything outside it fails validation on
 * save and comes back as a bare 500. A free-text input here would look correct
 * and 500 on every use.
 *
 * Needs the API on :4000, the app on :4300, and claim CLM-20260129-0002 in
 * DOCUMENTS_REQUIRED (it belongs to all@gmail.com).
 */
import { chromium } from 'playwright';

const APP = 'http://localhost:4300';
const CLAIM_ID = '697b74a6d84bfce8f0ee22e5';
// Same member, ASSIGNED — proves the section is gated on status, not just present.
const ASSIGNED_CLAIM_ID = '697b73d0d84bfce8f0ee22aa';
const EXPECTED_TYPES = ['INVOICE', 'PRESCRIPTION', 'REPORT', 'DISCHARGE_SUMMARY', 'OTHER'];

const log = (m) => console.log(m);
let failures = 0;
const check = (label, ok, detail = '') => {
  log(`${ok ? 'PASS ' : 'FAIL '} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
};

const browser = await chromium.launch();
const p = await browser.newPage();
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));

const go = async (u) => {
  await p.goto(APP + u, { waitUntil: 'domcontentloaded' });
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(400);
};

await go('/login');
await p.getByLabel(/email/i).fill('all@gmail.com');
await p.getByLabel(/password/i).fill('User@123');
await p.getByRole('button', { name: /sign in/i }).click();
await p.waitForURL('**/member**', { timeout: 20000 });

await go(`/member/claims/${CLAIM_ID}`);

const section = p.getByRole('heading', { name: /send the documents requested/i });
check('section shows on DOCUMENTS_REQUIRED', (await section.count()) > 0);

const select = p.locator('select');
check('type control is a select, not free text', (await select.count()) === 1);

const values = await select.locator('option').evaluateAll((o) => o.map((x) => x.value));
check(
  'select offers exactly the schema enum',
  JSON.stringify(values) === JSON.stringify(EXPECTED_TYPES),
  values.join(','),
);

const send = p.getByRole('button', { name: /send documents/i });
check('send is disabled until a file is chosen', await send.isDisabled());

// Negative control: an ASSIGNED claim, same member, must not offer it.
await go(`/member/claims/${ASSIGNED_CLAIM_ID}`);
check(
  'section absent on a claim in another status',
  (await p.getByRole('heading', { name: /send the documents requested/i }).count()) === 0,
);

check('no page errors', errors.length === 0, errors.join(' | '));

await browser.close();
log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
