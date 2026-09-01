import { chromium } from 'playwright';
const APP='http://localhost:4200';
const b=await chromium.launch();
const p=await (await b.newContext()).newPage();
await p.goto(APP+'/login',{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');
await p.getByLabel(/email/i).fill('shivam@gmail.com');await p.getByLabel(/password/i).fill('12345678');
await p.getByRole('button',{name:/sign in/i}).click();await p.waitForURL('**/member**',{timeout:20000});
for (const url of ['/member/lab-tests/cart/CART-1786253711175-DAWV92M4N',
                   '/member/diagnostics/cart/DIAG-CART-1782129431229-MFGEHVOLQ']) {
  await p.goto(APP+url,{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(1000);
  const all=await p.getByRole('link').evaluateAll(e=>e.map(x=>x.getAttribute('href')));
  console.log(url);
  console.log('   vendor links:', JSON.stringify(all.filter(h=>h&&h.includes('/vendor/'))));
}
await b.close();
