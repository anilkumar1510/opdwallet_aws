/**
 * new-claim-page: the prefill guard, and the refusal messages.
 *
 * **NON-MUTATING.** Nothing here submits a claim — every case asserts that no
 * request is sent. `verify-claims.mjs` is the mutating one; this is its states
 * counterpart, the same split as verify-dental / verify-dental-states.
 *
 * Claims has no category-allowance constraint of the kind that spent CAT006, so
 * this can run freely. It costs no consultations run.
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
const alerts = async (pg) =>
  (await pg.locator('[role=alert]').allInnerTexts()).join(' ').replace(/\s+/g, ' ').trim();

try {
  const p = await (await b.newContext()).newPage();
  const posts = [];
  p.on('response', (r) => {
    const u = new URL(r.url()).pathname;
    if (u.startsWith('/api') && r.request().method() === 'POST') posts.push(u);
  });
  await login(p);
  const open = async () => {
    await p.goto(APP + '/member/claims/new', { waitUntil: 'domcontentloaded' });
    await p.waitForLoadState('networkidle');
    await p.waitForTimeout(1200);
    posts.length = 0;
  };

  // ---- POSITIVE CONTROL: the guard did not break the prefill it guards.
  await open();
  const prefilled = await p.locator('select#patient').inputValue();
  const options = await p
    .locator('select#patient option')
    .evaluateAll((e) => e.map((x) => ({ v: x.value, t: x.textContent.trim() })));
  rec('POSITIVE CONTROL — the patient is still prefilled to the active member',
    prefilled !== '', `value="${prefilled}" among ${options.length} option(s)`);

  // ---- Is the unguarded effect member-REACHABLE on this page?
  //
  // The upload form's address select carried a blank "Select an address" option,
  // so the member could clear it and the effect refilled it. This select is built
  // from the family list with no blank option. Checked rather than assumed —
  // "line-for-line the same code" is true of the code and says nothing about
  // whether a member can get to it.
  const hasBlank = options.some((o) => o.v === '');
  rec('The patient select offers no empty choice, so the field cannot be cleared from the UI',
    !hasBlank, `options: ${options.map((o) => `"${o.v}"`).join(', ')}`);

  // Force the empty value the way the effect would have seen it, and confirm the
  // guard holds: pre-fix the effect would put the member straight back.
  await p.locator('select#patient').evaluate((el) => {
    el.value = '';
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await p.waitForTimeout(900);
  const afterClear = await p.locator('select#patient').inputValue();
  rec('GUARD — once cleared, the field stays cleared (the effect does not refill it)',
    afterClear === '', `value after clearing: "${afterClear}"`);

  // ---- The submit path refuses, naming the field.
  await p.getByRole('button', { name: /submit claim/i }).click();
  await p.waitForTimeout(1000);
  const a1 = await alerts(p);
  rec('REFUSAL — with no patient, the message names the patient',
    /patient/i.test(a1) && !/category|provider|bill|prescription/i.test(a1),
    `alert: "${a1 || 'NONE'}"`);
  rec('REFUSAL — and no request is sent', posts.length === 0, `posts: ${posts.join(' | ') || 'none'}`);

  // ---- A second field, so the assertion is testing the naming and not just the
  // presence of one hardcoded string.
  await open();
  await p.locator('select#category').selectOption('');
  await p.waitForTimeout(400);
  posts.length = 0;
  await p.getByRole('button', { name: /submit claim/i }).click();
  await p.waitForTimeout(1000);
  const a2 = await alerts(p);
  rec('REFUSAL — with no category, the message names the category, not the patient',
    /category/i.test(a2) && !/patient/i.test(a2), `alert: "${a2 || 'NONE'}"`);
  rec('REFUSAL — and no request is sent', posts.length === 0, `posts: ${posts.join(' | ') || 'none'}`);

  // ---- NEGATIVE CONTROL: the control is enabled, so the attempt is possible at
  // all. Under the old disabled-button model none of the above could be driven.
  rec('NEGATIVE CONTROL — the submit control is enabled while the form is incomplete',
    await p.getByRole('button', { name: /submit claim/i }).isEnabled(), 'enabled');
} finally {
  await b.close();
}
console.log(`\npass ${R.filter(Boolean).length}/${R.length}`);
