import { chromium } from 'playwright';
const OPS='http://localhost:3005/operations';
const b=await chromium.launch();
const p=await (await b.newContext()).newPage();
p.on('response',r=>{const u=r.url();if(u.includes('/api/'))console.log('  NET',r.request().method(),new URL(u).pathname,r.status());});
await p.goto(OPS+'/login',{waitUntil:'domcontentloaded'});
await p.waitForLoadState('networkidle');
await p.getByLabel(/email/i).fill('opsadmin@gmail.com').catch(async()=>{await p.locator('input[type=email]').fill('opsadmin@gmail.com');});
await p.locator('input[type=password]').fill('Admin@123');
await p.getByRole('button',{name:/sign in|log ?in/i}).click();
await p.waitForTimeout(4000);
console.log('URL after login:', p.url());
await p.goto(OPS+'/lab/prescriptions/PRES-1785999575409-13N0ZUZXB/digitize',{waitUntil:'domcontentloaded'});
await p.waitForLoadState('networkidle');await p.waitForTimeout(2500);
console.log('URL:',p.url());
console.log('--- RENDER ---');
console.log((await p.locator('body').innerText()).replace(/\s+/g,' ').slice(0,1500));
const search=p.locator('input[placeholder*="earch" i]').first();
await search.fill('blood');
await p.waitForTimeout(2000);
await p.getByRole('button',{name:/Complete Blood Count/i}).first().click();
await p.waitForTimeout(800);
console.log('--- SELECTED ---');
console.log((await p.locator('body').innerText()).replace(/\s+/g,' ').slice(300,1100));
await p.getByRole('button',{name:/Find Vendors/i}).click();
await p.waitForTimeout(4000);
console.log('--- AFTER FIND VENDORS ---');
console.log((await p.locator('body').innerText()).replace(/\s+/g,' ').slice(300,1400));
// The checkbox is decorative; the card is the control. Verify the counter
// moved off "0 selected" BEFORE committing — Create Cart silently no-ops
// otherwise, which is how the first two attempts fired no request at all.
await p.locator('input[type=checkbox]').first().click({force:true}).catch(()=>{});
await p.waitForTimeout(400);
let sel=(await p.locator('body').innerText()).match(/(\d+) selected/);
if(!sel||sel[1]==='0'){
  await p.getByText(/Dr\. Lal PathLabs/i).first().click({force:true}).catch(()=>{});
  await p.waitForTimeout(400);
  sel=(await p.locator('body').innerText()).match(/(\d+) selected/);
}
console.log('vendor selection:', sel?sel[0]:'counter not found');
if(!sel||sel[1]==='0'){console.log('ABORT — no vendor selected, not clicking Create Cart');await b.close();process.exit(1);}
await p.getByRole('button',{name:/^Create Cart$/i}).click();
await p.waitForTimeout(5000);
console.log('--- AFTER CREATE CART ---');
console.log('URL:',p.url());
console.log((await p.locator('body').innerText()).replace(/\s+/g,' ').slice(0,700));
await b.close();
