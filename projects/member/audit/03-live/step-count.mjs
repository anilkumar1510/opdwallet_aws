// Behavioural step measurement: how many interactions does it take to leave a
// screen? Never reads markup for meaning — only clicks and watches the URL, so
// it cannot fail the framework-shaped way the two regex attempts did.
import { chromium } from 'playwright';

const REACT = 'http://localhost:3002';
const NG = 'http://localhost:4200';
const rows = [];
const b = await chromium.launch();

const loginReact = async (p) => {
  await p.goto(`${REACT}/`, { waitUntil: 'networkidle' });
  await p.fill('input[type=email]', 'shivam@gmail.com');
  await p.fill('input[type=password]', '12345678');
  await p.click('button[type=submit]');
  await p.waitForURL('**/member**', { timeout: 20000 });
};
const loginNg = async (p) => {
  await p.goto(`${NG}/login`, { waitUntil: 'networkidle' });
  await p.fill('#email', 'shivam@gmail.com');
  await p.fill('input[type=password]', '12345678');
  await p.click('button[type=submit]');
  await p.waitForURL('**/member**', { timeout: 20000 });
};

/**
 * Clicks the first option, then (if the route hasn't changed) hunts for an
 * enabled commit control and clicks that. Returns how many clicks it took for
 * the URL to change. 0 = never left within the budget.
 */
async function stepsToLeave(page, url, optionSel) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const start = page.url();
  let clicks = 0;

  const opt = page.locator(optionSel).first();
  if ((await opt.count()) === 0) return { clicks: -1, note: 'no option matched' };
  await opt.click({ timeout: 5000 }).catch(() => {});
  clicks++;
  await page.waitForTimeout(1200);
  if (page.url() !== start) return { clicks, note: 'first interaction committed' };

  // Still here: look for an enabled commit control.
  const commit = page.locator('button:enabled, a[href]').filter({
    hasText: /continue|confirm|proceed|next|book|submit|pay/i,
  }).first();
  if ((await commit.count()) === 0) return { clicks, note: 'no route change, no commit control found' };
  await commit.click({ timeout: 5000 }).catch(() => {});
  clicks++;
  await page.waitForTimeout(1800);
  return {
    clicks,
    note: page.url() !== start ? 'second interaction committed' : 'still did not leave',
  };
}

const pr = await (await b.newContext()).newPage();
const pn = await (await b.newContext()).newPage();
await loginReact(pr);
await loginNg(pn);

const CASES = [
  { flow: 'appointments/select-patient  [POSITIVE CONTROL]',
    r: `${REACT}/member/appointments/select-patient`, n: `${NG}/member/appointments/select-patient`,
    sel: 'button, li a, [role=button]' },
  { flow: 'appointments/specialties     [NEGATIVE CONTROL]',
    r: `${REACT}/member/appointments/specialties`, n: `${NG}/member/appointments/specialties`,
    sel: 'button, li a, [role=button]' },
  { flow: 'online-consult/specialties',
    r: `${REACT}/member/online-consult/specialties`, n: `${NG}/member/online-consult/specialties`,
    sel: 'button, li a, [role=button]' },
  { flow: 'vision/select-patient',
    r: `${REACT}/member/vision/select-patient`, n: `${NG}/member/vision/select-patient`,
    sel: 'button, li a, [role=button]' },
  { flow: 'vision/clinics',
    r: `${REACT}/member/vision/clinics`, n: `${NG}/member/vision/clinics`,
    sel: 'button, li a, [role=button]' },
  { flow: 'dental/select-patient',
    r: `${REACT}/member/dental/select-patient`, n: `${NG}/member/dental/select-patient`,
    sel: 'button, li a, [role=button]' },
];

for (const c of CASES) {
  const R = await stepsToLeave(pr, c.r, c.sel);
  const N = await stepsToLeave(pn, c.n, c.sel);
  rows.push({ flow: c.flow, react: R, ng: N });
  const flag = R.clicks > 0 && N.clicks > 0 && R.clicks !== N.clicks ? '  <<< DIVERGENCE' : '';
  console.log(
    `${c.flow}\n   react=${R.clicks} (${R.note})\n   ng   =${N.clicks} (${N.note})${flag}`,
  );
}
await b.close();
