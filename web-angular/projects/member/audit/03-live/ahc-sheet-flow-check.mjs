// Walks the AHC journey against Patient Flows section 8: three entry options
// with the alternatives closed off, then the pathology leg's mode-of-collection
// and collection-address steps, then the centre step. Stops before Confirm so
// it never burns the member's once-a-year eligibility.
import { chromium } from 'playwright';

const APP = 'http://localhost:4300';
const log = (...a) => console.log(...a);

const b = await chromium.launch();
try {
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  const go = async (u) => {
    await p.goto(APP + u, { waitUntil: 'domcontentloaded' });
    await p.waitForLoadState('networkidle');
    await p.waitForTimeout(400);
  };

  await go('/login');
  await p.getByLabel(/email/i).fill('shivam@gmail.com');
  await p.getByLabel(/password/i).fill('12345678');
  await p.getByRole('button', { name: /sign in/i }).click();
  await p.waitForURL('**/member**', { timeout: 20000 });

  log('### step 2: three options ###');
  await go('/member/wellness');
  for (const name of ['Book Pathology', 'Book Radiology', 'Book the entire package']) {
    const btn = p.getByRole('button', { name: new RegExp(name, 'i') }).first();
    log(`${name}: shown=${(await btn.count()) > 0} disabled=${await btn.isDisabled()}`);
  }

  log('\n### step 3-8: pathology leg ###');
  // A member who already used the benefit has all three options closed — that
  // greying IS the rule under test. Go to the leg directly to exercise its own
  // steps; nothing here places an order.
  const pathology = p.getByRole('button', { name: /Book Pathology/i }).first();
  if (await pathology.isDisabled()) {
    log('all options closed for this member (benefit already used) — opening the leg directly');
    await go('/member/ahc/booking');
  } else {
    await pathology.click();
    await p.waitForURL('**/ahc/booking', { timeout: 15000 });
  }
  await p.waitForTimeout(600);
  log('mode of collection asked?', (await p.getByText('Mode of collection').count()) > 0);
  log('vendors hidden until a mode is chosen?', (await p.getByText(/to see the labs that offer it/i).count()) > 0);

  await p.getByRole('button', { name: /^Home collection$/ }).click();
  await p.waitForTimeout(500);
  log('collection address step shown for home collection?', (await p.getByText('Collection address').count()) > 0);
  log('address pre-selected (should be false)?', (await p.locator('button[aria-pressed="true"]').count()) > 0);

  const vendorTimes = p.getByRole('button', { name: /View available times/i }).first();
  if (await vendorTimes.count()) {
    await vendorTimes.click();
    await p.waitForTimeout(3000);
    const slot = p.getByRole('button', { name: /^\d{1,2}:\d{2}/ }).first();
    const cont = p.getByRole('button', { name: /Continue without a time/i }).first();
    log('vendors listed:', await p.locator('h2.truncate').count(), 'slots:', await slot.count(), 'no-time button:', await cont.count());
    if (await slot.count()) await slot.click();
    else if (await cont.count()) await cont.click();
    await p.waitForTimeout(700);
    log('blocked without an address?', (await p.getByText(/sample should be collected from/i).count()) > 0);
    log('still on the pathology leg?', p.url().endsWith('/ahc/booking'));

    const address = p.locator('button[aria-pressed]').first();
    if (await address.count()) {
      await address.click();
      await p.waitForTimeout(300);
      if (await slot.count()) await slot.click();
      else if (await cont.count()) await cont.click();
      await p.waitForTimeout(1200);
      log('continued to review after choosing one?', p.url().includes('/ahc/booking/payment'));
      const body = (await p.locator('body').innerText()).replace(/\s+/g, ' ');
      log('review names the leg "Pathology"?', body.includes('Pathology'));
      log('review shows the collection mode?', body.includes('Home collection'));
      log('review warns pathology-only bills now?', /bills the health check now/i.test(body));
    }
  } else {
    log('no vendors at this pincode — leg steps not exercised');
  }

  log('\n### radiology leg: centre step ###');
  await go('/member/ahc/booking/diagnostic');
  const radTimes = p.getByRole('button', { name: /View available times/i }).first();
  if (await radTimes.count()) {
    await radTimes.click();
    await p.waitForTimeout(1200);
    log('centre step shown?', (await p.getByText('Select a centre').count()) > 0);
    log('centres offered:', await p.locator('button[aria-pressed]').count());
    log('marked as placeholder?', (await p.getByText(/Placeholder centres/i).count()) > 0);
  } else {
    log('no diagnostic vendors at this pincode');
  }

  log('\npage errors:', errs.length ? errs.join(' | ') : 'none');
} finally {
  await b.close();
}
