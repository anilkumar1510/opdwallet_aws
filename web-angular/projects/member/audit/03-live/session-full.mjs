// All member-session scenarios except the expiry one (which needs a 60s token
// and is covered by verify-terminate.mjs). Task 3.9.
import { chromium } from 'playwright';
const APP = 'http://localhost:4200';
const out = [];
const rec = (n, p, note) => {
  out.push(p);
  console.log(`${p ? 'PASS' : 'FAIL'}  ${n}\n        ${note}`);
};
const txt = async (p) => (await p.locator('body').innerText()).replace(/\s+/g, ' ').trim();
const b = await chromium.launch();
const fresh = async () => (await b.newContext()).newPage();
const login = async (p, e, pw) => {
  await p.fill('#email', e);
  await p.fill('input[type=password]', pw);
  await p.click('button[type=submit]');
};

// 1 successful login
{
  const p = await fresh();
  await p.goto(`${APP}/login`, { waitUntil: 'networkidle' });
  await login(p, 'standard@gmail.com', 'User@123');
  await p.waitForURL('**/member**', { timeout: 15000 });
  rec('Successful login', p.url().includes('/member'), `landed ${p.url().replace(APP, '')}`);

  // 4 reload with a valid session
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  rec('Reload with a valid session', p.url().includes('/member') && !p.url().includes('/login'),
    `stayed on ${p.url().replace(APP, '')}`);
}

// 2 rejected credentials
{
  const p = await fresh();
  await p.goto(`${APP}/login`, { waitUntil: 'networkidle' });
  await login(p, 'standard@gmail.com', 'wrong-password');
  await p.waitForTimeout(1800);
  const t = await txt(p);
  rec('Rejected credentials', p.url().includes('/login') && /not recognised|invalid|incorrect/i.test(t),
    `stayed on login; message: "${(t.match(/[^.]*not recognised[^.]*/i) || ['(none)'])[0].trim()}"`);
}

// 3 authentication service unreachable
{
  const p = await fresh();
  await p.route('**/api/auth/login', (r) => r.abort('failed'));
  await p.goto(`${APP}/login`, { waitUntil: 'networkidle' });
  await login(p, 'standard@gmail.com', 'User@123');
  await p.waitForTimeout(1800);
  const t = await txt(p);
  rec('Authentication service unreachable',
    p.url().includes('/login') && /went wrong|could not|try again|unavailable|connect/i.test(t),
    `error shown: "${t.slice(0, 130)}"`);
}

// 5 reload with an expired session (cookie removed = session no longer valid)
{
  const p = await fresh();
  await p.goto(`${APP}/login`, { waitUntil: 'networkidle' });
  await login(p, 'standard@gmail.com', 'User@123');
  await p.waitForURL('**/member**');
  await p.context().clearCookies();
  await p.goto(`${APP}/member/wallet`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  rec('Reload with an expired session', p.url().includes('/login'),
    `landed ${p.url().replace(APP, '')}`);
}

// 6/7/8 guards
{
  const p = await fresh();
  await p.goto(`${APP}/member/claims`, { waitUntil: 'networkidle' });
  rec('Direct navigation without a session', p.url().includes('/login'),
    `landed ${p.url().replace(APP, '')}`);
  await login(p, 'standard@gmail.com', 'User@123');
  await p.waitForURL('**/member**', { timeout: 15000 });
  rec('Return to the attempted route after signing in',
    p.url().replace(APP, '') === '/member/claims', `landed ${p.url().replace(APP, '')}`);
  await p.goto(`${APP}/login`, { waitUntil: 'networkidle' });
  rec('Login screen while already authenticated', p.url().replace(APP, '') === '/member',
    `redirected to ${p.url().replace(APP, '')}`);
}

// 11 signing back in as a different member leaves nothing behind
{
  const p = await fresh();
  await p.goto(`${APP}/login`, { waitUntil: 'networkidle' });
  await login(p, 'shivam@gmail.com', '12345678');
  await p.waitForURL('**/member**');
  await p.goto(`${APP}/member/wallet`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1000);
  const first = await txt(p);
  await p.locator('button[aria-label^="Account menu for"]').click();
  await p.waitForTimeout(250);
  await p.locator('button', { hasText: /log out/i }).first().click();
  await p.waitForURL('**/login', { timeout: 10000 });
  await login(p, 'standard@gmail.com', 'User@123');
  await p.waitForURL('**/member**', { timeout: 15000 });
  await p.goto(`${APP}/member/wallet`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  const second = await txt(p);
  rec('Signing back in after signing out shows only the new member',
    /shivam/i.test(first) && !/shivam|15,180|20,000/i.test(second),
    `first session named Shivam: ${/shivam/i.test(first)}; second leaks Shivam or his figures: ${/shivam|15,180|20,000/i.test(second)}`);
}

await b.close();
console.log(`\npass ${out.filter(Boolean).length}/${out.length}`);
