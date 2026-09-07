/**
 * Sheet flow 3 step 2 — "Policy coverage details appear: eligible amount,
 * frequency and covered items are shown."
 *
 * The covered items were always on this screen as service cards. The money was
 * not, so the step was only half built. Every figure here comes from
 * wallet/balance: available and total off the category, the annual and
 * per-booking limits off the config block beside it.
 *
 * Also checks the way IN to the order journey. The screen the sheet describes
 * was reachable only by typing its URL until this link existed.
 */
import { chromium } from 'playwright';

const APP = 'http://localhost:4300';
let failures = 0;
const check = (l, ok, d = '') => {
  console.log(`${ok ? 'PASS ' : 'FAIL '} ${l}${d ? ` — ${d}` : ''}`);
  if (!ok) failures++;
};

const b = await chromium.launch();
const p = await b.newPage();
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));

await p.goto(`${APP}/login`, { waitUntil: 'domcontentloaded' });
await p.getByLabel(/email/i).fill('shivam@gmail.com');
await p.getByLabel(/password/i).fill('12345678');
await p.getByRole('button', { name: /sign in/i }).click();
await p.waitForURL('**/member**', { timeout: 20000 });

await p.goto(`${APP}/member/vision`, { waitUntil: 'domcontentloaded' });
await p.waitForLoadState('networkidle');
await p.waitForTimeout(1200);
const body = await p.locator('body').innerText();

check('a cover panel is shown', /your cover/i.test(body));
check('eligible amount is shown', /available to use[\s\S]{0,40}₹/i.test(body), (body.match(/Available to use[\s\S]{0,20}/i) ?? [''])[0].replace(/\n/g, ' '));
check('what has been used is shown', /used so far/i.test(body));
check('the renewal period is shown', /each policy year/i.test(body));
check('the per-booking cap is shown', /most per booking/i.test(body));
// The clinic-booking cards are gone from vision: that journey is in neither
// sheet and its clinic list was empty, so every "Book Now" led nowhere.
check(
  'no clinic-booking cards on vision',
  (await p.getByRole('link', { name: /book now/i }).count()) === 0,
);
check(
  'the order journey is reachable from here',
  (await p.getByRole('link', { name: /start a new order/i }).count()) > 0,
);

// Dental shares this screen; the order journey is vision-only.
await p.goto(`${APP}/member/dental`, { waitUntil: 'domcontentloaded' });
await p.waitForLoadState('networkidle');
await p.waitForTimeout(1200);
check('dental gets the cover panel too', /your cover/i.test(await p.locator('body').innerText()));
// Dental's flow 4 IS a clinic visit, so its cards must survive.
check(
  'dental KEEPS its booking cards',
  (await p.getByRole('link', { name: /book now/i }).count()) > 0,
);
check(
  'dental does NOT offer the vision order link',
  (await p.getByRole('link', { name: /start a new order/i }).count()) === 0,
);

check('no page errors', errors.length === 0, errors.join(' | '));
await b.close();
console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} failed.`);
process.exit(failures === 0 ? 0 : 1);
