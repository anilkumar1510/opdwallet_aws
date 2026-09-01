import { chromium } from 'playwright';
import { bookFirstFreeSlot } from './slot-picker.mjs';
import { controls, pendingSnapshot, pendingSince, describe } from './pending-payments.mjs';
const APP='http://localhost:4200';
const R=[];const rec=(n,p,note)=>{R.push(p);console.log(`${p?'PASS':'FAIL'}  ${n}\n        ${note}`);};
const b=await chromium.launch();
try{
const p=await (await b.newContext()).newPage();
const net=[];p.on('response',r=>{const u=new URL(r.url()).pathname;if(u.startsWith('/api'))net.push(`${r.request().method()} ${u} ${r.status()}`);});
const txt=async()=>(await p.locator('#main, body').first().innerText()).replace(/\s+/g,' ').trim();
const go=async u=>{await p.goto(APP+u,{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(800);};
// A commit is accepted when it leaves the confirm screen — either to the
// bookings list, or to the copay the API just created. Both are terminal
// destinations; staying put is the collision case slot-picker.mjs retries.
const booked=async()=>/\/member\/(bookings|payments\/PAY-)/.test(p.url());

/**
 * Extended criterion 6, applied to one commit: whatever pending payment this
 * flow opened must be the one it navigated to, the destination must be able to
 * settle it, and after settling nothing unexplained may remain.
 */
/*
 * SESSION 50 — THE CONTINUATION IS RULED AND THESE ASSERTIONS ARE RE-AIMED.
 *
 * The six assertions that used to be labelled OPEN DEFECT now assert the ruled
 * behaviour: a consultation with an outstanding copay navigates to that payment,
 * the destination names the amount, and settling it leaves nothing unexplained.
 * **No predicate changed** — only the labels, which described a defect that has
 * since been fixed by decision.
 *
 * WHAT A GREEN RUN MEANS: the member is TAKEN to what they owe.
 * WHAT IT DOES NOT PROVE: that anything is collected (Cancel sits beside Pay), or
 * that the bookings list shows it afterwards — for consultations it structurally
 * cannot, because GET appointments/user/:id returns no payment fields at all
 * (inherited finding 13). This ruling addresses disclosure at the moment of
 * booking, not after it.
 *
 * Criterion 6 is UNCHANGED: a pending payment the journey navigated to is the flow
 * working; one left behind is the defect.
 *
 * RUN BUDGET: each run books one CAT001 and one CAT005 consultation. CAT001 had
 * two runs left as of session 42. Do not run this casually.
 */

/** The "You pay total" the confirm screen quotes, read before committing. */
const quotedTotal=async()=>{
  const t=(await p.locator('#main, body').first().innerText()).replace(/\s+/g,' ');
  const m=t.match(/You pay total\s*.?\s?([\d,]+)/i);
  return m ? m[1].replace(/,/g,'') : null;
};

const settle=async(label,before,quoted)=>{
  const opened=await pendingSince(before);
  if(!opened.length){
    rec(`${label} — no payment was owed, so the bookings list is the terminal state`,
      p.url().includes('/member/bookings'), p.url().replace(APP,''));
    return;
  }
  const at=decodeURIComponent(p.url().split('/member/payments/')[1]??'');
  rec(`CONTINUATION — ${label}: navigated to the copay the API created`,
    opened.length===1 && opened[0].paymentId===at, `new: ${describe(opened)} | at: ${at}`);
  const pay=await txt();
  rec(`${label} — IDENTIFIER: the payment screen renders PAY-…, no Mongo _id`,
    new RegExp(at).test(pay) && !/[0-9a-f]{24}/.test(pay), pay.slice(0,150));
  rec(`CONTINUATION — ${label}: the destination names the amount owed and offers to settle it`,
    new RegExp(`₹\\s?${opened[0].amount}`).test(pay) && await p.getByRole('button',{name:/mark as paid/i}).count()===1,
    `owed ₹${opened[0].amount}`);
  // Session 50's stop condition: what the confirm screen quoted must be what the
  // payment screen asks for. Two different figures would mean the member agreed
  // to one number and was billed another.
  rec(`CONTINUATION — ${label}: the amount asked for matches the confirm breakdown`,
    quoted !== null && Number(quoted) === Number(opened[0].amount),
    `confirm quoted ₹${quoted ?? '?'} · payment asks ₹${opened[0].amount}`);
  await p.getByRole('button',{name:/mark as paid/i}).click().catch(()=>{});
  await p.waitForTimeout(3000);
  rec(`CRITERION 6 — ${label}: the payment the journey opened was settled; nothing unexplained remains`,
    (await pendingSince(before)).length===0, describe(await pendingSince(before)));
};

await go('/login');
await p.getByLabel(/email/i).fill('shivam@gmail.com');
await p.getByLabel(/password/i).fill('12345678');
await p.getByRole('button',{name:/sign in/i}).click();
await p.waitForURL('**/member**',{timeout:20000});

// Extended criterion 6 — prove the money query works before trusting it.
const ctl=await controls();
rec('POSITIVE CONTROL — the pending-payment query finds a known real obligation',
  ctl.positive, `PAY-20260808-0188 present among ${ctl.total} payments`);
rec('NEGATIVE CONTROL — it does not find a payment that cannot exist',
  ctl.negative, 'PAY-00000000-0000 absent');

// ---- hubs
for(const [mode,label] of [['appointments','IN_CLINIC'],['online-consult','ONLINE']]){
  await go(`/member/${mode}`);
  const t=await txt();
  rec(`${label} hub lists consultations and offers booking`,
    /book|new/i.test(t) && !/could not|went wrong/i.test(t), t.slice(0,100));
}

// ---- specialties are category-scoped (entry 9 conformance)
await go('/member/appointments/specialties');
const icSpec=await txt();
await go('/member/online-consult/specialties');
const onSpec=await txt();
rec('POSITIVE CONTROL — specialties render for both modes',
  /General Physician/.test(icSpec) && /General Physician/.test(onSpec), 'both lists populated');

// ---- IN_CLINIC end to end, slot-aware
await go('/member/appointments/specialties');
await p.getByRole('link',{name:/General Physician/i}).first().click();
await p.waitForLoadState('networkidle');await p.waitForTimeout(800);
let h=await p.getByRole('link').evaluateAll(e=>e.map(x=>x.getAttribute('href')).filter(x=>x&&x.includes('select-patient')));
await p.goto(APP+h[0],{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(700);
rec('Active family member marked on the patient picker',
  /Currently viewing/i.test(await txt()), 'marker present');
h=await p.getByRole('link').evaluateAll(e=>e.map(x=>x.getAttribute('href')).filter(x=>x&&x.includes('patientId=')));
await p.goto(APP+h[0],{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(900);
const slotLinks=p.getByRole('link').filter({hasNotText:'Skip to content'});
const slotHrefs=await slotLinks.evaluateAll(e=>e.map(x=>x.getAttribute('href')).filter(x=>x&&x.includes('confirm')));
let icOk=false, icNote='', icQuoted=null;
const icBefore=await pendingSnapshot();
for(const href of slotHrefs.slice(0,8)){
  await p.goto(APP+href,{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(1000);
  net.length=0;
  icQuoted=await quotedTotal();
  await p.getByRole('button',{name:/confirm appointment/i}).click();
  await p.waitForTimeout(3800);
  if(await booked()){icOk=true;icNote=net.filter(c=>/POST/.test(c)).join(',');break;}
  icNote=(await txt()).slice(0,80);
}
rec('IN_CLINIC — TERMINAL STATE: booked, navigated, slot-aware retry', icOk, icNote);
if(icOk){
  await settle('IN_CLINIC', icBefore, icQuoted);
  await go('/member/bookings?tab=doctors');
  rec('New appointment appears in the bookings list', /consultation|doctor/i.test(await txt()), (await txt()).slice(0,90));
  // DISCLOSURE — session 41 surfaced the outstanding amount on the bookings row
  // for dental and vision, where the list response carries paymentStatus and
  // totalMemberPayment. It CANNOT be done for consultations: every one of the 27
  // rows from GET appointments/user/:id carries only `consultationFee` — no
  // copay, no paymentStatus, no paymentId (03-live/probe-appt-keys.mjs).
  //
  // Asserted as the current, blocked reality with its cause named, so the gap is
  // in the suite rather than only in a document. Flip this to expect the amount
  // once the API returns it.
  rec('BLOCKED — a consultation row cannot name what is owed; the API omits it from the list',
    !/still to pay/i.test(await txt()),
    'GET appointments/user/:id returns consultationFee only — see audit/20-copay-continuation.md');
}

// ---- ONLINE / LATER, slot-aware
await go('/member/online-consult/specialties');
await p.getByRole('link',{name:/General Physician/i}).first().click();
await p.waitForLoadState('networkidle');await p.waitForTimeout(800);
h=await p.getByRole('link').evaluateAll(e=>e.map(x=>x.getAttribute('href')).filter(x=>x&&x.includes('confirm')));
await p.goto(APP+h[0],{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(1000);
rec('ONLINE confirm collects contact details',
  /Contact number/i.test(await txt()) && (await p.locator('#contactNumber').inputValue()).length>0,
  `prefilled "${await p.locator('#contactNumber').inputValue()}"`);
await p.getByRole('button',{name:/schedule later/i}).click();
await p.waitForTimeout(1800);
const days=p.locator('button').filter({hasText:/^\d{4}-\d{2}-\d{2}$/});
if(await days.count()) {await days.last().click();await p.waitForTimeout(600);}
const slots=p.locator('button').filter({hasText:/\d{1,2}:\d{2}/});
const onBefore=await pendingSnapshot();
let onQuoted=null;
const res=await bookFirstFreeSlot(p, slots,
  async()=>{
    onQuoted=await quotedTotal();
    await p.getByRole('button',{name:/confirm appointment/i}).click();
  }, booked);
rec('ONLINE / LATER — TERMINAL STATE via slot-aware selection', res.ok,
  res.ok?`booked after ${res.attempts} attempt(s)`:`${res.reason}`);
if(res.ok) await settle('ONLINE/LATER', onBefore, onQuoted);

// ---- Scenario: Nothing is owed
// Every seeded consultation carries a copay, so this branch is unreachable with
// real data. The POST is fulfilled rather than sent, so no appointment is
// written and the run stays repeatable.
{
  const fresh=await (await b.newContext()).newPage();
  await fresh.route('**/api/appointments',r=>r.request().method()==='POST'
    ? r.fulfill({status:201,contentType:'application/json',
        body:'{"appointment":{"appointmentId":"APT-FORCED"},"paymentRequired":false,"paymentId":null}'})
    : r.continue());
  await fresh.goto(APP+'/login',{waitUntil:'domcontentloaded'});await fresh.waitForLoadState('networkidle');
  await fresh.getByLabel(/email/i).fill('shivam@gmail.com');await fresh.getByLabel(/password/i).fill('12345678');
  await fresh.getByRole('button',{name:/sign in/i}).click();await fresh.waitForURL('**/member**',{timeout:20000});
  await fresh.goto(APP+'/member/appointments/specialties',{waitUntil:'domcontentloaded'});await fresh.waitForLoadState('networkidle');await fresh.waitForTimeout(800);
  await fresh.getByRole('link',{name:/General Physician/i}).first().click();
  await fresh.waitForLoadState('networkidle');await fresh.waitForTimeout(800);
  let fh=await fresh.getByRole('link').evaluateAll(e=>e.map(x=>x.getAttribute('href')).filter(x=>x&&x.includes('select-patient')));
  await fresh.goto(APP+fh[0],{waitUntil:'domcontentloaded'});await fresh.waitForLoadState('networkidle');await fresh.waitForTimeout(700);
  fh=await fresh.getByRole('link').evaluateAll(e=>e.map(x=>x.getAttribute('href')).filter(x=>x&&x.includes('patientId=')));
  await fresh.goto(APP+fh[0],{waitUntil:'domcontentloaded'});await fresh.waitForLoadState('networkidle');await fresh.waitForTimeout(900);
  fh=await fresh.getByRole('link').evaluateAll(e=>e.map(x=>x.getAttribute('href')).filter(x=>x&&x.includes('confirm')));
  await fresh.goto(APP+fh[0],{waitUntil:'domcontentloaded'});await fresh.waitForLoadState('networkidle');await fresh.waitForTimeout(1200);
  await fresh.getByRole('button',{name:/confirm appointment/i}).click().catch(()=>{});
  await fresh.waitForTimeout(2500);
  rec('Nothing is owed — no payment, and the member is taken to their bookings',
    fresh.url().includes('/member/bookings') && fresh.url().includes('tab=doctors'), fresh.url().replace(APP,''));
  await fresh.close();
}

// ---- NEGATIVE CONTROL
await go('/member/online-consult/specialties');
await p.getByRole('link',{name:/General Physician/i}).first().click();
await p.waitForLoadState('networkidle');await p.waitForTimeout(800);
h=await p.getByRole('link').evaluateAll(e=>e.map(x=>x.getAttribute('href')).filter(x=>x&&x.includes('confirm')));
await p.goto(APP+h[0],{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(1000);
await p.locator('#contactNumber').fill('');
await p.waitForTimeout(300);
net.length=0;
await p.getByRole('button',{name:/confirm appointment/i}).click();
await p.waitForTimeout(1500);
rec('NEGATIVE CONTROL — no contact number blocks, zero POSTs',
  /Enter a contact number/i.test(await txt()) && !net.some(c=>/POST \/api\/appointments/.test(c)),
  `POSTs: ${net.filter(c=>/POST/.test(c)).length}`);
} finally { await b.close(); }
console.log(`\npass ${R.filter(Boolean).length}/${R.length}`);
