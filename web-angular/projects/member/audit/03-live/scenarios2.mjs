// Re-run of the three scenarios whose first assertions were wrong.
// Correct selectors: the switcher is the avatar in profile-menu, aria-label
// "Account menu for <name>"; the 404 copy is "could not find that page".
import { chromium } from 'playwright';

const APP = 'http://localhost:4200';
const rec = (s, n, p, note) =>
  console.log(`${p === true ? 'PASS' : p === false ? 'FAIL' : '????'}  [${s}] ${n}\n        ${note}`);
const txt = async (page) => (await page.locator('body').innerText()).replace(/\s+/g, ' ').trim();

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

await page.goto(`${APP}/login`, { waitUntil: 'networkidle' });
await page.fill('#email', 'shivam@gmail.com');
await page.fill('input[type=password]', '12345678');
await page.click('button[type=submit]');
await page.waitForURL('**/member**', { timeout: 15000 });

// 1 — unknown route, with the copy the app actually uses
await page.goto(`${APP}/member/definitely-not-a-route`, { waitUntil: 'networkidle' });
const nf = await txt(page);
rec('member-shell', 'Unknown member route', /404|could not find that page/i.test(nf),
  `rendered: ${nf.slice(0, 90)}`);

// 2 — switch the active member from the shell avatar
await page.goto(`${APP}/member/wallet`, { waitUntil: 'networkidle' });
const walletBefore = await txt(page);
const avatar = page.locator('button[aria-label^="Account menu for"]');
await avatar.click();
await page.waitForTimeout(300);
const menu = await txt(page);
const canSwitch = /Switch profile/i.test(menu);
rec('member-family-context', 'Primary member with dependents can switch', canSwitch,
  canSwitch ? '"Switch profile" section present in the avatar menu' : 'no switch section');

const dependent = page.locator('button[role=menuitem]', { hasText: /Sayani/i }).first();
const found = (await dependent.count()) > 0;
if (found) {
  await dependent.click();
  await page.waitForTimeout(1500);
}
const walletAfter = await txt(page);
rec('member-family-context', 'Already-open screen follows the switch',
  found && walletBefore !== walletAfter && /Sayani/i.test(walletAfter),
  `wallet now names: ${/Sayani/i.test(walletAfter) ? 'Sayani' : 'unchanged'}; url ${page.url().replace(APP, '')}`);

// 3 — reload keeps the selection (sessionStorage)
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
const afterReload = await txt(page);
rec('member-family-context', 'Reload keeps the selection', /Sayani/i.test(afterReload),
  `after reload names: ${/Sayani/i.test(afterReload) ? 'Sayani' : 'reverted to primary'}`);

// 4 — THE BLOCKER: with Sayani active, does select-patient default to her?
await page.goto(`${APP}/member/appointments/select-patient`, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
const sel = await txt(page);
const marked = await page
  .locator('[aria-checked=true],[aria-selected=true],input:checked,.bg-blue-50,[class*=selected]')
  .count();
rec('member-family-context', 'Booking flow defaults to the active member', marked > 0,
  `visually-marked options: ${marked}. Page: ${sel.slice(0, 170)}`);

await browser.close();
