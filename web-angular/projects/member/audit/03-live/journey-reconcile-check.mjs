import { chromium } from 'playwright';
const APP = 'http://localhost:4300';
const realLinks = (p) => p.locator('main a[href]');
const b = await chromium.launch();
try {
  const ctx = await b.newContext();
  const p = await ctx.newPage();
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

  await go('/member/appointments/specialties');
  const specHrefs = (await realLinks(p).evaluateAll((els) => els.map((e) => e.getAttribute('href')))).filter((h) => h && h.includes('/doctors'));
  await go(specHrefs[0]);
  const clinicHrefs = (await realLinks(p).evaluateAll((els) => els.map((e) => e.getAttribute('href')))).filter((h) => h && h.includes('select-patient'));
  await go(clinicHrefs[0]);
  const patientHrefs = (await realLinks(p).evaluateAll((els) => els.map((e) => e.getAttribute('href')))).filter((h) => h && h.includes('select-slot'));
  await go(patientHrefs[0]);

  let appointmentUrl = null;
  outer: for (let day = 0; day < 5 && !appointmentUrl; day++) {
    await go(patientHrefs[0].replace('select-patient', 'select-slot'));
    if (day > 0) {
      const dayBtns = p.locator('button').filter({ hasText: /^(Today|Tomorrow|[A-Za-z]{3} \d)/ });
      if (day >= (await dayBtns.count())) break;
      await dayBtns.nth(day).click();
      await p.waitForTimeout(600);
    }
    const slotHrefs = (await realLinks(p).evaluateAll((els) => els.map((e) => e.getAttribute('href')))).filter((h) => h && h.includes('/appointments/confirm'));
    for (let i = 0; i < Math.min(slotHrefs.length, 8); i++) {
      await go(slotHrefs[i]);
      const net = [];
      p.on('response', (r) => { const u = new URL(r.url()).pathname; if (u.startsWith('/api')) net.push(`${r.request().method()} ${u} ${r.status()}`); });
      await p.getByRole('button', { name: /confirm/i }).first().click();
      await p.waitForTimeout(3000);
      if (p.url().includes('/appointments/journey/')) { appointmentUrl = p.url(); break outer; }
    }
  }
  console.log('Booked, landed on:', appointmentUrl?.replace(APP, ''));
  const appointmentId = appointmentUrl?.split('/').pop();

  // Confirm it for real via the ops API, same as the Operations portal would.
  const loginRes = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'opsadmin@gmail.com', password: 'Admin@123' }),
  }).then((r) => r.json());
  const confirmRes = await fetch(`http://localhost:4000/api/appointments/${appointmentId}/confirm`, {
    method: 'PATCH', headers: { Authorization: `Bearer ${loginRes.token}` },
  });
  console.log('Ops confirm call status:', confirmRes.status);

  // Reload the SAME journey screen in the SAME browser session and check.
  await go(`/member/appointments/journey/${appointmentId}`);
  await p.waitForTimeout(1500);
  const body = (await p.locator('#main, main, body').first().innerText()).replace(/\s+/g, ' ').trim();
  console.log('Journey screen after ops-confirm + reload:', body.slice(0, 300));
} finally {
  await b.close();
}
