/**
 * member-lab — every scenario, live or forced.
 *
 * Mostly non-mutating: every failure state is served by interception. The
 * exception is the ordering leg, which places ONE real lab order — that is the
 * only way to reach a terminal state, and session 38 unblocked it by digitizing
 * a prescription through the ops portal
 * (POST ops/lab/prescriptions/:ref/digitize) rather than seeding a cart.
 *
 * The ordering leg consumes its cart (CREATED -> ORDERED) and the API lists only
 * CREATED/REVIEWED carts, so it is NOT repeatable without another ops digitize.
 * It detects that and says it is skipping, rather than passing on an empty run.
 */
import { chromium } from 'playwright';
import { controls, pendingSnapshot, pendingSince, describe } from './pending-payments.mjs';
import { bookFirstFreeSlot } from './slot-picker.mjs';
const APP='http://localhost:4200';
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

try{
const ctl=await controls();
rec('POSITIVE CONTROL — the pending-payment query finds a known real obligation',
  ctl.positive, `PAY-20260808-0188 present among ${ctl.total} payments`);
rec('NEGATIVE CONTROL — it does not find a payment that cannot exist',
  ctl.negative, 'PAY-00000000-0000 absent');
const beforePending=await pendingSnapshot();

const p=await (await b.newContext()).newPage();
await login(p);
const go=async u=>{await p.goto(APP+u,{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(900);};

// ---- hub renders, and records the cart blocker as observed rather than assumed
await go('/member/lab-tests');
const hub=await txt(p);
rec('POSITIVE CONTROL — the lab hub renders its journey', /prescription/i.test(hub), hub.slice(0,110));
const carts=await hrefs(p,/lab-tests\/cart\//);
// Session 38: the blocker is gone. A cart now exists, created through the ops
// portal (POST ops/lab/prescriptions/:ref/digitize) rather than seeded — the
// route the member journey actually depends on.
//
// NOT REPEATABLE BY DEFAULT, and detected rather than assumed: placing the order
// moves the cart to ORDERED, and the API lists only CREATED/REVIEWED carts, so a
// rerun finds none until ops digitizes another prescription. The ordering leg is
// skipped and SAID to be skipped, never silently passed.
if(carts.length){
  rec('A lab cart exists, so the ordering journey is reachable', true, `${carts.length} cart link(s) on the hub`);
}else{
  // NOT a failure: the previous run consumed the cart, which is the documented
  // property of this leg. Reporting it as FAIL made a working harness look broken.
  console.log('SKIP  the ordering leg — no CREATED cart on this account (the last run consumed it)');
}
console.log('\n--- lab hub as rendered ---\n'+hub.slice(0,900)+'\n');

// ---- "Use a saved one" — session 39 built the action behind it.
// It is a BUTTON now, not a link to /member/health-records, and the defect this
// block used to assert (a labelled control landing somewhere that cannot perform
// the action) is fixed. Behaviour is covered by verify-submission.mjs; all this
// needs to check is that the control is still here and no longer navigates away.
{
  const saved=p.getByRole('button',{name:/use a saved one/i});
  rec('The hub offers "Use a saved one" as an in-place control, not a link away',
    (await saved.count())>0 && (await hrefs(p,/health-records/)).length===0,
    `buttons: ${await saved.count()}; links to health-records: ${(await hrefs(p,/health-records/)).length}`);
}

// ---- Order history: the empty state, forced (this account has no lab orders)
{
  const {pg}=await cold([['**/api/member/lab/orders*',json({success:true,data:[]})],
                         ['**/api/member/lab/prescriptions*',json({success:true,data:[]})]],'/member/lab-tests/orders');
  const t=await txt(pg);
  rec('No orders yet — empty state, distinguishable from a failed load',
    /No orders yet/i.test(t) && !/went wrong|try again/i.test(t), t.slice(0,140));
  await pg.close();
}

// ---- Degradation: the portal keeps the screen rather than blanking it. The
// question each of these asks is whether the member is TOLD it degraded.
// POSITIVE CONTROL first — the hub does say so, so the notice exists and works.
{
  const {pg}=await cold([['**/api/member/lab/orders*',r=>r.fulfill({status:500,contentType:'application/json',body:'{"m":"x"}'})]],
                        '/member/lab-tests');
  const t=await txt(pg);
  rec('POSITIVE CONTROL — the hub names a partial failure',
    /Could not load orders/i.test(t), t.match(/Could not load[^.]*\./)?.[0] ?? t.slice(0,140));
  await pg.close();
}
{
  const {pg}=await cold([['**/api/member/lab/orders*',r=>r.fulfill({status:500,contentType:'application/json',body:'{"m":"x"}'})]],
                        '/member/lab-tests/orders');
  const t=await txt(pg);
  rec('FIXED — the orders screen says the order list failed to load',
    /could not load/i.test(t), `rendered instead: ${t.slice(100,260)}`);
  await pg.close();
}

// ---- Vendor list states, forced on a synthetic cart
const CART={success:true,data:{cartId:'LAB-CART-FORCED',prescriptionId:'PR-1',patientName:'Shivam Jha',
  pincode:'201301',status:'READY',items:[{serviceId:'S1',serviceName:'Lipid Profile',serviceCode:'LIP',mrp:900}]}};
{
  const {pg,net}=await cold([['**/api/member/lab/carts/LAB-CART-FORCED',json(CART)],
                         ['**/api/member/lab/carts/LAB-CART-FORCED/vendors',json({success:true,data:[]})]],
                        '/member/lab-tests/cart/LAB-CART-FORCED');
  const t=await txt(pg);
  // Discriminate on copy unique to each branch. "Try again" is NOT a
  // discriminator — the empty copy says "Try again shortly" too, which is how
  // the failure assertion below was passing on the empty state.
  rec('No vendor serves the area — empty state, and no vendor is selectable',
    /No lab partners available yet/i.test(t) && (await hrefs(pg,/vendor\//)).length===0, t.slice(-120));
  await pg.close();
}
{
  const {pg}=await cold([['**/api/member/lab/carts/LAB-CART-FORCED',json(CART)],
                         ['**/api/member/lab/carts/LAB-CART-FORCED/vendors',r=>r.fulfill({status:500,contentType:'application/json',body:'{"m":"x"}'})]],
                        '/member/lab-tests/cart/LAB-CART-FORCED');
  const t=await txt(pg);
  rec('FIXED — a failed vendor request is an error state, not "no lab has quoted" (COLD)',
    /We could not load this/i.test(t), `rendered instead: ${t.slice(-140)}`);
  await pg.close();
}

// ---- Ordering journey, on the real cart. WRITES: places one lab order.
if(carts.length){
  await go(carts[0]);
  const cartTxt=await txt(p);
  rec('Vendors listed for a cart — each with its price for this cart’s items',
    /₹|Rs\.?\s?\d/.test(cartTxt) && (await hrefs(p,/cart\/.*\/vendor\//)).length>0, cartTxt.slice(0,200));
  console.log('\n--- lab cart as rendered ---\n'+cartTxt.slice(0,700)+'\n');

  const vlinks=await hrefs(p,/cart\/.*\/vendor\//);
  if(vlinks.length){
    await go(vlinks[0]);
    const vt=await txt(p);
    rec('Slots listed for a date, and the wallet split is shown before commitment',
      /slot/i.test(vt) && /wallet/i.test(vt) && !/went wrong|could not load/i.test(vt), vt.slice(-240));

    const before=await pendingSnapshot();
    const slots=p.locator('button').filter({hasText:/\d{2}:\d{2}\s*[–-]\s*\d{2}:\d{2}/});
    const placed=await bookFirstFreeSlot(
      p, slots,
      async()=>{await p.getByRole('button',{name:/confirm booking/i}).first().click().catch(()=>{});},
      async()=>/\/lab-tests\/orders/.test(p.url()) || /LAB-ORD-/.test(await txt(p)),
    );
    rec('Order placed — the journey reaches a terminal state',
      placed.ok, `attempts ${placed.attempts}${placed.reason?': '+placed.reason:''} | url ${p.url()}`);

    if(placed.ok){
      await go('/member/lab-tests/orders');
      const list=await txt(p);
      const links=await hrefs(p,/lab-tests\/orders\//);
      // Lab's business reference is ORD-…, NOT LAB-ORD-… — diagnostics uses
      // DIAG-ORD-… and the spec had been written assuming a symmetric prefix.
      // Read off a real 201: ORD-1786254378495-ZH3O7CYKT.
      rec('Orders listed, and the row links by the ORD-… reference, not a Mongo _id',
        links.length>0 && /\/orders\/ORD-/.test(links[0]) && !/[0-9a-f]{24}/.test(links[0]),
        `${links.length} row(s) | ${links[0]??'none'} | ${list.slice(90,180)}`);
      if(links.length){
        await go(links[0]);
        const d=await txt(p);
        rec('IDENTIFIER (lab’s own leg) — the detail route resolves and shows no Mongo _id',
          /ORD-/.test(d) && !/not found|went wrong|could not/i.test(d) && !/[0-9a-f]{24}/.test(d), d.slice(0,180));
      }
      // Lab's createOrder has no else branch: without paymentAlreadyProcessed
      // there is no wallet debit and no payment record. Checked, not inherited.
      const after=await pendingSince(before);
      rec('CRITERION 6 (ordering leg) — placing a lab order left no unexplained pending payment',
        after.length===0, describe(after));
    }
  } else rec('Ordering journey — NOT REACHED, no selectable vendor on the cart', false, 'no vendor link');
} else {
  console.log('\n  ordering leg SKIPPED — no CREATED cart on this account; digitize another prescription via the ops portal to re-run it\n');
}

// ---- Carried-forward item: lab-orders-page.ts:44 passes order.reference to the
// detail route. Unverifiable on lab (no orders), but the component is shared and
// DIAGNOSTICS has one order — so the same line is exercised there.
{
  await go('/member/diagnostics/orders');
  const list=await txt(p);
  const links=await hrefs(p,/diagnostics\/orders\//);
  rec('POSITIVE CONTROL — a diagnostic order row exists to navigate from',
    links.length>0, `${links.length} row link(s) | ${list.slice(90,200)}`);
  if(links.length){
    rec('lab-orders-page.ts:44 — the row links by business reference, not a Mongo _id',
      /\/orders\/DIAG-ORD-/.test(links[0]) && !/[0-9a-f]{24}/.test(links[0]), links[0]);
    await go(links[0]);
    const detail=await txt(p);
    rec('CLOSES the carried item — the detail route resolves and renders the order',
      /DIAG-ORD-/.test(detail) && !/not found|went wrong|could not/i.test(detail), detail.slice(0,180));
    rec('IDENTIFIER — no Mongo _id reaches the order detail screen',
      !/[0-9a-f]{24}/.test(detail), detail.slice(0,140));
    console.log('\n--- diagnostic order detail as rendered ---\n'+detail.slice(0,600)+'\n');
  }
}

// ---- Criterion 6 across everything above: none of it should touch money.
const opened=await pendingSince(beforePending);
rec('CRITERION 6 — nothing in this run created a pending payment', opened.length===0, describe(opened));

} finally { await b.close(); }
console.log(`\npass ${R.filter(Boolean).length}/${R.length}`);
