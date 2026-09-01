// Verifies the picker now surfaces the active member, with no added step.
import { chromium } from 'playwright';
const APP = 'http://localhost:4200';
const rec = (n, p, note) => console.log(`${p ? 'PASS' : 'FAIL'}  ${n}\n        ${note}`);
const txt = async (p) => (await p.locator('body').innerText()).replace(/\s+/g, ' ').trim();

const b = await chromium.launch();
const p = await (await b.newContext()).newPage();
await p.goto(`${APP}/login`, { waitUntil: 'networkidle' });
await p.fill('#email', 'shivam@gmail.com');
await p.fill('input[type=password]', '12345678');
await p.click('button[type=submit]');
await p.waitForURL('**/member**');

// Default active member = signed-in member
await p.goto(`${APP}/member/appointments/select-patient`, { waitUntil: 'networkidle' });
await p.waitForTimeout(600);
const asPrimary = await txt(p);
const markers = await p.locator('text=Currently viewing').count();
rec('Active member marked on the picker', markers === 1,
  `"Currently viewing" markers: ${markers}`);
rec('Marker sits on the signed-in member by default',
  /Shivam Jha Self Currently viewing/.test(asPrimary),
  asPrimary.slice(asPrimary.indexOf('Who is this'), asPrimary.indexOf('Who is this') + 130));

// Switch to the dependent, then return to the picker
await p.goto(`${APP}/member/wallet`, { waitUntil: 'networkidle' });
await p.locator('button[aria-label^="Account menu for"]').click();
await p.waitForTimeout(250);
await p.locator('button[role=menuitem]', { hasText: /Sayani/i }).first().click();
await p.waitForTimeout(1200);
await p.goto(`${APP}/member/appointments/select-patient`, { waitUntil: 'networkidle' });
await p.waitForTimeout(600);
const asDependent = await txt(p);
rec('Marker follows the family switch',
  /Sayani Kumari Spouse Currently viewing/.test(asDependent),
  asDependent.slice(asDependent.indexOf('Who is this'), asDependent.indexOf('Who is this') + 150));

// No added step: tapping a member still commits straight to select-slot
await p.locator('a', { hasText: /Shivam Jha/ }).first().click();
await p.waitForTimeout(1500);
rec('No commit step added — tap still navigates straight through',
  p.url().includes('select-slot'), `landed ${p.url().replace(APP, '').split('?')[0]}`);
rec('Tap books for the tapped member, not the active one',
  p.url().includes('patientId='), `query carries an explicit patientId: ${p.url().split('patientId=')[1]?.slice(0, 24)}`);

await b.close();
