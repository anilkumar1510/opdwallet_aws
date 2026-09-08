/** Are the reduce buttons in one column, whatever the price width? */
import { chromium } from 'playwright';

const b = await chromium.launch();
const p = await b.newPage();
await p.goto('http://localhost:4300/member/login');
await p.getByLabel(/email/i).fill('shivam@gmail.com');
await p.getByLabel(/password/i).fill('12345678');
await p.getByRole('button', { name: /sign in|log in/i }).click();
await p.waitForURL(/\/member\//, { timeout: 30000 });
await p.goto('http://localhost:4300/member/pharmacy');

const buttons = p.locator('li button[aria-label*="duce"], li button[aria-label*="emove"]');
await buttons.first().waitFor({ timeout: 20000 });
const xs = [];
const gaps = [];
for (let i = 0; i < (await buttons.count()); i++) {
  const button = await buttons.nth(i).boundingBox();
  xs.push(Math.round(button.x));
  // How much air sits between the button and the first digit of the amount.
  const price = await buttons.nth(i).locator('xpath=preceding-sibling::span').boundingBox();
  const text = await buttons.nth(i).locator('xpath=preceding-sibling::span').evaluate((el) => {
    const r = document.createRange();
    r.selectNodeContents(el);
    return r.getBoundingClientRect().right;
  });
  gaps.push(Math.round(button.x - text));
  void price;
}
console.log('minus x positions:', xs.join(', '), '->', new Set(xs).size === 1 ? 'ALIGNED' : 'RAGGED');
console.log('gap to the digits (px):', gaps.join(', '));
await p.screenshot({ path: `${process.cwd()}/pharmacy-cart-layout.png`, fullPage: true });
await b.close();
