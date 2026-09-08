/**
 * Flow 5 step 12 — does the receipt render real figures, and are the two
 * remaining placeholders reachable by clicking?
 */
import { chromium } from 'playwright';

const ORDER = process.argv[2] ?? 'PHORD-1788781695248';
const b = await chromium.launch();
const p = await b.newPage();

await p.goto('http://localhost:4200/member/login');
await p.getByLabel(/email/i).fill('shivam@gmail.com');
await p.getByLabel(/password/i).fill('12345678');
await p.getByRole('button', { name: /sign in|log in/i }).click();
await p.waitForURL(/\/member\//, { timeout: 30000 });

await p.goto(`http://localhost:4200/member/pharmacy/orders/${ORDER}`);
await p.waitForTimeout(2500);

await p.getByRole('link', { name: 'View' }).click();
await p.waitForURL(/receipt/, { timeout: 15000 });
await p.waitForTimeout(1500);
const receipt = await p.locator('body').innerText();
console.log('--- RECEIPT ---');
console.log(receipt.split('\n').filter(Boolean).slice(0, 24).join('\n'));
await p.screenshot({ path: 'pharmacy-receipt.png', fullPage: true });

for (const step of ['delivery', 'refund']) {
  await p.goto(`http://localhost:4200/member/pharmacy/orders/${ORDER}/${step}`);
  await p.waitForTimeout(1200);
  const text = await p.locator('body').innerText();
  console.log(`--- ${step.toUpperCase()} ---`);
  console.log(text.split('\n').filter(Boolean).slice(5, 16).join(" | "));
}

await b.close();
