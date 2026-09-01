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

const toConfirm=async(mode)=>{
  await go(`/member/${mode}/specialties`);
  await p.getByRole('link',{name:/General Physician/i}).first().click();
  await p.waitForLoadState('networkidle');await p.waitForTimeout(800);
  const hrefs=await p.getByRole('link').evaluateAll(e=>e.map(x=>x.getAttribute('href')).filter(h=>h&&(h.includes('confirm')||h.includes('select-patient'))));
  await p.goto(APP+hrefs[0],{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(900);
};

// ---- ONLINE / NOW
await toConfirm('online-consult');
const f=await txt();
rec('POSITIVE CONTROL — the three inputs render on ONLINE',
  /Contact number/i.test(f) && /Call preference/i.test(f) && /Consult Now/i.test(f) && /Schedule Later/i.test(f),
  'contact number, call preference, NOW/LATER present');
rec('Contact number prefilled from the member record',
  (await p.locator('#contactNumber').inputValue()).length>0, `value "${await p.locator('#contactNumber').inputValue()}"`);
rec('Wallet split shown', /you pay|covered by wallet/i.test(f), 'coverage section rendered');
net.length=0;
await p.getByRole('button',{name:/confirm appointment/i}).click();
await p.waitForTimeout(4500);
const nowCalls=net.filter(c=>/POST \/api\/appointments/.test(c)).join(',');
// NOW synthesises a deterministic slot id — `<doctorId>_ONLINE_<today>_Immediate`,
// exactly as the reference does — so a second run on the same day collides with
// its own earlier booking. A 201 proves terminal state; the API's own
// "already been booked" proves the payload was well-formed and evaluated.
// Anything else is a real failure.
const nowBody=await txt();
const nowOk=/POST \/api\/appointments 201/.test(nowCalls) && p.url().includes('/member/bookings');
const nowCollision=/POST \/api\/appointments 400/.test(nowCalls) && /already been booked/i.test(nowBody);
rec('ONLINE / NOW — TERMINAL STATE (201, or a same-day slot collision)',
  nowOk || nowCollision,
  nowOk ? `${nowCalls} | url ${p.url().replace(APP,'')}`
        : `${nowCalls} | collision on a repeat run: ${nowCollision}`);
const list=await txt();
rec('Booking appears in the list', /video consultation|online/i.test(list), list.slice(0,120));

// ---- ONLINE / LATER
await toConfirm('online-consult');
await p.getByRole('button',{name:/schedule later/i}).click();
await p.waitForTimeout(2000);
const dayBtns=p.locator('button').filter({hasText:/^\d{4}-\d{2}-\d{2}$/});
if(await dayBtns.count()){await dayBtns.last().click();await p.waitForTimeout(600);}
const slotBtns=p.locator('button').filter({hasText:/\d{1,2}:\d{2}/});
const haveSlots=await slotBtns.count()>0;
if(haveSlots){await slotBtns.last().click();await p.waitForTimeout(400);}
rec('LATER offers real slots for the doctor', haveSlots, haveSlots?`${await slotBtns.count()} slot buttons`:'no slots returned for this doctor');
if(haveSlots){
  net.length=0;
  await p.getByRole('button',{name:/confirm appointment/i}).click();
  await p.waitForTimeout(4500);
  const c=net.filter(x=>/POST \/api\/appointments/.test(x)).join(',');
  rec('ONLINE / LATER — TERMINAL STATE: appointment created and navigated',
    /POST \/api\/appointments 201/.test(c) && p.url().includes('/member/bookings'),
    `${c||'no POST'} | url ${p.url().replace(APP,'')}`);
}

// ---- NEGATIVE CONTROL: contact number required
await toConfirm('online-consult');
await p.locator('#contactNumber').fill('');
await p.waitForTimeout(300);
net.length=0;
await p.getByRole('button',{name:/confirm appointment/i}).click();
await p.waitForTimeout(1500);
const blocked=await txt();
rec('NEGATIVE CONTROL — empty contact number blocks, with a message, no request',
  /Enter a contact number/i.test(blocked) && !net.some(c=>/POST \/api\/appointments/.test(c)),
  `guard message: ${/Enter a contact number/i.test(blocked)} | POSTs: ${net.filter(c=>/POST/.test(c)).length}`);

// ---- REGRESSION: IN_CLINIC still books
await toConfirm('appointments');
if(p.url().includes('select-patient')){
  const ph=await p.getByRole('link').evaluateAll(e=>e.map(x=>x.getAttribute('href')).filter(h=>h&&h.includes('patientId=')));
  await p.goto(APP+ph[0],{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(900);
  const sl=await p.getByRole('link').evaluateAll(e=>e.map(x=>x.getAttribute('href')).filter(h=>h&&h.includes('confirm')));
  if(sl.length){await p.goto(APP+sl[sl.length-1],{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(1200);}
}
const ic=await txt();
console.log('        [in-clinic confirm url]', p.url().replace(APP,''));
rec('IN_CLINIC unchanged — no ONLINE form leaked onto it', !/Call preference/i.test(ic), 'contact/call-preference absent on in-clinic');
net.length=0;
await p.getByRole('button',{name:/confirm appointment/i}).click();
await p.waitForTimeout(4500);
rec('IN_CLINIC — TERMINAL STATE still works',
  net.some(c=>/POST \/api\/appointments 201/.test(c)) && p.url().includes('/member/bookings'),
  net.filter(c=>/POST/.test(c)).join(',')||'no POST');
} finally { await b.close(); }
console.log(`\npass ${R.filter(Boolean).length}/${R.length}`);
