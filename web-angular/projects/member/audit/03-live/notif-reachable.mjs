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
  const link=p.getByRole('link',{name:/notifications/i});
  const n=await link.count();
  console.log('services directory has a Notifications link:', n>0);
  if(n){ await link.first().click(); await p.waitForLoadState('networkidle'); await p.waitForTimeout(600);
    console.log('clicking it lands on:', p.url().replace(APP,''));
    const t=(await p.locator('body').innerText()).replace(/\s+/g,' ');
    console.log('page renders:', t.slice(t.indexOf('Notifications'),t.indexOf('Notifications')+90)); }
  // NEGATIVE CONTROL: the two genuinely-absent routes must NOT be linked
  for(const dead of [/reimbursement/i,/^help$/i]){
    await p.goto(APP+'/member/services',{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');
    console.log('NEG CONTROL link for',dead,'present?', await p.getByRole('link',{name:dead}).count()>0);
  }
} finally { await b.close(); }
