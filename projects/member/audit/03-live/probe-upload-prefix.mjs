/**
 * Which prefix does each upload route POST to?
 *
 * The component serves both and hardcoded LabKind.Lab, so a diagnostics upload
 * filed a LAB prescription and returned the member to the lab hub. Asserted on
 * the network log, not the render — the form looks identical either way.
 *
 * WRITES: uploads one prescription per route. Accretion, same class as bookings.
 */
import { chromium } from 'playwright';
const APP='http://localhost:4200';
const b=await chromium.launch();
const R=[];const rec=(n,p,note)=>{R.push(p);console.log(`${p?'PASS':'FAIL'}  ${n}\n        ${note}`);};
const p=await (await b.newContext()).newPage();
const posts=[];
p.on('response',r=>{const u=new URL(r.url()).pathname;if(u.startsWith('/api')&&r.request().method()==='POST')posts.push(u+' '+r.status());});
await p.goto(APP+'/login',{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');
await p.getByLabel(/email/i).fill('shivam@gmail.com');await p.getByLabel(/password/i).fill('12345678');
await p.getByRole('button',{name:/sign in/i}).click();await p.waitForURL('**/member**',{timeout:20000});

for (const [route, want, other] of [['diagnostics','/api/member/diagnostics/prescriptions/upload','/api/member/lab/prescriptions/upload'],
                                    ['lab-tests','/api/member/lab/prescriptions/upload','/api/member/diagnostics/prescriptions/upload']]) {
  posts.length=0;
  await p.goto(`${APP}/member/${route}/upload`,{waitUntil:'domcontentloaded'});
  await p.waitForLoadState('networkidle');await p.waitForTimeout(1200);
  await p.locator('input[type=file]').setInputFiles('presc.pdf');
  await p.waitForTimeout(600);
  const addr=p.locator('select#address');
  const opts=await addr.locator('option').evaluateAll(e=>e.map(x=>x.value).filter(Boolean));
  if(opts.length) await addr.selectOption(opts[0]);
  // canSubmit needs file + patient + address + a CHOSEN date (not defaulted).
  await p.locator('input#date').fill('2026-08-01');
  await p.locator('input#date').dispatchEvent('change');
  await p.waitForTimeout(500);
  await p.getByRole('button',{name:/upload prescription/i}).click();
  await p.waitForTimeout(5000);
  const hit=posts.find(x=>x.startsWith(want));
  const wrong=posts.find(x=>x.startsWith(other));
  rec(`/member/${route}/upload POSTs to its own prefix`, !!hit && !wrong, `posts: ${posts.join(' | ')||'none'}`);
  rec(`/member/${route}/upload returns the member to /member/${route}`,
    new RegExp(`/member/${route}$`).test(p.url()), `url ${p.url()}`);
}
await b.close();
console.log(`\npass ${R.filter(Boolean).length}/${R.length}`);
