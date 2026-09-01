import { chromium } from 'playwright';
const APP='http://localhost:4200';
const D='C:/Users/singh/OneDrive/Desktop/opdwallet_aws/web-angular/projects/member/audit/03-live';
const rec=(n,p,note)=>console.log(`${p?'PASS':'FAIL'}  ${n}\n        ${note}`);
const b=await chromium.launch();
try{
const p=await (await b.newContext()).newPage();
const txt=async()=>(await p.locator('body').innerText()).replace(/\s+/g,' ').trim();
await p.goto(APP+'/login',{waitUntil:'domcontentloaded'});
await p.getByLabel(/email/i).fill('shivam@gmail.com');
await p.getByLabel(/password/i).fill('12345678');
await p.getByRole('button',{name:/sign in/i}).click();
await p.waitForURL('**/member**',{timeout:20000});
await p.goto(APP+'/member/claims/new',{waitUntil:'domcontentloaded'});
await p.waitForLoadState('networkidle');await p.waitForTimeout(1200);

const submit=p.getByRole('button',{name:/submit claim/i});
rec('POSITIVE CONTROL — form reachable, submit button present', await submit.count()>0, 'claims/new rendered');

// fill the non-document fields
await p.selectOption('select[name=category]',{index:1}).catch(()=>{});
await p.fill('input[name=treatmentDate]','2026-08-01').catch(()=>{});
await p.fill('input[name=provider]','Test Clinic').catch(()=>{});
await p.fill('input[name=billAmount]','100');
await p.waitForTimeout(400);
rec('Submit blocked with no documents', !(await submit.isEnabled()), 'disabled before any file');

// prescription only -> must still be blocked (GAP 2)
await p.locator('#doc-prescription').setInputFiles(D+'/presc.pdf');
await p.waitForTimeout(500);
rec('GAP 2 — prescription-only submission refused', !(await submit.isEnabled()),
    'submit still disabled with a prescription but no bill');

// add the bill -> enabled
await p.locator('#doc-bill').setInputFiles(D+'/bill.pdf');
await p.waitForTimeout(500);
const okNow=await submit.isEnabled();
rec('NEGATIVE CONTROL — valid claim is not blocked', okNow, 'submit enabled with both document types and a small amount');
rec('NEGATIVE CONTROL — no balance warning on a valid amount', !/exceeds available balance/i.test(await txt()), 'no false balance error at ₹100');

// huge amount -> balance guard fires, naming the figure (GAP 1)
await p.fill('input[name=billAmount]','9999999');
await p.waitForTimeout(600);
const t=await txt();
const m=t.match(/Amount exceeds available balance[^.]{0,30}/i);
rec('GAP 1 — balance guard fires and names the figure', Boolean(m) && !(await submit.isEnabled()),
    m?`"${m[0].trim()}" and submit disabled`:'no balance message found');
} finally { await b.close(); }
