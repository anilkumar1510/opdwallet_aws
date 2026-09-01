// Remaining unobserved scenarios: member-shell "Single member",
// member-wallet transaction history + formatting. Observes only.
import { chromium } from 'playwright';

const APP = 'http://localhost:4200';
const rec = (s, n, p, note) =>
  console.log(`${p === true ? 'PASS' : p === false ? 'FAIL' : '????'}  [${s}] ${n}\n        ${note}`);
const txt = async (page) => (await page.locator('body').innerText()).replace(/\s+/g, ' ').trim();
const browser = await chromium.launch();

const login = async (page, email, pw) => {
  await page.goto(`${APP}/login`, { waitUntil: 'networkidle' });
  await page.fill('#email', email);
  await page.fill('input[type=password]', pw);
  await page.click('button[type=submit]');
  await page.waitForURL('**/member**', { timeout: 15000 });
};

// --- member-shell: Single member (no switch affordance)
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await login(page, 'standard@gmail.com', 'User@123');
  await page.locator('button[aria-label^="Account menu for"]').click();
  await page.waitForTimeout(300);
  const menu = await txt(page);
  rec('member-shell', 'Single member — no switch offered', !/Switch profile/i.test(menu),
    `avatar menu contains "Switch profile": ${/Switch profile/i.test(menu)}`);
  await ctx.close();
}

// --- member-wallet: transaction history + formatting
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await login(page, 'shivam@gmail.com', '12345678');
  await page.goto(`${APP}/member/wallet`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const w = await txt(page);

  rec('member-wallet', 'Transactions listed', /Activity/i.test(w) && /\d{1,2} \w{3} \d{4}/.test(w),
    `activity section + formatted dates present`);
  rec('member-wallet', 'Amounts formatted', /₹[\d,]+/.test(w),
    `rupee-formatted amounts present: ${(w.match(/₹[\d,]+/g) || []).slice(0, 4).join(' ')}`);
  rec('member-wallet', 'Dates formatted', /\d{1,2} \w{3} \d{4}/.test(w),
    `sample: ${(w.match(/\d{1,2} \w{3} \d{4}/g) || []).slice(0, 3).join(' | ')}`);

  // Newest first
  const dates = [...w.matchAll(/(\d{1,2} \w{3} \d{4})/g)].map((m) => new Date(m[1]));
  const activityDates = dates.filter((d) => !isNaN(d));
  let sorted = true;
  for (let i = 1; i < activityDates.length; i++)
    if (activityDates[i] > activityDates[i - 1]) { sorted = false; break; }
  rec('member-wallet', 'Transactions newest first', sorted,
    `date sequence as rendered: ${activityDates.slice(0, 5).map((d) => d.toISOString().slice(0, 10)).join(' > ')}`);

  // Show more
  const more = page.locator('button', { hasText: /show more|load more/i }).first();
  const hasMore = (await more.count()) > 0;
  if (hasMore) {
    const before = (await txt(page)).length;
    await more.click();
    await page.waitForTimeout(1500);
    const after = (await txt(page)).length;
    rec('member-wallet', 'Loading further transactions', after > before,
      `page grew ${before} -> ${after} chars`);
  } else {
    rec('member-wallet', 'Loading further transactions', null,
      'no "show more" control rendered — cannot tell if that is correct without knowing the total count');
  }

  // Category states
  rec('member-wallet', 'Categories listed with readable names',
    /Online Consultation|Pharmacy|Dental Services/.test(w), 'human-readable category names present');
  rec('member-wallet', 'Exhausted category',
    /₹3,000 of ₹3,000/.test(w), 'a fully-consumed category renders (Pathology/Vision at 3000 of 3000)');
  await ctx.close();
}

await browser.close();
