import { chromium } from 'playwright';
const APP='http://localhost:4200';
const b=await chromium.launch();
try{
const p=await (await b.newContext()).newPage();
p.on('request', r=>{ if(r.url().includes('/api/member/ahc/orders') && r.method()==='POST') console.log('REQUEST BODY:\n'+r.postData()); });
p.on('response', async r=>{ if(r.url().includes('/api/member/ahc/orders') && r.status()>=400) console.log('RESPONSE:\n'+(await r.text()).slice(0,400)); });
const go=async u=>{await p.goto(APP+u,{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(800);};
await go('/login');
await p.getByLabel(/email/i).fill('shivam@gmail.com');
await p.getByLabel(/password/i).fill('12345678');
await p.getByRole('button',{name:/sign in/i}).click();
await p.waitForURL('**/member**',{timeout:20000});
await go('/member/ahc/booking');
await p.getByRole('button',{name:/^Find$/i}).click().catch(()=>{});
await p.waitForTimeout(1800);
await p.getByRole('button',{name:/select and continue/i}).first().click();
await p.waitForTimeout(1500);
await p.getByRole('button',{name:/^Find$/i}).click().catch(()=>{});
await p.waitForTimeout(1800);
await p.getByRole('button',{name:/select and continue/i}).first().click();
await p.waitForTimeout(1800);
await p.getByRole('button',{name:/confirm booking/i}).click();
await p.waitForTimeout(4000);
} finally { await b.close(); }
