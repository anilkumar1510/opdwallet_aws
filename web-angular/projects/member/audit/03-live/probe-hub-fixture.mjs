import { chromium } from 'playwright';
const APP='http://localhost:4200';
const b=await chromium.launch();
const pg=await (await b.newContext()).newPage();
const net=[];pg.on('response',r=>{const u=new URL(r.url()).pathname;if(u.startsWith('/api'))net.push(u+' '+r.status());});
const json=body=>r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
const RX={success:true,data:[
  {prescriptionId:'DIAG-RX-FORCED-UP',status:'UPLOADED',fileName:'pending.pdf',uploadedAt:'2026-08-06T00:00:00.000Z'},
  {prescriptionId:'DIAG-RX-FORCED-DG',status:'DIGITIZED',fileName:'ready.pdf',uploadedAt:'2026-06-22T00:00:00.000Z',cartId:'DIAG-CART-FORCED'}]};
const CARTS={success:true,data:[{cartId:'DIAG-CART-FORCED',prescriptionId:'DIAG-RX-FORCED-DG',patientName:'Shivam Jha',pincode:'201301',status:'CREATED',items:[]}]};
await pg.route('**/api/member/diagnostics/prescriptions*',json(RX));
await pg.route('**/api/member/diagnostics/carts?*',json(CARTS));
await pg.goto(APP+'/login',{waitUntil:'domcontentloaded'});await pg.waitForLoadState('networkidle');
await pg.getByLabel(/email/i).fill('shivam@gmail.com');await pg.getByLabel(/password/i).fill('12345678');
await pg.getByRole('button',{name:/sign in/i}).click();await pg.waitForURL('**/member**',{timeout:20000});
await pg.goto(APP+'/member/diagnostics',{waitUntil:'domcontentloaded'});await pg.waitForLoadState('networkidle');await pg.waitForTimeout(1500);
console.log('--- NET (diagnostics) ---');
console.log(net.filter(u=>u.includes('diagnostics')).join('\n'));
console.log('--- RENDER ---');
console.log((await pg.locator('#main, body').first().innerText()).replace(/\s+/g,' '));
console.log('--- ALL LINKS ---');
console.log(JSON.stringify(await pg.getByRole('link').evaluateAll(e=>e.map(x=>x.getAttribute('href')))));
await b.close();
