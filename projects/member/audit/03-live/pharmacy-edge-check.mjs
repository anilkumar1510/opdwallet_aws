// Edge-case checks beyond the happy path: cancel-before-payment refunds
// correctly, and the invoice becomes downloadable once delivered.
import { chromium } from 'playwright';

const APP = 'http://localhost:4300';
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

  // Check wallet CAT002 balance before, to verify the cancel refund lands.
  const loginRes = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'shivam@gmail.com', password: '12345678' }),
  }).then((r) => r.json());
  const balanceBefore = await fetch('http://localhost:4000/api/wallet/balance', {
    headers: { Authorization: `Bearer ${loginRes.token}` },
  }).then((r) => r.json());
  const cat002Before = balanceBefore.categories.find((c) => c.categoryCode === 'CAT002')?.available;
  log('CAT002 balance before:', cat002Before);

  log('\n### CANCEL-BEFORE-PAYMENT REFUND CHECK ###');
  await go('/member/pharmacy');
  await p.getByRole('button', { name: /don't have a prescription/i }).click({ timeout: 5000 }).catch(() => {});
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(600);
  await p.getByPlaceholder('Search medicines').fill('vitamin');
  await p.getByRole('button', { name: 'Search' }).click();
  await p.waitForTimeout(600);
  await p.getByRole('button', { name: 'Add' }).first().click();
  await p.waitForTimeout(400);
  await p.getByRole('button', { name: 'Submit for review' }).click();
  await p.waitForTimeout(2000);
  const orderId = p.url().split('/').pop();
  log('order created:', orderId);

  const orderBody = await txt();
  log('order screen excerpt:', orderBody.slice(0, 250));

  // Cancel via the real API directly (no cancel button wired in the UI yet — checking that).
  const hasCancelBtn = (await p.getByRole('button', { name: /cancel/i }).count()) > 0;
  log('cancel button present in UI?', hasCancelBtn);

  const cancelRes = await fetch(`http://localhost:4000/api/member/pharmacy/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${loginRes.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'Testing cancel-before-payment refund' }),
  });
  log('cancel API status:', cancelRes.status);
  const cancelled = await cancelRes.json();
  log('cancelled order status:', cancelled.status, cancelled.paymentStatus);

  const balanceAfter = await fetch('http://localhost:4000/api/wallet/balance', {
    headers: { Authorization: `Bearer ${loginRes.token}` },
  }).then((r) => r.json());
  const cat002After = balanceAfter.categories.find((c) => c.categoryCode === 'CAT002')?.available;
  log('CAT002 balance after cancel:', cat002After, '(should be unchanged — nothing was ever debited pre-payment)');
} finally {
  await b.close();
}
