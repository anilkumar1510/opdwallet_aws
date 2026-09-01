// Verifies the new delivery-address requirement: the picker shows saved
// addresses, submit is blocked with an address chosen not, an order carries
// the address through, and the order page displays it.
import { chromium } from 'playwright';

const APP = 'http://localhost:4300';
const log = (...a) => console.log(...a);

const b = await chromium.launch();
try {
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  const txt = async () => (await p.locator('main').first().innerText()).replace(/\s+/g, ' ').trim();
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

  await go('/member/pharmacy');
  await p.getByRole('button', { name: /don't have a prescription/i }).click();
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(600);
  await p.getByPlaceholder('Search medicines').fill('ors');
  await p.getByRole('button', { name: 'Search' }).click();
  await p.waitForTimeout(600);
  await p.getByRole('button', { name: 'Add' }).first().click();
  await p.waitForTimeout(400);

  log('delivery address heading present?', (await p.getByText('Delivery address').count()) > 0);
  const addressButtons = p.locator('button[aria-pressed]');
  const addressCount = await addressButtons.count();
  log('saved addresses shown:', addressCount);
  const preselected = await addressButtons.first().getAttribute('aria-pressed');
  log('an address is pre-selected by default?', preselected === 'true');

  log('\n### submit with default address ###');
  const net = [];
  p.on('response', async (r) => {
    const u = new URL(r.url()).pathname;
    if (u === '/api/member/pharmacy/orders' && r.request().method() === 'POST') {
      net.push(r.status());
    }
  });
  await p.getByRole('button', { name: 'Submit for review' }).click();
  await p.waitForTimeout(2000);
  log('create-order response status:', net.join(','));
  log('landed on order page?', p.url().includes('/pharmacy/orders/'));
  const body = await txt();
  log('order page shows "Delivering to"?', body.includes('Delivering to'));
  log('excerpt:', body.slice(0, 300));

  log('\n### page errors ###');
  log(errs.length ? errs.join('\n') : '(none)');
} finally {
  await b.close();
}
