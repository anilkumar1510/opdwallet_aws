import { chromium } from 'playwright';
const APP='http://localhost:4200';
const rec=(n,p,note)=>console.log(`${p?'PASS':'FAIL'}  ${n}\n        ${note}`);
const b=await chromium.launch();
const login=async(pg)=>{await pg.goto(APP+'/login',{waitUntil:'domcontentloaded'});await pg.waitForLoadState('networkidle');
  await pg.getByLabel(/email/i).fill('shivam@gmail.com');await pg.getByLabel(/password/i).fill('12345678');
  await pg.getByRole('button',{name:/sign in/i}).click();await pg.waitForURL('**/member**',{timeout:20000});};
const txt=async(pg)=>(await pg.locator('#main, body').first().innerText()).replace(/\s+/g,' ').trim();
try{
// discover the real clinics URL (it carries serviceCode) from the services screen
const warm=await (await b.newContext()).newPage();
await login(warm);
await warm.goto(APP+'/member/vision',{waitUntil:'domcontentloaded'});await warm.waitForLoadState('networkidle');await warm.waitForTimeout(900);
const href=(await warm.getByRole('link').evaluateAll(e=>e.map(x=>x.getAttribute('href')).filter(h=>h&&/\/member\/vision\/clinics/.test(h))))[0];
console.log('        clinics url from the journey:', href);
await warm.close();

// NEGATIVE CONTROL — same url, no interception: must NOT show an error
{
  const ok=await (await b.newContext()).newPage();
  await login(ok);
  await ok.goto(APP+href,{waitUntil:'domcontentloaded'});await ok.waitForLoadState('networkidle');await ok.waitForTimeout(700);
  await ok.locator('input[name=pincode]').fill('201301');
  await ok.getByRole('button',{name:/search/i}).first().click();
  await ok.waitForTimeout(2200);
  const t=await txt(ok);
  rec('NEGATIVE CONTROL — healthy search shows clinics, no error',
    !/could not|went wrong/i.test(t) && /clinic|select/i.test(t), t.slice(0,110));
  await ok.close();
}

// COLD forced failure, with serviceCode present so a request actually fires
{
  const cold=await (await b.newContext()).newPage();
  let hit=0;
  await cold.route('**/api/vision-bookings/clinics*',r=>{hit++;return r.fulfill({status:500,contentType:'application/json',body:'{"m":"x"}'});});
  await login(cold);
  await cold.goto(APP+href,{waitUntil:'domcontentloaded'});await cold.waitForLoadState('networkidle');await cold.waitForTimeout(700);
  await cold.locator('input[name=pincode]').fill('201301');
  await cold.getByRole('button',{name:/search/i}).first().click();
  await cold.waitForTimeout(2200);
  const t=await txt(cold);
  rec('POSITIVE CONTROL — the interception actually fired', hit>0, `${hit} intercepted request(s)`);
  rec('Clinic list fails to load — error state, distinct from empty (COLD)',
    /could not|went wrong|try again/i.test(t) && !/no clinics/i.test(t), t.slice(0,140));
  console.log('\n--- what actually rendered (cold, forced 500) ---\n' + t + '\n');
  await cold.close();
}
} finally { await b.close(); }
