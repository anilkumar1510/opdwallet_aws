// Verifies the new Cancel order button on the pharmacy order-detail page
// itself (not the bookings list): present + working pre-payment (ADJUDICATED)
// and post-payment (CONFIRMED, where it must also refund the wallet debit).
import { chromium } from 'playwright';

const APP = 'http://localhost:4300';
const API = 'http://localhost:4000';
const log = (...a) => console.log(...a);

const b = await chromium.launch();
try {
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  const txt = async () => (await p.locator('#main, main, body').first().innerText()).replace(/\s+/g, ' ').trim();
  const go = async (u) => {
    await p.goto(APP + u, { waitUntil: 'domcontentloaded' });
    await p.waitForLoadState('networkidle');
    await p.waitForTimeout(400);
  };

  await go('/login');
  await p.getByLabel(/email/i).fill('shivam@gmail.com');
  await p.getByLabel(/password/i).fill('12345678');
  await p.getByRole('button', { name: /sign in/i }).click();
  await p.waitForURL('**/member**', { timeout: 20000 });

  const loginRes = await fetch(`${API}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'shivam@gmail.com', password: '12345678' }),
  }).then((r) => r.json());
  const getCat002 = async () => {
    const bal = await fetch(`${API}/api/wallet/balance`, {
      headers: { Authorization: `Bearer ${loginRes.token}` },
    }).then((r) => r.json());
    return bal.categories.find((c) => c.categoryCode === 'CAT002')?.available;
  };

  const createOrder = async (search) => {
    await go('/member/pharmacy');
    await p.getByRole('button', { name: /don't have a prescription/i }).click({ timeout: 5000 }).catch(() => {});
    await p.waitForLoadState('networkidle');
    await p.waitForTimeout(600);
    await p.getByPlaceholder('Search medicines').fill(search);
    await p.getByRole('button', { name: 'Search' }).click();
    await p.waitForTimeout(600);
    await p.getByRole('button', { name: 'Add' }).first().click();
    await p.waitForTimeout(400);
    await p.getByRole('button', { name: 'Submit for review' }).click();
    await p.waitForTimeout(2000);
    return p.url().split('/').pop();
  };

  log('### CASE A: cancel from order page while ADJUDICATED (unpaid) ###');
  const orderA = await createOrder('ors');
  log('order created:', orderA, '| on order page:', p.url().includes(orderA));
  const cancelBtnA = p.getByRole('button', { name: /^cancel order$/i });
  log('Cancel order button visible on ADJUDICATED order page?', (await cancelBtnA.count()) > 0);
  const balBeforeA = await getCat002();
  await cancelBtnA.click();
  await p.waitForTimeout(1500);
  const bodyA = await txt();
  log('body after cancel (A):', bodyA.match(/(Cancelled|Order confirmed|error)[^.]{0,120}/i)?.[0] ?? bodyA.slice(0, 200));
  const balAfterA = await getCat002();
  log(`CAT002 balance before/after (A, was unpaid, should be unchanged): ${balBeforeA} -> ${balAfterA}`);

  log('\n### CASE B: cancel from order page while CONFIRMED (paid) ###');
  const orderB = await createOrder('vitamin');
  const payBtn = p.getByRole('button', { name: /pay and confirm order/i });
  log('pay button present?', (await payBtn.count()) > 0);
  await payBtn.click();
  await p.waitForTimeout(2500);
  const balBeforeB = await getCat002();
  log('CAT002 balance after payment (before cancel):', balBeforeB);
  const cancelBtnB = p.getByRole('button', { name: /^cancel order$/i });
  log('Cancel order button visible on CONFIRMED order page?', (await cancelBtnB.count()) > 0);
  const net = [];
  p.on('response', (r) => { const u = new URL(r.url()).pathname; if (u.startsWith('/api')) net.push(`${r.request().method()} ${u} ${r.status()}`); });
  await cancelBtnB.click();
  await p.waitForTimeout(1500);
  log('API calls:', net.join(' | '));
  const bodyB = await txt();
  log('body after cancel (B):', bodyB.match(/(Cancelled|Order confirmed|error)[^.]{0,120}/i)?.[0] ?? bodyB.slice(0, 200));
  const balAfterB = await getCat002();
  log(`CAT002 balance before/after (B, was paid, should refund back up): ${balBeforeB} -> ${balAfterB}`);
} finally {
  await b.close();
}
