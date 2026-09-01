/**
 * Patient-flows flow 2, steps 3-4 — "Location is auto detected, or the member
 * searches by postal code" and "Sorted by nearest doctor first".
 *
 * The whole calculation is the API's: given `pincode` or `latitude`+`longitude`
 * it geocodes, measures every clinic, filters to `radius` and sorts closest
 * first (`doctors.service.ts:75-226`). The portal never sent any of it, so the
 * list was unlocated and unsorted. This asserts it now does.
 *
 * The subtle one is the last check. The API's radius filter is DEFEATED by a
 * fallback (`doctors.service.ts:227-241`): if filtering empties a doctor's
 * clinics, their raw `clinics` array is restored with `distance: null`. So a
 * located search legitimately returns a mix, and the screen must not caption it
 * "nearest first" without qualification. That caption is checked here because
 * it is the honest-labelling part, and it is the part a later tidy-up would
 * most plausibly "simplify" back into a lie.
 *
 * Geolocation is granted via CDP so the detect path runs without a human
 * clicking the browser's permission prompt.
 *
 * Needs the API on :4000 and the app on :4300.
 */
import { chromium } from 'playwright';

const APP = 'http://localhost:4300';
// Sector 62 Noida — the seeded clinics sit in and around Noida.
const COORDS = { latitude: 28.6139, longitude: 77.209 };
const PINCODE = '201301';

let failures = 0;
const log = (m) => console.log(m);
const check = (label, ok, detail = '') => {
  log(`${ok ? 'PASS ' : 'FAIL '} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
};

const browser = await chromium.launch();
const ctx = await browser.newContext({
  permissions: ['geolocation'],
  geolocation: COORDS,
});
const p = await ctx.newPage();
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));

// Every doctors request the page makes, so we can prove what was actually sent.
const doctorCalls = [];
p.on('request', (r) => {
  if (/\/api\/doctors\?/.test(r.url())) doctorCalls.push(r.url());
});

const go = async (u) => {
  await p.goto(APP + u, { waitUntil: 'domcontentloaded' });
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(400);
};

await go('/login');
// shivam@ is the seeded member with cover in force — standard@ and all@ have no
// active policy, so the specialties list is empty for them and the in-clinic
// journey cannot be reached at all.
await p.getByLabel(/email/i).fill('shivam@gmail.com');
await p.getByLabel(/password/i).fill('12345678');
await p.getByRole('button', { name: /sign in/i }).click();
await p.waitForURL('**/member**', { timeout: 20000 });

await go('/member/appointments/specialties');
const firstSpecialty = p.locator('a[href*="/doctors"]').first();
if (!(await firstSpecialty.count())) {
  log('SKIP  no specialties listed for this member — cannot exercise the list');
  await browser.close();
  process.exit(0);
}
await firstSpecialty.click();
await p.waitForLoadState('networkidle');
await p.waitForTimeout(600);

check('location controls appear on the in-clinic list', await p.getByPlaceholder(/postal code/i).count() > 0);
check(
  'first fetch is unlocated',
  doctorCalls.length > 0 && !/pincode=|latitude=/.test(doctorCalls.at(-1)),
  doctorCalls.at(-1) ?? 'no call seen',
);

// --- typed postal code ---
doctorCalls.length = 0;
await p.getByPlaceholder(/postal code/i).fill(PINCODE);
await p.getByRole('button', { name: /^search$/i }).click();
await p.waitForTimeout(2500);
check(
  'typed postal code is sent as pincode, with an explicit radius',
  doctorCalls.some((u) => u.includes(`pincode=${PINCODE}`) && u.includes('radius=')),
  doctorCalls.at(-1) ?? 'no call seen',
);
check('chosen location is named back to the member', await p.getByText(/near /i).count() > 0);
check(
  'the list is not captioned "nearest first" without qualification',
  await p.getByText(/could not be placed/i).count() > 0,
);

// --- browser detection ---
doctorCalls.length = 0;
await p.getByRole('button', { name: /clear/i }).first().click();
await p.waitForTimeout(800);
await p.getByRole('button', { name: /use my location/i }).click();
await p.waitForTimeout(3500);
check(
  'detected location reaches the doctors query',
  doctorCalls.some((u) => /pincode=|latitude=/.test(u)),
  doctorCalls.at(-1) ?? 'no call seen',
);

check('no page errors', errors.length === 0, errors.join(' | '));

await browser.close();
log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
