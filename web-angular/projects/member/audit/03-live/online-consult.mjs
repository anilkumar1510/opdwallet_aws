import { chromium } from 'playwright';
const APP='http://localhost:4200';
const b=await chromium.launch();const p=await (await b.newContext()).newPage();
const net=[];p.on('response',r=>{const u=new URL(r.url()).pathname;if(u.startsWith('/api'))net.push(r.request().method()+' '+u+' -> '+r.status());});
const txt=async()=>(await p.locator('body').innerText()).replace(/\s+/g,' ').trim();
await p.goto(`${APP}/login`,{waitUntil:'networkidle'});
await p.fill('#email','shivam@gmail.com');await p.fill('input[type=password]','12345678');
await p.click('button[type=submit]');await p.waitForURL('**/member**');

// CONTROL: in-clinic confirm DOES receive a patientId and should validate.
await p.goto(`${APP}/member/appointments/specialties`,{waitUntil:'networkidle'});await p.waitForTimeout(900);
await p.locator('a,button').filter({hasText:/consult|physician|general|dental|derma|cardio/i}).first().click().catch(()=>{});
await p.waitForTimeout(1200);
console.log('CONTROL in-clinic path reached:', p.url().replace(APP,''));

// SUBJECT: walk the online flow.
await p.goto(`${APP}/member/online-consult/specialties`,{waitUntil:'networkidle'});await p.waitForTimeout(1200);
console.log('\nonline specialties:', (await txt()).slice(0,110));
const spec=p.locator('li a, a[href*="doctors"], button').first();
await spec.click().catch(()=>{});await p.waitForTimeout(1500);
console.log('after specialty tap ->', p.url().replace(APP,'').split('?')[0]);
const doc=p.locator('a[href*="online-consult/confirm"], a').filter({hasText:/book|consult|select/i}).first();
await doc.click().catch(()=>{});await p.waitForTimeout(1800);
const url=p.url().replace(APP,'');
console.log('after doctor tap ->', url.split('?')[0]);
console.log('query carries patientId?', url.includes('patientId='));
const body=await txt();
console.log('\nconfirm screen text:', body.slice(0,300));
console.log('\nwallet split rendered (You pay / Copay)?', /you pay|copay/i.test(body));
net.length=0;
const btn=p.locator('button').filter({hasText:/confirm/i}).first();
console.log('confirm button present:', await btn.count()>0, '| enabled:', await btn.count()?await btn.isEnabled():'n/a');
await btn.click().catch(()=>{});await p.waitForTimeout(2500);
console.log('after clicking confirm -> url:', p.url().replace(APP,'').split('?')[0]);
console.log('API calls made by the click:', net.length?net.join(' | '):'(NONE)');
await b.close();
