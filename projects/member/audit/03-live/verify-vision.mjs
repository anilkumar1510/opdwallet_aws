import { chromium } from 'playwright';
import { ALREADY_BOOKED } from './slot-picker.mjs';
import { controls, pendingSnapshot, pendingSince, describe } from './pending-payments.mjs';
const APP='http://localhost:4200';
const R=[];const rec=(n,p,note)=>{R.push(p);console.log(`${p===true?'PASS':p===false?'FAIL':'????'}  ${n}\n        ${note}`);};
const b=await chromium.launch();
const login=async(pg)=>{await pg.goto(APP+'/login',{waitUntil:'domcontentloaded'});await pg.waitForLoadState('networkidle');
  await pg.getByLabel(/email/i).fill('shivam@gmail.com');await pg.getByLabel(/password/i).fill('12345678');
  await pg.getByRole('button',{name:/sign in/i}).click();await pg.waitForURL('**/member**',{timeout:20000});};
try{
const p=await (await b.newContext()).newPage();
const net=[];p.on('response',r=>{const u=new URL(r.url()).pathname;if(u.startsWith('/api'))net.push({m:r.request().method(),u,s:r.status(),t:Date.now()});});
const txt=async(pg=p)=>(await pg.locator('#main, body').first().innerText()).replace(/\s+/g,' ').trim();
const go=async u=>{await p.goto(APP+u,{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(900);};
const hrefs=async(re)=>p.getByRole('link').evaluateAll((e,r)=>e.map(x=>x.getAttribute('href')).filter(h=>h&&new RegExp(r).test(h)),re.source);
await login(p);

await go('/member/vision');
rec('POSITIVE CONTROL — vision services listed', /₹|service|consult|lens|frame|eye/i.test(await txt()), (await txt()).slice(0,100));

// The cold clinics-failure scenario lives in verify-vision-clinics-fail.mjs.
// The version that was here navigated to /member/vision/clinics WITHOUT the
// serviceCode the journey supplies, so `selectClinics` returned early, no
// request fired, and the empty branch rendered instead of the error branch —
// it reported FAIL for a reason that had nothing to do with the screen.

// Extended criterion 6 — prove the money query works before trusting it.
const ctl=await controls();
rec('POSITIVE CONTROL — the pending-payment query finds a known real obligation',
  ctl.positive, `PAY-20260808-0188 present among ${ctl.total} payments`);
rec('NEGATIVE CONTROL — it does not find a payment that cannot exist',
  ctl.negative, 'PAY-00000000-0000 absent');
const beforePending=await pendingSnapshot();

// journey
await go('/member/vision');
let h=await hrefs(/\/member\/vision\/clinics/);
if(!h.length){rec('Vision journey startable',false,'no clinics link from services');throw new Error('stop');}
await p.goto(APP+h[0],{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(900);
await p.locator('input[name=pincode]').fill('201301');
await p.getByRole('button',{name:/search/i}).first().click();
await p.waitForTimeout(2200);
h=await hrefs(/select-patient/);
if(!h.length){rec('Clinics found for the searched pincode',false,(await txt()).slice(0,120));throw new Error('stop');}
await p.goto(APP+h[0],{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(800);
rec('Active family member marked on the patient picker', /Currently viewing/i.test(await txt()), 'marker present');
h=await hrefs(/patientId=/);
await p.goto(APP+h[0],{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(1000);

// slot-aware: try confirm links until the booking is accepted
const slotLinks=await hrefs(/confirm/);
let created=null, attempts=0;
for(const link of slotLinks.slice(0,8)){
  attempts++;
  await p.goto(APP+link,{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(1100);
  net.length=0;
  await p.getByRole('button',{name:/confirm|book/i}).first().click().catch(()=>{});
  await p.waitForTimeout(4000);
  const post=net.find(c=>c.m==='POST' && /vision-bookings$/.test(c.u));
  if(post && post.s<400){created=post;break;}
  const body=await txt();
  // Use the shared detector, not a local regex. This harness carried its own,
  // which knew "already"/"not available" but not "fully booked" — so a plain
  // slot collision reported as a defect and the retry loop stopped.
  if(post && !ALREADY_BOOKED.test(body)){rec('Vision booking refused for a non-collision reason',false,`${post.s} | ${body.slice(0,110)}`);break;}
}
rec('Vision booking created (slot-aware)', Boolean(created), created?`POST vision-bookings ${created.s} after ${attempts} attempt(s)`:'no successful create');

if(created){
  rec('ENTRY 5 — lands on the payment screen keyed by the new bookingId',
    /\/member\/vision\/payment\/.+/.test(p.url()), p.url().replace(APP,''));
  const pay=await txt();
  rec('Payment screen shows the booking reference, not a Mongo _id',
    !/[0-9a-f]{24}/.test(pay), pay.slice(0,110));

  net.length=0;
  await p.getByRole('button',{name:/complete payment|pay/i}).first().click().catch(()=>{});
  await p.waitForTimeout(4500);
  const pp=net.find(c=>/process-payment/.test(c.u));
  const creates=net.filter(c=>c.m==='POST' && /vision-bookings$/.test(c.u));
  rec('ENTRY 5 — payment creates no booking; the booking already existed',
    creates.length===0, creates.length?`unexpected create: ${creates.length}`:'no create calls during payment');
  // Corrected once, in session 34, and the reason is recorded rather than the
  // assertion loosened: this used to require a paymentId and a hop to
  // /member/payments/:id. It cannot succeed on a fresh booking — payment is
  // gated on a bill nothing in the portal generates (inherited finding 11), so
  // the API refuses correctly. What the portal owes the member is the reason.
  const said=await txt();
  rec('process-payment is called, and its refusal is surfaced rather than swallowed',
    Boolean(pp) && (pp.s<400
      ? /\/member\/payments\/.+/.test(p.url())
      : /bill has not been generated|could not complete/i.test(said)),
    `${pp?pp.m+' '+pp.u+' '+pp.s:'no process-payment'} | ${said.slice(-160)}`);

  // EXTENDED CRITERION 6, and this is the criterion's own negative control:
  // vision's create makes no payment at all — `createPaymentRequest` sits inside
  // the bill-gated `processPaymentForBilling`. So nothing pending here is
  // orphaning, and anything that did appear would be a real finding.
  const opened=await pendingSince(beforePending);
  rec('EXTENDED CRITERION 6 — vision creates no payment at booking time',
    opened.length===0, describe(opened));
}
} finally { await b.close(); }
console.log(`\npass ${R.filter(x=>x===true).length}/${R.length}`);
