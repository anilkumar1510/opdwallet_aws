/**
 * The Health checkup tab on /member/bookings.
 *
 * `BookingKind.Ahc` and its tab have existed since the screen was built and
 * nothing ever produced one, so the tab was permanently empty while the member
 * held a real AHC order. NON-MUTATING: page loads only.
 *
 * CONTROLS
 *   positive — a real AHC order exists on this account (AHC-ORD-1786182053508-…),
 *              so an empty tab is a defect and not an accurate empty state
 *   negative — an unrelated tab must not gain rows from this change
 */
import { chromium } from 'playwright';
const APP='http://localhost:4200';
const ORDER='AHC-ORD-1786182053508-8GHNX7JM9';
const R=[];const rec=(n,p,note)=>{R.push(p);console.log(`${p?'PASS':'FAIL'}  ${n}\n        ${note}`);};
const b=await chromium.launch();
try{
  const p=await (await b.newContext()).newPage();
  const calls=[];
  p.on('response',r=>{const u=new URL(r.url()).pathname;if(u.includes('/api/'))calls.push(u);});
  await p.goto(APP+'/login',{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');
  await p.getByLabel(/email/i).fill('shivam@gmail.com');await p.getByLabel(/password/i).fill('12345678');
  await p.getByRole('button',{name:/sign in/i}).click();await p.waitForURL('**/member**',{timeout:20000});

  calls.length=0;
  await p.goto(APP+'/member/bookings?tab=ahc',{waitUntil:'domcontentloaded'});
  await p.waitForLoadState('networkidle');await p.waitForTimeout(2500);
  const txt=(await p.locator('#main, body').first().innerText()).replace(/\s+/g,' ');

  rec('the bookings list now fetches AHC orders',
    calls.some(u=>/member\/ahc\/orders/.test(u)), calls.filter(u=>/ahc/.test(u)).join(', ')||'no ahc call');
  rec('POSITIVE CONTROL — the Health checkup tab is offered',
    /Health checkup/i.test(txt), 'tab present');
  rec('the real AHC order appears under it',
    new RegExp(ORDER).test(txt), txt.match(/AHC-ORD-[^ ]*/)?.[0] ?? 'no AHC-ORD- on screen');
  rec('it carries its package name and what is owed',
    /HCL Health AHC/i.test(txt) && /still to pay|240/.test(txt),
    txt.match(/HCL Health AHC[^]{0,80}/i)?.[0]?.slice(0,80) ?? 'not shown');

  // NEGATIVE CONTROL — an unrelated tab must be unaffected
  await p.goto(APP+'/member/bookings?tab=dental',{waitUntil:'domcontentloaded'});
  await p.waitForLoadState('networkidle');await p.waitForTimeout(2000);
  const dental=(await p.locator('#main, body').first().innerText()).replace(/\s+/g,' ');
  rec('NEGATIVE CONTROL — the dental tab did not gain AHC rows',
    !new RegExp(ORDER).test(dental) && /DEN-BOOK-/.test(dental),
    'dental rows intact, no AHC leakage');
} finally { await b.close(); }
console.log(`\npass ${R.filter(Boolean).length}/${R.length}`);
