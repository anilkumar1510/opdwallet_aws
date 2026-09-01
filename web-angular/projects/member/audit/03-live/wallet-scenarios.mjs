// 6.11: the five member-wallet scenarios that had no seed data.
// Each serves a fixture shaped to the real DTO (field names read from
// core/wallet/wallet.dto.ts) and observes what the portal renders.
import { chromium } from 'playwright';

const APP = 'http://localhost:4200';
const results = [];
const rec = (n, p, note) => {
  results.push({ n, p });
  console.log(`${p ? 'PASS' : 'FAIL'}  ${n}\n        ${note}`);
};
const txt = async (p) => (await p.locator('body').innerText()).replace(/\s+/g, ' ').trim();

const totals = (allocated, current, consumed) => ({
  allocated, current, consumed, _id: 'fixture', lastUpdated: '2026-08-06T18:40:04.509Z',
});
const cat = (categoryCode, name, available, total, consumed, isUnlimited = false) => ({
  categoryCode, name, available, total, consumed, isUnlimited,
});

const b = await chromium.launch();
const ctx = await b.newContext();
const page = await ctx.newPage();

const login = async () => {
  await page.goto(`${APP}/login`, { waitUntil: 'networkidle' });
  await page.fill('#email', 'shivam@gmail.com');
  await page.fill('input[type=password]', '12345678');
  await page.click('button[type=submit]');
  await page.waitForURL('**/member**');
};
const serve = async (balance, transactions) => {
  await page.unroute('**/api/wallet/balance*').catch(() => {});
  await page.unroute('**/api/wallet/transactions*').catch(() => {});
  if (balance)
    await page.route('**/api/wallet/balance*', (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(balance) }));
  if (transactions)
    await page.route('**/api/wallet/transactions*', (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(transactions) }));
  await page.goto(`${APP}/member/wallet`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  return txt(page);
};
await login();

// ---- NEGATIVE CONTROL: the real, unmodified wallet must NOT trip any assertion
{
  await page.unroute('**/api/wallet/balance*').catch(() => {});
  await page.unroute('**/api/wallet/transactions*').catch(() => {});
  await page.goto(`${APP}/member/wallet`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const t = await txt(page);
  const clean = /₹20,000/.test(t) && !/Unlimited/i.test(t) && !/Reversed/i.test(t)
    && !/No transactions|no activity/i.test(t) && !/Shared|family pool/i.test(t);
  rec('NEGATIVE CONTROL — real wallet trips none of the five assertions', clean,
    `real wallet renders ₹20,000 and none of: Unlimited / Reversed / No transactions / Shared`);
}

// ---- POSITIVE CONTROL: a known-present state must still be detected
{
  const t = await serve({
    totalBalance: totals(3000, 0, 3000),
    categories: [cat('CAT005', 'Online Consultation', 0, 3000, 3000)],
    isFloater: false, memberConsumption: [], config: null,
  }, null);
  // The card reads "<available> of <total>", and an exhausted category drops the
  // pair entirely for "₹0 Fully used". Two earlier assertions here were wrong:
  //   "₹0 of ₹3,000"     - wrong, exhausted cards do not use the "of" form
  //   "₹3,000 of ₹3,000" - wrong, and worse: that string means fully AVAILABLE.
  // Session 1 passed the "Exhausted category" scenario on that second string,
  // so it was never actually verified. Corrected here.
  rec('POSITIVE CONTROL — exhausted category still detected', /Fully used/i.test(t),
    `exhausted category renders "₹0 Fully used"`);
}

// ---- 1. Zero balance
{
  const t = await serve({
    totalBalance: totals(20000, 0, 20000),
    categories: [cat('CAT005', 'Online Consultation', 0, 5000, 5000),
                 cat('CAT002', 'Pharmacy', 0, 15000, 15000)],
    isFloater: false, memberConsumption: [], config: null,
  }, null);
  rec('Zero balance renders without figures going negative or blank',
    /₹0/.test(t) && /₹20,000/.test(t) && !/NaN|undefined|-₹/.test(t),
    `available ₹0 against allocated ₹20,000; no NaN/undefined/negative`);
}

// ---- 2. Unlimited category
{
  const t = await serve({
    totalBalance: totals(20000, 15180, 4820),
    categories: [cat('CAT005', 'Online Consultation', 1500, 3000, 1500),
                 cat('CAT009', 'Teleconsultation', 0, 0, 0, true)],
    isFloater: false, memberConsumption: [], config: null,
  }, null);
  rec('Unlimited category is not rendered as a number',
    /unlimited/i.test(t) && !/₹0 of ₹0/.test(t),
    `renders an unlimited marker rather than "₹0 of ₹0"`);
}

// ---- 3. Unrecognised category keeps the API-supplied name
{
  const t = await serve({
    totalBalance: totals(20000, 15180, 4820),
    categories: [cat('CAT999', 'Experimental Therapy', 2000, 4000, 2000)],
    isFloater: false, memberConsumption: [], config: null,
  }, null);
  rec('Unrecognised category keeps its API-supplied label, raw code hidden',
    /Experimental Therapy/.test(t) && !/CAT999/.test(t),
    `shows "Experimental Therapy"; raw code CAT999 not shown to the member`);
}

// ---- 4. Floater (shared family) wallet
{
  const t = await serve({
    totalBalance: totals(50000, 32000, 18000),
    categories: [cat('CAT005', 'Online Consultation', 8000, 10000, 2000)],
    isFloater: true,
    memberConsumption: [
      { userId: '6a34c98e4e45325c5a7c06b5', consumed: 12000 },
      { userId: '6a34c9ff4e45325c5a7c06c1', consumed: 6000 },
    ],
    config: null,
  }, null);
  rec('Floater wallet surfaces shared/family consumption',
    /shared|family|pool/i.test(t), `page signals a shared wallet: ${/shared|family|pool/i.test(t)}`);
}

// ---- 5. Empty transaction list + 6. reversed transaction
{
  const t = await serve(null, { transactions: [], total: 0, limit: 15 });
  rec('No transactions renders an empty activity state',
    /no .*(transaction|activity)/i.test(t), `activity empty state present`);
}
{
  const t = await serve(null, {
    transactions: [
      { transactionId: 'TXN-R1', type: 'DEBIT', amount: 1200, categoryCode: 'CAT005',
        serviceType: 'Online Consultation', serviceProvider: 'Dr Test',
        processedAt: '2026-08-05T10:00:00.000Z', createdAt: '2026-08-05T10:00:00.000Z',
        isReversed: true },
      { transactionId: 'TXN-N1', type: 'DEBIT', amount: 800, categoryCode: 'CAT002',
        serviceType: 'Pharmacy', serviceProvider: 'Apollo',
        processedAt: '2026-08-04T10:00:00.000Z', createdAt: '2026-08-04T10:00:00.000Z',
        isReversed: false },
    ], total: 2, limit: 15,
  });
  rec('Reversed transaction is marked as such',
    /revers/i.test(t), `reversal marker present in the activity list`);
}

await b.close();
console.log(`\npass ${results.filter((r) => r.p).length}/${results.length}`);
