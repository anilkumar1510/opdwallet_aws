import { chromium } from 'playwright';
const APP='http://localhost:4200';
const b=await chromium.launch();
try{
const p=await (await b.newContext()).newPage();
const txt=async()=>(await p.locator('body').innerText()).replace(/\s+/g,' ').trim();
await p.goto(APP+'/login',{waitUntil:'domcontentloaded'});
await p.getByLabel(/email/i).fill('shivam@gmail.com');
await p.getByLabel(/password/i).fill('12345678');
await p.getByRole('button',{name:/sign in/i}).click();
await p.waitForURL('**/member**',{timeout:20000});
await p.goto(APP+'/member/wallet',{waitUntil:'domcontentloaded'});
await p.waitForLoadState('networkidle');await p.waitForTimeout(800);
const before=await txt();
console.log('POSITIVE CONTROL — wallet renders while authenticated:', /AVAILABLE BALANCE|₹/.test(before));

// idle past the 60s token; sample what the member sees in the gap
let sawFalseEmpty=false, sawSpinner=false, landed='';
for(let i=0;i<26;i++){
  await p.waitForTimeout(5000);
  const t=await txt();
  if(/no wallet for this member|no claims yet|you have no/i.test(t)) sawFalseEmpty=true;
  if(/loading/i.test(t) && !p.url().includes('/login')) sawSpinner=true;
  if(p.url().includes('/login')){landed=p.url().replace(APP,'');break;}
}
console.log('redirected to login          :', landed||'(did not redirect)');
console.log('false empty state seen in gap:', sawFalseEmpty);
console.log('spinner seen in gap          :', sawSpinner);
const after=await txt();
console.log('login screen rendered        :', /sign in/i.test(after));
} finally { await b.close(); }
