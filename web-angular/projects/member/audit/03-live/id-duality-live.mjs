import { chromium } from 'playwright';
const APP='http://localhost:4200';
const b=await chromium.launch();
try{
const p=await (await b.newContext()).newPage();
const bad=[];p.on('response',r=>{const u=new URL(r.url()).pathname;if(u.startsWith('/api')&&r.status()>=400)bad.push(`${r.status()} ${u}`);});
const txt=async()=>(await p.locator('body').innerText()).replace(/\s+/g,' ').trim();
await p.goto(APP+'/login',{waitUntil:'domcontentloaded'});
await p.getByLabel(/email/i).fill('shivam@gmail.com');
await p.getByLabel(/password/i).fill('12345678');
await p.getByRole('button',{name:/sign in/i}).click();
await p.waitForURL('**/member**',{timeout:20000});

// POSITIVE CONTROL: the fixed claims path must now render the claim.
await p.goto(APP+'/member/claims',{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(900);
const first=p.getByRole('link',{name:/view|details|CLM/i});
if(await first.count()){bad.length=0;await first.first().click();await p.waitForLoadState('networkidle');await p.waitForTimeout(1500);
  const t=await txt();
  console.log('POSITIVE CONTROL claim detail ->',p.url().replace(APP,''));
  console.log('   renders the claim (not "not found"):', !/not found/i.test(t), '| errors:', bad.join(',')||'none');}
else console.log('POSITIVE CONTROL: no claim link found');

// The three other business-id navigations
for(const [label,list,linkRe] of [
  ['lab order','/member/lab-tests/orders',/ORD-|view|detail/i],
  ['transaction','/member/orders',/TXN|view|detail/i],
]){
  await p.goto(APP+list,{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(1000);
  const l=p.getByRole('link',{name:linkRe});
  if(!(await l.count())){console.log(`${label}: no rows to open`);continue;}
  bad.length=0;await l.first().click();await p.waitForLoadState('networkidle');await p.waitForTimeout(1500);
  const t=await txt();
  console.log(`${label} detail -> ${p.url().replace(APP,'').split('?')[0]}`);
  console.log('   not-found/error text:', /not found|could not/i.test(t), '| api errors:', bad.join(',')||'none');
}
} finally { await b.close(); }
