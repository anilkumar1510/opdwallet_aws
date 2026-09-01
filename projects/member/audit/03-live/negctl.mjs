import { chromium } from 'playwright';
const APP='http://localhost:4200';
const b=await chromium.launch();
try{
  const p=await (await b.newContext()).newPage();
  await p.goto(APP+'/login',{waitUntil:'domcontentloaded'});
  await p.getByLabel(/email/i).fill('shivam@gmail.com');
  await p.getByLabel(/password/i).fill('12345678');
  await p.getByRole('button',{name:/sign in/i}).click();
  await p.waitForURL('**/member**',{timeout:20000});
  await p.goto(APP+'/member/services',{waitUntil:'domcontentloaded'});
  await p.waitForLoadState('networkidle');
  const hrefs=await p.getByRole('link').evaluateAll(e=>e.map(x=>x.getAttribute('href')));
  console.log('any href to a dropped route?');
  console.log('  /member/reimbursements:', hrefs.includes('/member/reimbursements'));
  console.log('  /member/help          :', hrefs.includes('/member/help'));
  console.log('  /member/notifications :', hrefs.includes('/member/notifications'));
  console.log('\nwhat matched /reimbursement/ by accessible name:');
  const m=await p.getByRole('link',{name:/reimbursement/i}).evaluateAll(e=>e.map(x=>x.getAttribute('href')+' | '+x.innerText.replace(/\s+/g,' ').slice(0,60)));
  m.forEach(x=>console.log('   ',x));
} finally { await b.close(); }
