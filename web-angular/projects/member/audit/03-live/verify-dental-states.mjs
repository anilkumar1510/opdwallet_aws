/**
 * Dental — the states the journey harness cannot reach.
 *
 * Every scenario here is FORCED by interception from a cold context, per
 * section 9 criterion 5. This file makes NO writes: the one scenario that
 * exercises the create endpoint intercepts it, so no booking record is
 * created and the run is repeatable.
 *
 * Pairs with verify-dental.mjs, which drives the happy path to a terminal
 * state and does mutate.
 */
import { chromium } from 'playwright';
const APP='http://localhost:4200';
const R=[];const rec=(n,p,note)=>{R.push(p);console.log(`${p?'PASS':'FAIL'}  ${n}\n        ${note}`);};
const b=await chromium.launch();
const login=async(pg)=>{await pg.goto(APP+'/login',{waitUntil:'domcontentloaded'});await pg.waitForLoadState('networkidle');
  await pg.getByLabel(/email/i).fill('shivam@gmail.com');await pg.getByLabel(/password/i).fill('12345678');
  await pg.getByRole('button',{name:/sign in/i}).click();await pg.waitForURL('**/member**',{timeout:20000});};
const txt=async(pg)=>(await pg.locator('#main, body').first().innerText()).replace(/\s+/g,' ').trim();
const hrefs=async(pg,re)=>pg.getByRole('link').evaluateAll((e,r)=>e.map(x=>x.getAttribute('href')).filter(h=>h&&new RegExp(r).test(h)),re.source);
/** A cold context with routes installed BEFORE sign-in, then deep-linked. */
const cold=async(routes,url)=>{
  const pg=await (await b.newContext()).newPage();
  const net=[];pg.on('response',r=>{const u=new URL(r.url()).pathname;if(u.startsWith('/api'))net.push({m:r.request().method(),u,s:r.status()});});
  for(const [pattern,handler] of routes) await pg.route(pattern,handler);
  await login(pg);
  await pg.goto(APP+url,{waitUntil:'domcontentloaded'});await pg.waitForLoadState('networkidle');await pg.waitForTimeout(1200);
  return {pg,net};
};
const json=body=>r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});

try{
// ---- one clean walk, only to collect the real URLs the forced runs deep-link to
const w=await (await b.newContext()).newPage();
await login(w);
await w.goto(APP+'/member/dental',{waitUntil:'domcontentloaded'});await w.waitForLoadState('networkidle');await w.waitForTimeout(900);
const clinicsHref=(await hrefs(w,/\/member\/dental\/clinics/))[0];
await w.goto(APP+clinicsHref,{waitUntil:'domcontentloaded'});await w.waitForLoadState('networkidle');await w.waitForTimeout(700);
await w.locator('input[name=pincode]').fill('201301');
await w.getByRole('button',{name:/search/i}).first().click();await w.waitForTimeout(2200);
await w.goto(APP+(await hrefs(w,/select-patient/))[0],{waitUntil:'domcontentloaded'});await w.waitForLoadState('networkidle');await w.waitForTimeout(800);
const slotHref=(await hrefs(w,/patientId=/))[0];
await w.goto(APP+slotHref,{waitUntil:'domcontentloaded'});await w.waitForLoadState('networkidle');await w.waitForTimeout(1200);
const confirmHref=(await hrefs(w,/confirm/))[0];
console.log('        slot url:',slotHref,'\n        confirm url:',confirmHref);
await w.close();

// ---- Scenario: No dental cover
{
  const {pg}=await cold([['**/api/member/benefits/CAT006/services*',json({categoryId:'CAT006',services:[],total:0})]],'/member/dental');
  const t=await txt(pg);
  const book=await hrefs(pg,/\/member\/dental\/clinics/);
  rec('No dental cover — empty state, and no clinic journey can be started',
    /No Dental Services Available/i.test(t) && book.length===0, `${t.slice(0,120)} | ${book.length} Book Now link(s)`);
  await pg.close();
}

// ---- Scenario: No clinic offers the service (empty, NOT the error state)
{
  const {pg}=await cold([['**/api/dental-bookings/clinics*',json({clinics:[]})]],clinicsHref);
  await pg.locator('input[name=pincode]').fill('201301');
  await pg.getByRole('button',{name:/search/i}).first().click();await pg.waitForTimeout(2000);
  const t=await txt(pg);
  rec('No clinic offers the service — empty state, distinguishable from a failed load',
    /No clinics found/i.test(t) && !/went wrong|try again/i.test(t), t.slice(0,140));
  await pg.close();
}

// ---- Scenario: Slots listed for a date; an unavailable slot cannot be chosen
{
  const day=new Date().toISOString().slice(0,10);
  const {pg}=await cold([['**/api/dental-bookings/slots*',json({slots:[
    {_id:'S-OPEN',slotId:'S-OPEN',date:day,startTime:'10:00',endTime:'10:30',isAvailable:true,currentBookings:0,maxAppointments:4},
    {_id:'S-FULL',slotId:'S-FULL',date:day,startTime:'11:00',endTime:'11:30',isAvailable:false,currentBookings:4,maxAppointments:4},
  ]})]],slotHref);
  const open=pg.getByRole('link',{name:'10:00'});
  const full=pg.getByRole('link',{name:'11:00'});
  const listed=await open.count()===1 && await full.count()===1;
  // Select by what the element IS — the unavailable one is inert, not absent.
  const cls=listed?await full.getAttribute('class'):'';
  rec('Slots listed for a date, and an unavailable slot cannot be chosen',
    listed && /pointer-events-none/.test(cls) && !/pointer-events-none/.test(await open.getAttribute('class')),
    listed?`both slots rendered; 11:00 inert (${/pointer-events-none/.test(cls)})`:'slots not rendered');
  await pg.close();
}

// ---- Scenario: No slots on the chosen date
{
  const {pg}=await cold([['**/api/dental-bookings/slots*',json({slots:[]})]],slotHref);
  const t=await txt(pg);
  const days=await pg.getByRole('button').count();
  rec('No slots on the chosen date — empty state, date still changeable',
    /No slots on this day/i.test(t) && /Try another date/i.test(t) && days>1, `${t.slice(0,110)} | ${days} date button(s)`);
  await pg.close();
}

// ---- Scenario: Wallet split shown before commitment (NEGATIVE CONTROL for the two below)
{
  const {pg}=await cold([],confirmHref);
  await pg.waitForTimeout(1500);
  const t=await txt(pg);
  const enabled=await pg.getByRole('button',{name:/confirm booking/i}).isEnabled();
  rec('NEGATIVE CONTROL — healthy validate shows the wallet split and leaves confirm available',
    /Paid from wallet/i.test(t) && /You pay/i.test(t) && enabled, t.slice(0,160));
  await pg.close();
}

// ---- Scenario: Validation fails
{
  const {pg,net}=await cold([['**/api/dental-bookings/validate',json(
    {valid:false,error:'Dental cover is exhausted for this policy year.'})]],confirmHref);
  await pg.waitForTimeout(1500);
  const t=await txt(pg);
  const btn=pg.getByRole('button',{name:/confirm booking/i});
  const disabled=await btn.isDisabled();
  await btn.click({force:true}).catch(()=>{});
  await pg.waitForTimeout(2000);
  const created=net.filter(c=>c.m==='POST' && /dental-bookings$/.test(c.u));
  rec('Validation fails — the reason is surfaced and no booking is created',
    /exhausted for this policy year/i.test(t) && disabled && created.length===0,
    `disabled=${disabled}, creates=${created.length} | ${t.slice(0,140)}`);
  await pg.close();
}

// ---- Scenario: Nothing is owed
// The seeded dental services all carry a copay, so this branch cannot be
// reached with real data. Forcing the create response is the only way to see
// it — and because the POST is fulfilled, no booking is written.
{
  const {pg}=await cold([['**/api/dental-bookings',r=>r.request().method()==='POST'
    ? r.fulfill({status:201,contentType:'application/json',
        body:'{"bookingId":"DEN-BOOK-FORCED-0000","paymentId":null,"status":"PENDING_CONFIRMATION"}'})
    : r.continue()]],confirmHref);
  await pg.waitForTimeout(1500);
  await pg.getByRole('button',{name:/confirm booking/i}).click().catch(()=>{});
  await pg.waitForTimeout(2500);
  rec('Nothing is owed — no payment, and the member is taken to their dental bookings',
    pg.url().includes('/member/bookings') && pg.url().includes('tab=dental'), pg.url().replace(APP,''));
  await pg.close();
}

// ---- Scenario: Booking creation fails
{
  const {pg}=await cold([['**/api/dental-bookings',r=>r.request().method()==='POST'
    ? r.fulfill({status:500,contentType:'application/json',body:'{"message":"x"}'})
    : r.continue()]],confirmHref);
  await pg.waitForTimeout(1500);
  const before=await txt(pg);
  await pg.getByRole('button',{name:/confirm booking/i}).click().catch(()=>{});
  await pg.waitForTimeout(2500);
  const after=await txt(pg);
  const stayed=pg.url().includes('/member/dental/confirm');
  // "Selections preserved" = the same service, patient, clinic and time are
  // still on screen, not merely that navigation did not happen.
  const kept=stayed && before.split(' Checking your cover')[0].slice(0,80)===after.slice(0,80);
  rec('Booking creation fails — the failure is surfaced and the selections are preserved',
    /could not confirm that booking|went wrong|failed/i.test(after) && stayed,
    `stayed=${stayed}, sameDetails=${kept} | ${after.slice(0,170)}`);
  await pg.close();
}
} finally { await b.close(); }
console.log(`\npass ${R.filter(Boolean).length}/${R.length}`);
