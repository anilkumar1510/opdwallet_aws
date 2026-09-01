// Verifies the back-navigation fixes: (1) the header back-arrow steps back
// to the prescription question when mid-flow instead of jumping to home,
// (2) re-entering /member/pharmacy after already having a cart re-asks the
// question instead of jumping straight to the medicine search screen, and
// (3) resuming preserves cart items already added.
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
  const questionVisible = () => p.getByText('Do you have a prescription?').isVisible().catch(() => false);
  const searchVisible = () => p.getByPlaceholder('Search medicines').isVisible().catch(() => false);

  await go('/login');
  await p.getByLabel(/email/i).fill('shivam@gmail.com');
  await p.getByLabel(/password/i).fill('12345678');
  await p.getByRole('button', { name: /sign in/i }).click();
  await p.waitForURL('**/member**', { timeout: 20000 });

  log('### 1. header back-arrow mid-flow ###');
  await go('/member/pharmacy');
  log('on question step?', await questionVisible());
  await p.getByRole('button', { name: /don't have a prescription/i }).click();
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(500);
  log('advanced to search step?', await searchVisible());
  await p.getByRole('button', { name: 'Back' }).click();
  await p.waitForTimeout(400);
  log('url after back-arrow click:', p.url().replace(APP, ''));
  log('back to question step (not navigated to home)?', await questionVisible());

  log('\n### 2. add an item, go back, re-answer -> item should be preserved ###');
  await p.getByRole('button', { name: /don't have a prescription/i }).click();
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(500);
  await p.getByPlaceholder('Search medicines').fill('paracetamol');
  await p.getByRole('button', { name: 'Search' }).click();
  await p.waitForTimeout(600);
  await p.getByRole('button', { name: 'Add' }).first().click();
  await p.waitForTimeout(400);
  const cartHasItem = (await p.locator('text=Your cart').count()) > 0;
  log('item added to cart?', cartHasItem);
  await p.getByRole('button', { name: 'Back' }).click();
  await p.waitForTimeout(400);
  log('back to question step again?', await questionVisible());
  await p.getByRole('button', { name: /don't have a prescription/i }).click();
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(500);
  const cartStillHasItem = (await p.locator('text=Your cart').count()) > 0;
  log('cart item preserved after re-answering?', cartStillHasItem);

  log('\n### 3. leave via home, re-enter pharmacy -> should re-ask, not jump to search ###');
  await go('/member');
  await go('/member/pharmacy');
  log('re-asks prescription question on fresh entry?', await questionVisible());
  log('did NOT jump straight to search screen?', !(await searchVisible()));
} finally {
  await b.close();
}
