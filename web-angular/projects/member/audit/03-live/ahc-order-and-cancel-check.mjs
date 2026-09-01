/**
 * The two flow steps wired after the API fixes landed:
 *
 *   flow 8, after step 10 — the placed AHC order and its per-leg reports.
 *     This route was a placeholder because `getOrderByOrderId` populated
 *     `userId` into a document and the controller compared it as a string, so
 *     every member was refused their own order. The first check would have
 *     failed against the old API.
 *
 *   flow 7, step 17 — cancelling a radiology order. Pathology has no cancel
 *     endpoint, so the control must be absent there. That asymmetry is the
 *     easiest thing for a later change to "tidy up" into a control that 404s,
 *     which is why it is asserted in both directions.
 *
 * Needs the API on :4000 (rebuilt) and the app on :4300.
 */
import { chromium } from 'playwright';

const APP = 'http://localhost:4300';
const AHC_ORDER = 'AHC-ORD-1786182053508-8GHNX7JM9'; // shivam's
const MEMBER = { email: 'shivam@gmail.com', password: '12345678' };

let failures = 0;
const log = (m) => console.log(m);
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
  await p.waitForTimeout(500);
};

await go('/login');
await p.getByLabel(/email/i).fill(MEMBER.email);
await p.getByLabel(/password/i).fill(MEMBER.password);
await p.getByRole('button', { name: /sign in/i }).click();
await p.waitForURL('**/member**', { timeout: 20000 });

// --- flow 8: the placed order ---
await go(`/member/ahc/orders/${AHC_ORDER}`);
const body = await p.locator('body').innerText();

check('order screen renders, not the placeholder', !/not working yet|has not moved over/i.test(body));
check('order not reported as missing', !/Health check not found/i.test(body));
check('the order id is shown', body.includes(AHC_ORDER), body.slice(0, 80).replace(/\n/g, ' '));
check(
  'a leg is shown with its report state',
  /report is not ready yet|is ready\./i.test(body),
);
check(
  'no download link is offered for a file nothing serves',
  (await p.getByRole('link', { name: /download/i }).count()) === 0,
);

// --- flow 7: cancel, radiology only ---
await go('/member/diagnostics/orders');
const radiologyOrder = p.locator('a[href*="/member/diagnostics/orders/"]').first();
if (await radiologyOrder.count()) {
  await radiologyOrder.click();
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(500);
  const terminal = /cancelled|completed/i.test(await p.locator('body').innerText());
  check(
    'radiology order offers cancel (or is already terminal)',
    terminal || (await p.getByRole('button', { name: /cancel this order/i }).count()) > 0,
    terminal ? 'order is terminal, control correctly hidden' : '',
  );
} else {
  log('SKIP  no radiology order for this member');
}

await go('/member/lab-tests/orders');
const pathologyOrder = p.locator('a[href*="/member/lab-tests/orders/"]').first();
if (await pathologyOrder.count()) {
  await pathologyOrder.click();
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(500);
  check(
    'pathology order offers NO cancel — it has no endpoint',
    (await p.getByRole('button', { name: /cancel this order/i }).count()) === 0,
  );
} else {
  log('SKIP  no pathology order for this member');
}

check('no page errors', errors.length === 0, errors.join(' | '));

await browser.close();
log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
