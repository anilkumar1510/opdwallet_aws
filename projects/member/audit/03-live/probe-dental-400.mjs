/** Print the API's own words for the dental create refusal. Read the response,
 *  don't infer it from the render. */
import { chromium } from 'playwright';
const APP='http://localhost:4200';
const b=await chromium.launch();
const p=await (await b.newContext()).newPage();
p.on('response',async r=>{const u=new URL(r.url()).pathname;
  if(u.startsWith('/api')&&r.request().method()==='POST'&&/dental-bookings/.test(u)){
    console.log('NET',r.request().method(),u,r.status());
    console.log('  req:',(r.request().postData()||'').slice(0,300));
    console.log('  res:',(await r.text().catch(()=>'')).slice(0,400));}});
await p.goto(APP+'/login',{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');
await p.getByLabel(/email/i).fill('shivam@gmail.com');await p.getByLabel(/password/i).fill('12345678');
await p.getByRole('button',{name:/sign in/i}).click();await p.waitForURL('**/member**',{timeout:20000});
await p.goto(APP+'/member/dental',{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(1200);
const svc=p.getByRole('link').filter({hasText:/./});
// walk the journey the harness walks
await p.getByRole('link',{name:/book|select/i}).first().click().catch(()=>{});
await p.waitForTimeout(1500);
console.log('URL:',p.url());
console.log('WALLET/BALANCE hint:',(await p.locator('body').innerText()).replace(/\s+/g,' ').slice(0,300));
await b.close();
