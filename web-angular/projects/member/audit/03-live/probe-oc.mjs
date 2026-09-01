import { chromium } from 'playwright';
const APP='http://localhost:4200';
const b=await chromium.launch();const p=await (await b.newContext()).newPage();
await p.goto(`${APP}/login`,{waitUntil:'networkidle'});
await p.fill('#email','shivam@gmail.com');await p.fill('input[type=password]','12345678');
await p.click('button[type=submit]');await p.waitForURL('**/member**');
await p.goto(`${APP}/member/online-consult/specialties`,{waitUntil:'networkidle'});await p.waitForTimeout(1500);
const links=await p.locator('main a, main button').evaluateAll(els=>els.slice(0,12).map(e=>e.tagName+' href='+(e.getAttribute('href')||'-')+' | '+e.innerText.replace(/\s+/g,' ').slice(0,40)));
console.log('SPECIALTIES page controls:');links.forEach(l=>console.log('  ',l));
