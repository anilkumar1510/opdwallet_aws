import { chromium } from 'playwright';
const APP = 'http://localhost:4300';
let fail = 0;
const check = (l, ok, d='') => { console.log(`${ok?'PASS ':'FAIL '} ${l}${d?` — ${d}`:''}`); if(!ok) fail++; };
const b = await chromium.launch();
const ctx = await b.newContext({ acceptDownloads: true });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
const go = async u => { await p.goto(APP+u, {waitUntil:'domcontentloaded'}); await p.waitForLoadState('networkidle'); await p.waitForTimeout(400); };
await go('/login');
await p.getByLabel(/email/i).fill('all@gmail.com');
await p.getByLabel(/password/i).fill('User@123');
await p.getByRole('button', {name:/sign in/i}).click();
await p.waitForURL('**/member**', {timeout:20000});
// the diagnostics order that has a real report on disk
await go('/member/diagnostics/orders/DIAG-ORD-1769792847064-VEE44FHQQ');
const body = await p.locator('body').innerText();
check('report is listed, not just counted', /report(s)? for this order/i.test(body));
check('message no longer claims it cannot be opened', !/cannot open them here yet/i.test(body));
const open = p.getByRole('button', {name:/^open$/i}).first();
check('an Open control exists', await open.count() > 0);
if (await open.count()) {
  const dl = p.waitForEvent('download', {timeout:15000}).catch(() => null);
  await open.click();
  const got = await dl;
  check('clicking Open downloads the file', Boolean(got), got ? await got.suggestedFilename() : 'no download event');
}
check('no page errors', errs.length === 0, errs.join(' | '));
await b.close();
console.log(fail===0 ? '\nAll checks passed.' : `\n${fail} failed.`);
process.exit(fail===0?0:1);
