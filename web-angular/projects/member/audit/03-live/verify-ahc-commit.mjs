import { chromium } from 'playwright';
const APP='http://localhost:4200';
const R=[];const rec=(n,p,note)=>{R.push(p);console.log(`${p?'PASS':'FAIL'}  ${n}\n        ${note}`);};
const b=await chromium.launch();
try{
const p=await (await b.newContext()).newPage();
const net=[];p.on('response',r=>{const u=new URL(r.url()).pathname;if(u.startsWith('/api'))net.push(`${r.request().method()} ${u} ${r.status()}`);});
const txt=async()=>(await p.locator('#main, body').first().innerText()).replace(/\s+/g,' ').trim();
const go=async u=>{await p.goto(APP+u,{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(900);};
await go('/login');
await p.getByLabel(/email/i).fill('shivam@gmail.com');
await p.getByLabel(/password/i).fill('12345678');
await p.getByRole('button',{name:/sign in/i}).click();
await p.waitForURL('**/member**',{timeout:20000});

const balance=async()=>{await go('/member/wallet');return (await txt()).match(/AVAILABLE BALANCE ([₹\d,]+)/)?.[1] ?? '?';};
const before=await balance();

// A leg is set by "Select and continue" on a vendor card, and cards only appear
// after "Find". Read from the markup, not guessed at.
const pickLeg=async(route,label)=>{
  await go(route);
  await p.getByRole('button',{name:/^Find$/i}).click().catch(()=>{});
  await p.waitForTimeout(1800);
  const sel=p.getByRole('button',{name:/select and continue/i});
  const n=await sel.count();
  rec(`${label}: vendor cards offer "Select and continue"`, n>0, `${n} vendor card(s)`);
  if(!n) return false;
  await sel.first().click();
  await p.waitForTimeout(1500);
  return true;
};
const lab=await pickLeg('/member/ahc/booking','Step 1 (lab)');
if(lab) console.log('        after lab ->', p.url().replace(APP,''));
if(lab && p.url().includes('/diagnostic')) await pickLeg('/member/ahc/booking/diagnostic','Step 2 (diagnostic)');

// Step 3 — the populated branch.
// Do NOT navigate here: step 2 already routed us, and a page.goto reloads the
// app and wipes the signal store, which is what produced "Nothing to confirm"
// on the previous run. The reference keeps this in sessionStorage and does
// survive a reload; the store does not. Recorded as a finding.
await p.waitForLoadState('networkidle');await p.waitForTimeout(900);
const rp=await txt();
rec('POSITIVE CONTROL — Review & Pay reached its populated branch',
  !/Nothing to confirm/i.test(rp) && /Confirm booking/i.test(rp), rp.slice(0,120));

net.length=0;
const btn=p.getByRole('button',{name:/confirm booking/i});
if(await btn.count()){await btn.first().click();await p.waitForTimeout(4500);}
const post=net.filter(c=>/POST \/api\/member\/ahc\/orders/.test(c)).join(',');
rec('Commit issues POST member/ahc/orders and it succeeds',
  /201|200/.test(post), post || `no POST | screen: ${(await txt()).slice(0,120)}`);
rec('Lands on the bookings list', p.url().includes('/member/bookings'), p.url().replace(APP,''));

const after=await balance();
rec('NEGATIVE CONTROL — no wallet debit on a booking-first order',
  before===after, `before ${before} / after ${after}`);
} finally { await b.close(); }
console.log(`\npass ${R.filter(Boolean).length}/${R.length}`);
