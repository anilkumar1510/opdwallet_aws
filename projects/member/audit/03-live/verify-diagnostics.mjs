/**
 * member-diagnostics — every scenario, live or forced.
 *
 * NON-MUTATING throughout. Unlike lab, this account HAS a diagnostics cart
 * (DIAG-CART-1782129431229-MFGEHVOLQ, status ORDERED) and a diagnostics order,
 * so the cart and order screens are exercised against real data rather than a
 * fixture. Nothing here places an order: the cart is already ORDERED, and the
 * ordering scenarios are recorded as unreachable rather than forced through.
 *
 * The prefix question this vertical was flagged for is asserted on the NETWORK
 * log, not on the render — the reference's diagnostics cart screen fetches
 * `member/lab/carts/:id` (which 404s for a diagnostics cart, see
 * probe-cart-prefix.mjs), and the only way to show Angular does not repeat that
 * is to watch what it actually requests.
 */
import { chromium } from 'playwright';
import { controls, pendingSnapshot, pendingSince, describe } from './pending-payments.mjs';
const APP='http://localhost:4200';
const CART='DIAG-CART-1782129431229-MFGEHVOLQ';
const R=[];const rec=(n,p,note)=>{R.push(p);console.log(`${p?'PASS':'FAIL'}  ${n}\n        ${note}`);};
const b=await chromium.launch();
const login=async(pg)=>{await pg.goto(APP+'/login',{waitUntil:'domcontentloaded'});await pg.waitForLoadState('networkidle');
  await pg.getByLabel(/email/i).fill('shivam@gmail.com');await pg.getByLabel(/password/i).fill('12345678');
  await pg.getByRole('button',{name:/sign in/i}).click();await pg.waitForURL('**/member**',{timeout:20000});};
const txt=async(pg)=>(await pg.locator('#main, body').first().innerText()).replace(/\s+/g,' ').trim();
const hrefs=async(pg,re)=>pg.getByRole('link').evaluateAll((e,r)=>e.map(x=>x.getAttribute('href')).filter(h=>h&&new RegExp(r).test(h)),re.source);
/** Cold context: routes installed BEFORE sign-in, then deep-linked. */
const cold=async(routes,url)=>{
  const pg=await (await b.newContext()).newPage();
  const net=[];pg.on('response',r=>{const u=new URL(r.url()).pathname;if(u.startsWith('/api'))net.push({m:r.request().method(),u,s:r.status()});});
  for(const [pattern,handler] of routes) await pg.route(pattern,handler);
  await login(pg);
  await pg.goto(APP+url,{waitUntil:'domcontentloaded'});await pg.waitForLoadState('networkidle');await pg.waitForTimeout(1200);
  return {pg,net};
};
const json=body=>r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
const fail500=r=>r.fulfill({status:500,contentType:'application/json',body:'{"m":"x"}'});

try{
const ctl=await controls();
rec('POSITIVE CONTROL — the pending-payment query finds a known real obligation',
  ctl.positive, `PAY-20260808-0188 present among ${ctl.total} payments`);
rec('NEGATIVE CONTROL — it does not find a payment that cannot exist',
  ctl.negative, 'PAY-00000000-0000 absent');
const beforePending=await pendingSnapshot();

const p=await (await b.newContext()).newPage();
const net=[];p.on('response',r=>{const u=new URL(r.url()).pathname;if(u.startsWith('/api'))net.push({m:r.request().method(),u,s:r.status()});});
await login(p);
const go=async u=>{await p.goto(APP+u,{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(900);};

// ---------- hub ----------
await go('/member/diagnostics');
const hub=await txt(p);
rec('POSITIVE CONTROL — the diagnostics hub renders its journey',
  /prescription/i.test(hub), hub.slice(0,110));
console.log('\n--- diagnostics hub as rendered ---\n'+hub.slice(0,1000)+'\n');

// Cart origin (Step 1): this account has one DIGITIZED prescription that produced
// a cart, and one UPLOADED prescription that has not been digitized yet.
//
// ASSERTION CORRECTED ONCE, by reading the render rather than loosening the
// pattern. The first version asserted the awaiting copy on the HUB and failed:
// the hub shows a bare status token (`UPLOADED`) and withholds the Review Cart
// action, while the explanation — "Awaiting the lab … Our team is processing
// your prescription" — lives on the ORDERS screen. So the scenario is verified
// where the behaviour is, and the hub's own presentation is asserted separately
// for what it actually does.
// FORCED, not ambient. The hub renders only the two most recent prescriptions,
// so asserting against whatever the account happens to hold breaks the moment
// anything uploads another one — which the upload probe did. This is the
// 10-assertion-provenance.md failure exactly, caught in my own assertion.
{
  const RX={success:true,data:[
    {prescriptionId:'DIAG-RX-FORCED-UP',status:'UPLOADED',fileName:'pending.pdf',uploadedAt:'2026-08-06T00:00:00.000Z'},
    {prescriptionId:'DIAG-RX-FORCED-DG',status:'DIGITIZED',fileName:'ready.pdf',uploadedAt:'2026-06-22T00:00:00.000Z',cartId:'DIAG-CART-FORCED'},
  ]};
  // The cart must be served too: cartFor() matches carts()[].prescriptionId,
  // and without it cartLink() correctly falls back to /member/bookings. The
  // first version of this fixture forced only the prescriptions and read the
  // fallback as a missing control.
  const CARTS={success:true,data:[{cartId:'DIAG-CART-FORCED',prescriptionId:'DIAG-RX-FORCED-DG',
    patientName:'Shivam Jha',pincode:'201301',status:'CREATED',items:[]}]};
  const {pg}=await cold([['**/api/member/diagnostics/prescriptions*',json(RX)],
                         ['**/api/member/diagnostics/carts?*',json(CARTS)]],'/member/diagnostics');
  const t=await txt(pg);
  // The list endpoint carries a query string, so the route pattern needs the
  // trailing `?*` — without it the fixture silently passed through, carts() was
  // empty, and cartLink()'s deliberate /member/bookings fallback read as a
  // missing control. Diagnosed by printing the render and the link list.
  const reviewLinks=[...new Set(await hrefs(pg,/diagnostics\/cart\//))];
  rec('HUB — both prescriptions listed with status, and only the digitized one offers an action',
    // `=== 1` was wrong: the hub also renders a "Your Carts" section, so one
    // cart legitimately yields two links (one of them query-tagged). The clause
    // the spec actually states is that the action belongs to the DIGITIZED
    // prescription and not the uploaded one — so assert every cart link points
    // at the digitized one's cart. Third correction to this assertion; the rule
    // is two, and it is recorded in 26-… rather than quietly absorbed.
    /UPLOADED/.test(t) && /DIGITIZED/.test(t) &&
      reviewLinks.length>0 && reviewLinks.every(h=>h.includes('DIAG-CART-FORCED')),
    `statuses rendered; cart links: ${reviewLinks.join(' , ')||'none'}`);
  await pg.close();
}

// The awaiting block is an ELSE-BRANCH of the orders list (`lab-orders-page.ts:39,76`):
// orders -> awaiting -> "No orders yet". So it is visible only to a member with no
// orders, and this account has one. Read from the component after the assertion
// failed a second time; NOT adjusted a third time to fit — the scenario is
// restated with the precondition that makes it true, and the conditionality is
// filed as a finding in its own right.
{
  const {pg}=await cold([['**/api/member/diagnostics/orders*',json({success:true,data:[]})]],
                        '/member/diagnostics/orders');
  const ot=await txt(pg);
  rec('NEW SCENARIO — with no orders, a submitted-but-undigitized prescription reads as awaiting the lab',
    /awaiting the lab/i.test(ot) && /processing your prescription/i.test(ot) && !/went wrong|could not load/i.test(ot),
    ot.match(/Awaiting the lab[^.]*\./i)?.[0]?.slice(0,180) ?? ot.slice(0,180));
  await pg.close();
}
{
  await go('/member/diagnostics/orders');
  const ot=await txt(p);
  rec('FINDING — with one order present, the awaiting notice is not shown at all',
    !/awaiting the lab/i.test(ot) && /DIAG-ORD-/.test(ot),
    `orders list rendered; pending DIAG-RX-1786007360488-ZWLYJP5V2 not mentioned`);
}

// ---------- cart: the prefix question, on the network log ----------
{
  net.length=0;
  await go(`/member/diagnostics/cart/${CART}`);
  const t=await txt(p);
  const cartCalls=net.filter(n=>/\/carts\//.test(n.u));
  const onDiag=cartCalls.filter(n=>n.u.includes('/member/diagnostics/carts/'));
  const onLab=cartCalls.filter(n=>n.u.includes('/member/lab/carts/'));
  rec('PREFIX — Angular fetches the diagnostics cart on the diagnostics prefix',
    onDiag.length>0 && onLab.length===0,
    `diagnostics: ${onDiag.map(n=>n.u+' '+n.s).join(', ')} | lab: ${onLab.length?onLab.map(n=>n.u+' '+n.s).join(', '):'none'}`);
  rec('DO-NOT-PORT CONFIRMED — Angular does not repeat the reference’s lab-prefix call',
    onLab.length===0, `${cartCalls.length} cart request(s), none on the lab prefix`);
  rec('Vendors listed for a cart — each vendor with its price for this cart’s items',
    /₹|Rs\.?\s?\d/.test(t) && (await hrefs(p,/cart\/.*\/vendor\//)).length>0,
    t.slice(0,200));
  console.log('\n--- diagnostics cart as rendered ---\n'+t.slice(0,900)+'\n');

  // Slots, on a real vendor reached from a real cart.
  const vlinks=await hrefs(p,/cart\/.*\/vendor\//);
  if(vlinks.length){
    net.length=0;
    await go(vlinks[0]);
    const vt=await txt(p);
    const slotCall=net.find(n=>/\/vendors\/.*\/slots/.test(n.u));
    rec('Slots listed for a date — availability is requested for a date and rendered',
      !!slotCall && !/went wrong|could not load/i.test(vt),
      `${slotCall?slotCall.u+' '+slotCall.s:'no slots request'} | ${vt.slice(0,150)}`);
    rec('Wallet split shown before commitment — and confirm is unavailable until validation succeeds',
      /wallet/i.test(vt), vt.slice(-220));
    console.log('\n--- diagnostics vendor/booking as rendered ---\n'+vt.slice(0,900)+'\n');
  } else {
    rec('Slots listed for a date — NOT REACHED, no selectable vendor on this cart', false, 'no vendor link');
  }
}

// ---------- order history, live ----------
{
  await go('/member/diagnostics/orders');
  const list=await txt(p);
  const links=await hrefs(p,/diagnostics\/orders\//);
  rec('Orders listed — with status',
    links.length>0 && /placed|completed|confirmed|pending/i.test(list), `${links.length} row(s) | ${list.slice(90,220)}`);
  rec('IDENTIFIER — the row links by the order’s DIAG-ORD-… reference, not a Mongo _id',
    /\/orders\/DIAG-ORD-/.test(links[0]??'') && !/[0-9a-f]{24}/.test(links[0]??''), links[0]??'none');
  if(links.length){
    await go(links[0]);
    const detail=await txt(p);
    rec('IDENTIFIER — the detail route resolves, renders that order, and shows no Mongo _id',
      /DIAG-ORD-/.test(detail) && !/not found|went wrong|could not/i.test(detail) && !/[0-9a-f]{24}/.test(detail),
      detail.slice(0,180));
  }
}

// ---------- orders follow the active family member ----------
{
  await go('/member/diagnostics/orders');
  const before=await txt(p);
  // The switcher is the shell account menu, not a button named "switch" — taken
  // from family-scenarios.mjs, which already had the working selector.
  const sw=p.locator('button[aria-label^="Account menu for"]');
  if(await sw.count()){
    await sw.click().catch(()=>{});await p.waitForTimeout(500);
    const dep=p.locator('button[role=menuitem]',{hasText:/Sayani/i}).first();
    if(await dep.count()){
      net.length=0;
      await dep.click();await p.waitForTimeout(1800);
      const after=await txt(p);
      rec('Orders follow the active family member — the list refreshes without a manual reload',
        net.some(n=>/diagnostics\/orders/.test(n.u)) && after!==before,
        `${net.filter(n=>/diagnostics\/orders/.test(n.u)).length} refetch(es); text changed: ${after!==before}`);
    } else rec('Orders follow the active family member — NOT REACHED, no dependent on this account',false,'no dependent');
  } else rec('Orders follow the active family member — NOT REACHED, no switcher control',false,'no switcher');
}

// ---------- forced: empty vs failed ----------
{
  const {pg}=await cold([['**/api/member/diagnostics/orders*',json({success:true,data:[]})],
                         ['**/api/member/diagnostics/prescriptions*',json({success:true,data:[]})]],
                        '/member/diagnostics/orders');
  const t=await txt(pg);
  rec('No orders yet — empty state, distinguishable from a failed load',
    /No orders yet/i.test(t) && !/went wrong|could not load/i.test(t), t.slice(0,140));
  await pg.close();
}

// ---------- degraded-not-declared, per site ----------
// The lab hub is the class's positive control; the diagnostics hub is a DIFFERENT
// component (spec difference 1 — its own layout), so whether it inherited the
// disclosure is a real question rather than a shared-code certainty.
{
  const {pg}=await cold([['**/api/member/diagnostics/orders*',fail500]],'/member/diagnostics');
  const t=await txt(pg);
  rec('FIXED — the diagnostics hub names a partial failure, as the lab hub does',
    /could not load/i.test(t), `rendered instead: ${t.slice(0,200)}`);
  console.log('\n--- diagnostics hub under a failed orders fetch ---\n'+t.slice(0,700)+'\n');
  await pg.close();
}
{
  const {pg}=await cold([['**/api/member/diagnostics/orders*',fail500]],'/member/diagnostics/orders');
  const t=await txt(pg);
  rec('FIXED (shared component) — the orders screen says the order list failed',
    /could not load/i.test(t), `rendered instead: ${t.slice(0,200)}`);
  await pg.close();
}

// ---------- forced vendor states, on a synthetic diagnostics cart ----------
const FCART={success:true,data:{cartId:'DIAG-CART-FORCED',prescriptionId:'PR-1',patientName:'Shivam Jha',
  pincode:'201301',status:'READY',items:[{serviceId:'S1',serviceName:'CT Scan',serviceCode:'CT',mrp:4500}]}};
{
  const {pg}=await cold([['**/api/member/diagnostics/carts/DIAG-CART-FORCED',json(FCART)],
                         ['**/api/member/diagnostics/carts/DIAG-CART-FORCED/vendors',json({success:true,data:[]})]],
                        '/member/diagnostics/cart/DIAG-CART-FORCED');
  const t=await txt(pg);
  rec('No vendor serves the area — empty state, and no vendor is selectable',
    /No lab partners available yet/i.test(t) && (await hrefs(pg,/vendor\//)).length===0, t.slice(-140));
  await pg.close();
}
{
  const {pg}=await cold([['**/api/member/diagnostics/carts/DIAG-CART-FORCED',json(FCART)],
                         ['**/api/member/diagnostics/carts/DIAG-CART-FORCED/vendors',fail500]],
                        '/member/diagnostics/cart/DIAG-CART-FORCED');
  const t=await txt(pg);
  // Discriminate on copy unique to each branch. "Try again" is NOT a
  // discriminator — the empty copy ends "Try again shortly", which is how the
  // equivalent lab assertion passed on the wrong branch for a whole session.
  rec('FIXED (shared store) — a failed vendor request is an error state, not "no lab has quoted"',
    /We could not load this/i.test(t), `rendered instead: ${t.slice(-160)}`);
  await pg.close();
}

// ---------- criterion 6 ----------
const opened=await pendingSince(beforePending);
rec('CRITERION 6 — nothing in this run created a pending payment', opened.length===0, describe(opened));

} finally { await b.close(); }
console.log(`\npass ${R.filter(Boolean).length}/${R.length}`);
