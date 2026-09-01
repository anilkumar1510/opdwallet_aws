// BLOCKER spike: 401 mid-session with no user action.
// Read-only against the app; observes, never edits.
import { chromium } from 'playwright';

const APP = 'http://localhost:4200';
const log = (...a) => console.log(...a);

const browser = await chromium.launch();
// Clean context: no cookie collision with web-tpa/operations/finance.
const ctx = await browser.newContext();
const page = await ctx.newPage();

const net = [];
page.on('response', (r) => {
  const u = new URL(r.url()).pathname;
  if (u.startsWith('/api')) net.push({ t: Date.now(), u, s: r.status() });
});
const consoleErrors = [];
page.on('pageerror', (e) => consoleErrors.push(String(e)));

async function snap(label) {
  const url = page.url();
  const body = (await page.locator('body').innerText()).replace(/\s+/g, ' ').trim();
  const enabled = await page
    .locator('button:visible, a:visible')
    .evaluateAll((els) => els.filter((e) => !e.hasAttribute('disabled')).length);
  log(`\n===== ${label} =====`);
  log('URL      :', url);
  log('clickable:', enabled, 'visible buttons/links');
  log('text     :', body.slice(0, 420));
  return { url, body, enabled };
}

log('--- login ---');
await page.goto(`${APP}/login`, { waitUntil: 'networkidle' });
await page.fill('#email', 'standard@gmail.com');
await page.fill('input[type=password]', 'User@123');
const tLogin = Date.now();
await page.click('button[type=submit]');
await page.waitForURL('**/member**', { timeout: 15000 });

await page.goto(`${APP}/member/wallet`, { waitUntil: 'networkidle' });
const before = await snap('T+0  ON /member/wallet, AUTHENTICATED');

// Do nothing. The 30s notification poll is the trigger under test.
log('\n--- idling 100s, no interaction ---');
for (let i = 1; i <= 10; i++) {
  await page.waitForTimeout(10000);
  const secs = Math.round((Date.now() - tLogin) / 1000);
  const last401 = net.filter((n) => n.s === 401).slice(-1)[0];
  log(`  t+${secs}s  url=${page.url().replace(APP, '')}  401s so far=${net.filter((n) => n.s === 401).length}${last401 ? ' last=' + last401.u : ''}`);
}

const after = await snap('T+100s  AFTER TOKEN EXPIRY');

log('\n===== VERDICT =====');
log('URL changed        :', before.url !== after.url, `(${before.url} -> ${after.url})`);
log('401 responses      :', net.filter((n) => n.s === 401).length);
log('401 paths          :', [...new Set(net.filter((n) => n.s === 401).map((n) => n.u))].join(', ') || 'none');
log('still clickable    :', after.enabled, 'controls');
log('page errors        :', consoleErrors.length ? consoleErrors : 'none');

await browser.close();
