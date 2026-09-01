// Browser-dependent spec scenarios. Observes only; never edits the app.
import { chromium } from 'playwright';

const APP = 'http://localhost:4200';
const results = [];
const rec = (spec, scenario, pass, note) => {
  results.push({ spec, scenario, pass, note });
  console.log(`${pass === true ? 'PASS' : pass === false ? 'FAIL' : '????'}  [${spec}] ${scenario}\n        ${note}`);
};

const browser = await chromium.launch();

async function fresh() {
  const ctx = await browser.newContext();
  return { ctx, page: await ctx.newPage() };
}
async function login(page, email, pw) {
  await page.goto(`${APP}/login`, { waitUntil: 'networkidle' });
  await page.fill('#email', email);
  await page.fill('input[type=password]', pw);
  await page.click('button[type=submit]');
  await page.waitForURL('**/member**', { timeout: 15000 });
}
const txt = async (page) => (await page.locator('body').innerText()).replace(/\s+/g, ' ').trim();

// ---------- member-session ----------
{
  const { ctx, page } = await fresh();
  await page.goto(`${APP}/member/wallet`, { waitUntil: 'networkidle' });
  rec('member-session', 'Direct navigation without a session',
    page.url().includes('/login'), `landed on ${page.url().replace(APP, '')}`);

  await page.fill('#email', 'standard@gmail.com');
  await page.fill('input[type=password]', 'User@123');
  await page.click('button[type=submit]');
  await page.waitForURL('**/member**', { timeout: 15000 });
  const back = page.url().replace(APP, '');
  rec('member-session', 'Return to the attempted route after signing in',
    back === '/member/wallet', `after login landed on ${back} (attempted /member/wallet)`);

  await page.goto(`${APP}/login`, { waitUntil: 'networkidle' });
  rec('member-session', 'Login screen while already authenticated',
    page.url().replace(APP, '') === '/member', `redirected to ${page.url().replace(APP, '')}`);
  await ctx.close();
}

// ---------- member-shell ----------
{
  const { ctx, page } = await fresh();
  await login(page, 'standard@gmail.com', 'User@123');
  await page.goto(`${APP}/member/wallet`, { waitUntil: 'networkidle' });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(400);
  const wide = await txt(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  const narrowUrl = page.url().replace(APP, '');
  const narrow = await txt(page);

  rec('member-shell', 'Resizing across the breakpoint keeps the route',
    narrowUrl === '/member/wallet', `url after resize: ${narrowUrl}`);
  const dest = ['Home', 'Claims', 'Bookings', 'Wallet'];
  rec('member-shell', 'Destination parity across viewports',
    dest.every((d) => wide.includes(d)) && dest.every((d) => narrow.includes(d)),
    `wide has all 4: ${dest.every((d) => wide.includes(d))}, narrow has all 4: ${dest.every((d) => narrow.includes(d))}`);
  rec('member-shell', 'Resizing keeps already-loaded data',
    narrow.includes('Wallet'), 'wallet content still rendered after resize');

  await page.goto(`${APP}/member/definitely-not-a-route`, { waitUntil: 'networkidle' });
  const nf = await txt(page);
  rec('member-shell', 'Unknown member route',
    /not found|doesn't exist|does not exist/i.test(nf), `rendered: ${nf.slice(0, 120)}`);
  await ctx.close();
}

// ---------- member-family-context ----------
{
  const { ctx, page } = await fresh();
  await login(page, 'shivam@gmail.com', '12345678');
  await page.goto(`${APP}/member/wallet`, { waitUntil: 'networkidle' });
  const before = await txt(page);

  // Find a switcher control.
  const switcher = page.locator('button', { hasText: /switch|profile|shivam/i }).first();
  const hasSwitcher = (await switcher.count()) > 0;
  rec('member-family-context', 'Primary member with dependents can switch',
    hasSwitcher, hasSwitcher ? 'switch affordance present' : 'no switch control found');

  rec('member-family-context', 'Active member shown in the shell',
    /shivam/i.test(before), `shell text mentions signed-in member: ${/shivam/i.test(before)}`);

  // Patient preselect — the re-filed BLOCKER.
  await page.goto(`${APP}/member/appointments/select-patient`, { waitUntil: 'networkidle' });
  const sel = await txt(page);
  const preselected = await page
    .locator('[aria-checked=true], [aria-selected=true], input:checked, .selected')
    .count();
  rec('member-family-context', 'Booking flow defaults to the active member',
    preselected > 0, `preselected controls on select-patient: ${preselected}; page: ${sel.slice(0, 160)}`);
  await ctx.close();
}

// ---------- member-wallet ----------
{
  const { ctx, page } = await fresh();
  await login(page, 'shivam@gmail.com', '12345678');
  await page.goto(`${APP}/member/wallet`, { waitUntil: 'networkidle' });
  const w = await txt(page);
  rec('member-wallet', 'Balance figures render for a funded wallet',
    /20,?000|20000/.test(w), `page mentions allocated total: ${/20,?000|20000/.test(w)}`);
  rec('member-wallet', 'Policy period rendered',
    /Cover/i.test(w), `"Cover …" line present: ${/Cover/i.test(w)}`);
  console.log('\n--- wallet page text ---\n', w.slice(0, 500));
  await ctx.close();
}

await browser.close();
console.log('\n===== TOTALS =====');
console.log('pass:', results.filter((r) => r.pass === true).length,
            ' fail:', results.filter((r) => r.pass === false).length);
