import { chromium } from 'playwright';
const APP = 'http://localhost:4300';
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
  await p.waitForTimeout(1000);
  const body = (await p.locator('main').first().innerText()).replace(/\n+/g, ' | ').trim();
  console.log('Doctors page (online) render:', body.slice(0, 600));
} finally {
  await b.close();
}
