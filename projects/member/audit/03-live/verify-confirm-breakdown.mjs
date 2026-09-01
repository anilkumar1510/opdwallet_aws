/**
 * The payment breakdown on the consultation confirm screen.
 *
 * **NON-MUTATING and it spends no booking run.** Every case is a forced
 * `appointments/validate-booking` response served by interception; nothing is
 * ever confirmed, so CAT001/CAT005 are untouched.
 *
 * Asserts on the RENDERED TEXT, not on a pass count. A green run that shows the
 * wrong label is the exhausted-category defect again — so each case checks the
 * label AND its value, and the negative cases check that lines are ABSENT.
 *
 * Line set and order follow the reference's PaymentProcessor breakdown
 * (`web-member/components/PaymentProcessor.tsx:347-410`), which React renders on
 * a second step of its confirm screen; Angular renders it on the single confirm
 * screen it already has.
 */
import { chromium } from 'playwright';
const APP = 'http://localhost:4200';
const R = [];
const rec = (n, p, note) => { R.push(p); console.log(`${p ? 'PASS' : 'FAIL'}  ${n}\n        ${note}`); };
const b = await chromium.launch();

const breakdown = (over = {}) => ({
  isAllowed: true,
  warnings: [],
  breakdown: {
    billAmount: 800,
    copayAmount: 160,
    copayPercentage: 20,
    insuranceEligibleAmount: 640,
    serviceTransactionLimit: 300,
    insurancePayment: 300,
    excessAmount: 340,
    totalMemberPayment: 500,
    walletBalance: 11508,
    walletDebitAmount: 300,
    insufficientBalance: false,
    ...over,
  },
});

/** Sign in, force the validation response, walk to an ONLINE confirm screen. */
const confirmWith = async (payload) => {
  const pg = await (await b.newContext()).newPage();
  await pg.route('**/api/appointments/validate-booking', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) }),
  );
  await pg.goto(APP + '/login', { waitUntil: 'domcontentloaded' });
  await pg.waitForLoadState('networkidle');
  await pg.getByLabel(/email/i).fill('shivam@gmail.com');
  await pg.getByLabel(/password/i).fill('12345678');
  await pg.getByRole('button', { name: /sign in/i }).click();
  await pg.waitForURL('**/member**', { timeout: 20000 });

  await pg.goto(APP + '/member/online-consult/specialties', { waitUntil: 'domcontentloaded' });
  await pg.waitForLoadState('networkidle');
  await pg.waitForTimeout(900);
  // Select by destination, not position: `.first()` grabs the "Skip to content"
  // anchor, which is present on every screen and outside the viewport.
  const toDoctors = (
    await pg.getByRole('link').evaluateAll((e) =>
      e.map((x) => x.getAttribute('href')).filter((h) => h && h.includes('/doctors')),
    )
  )[0];
  if (!toDoctors) return { pg, text: '', reached: false };
  await pg.goto(APP + toDoctors, { waitUntil: 'domcontentloaded' });
  await pg.waitForLoadState('networkidle');
  await pg.waitForTimeout(1500);
  const confirmHref = (
    await pg.getByRole('link').evaluateAll((e) =>
      e.map((x) => x.getAttribute('href')).filter((h) => h && h.includes('confirm')),
    )
  )[0];
  if (!confirmHref) return { pg, text: '', reached: false };
  await pg.goto(APP + confirmHref, { waitUntil: 'domcontentloaded' });
  await pg.waitForLoadState('networkidle');
  await pg.waitForTimeout(1800);
  const text = (await pg.locator('#main, body').first().innerText()).replace(/\s+/g, ' ').trim();
  return { pg, text, reached: true };
};

try {
  // ---------- Case 1: the screenshot case ----------
  {
    const { pg, text, reached } = await confirmWith(breakdown());
    rec('POSITIVE CONTROL — the confirm screen renders with a forced validation',
      reached && /Payment/i.test(text), reached ? text.slice(0, 90) : 'confirm not reached');

    const lines = [
      ['Consultation fee', /Consultation fee/i, /₹\s?800/],
      ['Wallet balance', /Wallet balance/i, /₹\s?11,?508/],
      ['Your copay (20%)', /Your copay \(20%\)/i, /₹\s?160/],
      ['Insurance eligible amount', /Insurance eligible amount/i, /₹\s?640/],
      ['Service transaction limit applied', /Service transaction limit applied/i, /Max ₹\s?300/],
      ['Additional out-of-pocket', /Additional out-of-pocket/i, /₹\s?340/],
      ['Paid from your wallet', /Paid from your wallet/i, /₹\s?300/],
      ['You pay total', /You pay total/i, /₹\s?500/],
    ];
    for (const [label, labelRe, valueRe] of lines) {
      rec(`line present with its value — ${label}`,
        labelRe.test(text) && valueRe.test(text),
        `label: ${labelRe.test(text)}, value: ${valueRe.test(text)}`);
    }
    rec('the note explains the limit, the copay and the remainder',
      /transaction limit of ₹\s?300/i.test(text) && /20% copay \(₹\s?160\)/i.test(text) && /remaining ₹\s?340/i.test(text),
      text.match(/Note:[^]{0,200}/i)?.[0]?.replace(/\s+/g, ' ').slice(0, 190) ?? 'no note');
    console.log('\n--- breakdown as rendered ---\n' + (text.match(/Payment[^]{0,520}/i)?.[0] ?? text.slice(0, 400)) + '\n');
    await pg.close();
  }

  // ---------- Case 2: no transaction limit ----------
  {
    const { text, pg } = await confirmWith(
      breakdown({
        serviceTransactionLimit: 0,
        excessAmount: 0,
        insurancePayment: 640,
        walletDebitAmount: 640,
        totalMemberPayment: 160,
      }),
    );
    rec('NO LIMIT — the limit line is absent',
      !/Service transaction limit applied/i.test(text), 'limit line absent');
    rec('NO LIMIT — the out-of-pocket line is absent',
      !/Additional out-of-pocket/i.test(text), 'out-of-pocket line absent');
    rec('NO LIMIT — the note does not claim a limit was applied',
      !/transaction limit of/i.test(text), 'no limit note');
    rec('NO LIMIT — the copay and total still render',
      /Your copay \(20%\)/i.test(text) && /You pay total/i.test(text) && /₹\s?160/.test(text),
      text.match(/You pay total[^]{0,24}/i)?.[0]?.replace(/\s+/g, ' ') ?? 'missing');
    await pg.close();
  }

  // ---------- Case 3: the wallet covers nothing ----------
  // This is where the reference goes blank: its breakdown is gated on
  // walletDebitAmount > 0 (PaymentProcessor.tsx:353). Angular's must not.
  {
    const { text, pg } = await confirmWith(
      breakdown({
        copayAmount: 0,
        copayPercentage: 0,
        insuranceEligibleAmount: 0,
        serviceTransactionLimit: 0,
        insurancePayment: 0,
        excessAmount: 0,
        walletDebitAmount: 0,
        walletBalance: 0,
        totalMemberPayment: 800,
      }),
    );
    rec('WALLET COVERS NOTHING — the breakdown still renders',
      /Consultation fee/i.test(text) && /You pay total/i.test(text),
      'fee and total both present');
    rec('WALLET COVERS NOTHING — the member is told they pay the full amount',
      /You pay total/i.test(text) && /₹\s?800/.test(text),
      text.match(/You pay total[^]{0,24}/i)?.[0]?.replace(/\s+/g, ' ') ?? 'missing');
    rec('WALLET COVERS NOTHING — no wallet or copay line claims a contribution',
      !/Paid from your wallet/i.test(text) && !/Your copay/i.test(text),
      'wallet and copay lines correctly absent');
    await pg.close();
  }
} finally {
  await b.close();
}
console.log(`\npass ${R.filter(Boolean).length}/${R.length}`);
