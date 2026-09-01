import { chromium } from 'playwright';
const APP='http://localhost:4200';
const b=await chromium.launch();const p=await (await b.newContext()).newPage();
await p.goto(`${APP}/login`,{waitUntil:'networkidle'});
await p.fill('#email','shivam@gmail.com');await p.fill('input[type=password]','12345678');
await p.click('button[type=submit]');await p.waitForURL('**/member**');
await p.goto(`${APP}/member/wallet`,{waitUntil:'networkidle'});await p.waitForTimeout(1200);
const all=(await p.locator('body').innerText()).replace(/\s+/g,' ');
const act=all.slice(all.indexOf('Activity'));
const d=[...act.matchAll(/(\d{1,2} \w{3} \d{4})/g)].map(m=>new Date(m[1]));
let ok=true;for(let i=1;i<d.length;i++) if(d[i]>d[i-1]){ok=false;break;}
console.log('transaction dates (Activity section only):');
console.log(d.map(x=>x.toISOString().slice(0,10)).join(' > '));
console.log('strictly non-increasing (newest first):', ok);
await b.close();
