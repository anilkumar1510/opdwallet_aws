// Does a never-fetched store render "empty" before its first load completes,
// while fully authenticated? And how long is the post-rejection silent window?
import { chromium } from 'playwright';
const APP = 'http://localhost:4200';
const b = await chromium.launch();
const p = await (await b.newContext()).newPage();

await p.goto(`${APP}/login`, { waitUntil: 'networkidle' });
await p.fill('#email', 'shivam@gmail.com');
await p.fill('input[type=password]', '12345678');
await p.click('button[type=submit]');
await p.waitForURL('**/member**');

// Sample the claims screen aggressively from the instant navigation starts.
const seen = [];
p.goto(`${APP}/member/claims`).catch(() => {});
for (let i = 0; i < 40; i++) {
  await p.waitForTimeout(50);
  try {
    const t = (await p.locator('body').innerText()).replace(/\s+/g, ' ');
    const state = /No claims yet/.test(t)
      ? 'EMPTY("No claims yet")'
      : /Loading/i.test(t)
        ? 'loading'
        : /Claim|claims/.test(t)
          ? 'content'
          : 'other';
    if (seen[seen.length - 1]?.state !== state) seen.push({ ms: i * 50, state });
  } catch { /* mid-navigation */ }
}
console.log('state sequence on a fresh, AUTHENTICATED visit to /member/claims:');
for (const s of seen) console.log(`  t+${s.ms}ms  ${s.state}`);
const flashed = seen.some((s) => s.state.startsWith('EMPTY'));
console.log(`\nrendered a false "No claims yet" before data settled: ${flashed}`);
await b.close();
