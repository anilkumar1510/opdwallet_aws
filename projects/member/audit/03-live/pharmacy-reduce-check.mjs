/**
 * Flow 5 step 6 — the member can only reduce the cart.
 *
 * Uploads a prescription, has the stand-in adjudicator build the cart, then
 * checks the quantity control moves one way only.
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const BASE = process.argv[2] ?? 'http://localhost:4300';
const shot = `${process.cwd()}/pharmacy-reduce.png`;
const rx = `${process.cwd()}/rx-demo.png`;
// A distinct file each run — the same bytes twice is a duplicate, by design.
writeFileSync(rx, Buffer.from(`prescription ${process.argv[3] ?? Math.floor(Date.now() / 1000)}`));

const b = await chromium.launch();
const p = await b.newPage();
p.on('response', async (r) => {
  if (r.request().method() === 'PATCH') {
    console.log('PATCH', r.status(), r.url().split('/api')[1], (await r.text().catch(() => '')).slice(0, 160));
  }
});
await p.goto(`${BASE}/member/login`);
await p.getByLabel(/email/i).fill('shivam@gmail.com');
await p.getByLabel(/password/i).fill('12345678');
await p.getByRole('button', { name: /sign in|log in/i }).click();
await p.waitForURL(/\/member\//, { timeout: 30000 });

await p.goto(`${BASE}/member/pharmacy`);
await p.getByText('Order your medicines').waitFor({ timeout: 30000 });

// Walk the journey rather than assuming a cart is waiting: upload, have the
// stand-in adjudicator build it, then reduce.
if (await p.getByText('Upload prescription').isVisible().catch(() => false)) {
  await p.locator('input[type=file]').setInputFiles(rx);
  await p.waitForTimeout(3000);
  console.log('AFTER UPLOAD:', (await p.locator('body').innerText()).replace(/\s+/g, ' ').slice(120, 420));
}
const build = p.getByRole('button', { name: /Generate the cart/i });
if (await build.isVisible().catch(() => false)) {
  await build.click();
  await p.waitForTimeout(3500);
  console.log('AFTER BUILD:', (await p.locator('body').innerText()).replace(/\s+/g, ' ').slice(120, 420));
} else {
  console.log('NO BUILD BUTTON:', (await p.locator('body').innerText()).replace(/\s+/g, ' ').slice(120, 420));
}

const row = (name) => p.locator('li').filter({ hasText: name }).last();
const cartText = async () =>
  (await p.locator('section').filter({ hasText: 'Your cart' }).last().innerText()).replace(
    /\s+/g,
    ' ',
  );

await row('Amoxicillin').waitFor({ timeout: 20000 });
console.log('BUILT :', await cartText());

// Down to nothing, one press at a time — the last press takes the line out.
for (let i = 0; i < 4; i++) {
  const line = row('Amoxicillin');
  if (!(await line.isVisible().catch(() => false))) break;
  await line.getByRole('button', { name: /Amoxicillin/i }).click();
  await p.waitForTimeout(1800);
  console.log(`press ${i + 1}:`, await cartText());
}

console.log('Remove links left:', await p.getByRole('button', { name: 'Remove' }).count());
await p.screenshot({ path: shot, fullPage: true });
await b.close();
