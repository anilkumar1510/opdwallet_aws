/**
 * Patient-flows flow 3, steps 3 to 7 — the member's half of the vision journey.
 *
 * This is the flow where what was built had left the sheet entirely: a clinic
 * booking with slots, on a `vision-bookings/*` surface whose clinic list is
 * empty. The sheet and its `Vision Backend` tab describe an order and a coupon
 * handed off to Lenskart. This walks the journey the sheet actually describes.
 *
 * There is no partner or mode picker: the member gets a coupon, and the coupon
 * says where to spend it.
 *
 * The checks worth keeping are the last three. Steps 11-14 are shown as a
 * PLACEHOLDER sequence, and must never become a tracker — the tab records that
 * status, approval, rejection and fulfilment are all communicated outside this
 * application, so anything with a state or a current step would be inventing a
 * status nobody reports back.
 *
 * Resets the member's open order first, because the API allows one at a time
 * and a leftover would skip the journey straight to its end.
 *
 * Needs the API on :4000 and the app on :4300.
 */
import { chromium } from 'playwright';

const APP = 'http://localhost:4300';
// Relative, so the reset calls go through the app's own proxy and stay
// same-origin. Hitting :4000 directly from the page is blocked by CORS.
const API = '/api';
const MEMBER = { email: 'shivam@gmail.com', password: '12345678' };

let failures = 0;
const log = (m) => console.log(m);
const check = (label, ok, detail = '') => {
  log(`${ok ? 'PASS ' : 'FAIL '} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
};

const browser = await chromium.launch();
const ctx = await browser.newContext();
const p = await ctx.newPage();
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));

const go = async (u) => {
  await p.goto(APP + u, { waitUntil: 'domcontentloaded' });
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(500);
};

await go('/login');
await p.getByLabel(/email/i).fill(MEMBER.email);
await p.getByLabel(/password/i).fill(MEMBER.password);
await p.getByRole('button', { name: /sign in/i }).click();
await p.waitForURL('**/member**', { timeout: 20000 });

// Clear any open order so the journey starts at step 3.
const open = await p.evaluate(async (api) => {
  const res = await fetch(`${api}/member/vision/orders`, { credentials: 'include' });
  const body = await res.json();
  return (body.data ?? []).find((o) => o.status !== 'CANCELLED')?.orderId ?? null;
}, API);
if (open) {
  await p.evaluate(
    async ([api, id]) => {
      await fetch(`${api}/member/vision/orders/${id}/cancel`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'live check reset' }),
      });
    },
    [API, open],
  );
  log(`(reset: cancelled ${open})`);
}

await go('/member/vision/order');
let body = await p.locator('body').innerText();

check('the real screen renders, not the placeholder', !/not available yet|has not moved over/i.test(body));
check('the partner is named without being chosen', /Lenskart/i.test(body));
check(
  'no store picker is shown',
  (await p.getByRole('button', { name: /buy online|buy in store/i }).count()) === 0,
);

// Straight to the prescription step - no partner or mode to pick.
await p.getByRole('button', { name: /start my vision order/i }).click();
await p.waitForTimeout(1500);
body = await p.locator('body').innerText();
check('order started and asks for the prescription', /eye prescription/i.test(body));

const submit = p.getByRole('button', { name: /submit and get my coupon/i });
check('submit is blocked until a prescription is uploaded', await submit.isDisabled());

// Step 5: upload.
await p.locator('input[type="file"]').setInputFiles({
  name: 'eye-prescription.pdf',
  mimeType: 'application/pdf',
  buffer: Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n'),
});
await p.waitForTimeout(2000);
check('upload is confirmed by name', /eye-prescription\.pdf uploaded/i.test(await p.locator('body').innerText()));
check('submit is now enabled', !(await submit.isDisabled()));

// Steps 6-7: submit, receive the coupon.
await submit.click();
await p.waitForTimeout(2500);
body = await p.locator('body').innerText();
check('a coupon is issued and shown', /OPD-[A-Z0-9]{8}/.test(body), (body.match(/OPD-[A-Z0-9]{8}/) ?? [''])[0]);
check('the coupon states what it is worth', /worth ₹/i.test(body));
check(
  'a link to the partner is offered',
  (await p.getByRole('link', { name: /go to lenskart/i }).count()) > 0,
);
check('the stages after purchase are shown', /what happens next/i.test(body));
check(
  'all four downstream stages are listed',
  /above your coupon is collected separately/i.test(body) &&
    /order is reviewed/i.test(body) &&
    /partner fulfils/i.test(body) &&
    /someone will contact you/i.test(body),
);
check(
  'those stages are a placeholder, not a tracker',
  /you will not see them update here/i.test(body) && !/track (your )?order/i.test(body),
);

check('no page errors', errors.length === 0, errors.join(' | '));

/*
 * Close the order this run created.
 *
 * Without it the member is left holding an issued coupon, and because only one
 * order may be open at a time, the NEXT person to open the screen - a developer
 * looking at it, or this check on its next run - lands on the coupon and never
 * sees the partner picker, the upload or the submit. That is exactly how these
 * steps came to look missing.
 */
const leftover = await p.evaluate(async (api) => {
  const res = await fetch(`${api}/member/vision/orders`, { credentials: 'include' });
  const body = await res.json();
  return (body.data ?? []).find((o) => o.status !== 'CANCELLED')?.orderId ?? null;
}, API);
if (leftover) {
  await p.evaluate(
    async ([api, id]) => {
      await fetch(`${api}/member/vision/orders/${id}/cancel`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'live check cleanup' }),
      });
    },
    [API, leftover],
  );
  log(`(cleanup: cancelled ${leftover})`);
}

await browser.close();
log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
