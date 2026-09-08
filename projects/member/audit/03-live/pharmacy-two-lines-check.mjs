/**
 * Reduce one line, then another — does the first stay down?
 *
 * The cart's items were stored as Mixed, so an in-place quantity change never
 * reached the database: the screen showed the new number from the response,
 * and the next read of the cart brought the old one back.
 */
import { chromium } from 'playwright';

const b = await chromium.launch();
const p = await b.newPage();
await p.goto('http://localhost:4300/member/login');
await p.getByLabel(/email/i).fill('shivam@gmail.com');
await p.getByLabel(/password/i).fill('12345678');
await p.getByRole('button', { name: /sign in|log in/i }).click();
await p.waitForURL(/\/member\//, { timeout: 30000 });
await p.goto('http://localhost:4300/member/pharmacy');

const cart = () =>
  p
    .locator('section')
    .filter({ hasText: 'Your cart' })
    .last()
    .innerText()
    .then((t) => t.replace(/\s+/g, ' '));
const press = async (name) => {
  await p
    .locator('li')
    .filter({ hasText: name })
    .last()
    .getByRole('button', { name: new RegExp(name, 'i') })
    .click();
  await p.waitForTimeout(1800);
};

await p.locator('li').filter({ hasText: 'Amlodipine' }).last().waitFor({ timeout: 20000 });
console.log('start     :', await cart());
await press('Amlodipine');
console.log('after A   :', await cart());
await press('Amoxicillin');
console.log('after B   :', await cart());
await p.reload();
await p.waitForTimeout(3000);
console.log('on reload :', await cart());
await p.screenshot({ path: `${process.cwd()}/pharmacy-two-lines.png`, fullPage: true });
await b.close();
