// Open question from the spike: with the session rejected and controls still
// live, does clicking a nav control redirect to login or silently 401?
import { chromium } from 'playwright';
const APP = 'http://localhost:4200';

const b = await chromium.launch();
const p = await (await b.newContext()).newPage();
const net = [];
p.on('response', (r) => {
  const u = new URL(r.url()).pathname;
  if (u.startsWith('/api')) net.push(`${r.status()} ${u}`);
});

await p.goto(`${APP}/login`, { waitUntil: 'networkidle' });
await p.fill('#email', 'standard@gmail.com');
await p.fill('input[type=password]', 'User@123');
await p.click('button[type=submit]');
await p.waitForURL('**/member**');
await p.goto(`${APP}/member/wallet`, { waitUntil: 'networkidle' });

// Idle past the 60s token, no interaction.
await p.waitForTimeout(75000);
console.log('after idle, url:', p.url().replace(APP, ''));
console.log('401s so far   :', net.filter((n) => n.startsWith('401')).length);

// Now click a nav destination.
const before = net.length;
await p.locator('a', { hasText: 'Claims' }).first().click();
await p.waitForTimeout(2500);
console.log('\nafter clicking "Claims":');
console.log('  url        :', p.url().replace(APP, ''));
console.log('  new calls  :', net.slice(before).join(' | ') || '(none)');
console.log('  body       :', (await p.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 160));
await b.close();
