import { chromium } from 'playwright';
const APP = 'http://localhost:4300';
const realLinks = (p) => p.locator('main a[href]');
const b = await chromium.launch();
try {
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  await p.goto(APP + '/login', { waitUntil: 'domcontentloaded' });
  await p.getByLabel(/email/i).fill('shivam@gmail.com');
  await p.getByLabel(/password/i).fill('12345678');
  await p.getByRole('button', { name: /sign in/i }).click();
  await p.waitForURL('**/member**', { timeout: 20000 });

  await p.goto(APP + '/member/online-consult/doctors?specialtyId=SPEC001&specialtyName=General%20Physician', { waitUntil: 'domcontentloaded' });
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(800);
  const consultHrefs = (await realLinks(p).evaluateAll((els) => els.map((e) => e.getAttribute('href')))).filter((h) => h && h.includes('/online-consult/confirm'));
  console.log('consult-online links:', consultHrefs.length);
  await p.goto(APP + consultHrefs[0], { waitUntil: 'domcontentloaded' });
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(1000);

  const hasHeading = await p.getByRole('heading', { name: 'Select Patient' }).count();
  console.log('Select Patient heading present?', hasHeading > 0);

  const buttons = p.locator('button').filter({ hasText: /Self|Jha|Spouse|Child|REL/i });
  const patientButtons = p.getByRole('button');
  const allButtonTexts = await p.locator('button').allInnerTexts();
  console.log('all buttons on page:', JSON.stringify(allButtonTexts.slice(0, 20)));

  const before = (await p.locator('dl').first().innerText()).replace(/\s+/g, ' ');
  console.log('Summary before click:', before);

  await p.getByRole('button', { name: /Sayani Kumari/i }).click();
  await p.waitForTimeout(500);
  const after = (await p.locator('dl').first().innerText()).replace(/\s+/g, ' ');
  console.log('Summary after clicking Sayani:', after);
} finally {
  await b.close();
}
