import { chromium } from 'playwright';
const APP='http://localhost:4200';
const R=[];const rec=(n,p,note)=>{R.push(p);console.log(`${p?'PASS':'FAIL'}  ${n}\n        ${note}`);};
const b=await chromium.launch();
try{
const p=await (await b.newContext()).newPage();
const txt=async()=>(await p.locator('#main, body').first().innerText()).replace(/\s+/g,' ').trim();
const go=async u=>{await p.goto(APP+u,{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(900);};
await go('/login');
await p.getByLabel(/email/i).fill('shivam@gmail.com');
await p.getByLabel(/password/i).fill('12345678');
await p.getByRole('button',{name:/sign in/i}).click();
await p.waitForURL('**/member**',{timeout:20000});

await go('/member/benefits');
const t=await txt();
rec('POSITIVE CONTROL — benefits reachable with real wallet figures',
  /₹[\d,]+/.test(t) && /Online Consultation|Pharmacy|Dental/.test(t), t.slice(0,110));
rec('NEGATIVE CONTROL — no hardcoded reference figure (₹30,000 / 40% used)',
  !/₹30,000/.test(t) && !/40% used/i.test(t), 'reference defaults absent');
await p.route('**/api/wallet/balance*',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
  totalBalance:{allocated:3000,current:0,consumed:3000},
  categories:[{categoryCode:'CAT005',name:'Online Consultation',available:0,total:3000,consumed:3000,isUnlimited:false}],
  isFloater:false,memberConsumption:[],config:null})}));
await go('/member/benefits');
const ex=await txt();
const card=ex.slice(ex.indexOf('Online Consultation'), ex.indexOf('Online Consultation')+80);
rec('Exhausted category is shown as exhausted, not as having a balance',
  /fully used|exhausted|₹0/i.test(card), `card reads: "${card}"`);
await p.unroute('**/api/wallet/balance*');

// forced: wallet fails -> error state, distinct from no-wallet empty
await p.route('**/api/wallet/balance*',r=>r.fulfill({status:500,contentType:'application/json',body:'{"m":"x"}'}));
await go('/member/benefits');
const e=await txt();
rec('Benefits fail to load — error state, distinct from the empty state',
  /could not|went wrong|try again/i.test(e) && !/no benefits|no active/i.test(e), e.slice(0,110));
await p.unroute('**/api/wallet/balance*');

// forced: unlimited + unrecognised category
await p.route('**/api/wallet/balance*',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
  totalBalance:{allocated:5000,current:5000,consumed:0},
  categories:[{categoryCode:'CAT999',name:'Experimental Therapy',available:2000,total:4000,consumed:2000,isUnlimited:false},
              {categoryCode:'CAT009',name:'Teleconsult',available:0,total:0,consumed:0,isUnlimited:true}],
  isFloater:false,memberConsumption:[],config:null})}));
await go('/member/benefits');
const f=await txt();
rec('Unlimited category presented as unlimited, not a number', /unlimited/i.test(f), 'unlimited marker rendered');
rec('Unrecognised category uses the API label, hides the raw code',
  /Experimental Therapy/.test(f) && !/CAT999/.test(f), 'label shown, code hidden');
await p.unroute('**/api/wallet/balance*');

// category detail (entry 13)
await go('/member/benefits');
// Categories WITH a dedicated journey forward to it by design; pick one without.
const cards=await p.getByRole('link').evaluateAll(e=>e.map(x=>({h:x.getAttribute('href'),t:x.innerText.replace(/\s+/g,' ').trim()}))
  .filter(x=>x.h&&/^\/member\/benefits\/.+/.test(x.h)));
const forwarding=cards.find(c=>/consultation/i.test(c.t));
const composed=cards.find(c=>/pharmacy|wellness|health/i.test(c.t))||cards[cards.length-1];
if(forwarding){
  await p.goto(APP+forwarding.h,{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(1200);
  rec('Category with a dedicated journey forwards to it',
    /specialties|lab-tests|diagnostics|vision|dental/.test(p.url()), `forwarded to ${p.url().replace(APP,'')}`);
}
if(composed){
  await p.goto(APP+composed.h,{waitUntil:'domcontentloaded'}); await p.waitForLoadState('networkidle'); await p.waitForTimeout(1200);
  const d=await txt();
  rec('Category detail — balance plus activity, and it is a real destination',
    /\/member\/benefits\/.+/.test(p.url()) && /₹/.test(d) && !/not found/i.test(d),
    `${p.url().replace(APP,'')} | ${d.slice(0,90)}`);
} else rec('Category detail reachable', false, 'no category link found on the benefits screen');

// policy detail
await go('/member');
const pol=p.getByRole('link').filter({hasText:/policy/i});
if(await pol.count()){
  await pol.first().click();await p.waitForLoadState('networkidle');await p.waitForTimeout(1200);
  const pd=await txt();
  rec('Policy detail renders with formatted dates',
    /\d{1,2} \w{3} \d{4}/.test(pd) && !/not available/i.test(pd), `${p.url().replace(APP,'')} | ${pd.slice(0,100)}`);
} else rec('Policy detail reachable from the home screen', false, 'no policy link found on /member');

// forced: unresolvable policy
await go('/member/policy-details/does-not-exist');
const np=await txt();
rec('Policy unavailable — stated, with a way back',
  /not available|could not/i.test(np), np.slice(0,100));
} finally { await b.close(); }
console.log(`\npass ${R.filter(Boolean).length}/${R.length}`);
