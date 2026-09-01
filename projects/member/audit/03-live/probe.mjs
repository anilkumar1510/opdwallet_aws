import { chromium } from 'playwright';
const APP='http://localhost:4200';
const b=await chromium.launch();
try{
  const p=await (await b.newContext()).newPage();
  await p.goto(`${APP}/login`,{waitUntil:'domcontentloaded'});
  await p.getByLabel(/email/i).fill('shivam@gmail.com');
  await p.getByLabel(/password/i).fill('12345678');
  await p.getByRole('button',{name:/sign in/i}).click();
  await p.waitForURL('**/member**',{timeout:20000});
  for(const path of ['/member/online-consult/specialties']){
    await p.goto(`${APP}${path}`,{waitUntil:'domcontentloaded'});
    await p.waitForLoadState('networkidle');
    const links=await p.getByRole('link').evaluateAll(e=>e.slice(0,10).map(x=>`link "${x.innerText.replace(/\s+/g,' ').trim().slice(0,45)}" -> ${x.getAttribute('href')}`));
    const btns=await p.getByRole('button').evaluateAll(e=>e.slice(0,10).map(x=>`button "${(x.getAttribute('aria-label')||x.innerText).replace(/\s+/g,' ').trim().slice(0,45)}"`));
    console.log('=== '+path+' ===');links.forEach(l=>console.log('  ',l));btns.forEach(l=>console.log('  ',l));
  }
} finally { await b.close(); }
