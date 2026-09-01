import { chromium } from 'playwright';
const APP = 'http://localhost:4300';
const log = (...a) => console.log(...a);
const b = await chromium.launch();
try {
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  const go = async (u) => { await p.goto(APP + u, { waitUntil: 'domcontentloaded' }); await p.waitForLoadState('networkidle'); await p.waitForTimeout(400); };
  const bodyText = async () => (await p.locator('main').first().innerText()).replace(/\s+/g, ' ');
  const createAndReview = async (q) => {
    await go('/member/pharmacy');
    await p.getByRole('button', { name: /don't have a prescription/i }).click({ timeout: 5000 }).catch(() => {});
    await p.waitForLoadState('networkidle');
    await p.waitForTimeout(600);
    await p.getByPlaceholder('Search medicines').fill(q);
    await p.getByRole('button', { name: 'Search' }).click();
    await p.waitForTimeout(600);
    await p.getByRole('button', { name: 'Add' }).first().click();
    await p.waitForTimeout(400);
    await p.getByRole('button', { name: 'Submit for review' }).click();
    await p.waitForTimeout(2000);
  };

  await go('/login');
  await p.getByLabel(/email/i).fill('shivam@gmail.com');
  await p.getByLabel(/password/i).fill('12345678');
  await p.getByRole('button', { name: /sign in/i }).click();
  await p.waitForURL('**/member**', { timeout: 20000 });

  log('### unpaid cancel ###');
  await createAndReview('ors');
  await p.getByRole('button', { name: /^cancel order$/i }).click();
  await p.waitForTimeout(1200);
  log((await bodyText()).match(/Order cancelled.*?taken for this order\./)?.[0] ?? '(no match) ' + (await bodyText()));

  log('### paid cancel ###');
  await createAndReview('vitamin');
  await p.getByRole('button', { name: /pay and confirm order/i }).click();
  await p.waitForTimeout(2000);
  await p.getByRole('button', { name: /^cancel order$/i }).click();
  await p.waitForTimeout(1200);
  log((await bodyText()).match(/Order cancelled.*?refunded\./)?.[0] ?? '(no match) ' + (await bodyText()));
} finally { await b.close(); }
