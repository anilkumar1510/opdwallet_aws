// Full end-to-end live check of the Pharmacy flow, built from scratch this
// session: home card -> upload/skip prescription -> search+add medicines
// (one OTC, one Rx-required) -> submit -> adjudication removes the Rx item
// -> pay -> bookings list shows it.
import { chromium } from 'playwright';

const APP = 'http://localhost:4300';
const log = (...a) => console.log(...a);

const b = await chromium.launch();
try {
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  const net = [];
  p.on('response', async (r) => {
    const u = new URL(r.url()).pathname;
    if (!u.startsWith('/api')) return;
    let extra = '';
    if (r.status() >= 400) { try { extra = ' :: ' + (await r.text()).slice(0, 200); } catch {} }
    net.push(`${r.request().method()} ${u} ${r.status()}${extra}`);
  });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  const txt = async () => (await p.locator('#main, main, body').first().innerText()).replace(/\s+/g, ' ').trim();
  const go = async (u) => {
    await p.goto(APP + u, { waitUntil: 'domcontentloaded' });
    await p.waitForLoadState('networkidle');
    await p.waitForTimeout(400);
  };

  log('### 1. LOGIN ###');
  await go('/login');
  await p.getByLabel(/email/i).fill('shivam@gmail.com');
  await p.getByLabel(/password/i).fill('12345678');
  await p.getByRole('button', { name: /sign in/i }).click();
  await p.waitForURL('**/member**', { timeout: 20000 });

  log('\n### 2. HOME CARD -> PHARMACY ###');
  await go('/member');
  const pharmacyLink = p.locator('a[href*="/member/pharmacy"]').first();
  const hasCard = (await pharmacyLink.count()) > 0;
  log('pharmacy card link present on home?', hasCard);
  if (hasCard) {
    await pharmacyLink.click();
    await p.waitForLoadState('networkidle');
  } else {
    await go('/member/pharmacy');
  }
  log('landed on:', p.url().replace(APP, ''));

  log('\n### 3. SKIP PRESCRIPTION ###');
  const skipBtn = p.getByRole('button', { name: /don't have a prescription/i });
  log('skip-prescription option present?', (await skipBtn.count()) > 0);
  await skipBtn.click();
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(500);

  log('\n### 4. SEARCH + ADD MEDICINES ###');
  await p.getByPlaceholder('Search medicines').fill('a');
  await p.getByRole('button', { name: 'Search' }).click();
  await p.waitForTimeout(600);
  const medicineCount = await p.getByRole('button', { name: 'Add' }).count();
  log('medicines listed:', medicineCount);

  // Add an OTC item (Paracetamol) and an Rx item (Azithromycin) by name.
  const addOtc = p.locator('li', { hasText: 'Paracetamol 500mg' }).getByRole('button', { name: 'Add' });
  const addRx = p.locator('li', { hasText: 'Azithromycin' }).getByRole('button', { name: 'Add' });
  log('Paracetamol row found?', (await addOtc.count()) > 0);
  log('Azithromycin row found?', (await addRx.count()) > 0);
  await addOtc.click();
  await p.waitForTimeout(400);
  await addRx.click();
  await p.waitForTimeout(400);

  const cartBody = await txt();
  log('cart shows unmet-prescription warning?', /haven.?t uploaded/i.test(cartBody));

  log('\n### 5. SUBMIT FOR REVIEW ###');
  net.length = 0;
  await p.getByRole('button', { name: 'Submit for review' }).click();
  await p.waitForTimeout(2000);
  log('after submit -> url:', p.url().replace(APP, ''));
  log('API calls:', net.length ? net.join(' | ') : '(NONE)');

  log('\n### 6. ADJUDICATED ORDER SCREEN ###');
  const orderBody = await txt();
  log('shows removed-item warning?', /removed during review/i.test(orderBody));
  log('screen excerpt:', orderBody.slice(0, 400));

  log('\n### 7. PAY ###');
  net.length = 0;
  const payBtn = p.getByRole('button', { name: /Pay and confirm order/i });
  const payVisible = (await payBtn.count()) > 0;
  log('pay button present?', payVisible);
  if (payVisible) {
    await payBtn.click();
    await p.waitForTimeout(2500);
    log('API calls:', net.length ? net.join(' | ') : '(NONE)');
    const afterPay = await txt();
    log('post-pay excerpt:', afterPay.slice(0, 300));
  }

  log('\n### 8. BOOKINGS LIST ###');
  await go('/member/bookings?tab=pharmacy');
  await p.waitForTimeout(600);
  const bookingsBody = await txt();
  log('bookings (pharmacy tab) excerpt:', bookingsBody.slice(0, 400));

  log('\n### PAGE ERRORS ###');
  log(errs.length ? errs.join('\n') : '(none)');
} finally {
  await b.close();
}
