// Live check of the In-Clinic Consultation flow against the running Angular
// app (localhost:4300) and API (localhost:4000). Adapted from
// web-angular/projects/member/audit/03-live/consult-flows.mjs (port 4200 ->
// 4300) and slot-picker.mjs's collision-retry strategy, driven further than
// either did: all the way to Confirm and the journey screen.
import { chromium } from 'playwright';

const APP = 'http://localhost:4300';
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
    if (r.status() >= 400) {
      try { extra = ' :: ' + (await r.text()).slice(0, 300); } catch {}
    }
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

  log('### LOGIN ###');
  await go('/login');
  // standard@gmail.com and dental.test@member.com both fail every booking flow
  // right now — verified via Mongo (userPolicyAssignments, the real collection
  // the app reads, not the dead "assignments" one): standard has zero
  // assignment docs, dental.test's is wrong-shaped AND expired (endDate
  // 2025-12-31). shivam@gmail.com is one of only 5 accounts in the whole DB
  // with a currently-valid, correctly-shaped assignment (effectiveFrom
  // 2026-06-19 to 2027-06-16).
  await p.getByLabel(/email/i).fill('shivam@gmail.com');
  await p.getByLabel(/password/i).fill('12345678');
  await p.getByRole('button', { name: /sign in/i }).click();
  await p.waitForURL('**/member**', { timeout: 20000 });
  log('logged in ->', p.url().replace(APP, ''));

  // Scoped to <main> so the header/shell nav (bell, profile, "Skip to
  // content") never enters the candidate list — that shell markup is present
  // on every route and was swallowing the "first link" heuristic otherwise.
  const realLinks = () => p.locator('main a[href]');

  log('\n### 1. SPECIALTIES ###');
  await go('/member/appointments/specialties');
  const specHrefs = (await realLinks().evaluateAll((els) => els.map((e) => e.getAttribute('href')))).filter(
    (h) => h && h.includes('/doctors'),
  );
  log('specialty links found:', specHrefs.length, '| sample:', specHrefs[0]);
  if (!specHrefs.length) {
    log('DEBUG page text:', (await txt()).slice(0, 500));
    log('DEBUG all <a> hrefs:', await p.locator('a[href]').evaluateAll((els) => els.map((e) => e.getAttribute('href'))));
    throw new Error('No specialty links — cannot proceed');
  }
  await go(specHrefs[0]);
  log('-> ', p.url().replace(APP, '').split('?')[0]);

  log('\n### 2. DOCTORS (in-clinic clinic links) ###');
  const hrefs = (await realLinks().evaluateAll((els) => els.map((e) => e.getAttribute('href')))).filter(
    (h) => h && h.includes('select-patient'),
  );
  log('clinic-link count:', hrefs.length, '| sample:', hrefs[0]);
  if (!hrefs.length) throw new Error('No doctor/clinic link found — doctors page may be empty or online-only');
  await go(hrefs[0]);
  log('-> ', p.url().replace(APP, '').split('?')[0]);

  log('\n### 3. SELECT PATIENT ###');
  const patientHrefs = (
    await realLinks().evaluateAll((els) => els.map((e) => e.getAttribute('href')))
  ).filter((h) => h && h.includes('select-slot'));
  log('patient options:', patientHrefs.length);
  if (!patientHrefs.length) throw new Error('No patient link found');
  await go(patientHrefs[0]);
  log('-> ', p.url().replace(APP, '').split('?')[0]);

  log('\n### 4+5. SELECT SLOT + CONFIRM (collision-aware retry across candidates) ###');
  const slotPageUrl = p.url().replace(APP, '');
  let landedOnJourney = false;
  const maxDays = 5;
  outer: for (let dayTry = 0; dayTry < maxDays; dayTry++) {
    await go(slotPageUrl);
    if (dayTry > 0) {
      const dayBtns = p.locator('button').filter({ hasText: /^(Today|Tomorrow|[A-Za-z]{3} \d)/ });
      const dCount = await dayBtns.count();
      if (dayTry >= dCount) break;
      await dayBtns.nth(dayTry).click();
      await p.waitForTimeout(600);
    }
    const slotHrefs = (
      await realLinks().evaluateAll((els) => els.map((e) => e.getAttribute('href')))
    ).filter((h) => h && h.includes('/appointments/confirm'));
    log(`  day ${dayTry}: ${slotHrefs.length} slot link(s)`);

    for (let i = 0; i < Math.min(slotHrefs.length, 8); i++) {
      await go(slotHrefs[i]);
      if (i === 0 && dayTry === 0) {
        const body1 = await txt();
        log('\n### CONFIRM PAGE (first candidate) ###');
        log('has payment breakdown wording?', /you pay|copay|covered|wallet/i.test(body1));
        log('screen excerpt:', body1.slice(0, 220));
        const hasBtn = (await p.getByRole('button', { name: /confirm/i }).count()) > 0;
        log('confirm button present?', hasBtn);
        if (!hasBtn) throw new Error('No confirm button on the confirm page');
      }
      const cbtn = p.getByRole('button', { name: /confirm/i });
      net.length = 0;
      await cbtn.first().click();
      await p.waitForTimeout(3000);
      const status400 = net.find((l) => / 400/.test(l));
      if (status400 && /already been booked|fully booked|no longer available/i.test(status400)) {
        log(`  slot ${i} on day ${dayTry}: collision, trying next`);
        continue;
      }
      log('\n### RESULT ###');
      log('after click -> url:', p.url().replace(APP, '').split('?')[0]);
      log('API calls fired:', net.length ? net.join(' | ') : '(NONE)');
      landedOnJourney = p.url().includes('/appointments/journey/');
      log('landed on journey screen?', landedOnJourney);
      if (landedOnJourney) {
        await p.waitForLoadState('networkidle');
        await p.waitForTimeout(500);
        const journeyBody = await txt();
        log('journey screen excerpt:', journeyBody.slice(0, 300));
      } else {
        const errBody = await txt();
        log('NOT on journey — current screen excerpt:', errBody.slice(0, 300));
      }
      break outer;
    }
  }
  if (!landedOnJourney) log('\n(exhausted all slot candidates tried without a non-collision result)');

  log('\n### 6. BOOKINGS LIST SANITY CHECK ###');
  await go('/member/bookings?tab=doctors');
  await p.waitForTimeout(600);
  const bookingsBody = await txt();
  log('bookings screen excerpt:', bookingsBody.slice(0, 400));

  log('\n### PAGE ERRORS ###');
  log(errs.length ? errs.join('\n') : '(none)');
} finally {
  await b.close();
}
