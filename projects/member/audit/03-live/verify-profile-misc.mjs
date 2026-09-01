import { chromium } from 'playwright';
const APP='http://localhost:4200';
const R=[];const rec=(n,p,note)=>{R.push(p);console.log(`${p?'PASS':'FAIL'}  ${n}\n        ${note}`);};
const b=await chromium.launch();
try{
const p=await (await b.newContext()).newPage();
const txt=async()=>(await p.locator('#main, body').first().innerText()).replace(/\s+/g,' ').trim();
const go=async u=>{await p.goto(APP+u,{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(800);};
await go('/login');
await p.getByLabel(/email/i).fill('shivam@gmail.com');
await p.getByLabel(/password/i).fill('12345678');
await p.getByRole('button',{name:/sign in/i}).click();
await p.waitForURL('**/member**',{timeout:20000});

// --- Profile
await go('/member/profile');
const pr=await txt();
rec('POSITIVE CONTROL — profile renders the member',
  /Shivam/i.test(pr) && !/could not|went wrong/i.test(pr), pr.slice(0,110));
rec('Coded values resolved to labels, no raw codes',
  !/REL\d|CAT\d{3}/.test(pr), 'no REL/CAT codes on screen');
// forced: profile fails — needs a COLD context. Intercepting after sign-in does
// nothing, because the store already holds the profile and never re-requests it.
{
  const cold=await (await b.newContext()).newPage();
  await cold.route('**/api/member/addresses*',r=>r.fulfill({status:500,contentType:'application/json',body:'{"m":"x"}'}));
  await cold.goto(APP+'/login',{waitUntil:'domcontentloaded'});await cold.waitForLoadState('networkidle');
  await cold.getByLabel(/email/i).fill('shivam@gmail.com');
  await cold.getByLabel(/password/i).fill('12345678');
  await cold.getByRole('button',{name:/sign in/i}).click();
  await cold.waitForURL('**/member**',{timeout:20000});
  await cold.goto(APP+'/member/profile',{waitUntil:'domcontentloaded'});
  await cold.waitForLoadState('networkidle');await cold.waitForTimeout(1200);
  const pe=(await cold.locator('#main, body').first().innerText()).replace(/\s+/g,' ').trim();
  rec('Member details render from the session; addresses failure is contained',
    /Shivam/i.test(pe) && !/John Doe/i.test(pe), pe.slice(0,130));
  await cold.close();
}

// --- Services directory
await go('/member/services');
const hrefs=await p.getByRole('link').evaluateAll(e=>e.map(x=>x.getAttribute('href')).filter(Boolean));
const dead=['/member/reimbursements','/member/help','/member/providers'].filter(d=>hrefs.includes(d));
rec('Service directory offers no dead destinations', dead.length===0, dead.length?`dead: ${dead}`:'no dead links');
rec('NEGATIVE CONTROL — directory still lists real destinations',
  hrefs.includes('/member/wallet') && hrefs.includes('/member/notifications'),
  `${hrefs.length} links incl. wallet + notifications`);

// --- Placeholders
for(const [route,label] of [['/member/health-checkup','health checkup'],['/member/helpline','helpline'],['/member/pharmacy','pharmacy']]){
  await go(route);
  const t=await txt();
  rec(`Placeholder states unavailability and offers a way back — ${label}`,
    /coming soon|not yet|available soon/i.test(t) && /back|home|dashboard/i.test(t), t.slice(0,90));
}

// --- Settings
await go('/member/settings');
const st=await txt();
rec('Settings render', /setting/i.test(st) && !/could not/i.test(st), st.slice(0,90));
const pw=p.locator('input[type=password]');
rec('Presentational controls claim nothing was saved',
  await pw.count()>0 ? !/saved|updated successfully/i.test(st) : true,
  `${await pw.count()} password field(s); no false save confirmation`);
} finally { await b.close(); }
console.log(`\npass ${R.filter(Boolean).length}/${R.length}`);
