// member-shell: Data pending / Data load fails / Retry succeeds.
// Forces the states via request interception. Observes only.
import { chromium } from 'playwright';

const APP = 'http://localhost:4200';
const rec = (n, p, note) =>
  console.log(`${p === true ? 'PASS' : p === false ? 'FAIL' : '????'}  [member-shell] ${n}\n        ${note}`);
const txt = async (page) => (await page.locator('body').innerText()).replace(/\s+/g, ' ').trim();

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

const login = async () => {
  await page.goto(`${APP}/login`, { waitUntil: 'networkidle' });
  await page.fill('#email', 'shivam@gmail.com');
  await page.fill('input[type=password]', '12345678');
  await page.click('button[type=submit]');
  await page.waitForURL('**/member**', { timeout: 15000 });
};
await login();

// --- Data pending: hold the wallet call open, look for a loading affordance
let hold = true;
await page.route('**/api/wallet/balance*', async (route) => {
  while (hold) await new Promise((r) => setTimeout(r, 100));
  await route.continue();
});
page.goto(`${APP}/member/wallet`).catch(() => {});
await page.waitForTimeout(2500);
const pending = await txt(page);
rec('Data pending', /loading|…|\bskeleton\b/i.test(pending),
  `while the request is in flight: "${pending.slice(0, 150)}"`);
hold = false;
await page.waitForTimeout(1500);
await page.unroute('**/api/wallet/balance*');

// --- Data load fails: 500 the wallet call
await page.route('**/api/wallet/balance*', (route) =>
  route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"boom"}' }),
);
await page.goto(`${APP}/member/wallet`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
const failed = await txt(page);
const looksLikeError = /something went wrong|could not|failed|error|try again|retry/i.test(failed);
const looksLikeEmpty = /no wallet|no active benefit/i.test(failed);
rec('Data load fails', looksLikeError && !looksLikeEmpty,
  `error-shaped: ${looksLikeError}, empty-shaped: ${looksLikeEmpty}. Rendered: "${failed.slice(0, 200)}"`);

// --- Retry succeeds: is there a retry control, and does it recover?
const retry = page.locator('button', { hasText: /try again|retry/i }).first();
const hasRetry = (await retry.count()) > 0;
if (hasRetry) {
  await page.unroute('**/api/wallet/balance*');
  await retry.click();
  await page.waitForTimeout(1800);
}
const recovered = await txt(page);
rec('Retry succeeds', hasRetry && /20,?000/.test(recovered),
  hasRetry
    ? `retry control present; after retry shows figures: ${/20,?000/.test(recovered)}`
    : 'no retry control found on the error state');

await browser.close();
