// 5.8's unobserved scenarios. All forced-state.
import { chromium } from 'playwright';
const APP = 'http://localhost:4200';
const rec = (n, p, note) => console.log(`${p ? 'PASS' : 'FAIL'}  ${n}\n        ${note}`);
const txt = async (p) => (await p.locator('body').innerText()).replace(/\s+/g, ' ').trim();
const b = await chromium.launch();
const login = async (p) => {
  await p.goto(`${APP}/login`, { waitUntil: 'networkidle' });
  await p.fill('#email', 'shivam@gmail.com');
  await p.fill('input[type=password]', '12345678');
  await p.click('button[type=submit]');
  await p.waitForURL('**/member**', { timeout: 20000 });
};

// --- NEGATIVE CONTROL: unmodified profile shows real relationships
{
  const p = await (await b.newContext()).newPage();
  await login(p);
  await p.goto(`${APP}/member/wallet`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  await p.locator('button[aria-label^="Account menu for"]').click();
  await p.waitForTimeout(500);
  const t = await txt(p);
  rec('NEGATIVE CONTROL — real profile renders a real relationship, no neutral fallback',
    /Spouse/i.test(t) && !/REL\d/.test(t), `menu shows "Spouse"; no raw REL code`);
}

// --- Unrecognised relationship (forced: rewrite codes to REL999)
{
  const p = await (await b.newContext()).newPage();
  await p.route('**/api/member/profile*', async (route) => {
    const res = await route.fetch();
    let body = await res.text();
    body = body.replace(/"relationshipId"\s*:\s*"REL\d+"/g, '"relationshipId":"REL999"')
               .replace(/"relationship"\s*:\s*"REL\d+"/g, '"relationship":"REL999"');
    await route.fulfill({ response: res, body });
  });
  await login(p);
  await p.goto(`${APP}/member/wallet`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  await p.locator('button[aria-label^="Account menu for"]').click();
  await p.waitForTimeout(600);
  const t = await txt(p);
  rec('Unrecognised relationship — dependent still listed, neutral label, raw code hidden',
    /Sayani/i.test(t) && !/REL999/.test(t),
    `dependent still listed: ${/Sayani/i.test(t)}; raw REL999 shown: ${/REL999/.test(t)}`);
}

// --- Family load fails (forced 500 on profile)
{
  const p = await (await b.newContext()).newPage();
  await login(p);
  await p.route('**/api/member/profile*', (r) =>
    r.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"boom"}' }));
  await p.goto(`${APP}/member/wallet`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  const t = await txt(p);
  rec('Family load fails — screen still usable, degrades to the signed-in member',
    /Wallet/.test(t) && !/Sayani/i.test(t) && !/undefined|NaN/.test(t),
    `wallet still renders; no dependent offered; text: "${t.slice(t.indexOf('Wallet'), t.indexOf('Wallet') + 90)}"`);
}

// --- Selection does not survive sign out
{
  const p = await (await b.newContext()).newPage();
  await login(p);
  await p.goto(`${APP}/member/wallet`, { waitUntil: 'networkidle' });
  await p.locator('button[aria-label^="Account menu for"]').click();
  await p.waitForTimeout(300);
  await p.locator('button[role=menuitem]', { hasText: /Sayani/i }).first().click();
  await p.waitForTimeout(1500);
  const switched = /Sayani/i.test(await txt(p));
  await p.locator('button[aria-label^="Account menu for"]').click();
  await p.waitForTimeout(300);
  await p.locator('button', { hasText: /log out/i }).first().click();
  await p.waitForURL('**/login', { timeout: 10000 });
  await login(p);
  await p.goto(`${APP}/member/wallet`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  const after = await txt(p);
  rec('Selection does not survive sign out',
    switched && /Shivam/i.test(after) && !/Sayani/i.test(after),
    `switched to Sayani first: ${switched}; after re-login active member is Shivam: ${/Shivam/i.test(after)}`);
}
await b.close();
