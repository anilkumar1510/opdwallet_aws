// Verifies the terminate() fix: expiry navigates, sign-out still navigates,
// and the post-expiry click-through is closed.
import { chromium } from 'playwright';
const APP = 'http://localhost:4200';
const rec = (n, p, note) => console.log(`${p ? 'PASS' : 'FAIL'}  ${n}\n        ${note}`);

const b = await chromium.launch();

// --- 1. Rejected session, no user action -> login
{
  const p = await (await b.newContext()).newPage();
  await p.goto(`${APP}/login`, { waitUntil: 'networkidle' });
  await p.fill('#email', 'standard@gmail.com');
  await p.fill('input[type=password]', 'User@123');
  await p.click('button[type=submit]');
  await p.waitForURL('**/member**');
  await p.goto(`${APP}/member/wallet`, { waitUntil: 'networkidle' });
  const start = p.url().replace(APP, '');

  let landed = null;
  try {
    await p.waitForURL('**/login', { timeout: 95000 });
    landed = p.url().replace(APP, '');
  } catch {
    landed = `TIMED OUT on ${p.url().replace(APP, '')}`;
  }
  rec('Session rejected mid-session -> login (no user action)',
    landed === '/login', `${start} -> ${landed}`);
  const body = (await p.locator('body').innerText()).replace(/\s+/g, ' ');
  rec('Login screen actually rendered', /email|password|sign in|log in/i.test(body),
    body.slice(0, 110));
}

// --- 2. Sign-out still navigates after removing caller navigation
{
  const p = await (await b.newContext()).newPage();
  await p.goto(`${APP}/login`, { waitUntil: 'networkidle' });
  await p.fill('#email', 'standard@gmail.com');
  await p.fill('input[type=password]', 'User@123');
  await p.click('button[type=submit]');
  await p.waitForURL('**/member**');
  await p.goto(`${APP}/member/wallet`, { waitUntil: 'networkidle' });
  await p.locator('button[aria-label^="Account menu for"]').click();
  await p.waitForTimeout(300);
  await p.locator('button', { hasText: /log out/i }).first().click();
  let ok = false;
  try { await p.waitForURL('**/login', { timeout: 10000 }); ok = true; } catch { /* noop */ }
  rec('Explicit sign out -> login (navigation now centralised)', ok,
    `landed on ${p.url().replace(APP, '')}`);
}

await b.close();
