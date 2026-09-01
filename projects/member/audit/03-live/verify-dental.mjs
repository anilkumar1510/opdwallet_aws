/*
 * SESSION 42 — READ THIS BEFORE TRUSTING THE SCORE.
 *
 * This file reports 7/9. It previously reported 14/18. Both numbers are correct
 * and neither is a regression from any fix — the difference is that the CREATE
 * LEG IS NOW UNRUNNABLE.
 *
 *   Cause: CAT006 Dental is at ₹200 of ₹3,000. Each booking debits ₹400, and
 *   this audit placed seven across sessions 33/34/40/41.
 *   dental-bookings.service.ts:316 refuses when walletBalance < walletDebitAmount
 *   ("Scenario C", :602). This is a SPENT ENTITLEMENT, not a defect, and it is
 *   not recoverable in-harness — no selection strategy gets an allowance back.
 *
 *   What still runs: everything up to the create — services, the CAT006/CAT007
 *   negative control, the cold clinic-failure state, the patient picker.
 *
 *   What no longer runs: create, the four continuation assertions, criterion 6.
 *   Their absence from the score is why 9 and not 18.
 *
 *   THE DISCLOSURE FIX IS STILL VERIFIED, separately: it renders off
 *   `booking.outstanding` and the six dental bookings already on the account
 *   exercise it. Session 41's DISCLOSURE assertion passing was real.
 *
 * The 14/18 measurement cannot be reproduced until the allowance is refreshed.
 * That is the first measurement in this audit that is gone rather than stale, and
 * it is recorded rather than quietly replaced. See audit/31-run-budget.md.
 *
 * ---
 *
 * SESSION 50 — THE CONTINUATION IS RULED AND THESE ASSERTIONS ARE RE-AIMED.
 *
 * Built in 34, reverted in 40 for want of a ruling, ruled and reinstated in 50.
 * The four assertions that used to be labelled OPEN DEFECT now assert the
 * behaviour the ruling requires: a booking with an outstanding copay navigates to
 * that payment, the destination names the amount, and settling it leaves nothing
 * unexplained. **Their predicates were never changed** — session 40 relabelled
 * without touching them precisely so this moment would be cheap.
 *
 * WHAT A GREEN RUN HERE MEANS: the member is TAKEN to what they owe, and the
 * amount shown is the payment the journey itself opened.
 *
 * WHAT IT NO LONGER PROVES, and did not before either:
 *   - that anything is COLLECTED. Cancel sits beside Pay on the payment screen and
 *     both use the same redirect. The ruling guarantees the member is told.
 *   - that the bookings list reflects it afterwards. For consultations it cannot
 *     (finding 13); for dental the row does disclose.
 *
 * Criterion 6 is UNCHANGED and must not be weakened: a pending payment the journey
 * navigated the member to is the flow working; one left behind on a screen saying
 * the booking is complete is the defect. The assertion still checks the payment
 * opened is the payment reached.
 *
 * NOTE: the create leg is still unrunnable on a spent CAT006 — see the session-42
 * banner above. These assertions will not execute until the allowance is
 * refreshed. They are re-aimed now so they are correct when it is.
 */
import { chromium } from 'playwright';
import { controls, pendingSnapshot, pendingSince, describe } from './pending-payments.mjs';
const APP='http://localhost:4200';
const R=[];const rec=(n,p,note)=>{R.push(p);console.log(`${p?'PASS':'FAIL'}  ${n}\n        ${note}`);};
const b=await chromium.launch();
const login=async(pg)=>{await pg.goto(APP+'/login',{waitUntil:'domcontentloaded'});await pg.waitForLoadState('networkidle');
  await pg.getByLabel(/email/i).fill('shivam@gmail.com');await pg.getByLabel(/password/i).fill('12345678');
  await pg.getByRole('button',{name:/sign in/i}).click();await pg.waitForURL('**/member**',{timeout:20000});};
const txt=async(pg)=>(await pg.locator('#main, body').first().innerText()).replace(/\s+/g,' ').trim();
try{
const p=await (await b.newContext()).newPage();
const net=[];p.on('response',r=>{const u=new URL(r.url()).pathname;if(u.startsWith('/api'))net.push({m:r.request().method(),u,s:r.status()});});
const go=async u=>{await p.goto(APP+u,{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(900);};
const hrefs=async(re)=>p.getByRole('link').evaluateAll((e,r)=>e.map(x=>x.getAttribute('href')).filter(h=>h&&new RegExp(r).test(h)),re.source);
await login(p);

// Extended criterion 6 — prove the money query works before trusting it.
const ctl=await controls();
rec('POSITIVE CONTROL — the pending-payment query finds a known real obligation',
  ctl.positive, `PAY-20260808-0188 present among ${ctl.total} payments`);
rec('NEGATIVE CONTROL — it does not find a payment that cannot exist',
  ctl.negative, 'PAY-00000000-0000 absent');
const beforePending=await pendingSnapshot();

await go('/member/dental');
const svc=await txt(p);
rec('POSITIVE CONTROL — dental services listed', /₹|dental|clean|filling|consult/i.test(svc), svc.slice(0,100));
rec('NEGATIVE CONTROL — dental is CAT006, not vision\'s CAT007 list',
  !/contact lens|spectacle|frame/i.test(svc), 'no vision-only services on the dental screen');

// COLD forced failure with serviceCode supplied — the vision lesson applied first time
const clinicsHref=(await hrefs(/\/member\/dental\/clinics/))[0];
{
  const cold=await (await b.newContext()).newPage();
  let hit=0;
  await cold.route('**/api/dental-bookings/clinics*',r=>{hit++;return r.fulfill({status:500,contentType:'application/json',body:'{"m":"x"}'});});
  await login(cold);
  await cold.goto(APP+clinicsHref,{waitUntil:'domcontentloaded'});await cold.waitForLoadState('networkidle');await cold.waitForTimeout(700);
  await cold.locator('input[name=pincode]').fill('201301');
  await cold.getByRole('button',{name:/search/i}).first().click();
  await cold.waitForTimeout(2200);
  const t=await txt(cold);
  rec('Interception fired', hit>0, `${hit} request(s)`);
  rec('Clinic list fails to load — error state, distinct from empty (COLD)',
    /could not|went wrong|try again/i.test(t) && !/no clinics/i.test(t), t.slice(0,120));
  await cold.close();
}

// journey
await p.goto(APP+clinicsHref,{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(700);
await p.locator('input[name=pincode]').fill('201301');
await p.getByRole('button',{name:/search/i}).first().click();
await p.waitForTimeout(2200);
let h=await hrefs(/select-patient/);
if(!h.length){rec('Clinics found',false,(await txt(p)).slice(0,120));throw new Error('stop');}
await p.goto(APP+h[0],{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(800);
rec('Active family member marked on the patient picker', /Currently viewing/i.test(await txt(p)), 'marker present');
h=await hrefs(/patientId=/);
await p.goto(APP+h[0],{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(1000);

const slotLinks=await hrefs(/confirm/);
let created=null, attempts=0;
for(const link of slotLinks.slice(0,8)){
  attempts++;
  net.length=0;
  // Clear BEFORE loading the confirm screen: validation runs on load, not on the
  // click, so clearing after the load discards the very call being asserted.
  await p.goto(APP+link,{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(1400);
  await p.getByRole('button',{name:/confirm|book/i}).first().click().catch(()=>{});
  await p.waitForTimeout(4000);
  const post=net.find(c=>c.m==='POST' && /dental-bookings$/.test(c.u));
  if(post && post.s<400){created=post;break;}
  const body=await txt(p);
  if(post && !/already been booked|fully booked|no longer available/i.test(body)){rec('Dental booking refused for a non-collision reason',false,`${post.s} | ${body.slice(0,110)}`);break;}
}
rec('Dental booking created (slot-aware)', Boolean(created), created?`POST dental-bookings ${created.s} after ${attempts} attempt(s)`:'no successful create');

if(created){
  const validated=net.some(c=>/dental-bookings\/validate/.test(c.u));
  rec('Validation ran before creation', validated, validated?'validate called':'no validate call seen in this attempt');

  // ENTRY 5 — booking-first still, and now payment-second. The create is the
  // only booking write; no booking is created by the payment screen.
  const creates=net.filter(c=>c.m==='POST' && /dental-bookings$/.test(c.u));
  rec('ENTRY 5 — the booking was created first, and exactly once',
    creates.length===1, `${creates.length} create call(s)`);
  rec('CONTINUATION — the journey lands on the copay the API created',
    /\/member\/payments\/PAY-/.test(p.url()), p.url().replace(APP,''));

  // The obligation the API created must be the one we were taken to.
  const opened=await pendingSince(beforePending);
  const navigatedTo=decodeURIComponent(p.url().split('/member/payments/')[1]??'');
  rec('CONTINUATION — the new PENDING payment is the one the member was navigated to',
    opened.length===1 && opened[0].paymentId===navigatedTo, `new: ${describe(opened)} | at: ${navigatedTo}`);

  const pay=await txt(p);
  rec('IDENTIFIER — the payment screen renders PAY-…, no Mongo _id',
    new RegExp(navigatedTo).test(pay) && !/[0-9a-f]{24}/.test(pay), pay.slice(0,200));
  // Assert against the amount the API actually recorded, not a literal — the
  // copay follows the service price and a hardcoded figure would rot.
  const owed=opened[0]?.amount;
  rec('CONTINUATION — the destination names the owed amount and offers a way to pay',
    new RegExp(`₹\\s?${owed}`).test(pay) && await p.getByRole('button',{name:/mark as paid/i}).count()===1,
    `owed ₹${owed} | ${pay.slice(0,140)}`);
  console.log('\n--- what actually rendered (payment continuation) ---\n' + pay + '\n');

  // Settle it, so the terminal state is genuinely terminal.
  await p.getByRole('button',{name:/mark as paid/i}).click().catch(()=>{});
  await p.waitForTimeout(3000);
  const settled=await txt(p);
  rec('Paying it clears the obligation', !/mark as paid/i.test(settled), settled.slice(0,140));
  rec('CRITERION 6 — no unexplained PENDING payment remains',
    (await pendingSince(beforePending)).length===0, describe(await pendingSince(beforePending)));

  // ?tab=dental filters the list to dental rows, so the 24-hex check is about
  // dental's own references and cannot be tripped by another vertical's row.
  await go('/member/bookings?tab=dental');
  const list=await txt(p);
  rec('IDENTIFIER — the booking renders DEN-BOOK-…, no Mongo _id',
    /DEN-BOOK-/.test(list) && !/[0-9a-f]{24}/.test(list), list.slice(0,200));
  // DISCLOSURE (session 41) — separate from the continuation, and it PASSES.
  // The journey ends here, so this is where the debt has to be visible. The row
  // used to read "₹1,000 · ₹400 from wallet" whether or not the copay was
  // settled. Distinct assertion from the four above on purpose: the member can
  // now SEE what is owed, and is still not TAKEN anywhere to pay it.
  rec('DISCLOSURE — the bookings row names the amount still owed',
    /still to pay/i.test(list), list.match(/[^.]*still to pay[^.]*/i)?.[0]?.slice(0,120) ?? 'not shown');
  console.log('\n--- what actually rendered (bookings list) ---\n' + list.slice(0,700) + '\n');
}
} finally { await b.close(); }
console.log(`\npass ${R.filter(Boolean).length}/${R.length}`);
