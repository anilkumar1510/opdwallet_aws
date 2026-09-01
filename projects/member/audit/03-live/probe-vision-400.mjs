// One-shot: why does POST vision-bookings answer 400? Prints the response body
// and the whole confirm screen, because the harness note truncates before the
// error paragraph and guessing at 400s cost sessions 27 and 28.
import { chromium } from 'playwright';
const APP='http://localhost:4200';
const b=await chromium.launch();
try{
const p=await (await b.newContext()).newPage();
const bodies=[];
p.on('response',async r=>{const u=new URL(r.url()).pathname;
  if(/vision-bookings/.test(u)) bodies.push(`${r.request().method()} ${u} ${r.status()}  req=${r.request().postData()??''}  res=${await r.text().catch(()=>'?')}`);});
const txt=async()=>(await p.locator('#main, body').first().innerText()).replace(/\s+/g,' ').trim();
const hrefs=async(re)=>p.getByRole('link').evaluateAll((e,r)=>e.map(x=>x.getAttribute('href')).filter(h=>h&&new RegExp(r).test(h)),re.source);
await p.goto(APP+'/login',{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');
await p.getByLabel(/email/i).fill('shivam@gmail.com');await p.getByLabel(/password/i).fill('12345678');
await p.getByRole('button',{name:/sign in/i}).click();await p.waitForURL('**/member**',{timeout:20000});

await p.goto(APP+'/member/vision',{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(900);
await p.goto(APP+(await hrefs(/\/member\/vision\/clinics/))[0],{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(700);
await p.locator('input[name=pincode]').fill('201301');
await p.getByRole('button',{name:/search/i}).first().click();await p.waitForTimeout(2200);
await p.goto(APP+(await hrefs(/select-patient/))[0],{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(800);
await p.goto(APP+(await hrefs(/patientId=/))[0],{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(1200);
const confirms=await hrefs(/confirm/);
console.log('confirm candidates:',confirms.length);
await p.goto(APP+confirms[0],{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(1500);
await p.getByRole('button',{name:/confirm booking/i}).click().catch(()=>{});
await p.waitForTimeout(4000);
console.log('\n--- vision-bookings traffic ---');
for(const line of bodies) console.log(line);
console.log('\n--- screen ---\n'+await txt());
console.log('\nurl:',p.url());
} finally { await b.close(); }
