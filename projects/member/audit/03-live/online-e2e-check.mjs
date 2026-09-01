// Full end-to-end live check of the Online Consultation booking flow, after
// this session's fixes: online-mode doctor filter, fastest-available sort,
// languages/next-available display, 5-min Consult Now greyout, Select
// Patient section, chronological slot sort, past/booked slot greying.
import { chromium } from 'playwright';

const APP = 'http://localhost:4300';
const realLinks = (p) => p.locator('main a[href]');
const log = (...a) => console.log(...a);
const ALREADY_BOOKED = /already been booked|fully booked|no longer available/i;

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
  log('logged in ->', p.url().replace(APP, ''));

  log('\n### 2. SPECIALTIES (online) ###');
  await go('/member/online-consult/specialties');
  const specHrefs = (await realLinks(p).evaluateAll((els) => els.map((e) => e.getAttribute('href')))).filter((h) => h && h.includes('/doctors'));
  log('specialty links:', specHrefs.length, '| picking:', specHrefs[0]);
  if (!specHrefs.length) throw new Error('No specialty links');
  await go(specHrefs[0]);

  log('\n### 3. DOCTOR LIST (online) — checking sort/labels ###');
  const doctorCards = await p.locator('main li').allInnerTexts();
  log('doctor cards, in order:');
  doctorCards.forEach((c, i) => log(`  [${i}] `, c.replace(/\n+/g, ' | ').slice(0, 140)));
  const consultHrefs = (await realLinks(p).evaluateAll((els) => els.map((e) => e.getAttribute('href')))).filter((h) => h && h.includes('/online-consult/confirm'));
  log('consult-online links:', consultHrefs.length);
  if (!consultHrefs.length) throw new Error('No online-consult confirm links found');
  await go(consultHrefs[0]);

  log('\n### 4. CONFIRM PAGE — Select Patient section ###');
  const hasSelectPatient = (await p.getByRole('heading', { name: 'Select Patient' }).count()) > 0;
  log('Select Patient heading present?', hasSelectPatient);
  if (hasSelectPatient) {
    const patientButtons = await p.locator('main section').first().locator('button').allInnerTexts().catch(() => []);
  }

  log('\n### 5. CONSULT NOW state ###');
  const nowBtn = p.getByRole('button', { name: 'Consult Now' });
  const nowDisabled = await nowBtn.isDisabled().catch(() => null);
  log('Consult Now disabled?', nowDisabled);
  const warnVisible = (await p.getByText(/isn't free right now/i).count()) > 0;
  log('greyout warning shown?', warnVisible);

  log('\n### 6. SCHEDULE LATER — day/slot picker ###');
  net.length = 0;
  await p.getByRole('button', { name: 'Schedule Later' }).click();
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(1500);
  log('API calls after Schedule Later click:', net.length ? net.join(' | ') : '(NONE)');
  const dayBtns = p.locator('button').filter({ hasText: /\d{4}-\d{2}-\d{2}/ });
  const dayCount = await dayBtns.count();
  log('day options:', dayCount);
  if (!dayCount) {
    log('DEBUG page text around Schedule Later:', (await txt()).slice(0, 500));
    throw new Error('No schedule-later days available');
  }

  let picked = null;
  outer: for (let d = 0; d < dayCount; d++) {
    await dayBtns.nth(d).click();
    await p.waitForTimeout(500);
    // DOM .disabled property, not a CSS :not([disabled]) locator — Angular's
    // [disabled] binding doesn't reliably reflect for Playwright's CSS engine.
    const enabledLabels = await p.locator('button').evaluateAll((els) =>
      els.filter((e) => /^\d{1,2}:\d{2}\s?(AM|PM)$/.test((e.textContent || '').trim()) && !e.disabled).map((e) => e.textContent.trim()),
    );
    log(`  day ${d}: ${enabledLabels.length} enabled slot(s)`);
    if (enabledLabels.length) {
      net.length = 0;
      await p.getByRole('button', { name: enabledLabels[0], exact: true }).click();
      await p.waitForTimeout(300);
      picked = enabledLabels[0];
      break outer;
    }
  }
  log('picked slot:', picked);
  if (!picked) throw new Error('No enabled slot found to pick across all days');

  log('\n### 7. FILL CONTACT + CONFIRM ###');
  const contactInput = p.locator('#contactNumber');
  const currentContact = await contactInput.inputValue().catch(() => '');
  if (!currentContact) await contactInput.fill('9999999999');

  const cover = await txt();
  log('has payment breakdown wording?', /you pay|copay|covered|wallet/i.test(cover));

  net.length = 0;
  const confirmBtn = p.getByRole('button', { name: /confirm/i });
  const confirmDisabled = await confirmBtn.first().isDisabled().catch(() => false);
  log('confirm button disabled?', confirmDisabled);
  await confirmBtn.first().click();
  await p.waitForTimeout(3000);
  log('after confirm -> url:', p.url().replace(APP, ''));
  log('API calls:', net.length ? net.join(' | ') : '(NONE)');

  log('\n### 8. POST-BOOKING SCREEN ###');
  const finalBody = await txt();
  log('screen excerpt:', finalBody.slice(0, 300));

  log('\n### 9. BOOKINGS LIST SANITY CHECK ###');
  await go('/member/bookings?tab=doctors');
  await p.waitForTimeout(600);
  const bookingsBody = await txt();
  log('bookings screen excerpt:', bookingsBody.slice(0, 300));

  log('\n### PAGE ERRORS ###');
  log(errs.length ? errs.join('\n') : '(none)');
} finally {
  await b.close();
}
