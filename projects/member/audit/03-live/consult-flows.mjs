// Stable locator strategy: getByRole with accessible names, scoped past the shell
// nav, networkidle settle, browser always closed in finally.
import { chromium } from 'playwright';
const APP='http://localhost:4200';
const log=(...a)=>console.log(...a);
const b=await chromium.launch();
try{
const ctx=await b.newContext();const p=await ctx.newPage();
const net=[];p.on('response',r=>{const u=new URL(r.url()).pathname;if(u.startsWith('/api'))net.push(`${r.request().method()} ${u} ${r.status()}`);});
const txt=async()=>(await p.locator('#main, main, body').first().innerText()).replace(/\s+/g,' ').trim();
const go=async u=>{await p.goto(APP+u,{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(400);};

await go('/login');
await p.getByLabel(/email/i).fill('shivam@gmail.com');
await p.getByLabel(/password/i).fill('12345678');
await p.getByRole('button',{name:/sign in/i}).click();
await p.waitForURL('**/member**',{timeout:20000});

for (const mode of ['appointments','online-consult']) {
  log(`\n########## ${mode.toUpperCase()} ##########`);
  await go(`/member/${mode}/specialties`);
  const spec=p.getByRole('link',{name:/General Physician/i});
  log('1. specialty link present:', await spec.count()>0);
  await spec.first().click(); await p.waitForLoadState('networkidle'); await p.waitForTimeout(700);
  log('   -> ', p.url().replace(APP,'').split('?')[0]);

  // doctors page: take the first link that goes deeper into this flow
  const next=p.getByRole('link').filter({hasNot:p.locator('[href="#main"]')});
  const hrefs=await next.evaluateAll(e=>e.map(x=>x.getAttribute('href')).filter(h=>h&&(h.includes('select-patient')||h.includes('confirm'))));
  log('2. doctor card destinations:', hrefs.slice(0,2));
  log('   carries patientId?', hrefs.some(h=>h.includes('patientId=')));
  if(!hrefs.length){log('   NO onward link found');continue;}
  await p.goto(APP+hrefs[0],{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(900);
  log('3. landed:', p.url().replace(APP,'').split('?')[0]);

  if(p.url().includes('select-patient')){
    const pat=p.getByRole('link').filter({hasText:/Shivam|Sayani/});
    const ph=await pat.evaluateAll(e=>e.map(x=>x.getAttribute('href')));
    log('   patient options:',ph.length,'| first carries patientId?',(ph[0]||'').includes('patientId='));
    await p.goto(APP+ph[0],{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(900);
    log('4. landed:', p.url().replace(APP,'').split('?')[0]);
    const slot=await p.getByRole('link').evaluateAll(e=>e.map(x=>x.getAttribute('href')).filter(h=>h&&h.includes('confirm')));
    if(slot.length){await p.goto(APP+slot[0],{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(1200);}
    log('5. landed:', p.url().replace(APP,'').split('?')[0]);
  }
  const body=await txt();
  log('   confirm URL has patientId?', p.url().includes('patientId='));
  log('   wallet split shown?', /you pay|copay|covered/i.test(body));
  log('   screen:', body.slice(0,180));
  const cbtn=p.getByRole('button',{name:/confirm/i});
  const has=await cbtn.count()>0;
  log('   confirm button:', has?'present':'ABSENT');
  if(has){ net.length=0; await cbtn.first().click(); await p.waitForTimeout(2500);
    log('   after confirm -> url:', p.url().replace(APP,'').split('?')[0]);
    log('   API calls:', net.length?net.join(' | '):'(NONE)'); }
}
} finally { await b.close(); }
