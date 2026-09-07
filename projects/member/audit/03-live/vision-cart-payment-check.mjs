/**
 * The vision cart and its co-payment, end to end in the browser.
 *
 * The shape this asserts is the point: the member never types an amount. The
 * coupon is a reference id, the partner prices the basket and reports its
 * value, operations record it, and only then does a cart exist to apply the
 * copay and the per-service cap to.
 *
 * The last two checks are the ones worth keeping:
 *   - only the COPAY is collected here. The amount above the plan's cap is
 *     paid at the partner's till, and offering to take it too would bill the
 *     member twice for one pair of glasses.
 *   - the cart screen has no input. If one ever appears, someone has started
 *     trusting a figure the partner did not send.
 *
 * Needs the API on :4000 and the app on :4300. Uses the ops account to stand in
 * for the partner report, which is what a person does today.
 */
import { chromium } from 'playwright';

const APP = 'http://localhost:4300';
const API = 'http://localhost:4000/api';
const MEMBER = { email: 'shivam@gmail.com', password: '12345678' };
const OPS = { email: 'opsadmin@gmail.com', password: 'Admin@123' };
const ORDER_VALUE = 4200;

let failures = 0;
const log = (m) => console.log(m);
const check = (label, ok, detail = '') => {
  log(`${ok ? 'PASS ' : 'FAIL '} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
};

/** Ops report, over HTTP — the browser session is the member's. */
async function reportAsOps(orderId) {
  const login = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(OPS),
  });
  const cookie = login.headers.getSetCookie?.().join('; ') ?? '';
  const res = await fetch(`${API}/ops/vision/orders/${orderId}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({
      orderValue: ORDER_VALUE,
      partnerOrderId: 'LK-CHECK-1',
      serviceCode: 'EYEGLASSES',
    }),
  });
  return res.json();
}

const browser = await chromium.launch();
const p = await browser.newPage();
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));

const go = async (u) => {
  await p.goto(APP + u, { waitUntil: 'domcontentloaded' });
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(700);
};

await go('/login');
await p.getByLabel(/email/i).fill(MEMBER.email);
await p.getByLabel(/password/i).fill(MEMBER.password);
await p.getByRole('button', { name: /sign in/i }).click();
await p.waitForURL('**/member**', { timeout: 20000 });

// Clear anything in progress so the journey starts at the beginning.
const clear = async () => {
  const open = await p.evaluate(async () => {
    const r = await fetch('/api/member/vision/orders', { credentials: 'include' });
    const b = await r.json();
    return (b.data ?? []).find((o) => !['CANCELLED', 'USED', 'REPORTED'].includes(o.status))
      ?.orderId ?? null;
  });
  if (open) {
    await p.evaluate(async (id) => {
      await fetch(`/api/member/vision/orders/${id}/cancel`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'cart payment check' }),
      });
    }, open);
  }
};
await clear();

await go('/member/vision/order');
// The start button is disabled until partners load, and absent entirely if an
// order is already in progress - wait for it rather than racing it.
await p.waitForFunction(
  () => {
    const b = [...document.querySelectorAll('button')].find((x) =>
      /start my vision order/i.test(x.textContent || ''),
    );
    return b && !b.disabled;
  },
  { timeout: 20000 },
);
await p.getByRole('button', { name: /start my vision order/i }).click();
await p.waitForTimeout(1600);
await p.locator('input[type="file"]').setInputFiles({
  name: 'rx.pdf',
  mimeType: 'application/pdf',
  buffer: Buffer.from('%PDF-1.4\ntrailer<</Root 1 0 R>>\n%%EOF\n'),
});
await p.waitForTimeout(1900);
await p.getByRole('button', { name: /submit and get my coupon/i }).click();
await p.waitForTimeout(2600);

// Cart before the partner reports.
await p.getByRole('link', { name: /see your cart/i }).click();
await p.waitForLoadState('networkidle');
await p.waitForTimeout(900);
const orderId = new URL(p.url()).pathname.split('/').at(-2);
check('cart waits on the partner before any report', /nothing to show yet/i.test(await p.locator('body').innerText()));
check('cart asks the member for nothing', (await p.locator('input').count()) === 0);

const reported = await reportAsOps(orderId);
check('ops can record the partner report', reported?.success === true, reported?.message ?? '');

await p.reload({ waitUntil: 'domcontentloaded' });
await p.waitForLoadState('networkidle');
await p.waitForTimeout(1200);
const cart = await p.locator('body').innerText();

check('the cart now shows the order value', /4,200/.test(cart));
check('it shows what the cover paid', /paid from your cover/i.test(cart));
check('it shows the co-payment', /co-payment/i.test(cart));
check('it still asks for nothing', (await p.locator('input').count()) === 0);
check(
  'only the copay is collected here, not the whole balance',
  /₹840 co-payment to settle/i.test(cart) && /goes to Lenskart directly/i.test(cart),
);

await p.getByRole('link', { name: /pay my co-payment/i }).click();
await p.waitForLoadState('networkidle');
await p.waitForTimeout(1200);
const payButton = p.getByRole('button', { name: /mark as paid/i });
check('the payment screen offers Mark as paid', (await payButton.count()) > 0);

await payButton.click();
await p.waitForTimeout(2500);
const settled = await p.locator('body').innerText();
check(
  'the payment completes',
  /completed|paid/i.test(settled) && (await p.getByRole('button', { name: /mark as paid/i }).count()) === 0,
);

check('no page errors', errors.length === 0, errors.join(' | '));

await browser.close();
log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
