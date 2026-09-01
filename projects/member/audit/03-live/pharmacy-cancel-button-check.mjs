import { chromium } from 'playwright';
const APP = 'http://localhost:4300';
const log = (...a) => console.log(...a);

const b = await chromium.launch();
try {
  const ctx = await b.newContext();
  const p = await ctx.newPage();
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

  // Create a fresh order to cancel via the real UI button this time.
  await go('/member/pharmacy');
  await p.getByRole('button', { name: /don't have a prescription/i }).click({ timeout: 5000 }).catch(() => {});
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(600);
  await p.getByPlaceholder('Search medicines').fill('ors');
  await p.getByRole('button', { name: 'Search' }).click();
  await p.waitForTimeout(600);
  await p.getByRole('button', { name: 'Add' }).first().click();
  await p.waitForTimeout(400);
  await p.getByRole('button', { name: 'Submit for review' }).click();
  await p.waitForTimeout(2000);
  const orderId = p.url().split('/').pop();
  log('order created:', orderId);

  await go('/member/bookings?tab=pharmacy');
  await p.waitForTimeout(600);
  const row = p.locator('li', { hasText: orderId });
  log('order row found in bookings list?', (await row.count()) > 0);
  const cancelBtn = row.getByRole('button', { name: /cancel booking/i });
  log('Cancel booking button present on this row?', (await cancelBtn.count()) > 0);

  const net = [];
  p.on('response', (r) => { const u = new URL(r.url()).pathname; if (u.startsWith('/api')) net.push(`${r.request().method()} ${u} ${r.status()}`); });
  await cancelBtn.click();
  await p.waitForTimeout(2000);
  log('API calls after clicking Cancel booking:', net.join(' | '));

  const bodyAfter = (await p.locator('main').first().innerText()).replace(/\s+/g, ' ');
  const stillShowsOrder = bodyAfter.includes(orderId);
  const statusMatch = bodyAfter.match(new RegExp(orderId + '.{0,150}'));
  log('row text after cancel:', statusMatch ? statusMatch[0] : '(order not found in list anymore)');
} finally {
  await b.close();
}
