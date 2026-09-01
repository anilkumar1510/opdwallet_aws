import { chromium } from 'playwright';
const APP='http://localhost:4200';
const R=[];const rec=(n,p,note)=>{R.push(p);console.log(`${p?'PASS':'FAIL'}  ${n}\n        ${note}`);};
const b=await chromium.launch();
const login=async(p)=>{await p.goto(APP+'/login',{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');
  await p.getByLabel(/email/i).fill('shivam@gmail.com');await p.getByLabel(/password/i).fill('12345678');
  await p.getByRole('button',{name:/sign in/i}).click();await p.waitForURL('**/member**',{timeout:20000});};
try{
const p=await (await b.newContext()).newPage();
const net=[];p.on('response',r=>{const u=new URL(r.url()).pathname;if(u.startsWith('/api'))net.push(`${r.request().method()} ${u} ${r.status()}`);});
const txt=async(pg=p)=>(await pg.locator('#main, body').first().innerText()).replace(/\s+/g,' ').trim();
const go=async u=>{await p.goto(APP+u,{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(900);};
await login(p);

// --- orders list + summary
await go('/member/orders');
const o=await txt();
rec('POSITIVE CONTROL — orders listed with summary totals',
  /₹[\d,]+/.test(o) && /(total|spent|wallet|self)/i.test(o), o.slice(0,120));
rec('Amounts and dates formatted, never raw',
  /\d{1,2} \w{3} \d{4}/.test(o) && !/\d{4}-\d{2}-\d{2}T/.test(o), 'formatted dates, no ISO strings');

// --- COLD forced failure: orders request fails (a real dependency)
{
  const cold=await (await b.newContext()).newPage();
  await cold.route('**/api/transactions*',r=>r.fulfill({status:500,contentType:'application/json',body:'{"m":"x"}'}));
  await login(cold);
  await cold.goto(APP+'/member/orders',{waitUntil:'domcontentloaded'});
  await cold.waitForLoadState('networkidle');await cold.waitForTimeout(1200);
  const t=await txt(cold);
  rec('Orders fail to load — error state, distinct from empty (COLD)',
    /could not|went wrong|try again/i.test(t) && !/no orders|nothing/i.test(t), t.slice(0,130));
  await cold.close();
}

// --- order detail: which identifier is displayed
await go('/member/orders');
const detail=await p.getByRole('link').evaluateAll(e=>e.map(x=>x.getAttribute('href')).filter(h=>h&&/^\/member\/orders\/.+/.test(h)));
if(detail.length){
  await p.goto(APP+detail[0],{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(1000);
  const d=await txt();
  rec('Order detail renders, and shows a business reference not a Mongo _id',
    !/not found/i.test(d) && !/[0-9a-f]{24}/.test(d), `${p.url().replace(APP,'')} | ${d.slice(0,110)}`);
} else rec('Order detail reachable', false, 'no order links found');

// --- unknown order
await go('/member/orders/TXN-does-not-exist');
rec('Unknown order — not-found state, not an empty detail',
  /not found|could not/i.test(await txt()), (await txt()).slice(0,100));

// --- entry 5 conformance: the payment screen must not create bookings
// The payment link is on the transaction DETAIL, not the list
// (transaction-detail-page.ts:105). Walk detail pages until one offers it.
let anyPay=[];
await go('/member/orders');
const details=await p.getByRole('link').evaluateAll(e=>e.map(x=>x.getAttribute('href')).filter(h=>h&&/^\/member\/orders\/.+/.test(h)));
for(const d of details.slice(0,6)){
  await p.goto(APP+d,{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(700);
  anyPay=await p.getByRole('link').evaluateAll(e=>e.map(x=>x.getAttribute('href')).filter(h=>h&&/^\/member\/payments\/.+/.test(h)));
  if(anyPay.length) break;
}
if(anyPay.length){
  net.length=0;
  await p.goto(APP+anyPay[0],{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(1200);
  const creates=net.filter(c=>/POST \/api\/(appointments|dental-bookings|vision-bookings|member\/lab\/orders|member\/diagnostics\/orders|member\/ahc\/orders)/.test(c));
  rec('NEGATIVE CONTROL — entry 5 conformance: payment screen creates no booking',
    creates.length===0, creates.length?`created: ${creates}`:'no creation calls on load');
  rec('Payment screen renders its record', !/not found/i.test(await txt()), (await txt()).slice(0,100));
} else rec('Payment screen reachable from a transaction detail', null,
  'UNREACHABLE with this account — no transaction in the sample carried an outstanding payment. Recorded unverified, not passing.');
} finally { await b.close(); }
console.log(`\npass ${R.filter(Boolean).length}/${R.length}`);
