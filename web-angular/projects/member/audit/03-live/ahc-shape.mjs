import { chromium } from 'playwright';
const APP='http://localhost:4200';
const b=await chromium.launch();
try{
const p=await (await b.newContext()).newPage();
const calls=[];p.on('response',r=>{const u=new URL(r.url()).pathname;if(u.startsWith('/api'))calls.push(`${r.request().method()} ${u} ${r.status()}`);});
const txt=async()=>(await p.locator('#main, body').first().innerText()).replace(/\s+/g,' ').trim();
const go=async u=>{await p.goto(APP+u,{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(900);};
await go('/login');
await p.getByLabel(/email/i).fill('shivam@gmail.com');
await p.getByLabel(/password/i).fill('12345678');
await p.getByRole('button',{name:/sign in/i}).click();
await p.waitForURL('**/member**',{timeout:20000});
for(const r of ['/member/ahc/booking','/member/ahc/booking/diagnostic','/member/ahc/booking/payment']){
  calls.length=0; await go(r);
  const t=await txt();
  const btns=await p.getByRole('button').evaluateAll(e=>e.map(x=>(x.getAttribute('aria-label')||x.innerText).replace(/\s+/g,' ').trim()).filter(Boolean).slice(0,6));
  console.log(`\n=== ${r} ===`);
  console.log('  renders :', t.slice(0,120));
  console.log('  buttons :', btns.join(' | ')||'(none)');
  console.log('  api     :', calls.filter(c=>!/notifications|auth\/me|member\/profile|wallet/.test(c)).join(' | ')||'(none beyond shell)');
}
} finally { await b.close(); }
