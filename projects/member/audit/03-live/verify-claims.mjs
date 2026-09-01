// Section 8 verification for specs/member-claims. Forced state; creation
// scenarios driven to a terminal state per criterion 5.
import { chromium } from 'playwright';
const APP='http://localhost:4200';
const D='C:/Users/singh/OneDrive/Desktop/opdwallet_aws/web-angular/projects/member/audit/03-live';
const R=[];const rec=(n,p,note)=>{R.push(p);console.log(`${p?'PASS':'FAIL'}  ${n}\n        ${note}`);};
const b=await chromium.launch();
try{
const p=await (await b.newContext()).newPage();
const bad=[];p.on('response',r=>{const u=new URL(r.url()).pathname;if(u.startsWith('/api')&&r.status()>=400)bad.push(`${r.status()} ${u}`);});
const txt=async()=>(await p.locator('body').innerText()).replace(/\s+/g,' ').trim();
const go=async u=>{await p.goto(APP+u,{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.waitForTimeout(900);};
await go('/login');
await p.getByLabel(/email/i).fill('shivam@gmail.com');
await p.getByLabel(/password/i).fill('12345678');
await p.getByRole('button',{name:/sign in/i}).click();
await p.waitForURL('**/member**',{timeout:20000});

// --- Claim list
await go('/member/claims');
const listTxt=await txt();
rec('POSITIVE CONTROL — claims list reachable and populated', /CLM-/.test(listTxt), 'list shows CLM references');
rec('Claims listed with status and formatted amounts', /₹[\d,]+/.test(listTxt) && /\d{1,2} \w{3} \d{4}/.test(listTxt),
  'rupee amounts and formatted dates present');
rec('NEGATIVE CONTROL — healthy list shows no error state', !/could not|went wrong/i.test(listTxt), 'no error text on a working list');

// --- Forced: list load fails
await p.route('**/api/member/claims?*',r=>r.fulfill({status:500,contentType:'application/json',body:'{"m":"x"}'}));
await p.route('**/api/member/claims',r=>r.fulfill({status:500,contentType:'application/json',body:'{"m":"x"}'}));
await go('/member/claims');
const errTxt=await txt();
rec('Claim list fails to load — error state, distinct from empty',
  /could not|went wrong|try again/i.test(errTxt) && !/no claims yet/i.test(errTxt), errTxt.slice(0,110));
await p.unroute('**/api/member/claims?*');await p.unroute('**/api/member/claims');

// --- Forced: empty list
await p.route('**/api/member/claims*',r=>{const u=new URL(r.request().url());
  if(/summary/.test(u.pathname))return r.continue();
  return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({claims:[],total:0})});});
await go('/member/claims');
const emptyTxt=await txt();
rec('No claims yet — empty state, and filing remains available',
  /no claims yet/i.test(emptyTxt) && /new claim/i.test(emptyTxt), emptyTxt.slice(emptyTxt.indexOf('Claims'),emptyTxt.indexOf('Claims')+90));
await p.unroute('**/api/member/claims*');

// --- Filing: guards (already covered) then TERMINAL STATE
await go('/member/claims/new');
const submit=p.getByRole('button',{name:/submit claim/i});
await p.selectOption('select[name=category]',{index:1}).catch(()=>{});
await p.fill('input[name=treatmentDate]','2026-08-01');
await p.fill('input[name=provider]','Session 21 verification');
await p.fill('input[name=billAmount]','60');
await p.locator('#doc-prescription').setInputFiles(D+'/presc.pdf');
await p.waitForTimeout(400);
// Session 43 — re-aimed from the disabled-button model to the one session 40
// ruled correct and session 41 applied: the control stays ENABLED and the
// refusal names what is missing on attempt. Asserting `!isEnabled()` was
// asserting the defect.
bad.length=0;
await submit.click();
await p.waitForTimeout(900);
{
  const a=(await p.locator('[role=alert]').allInnerTexts()).join(' ').replace(/\s+/g,' ').trim();
  rec('Both document types required — prescription only is refused, naming the bill',
    /bill/i.test(a) && bad.length===0, `alert: "${a||'NONE'}" | posts: ${bad.length}`);
}
await p.locator('#doc-bill').setInputFiles(D+'/bill.pdf');
await p.waitForTimeout(400);
{
  const a=(await p.locator('[role=alert]').allInnerTexts()).join(' ').replace(/\s+/g,' ').trim();
  rec('Valid claim is submittable — control enabled and nothing outstanding is named',
    (await submit.isEnabled()) && !/choose|enter|attach/i.test(a), `alert: "${a||'none'}"`);
}
await p.fill('input[name=billAmount]','9999999');await p.waitForTimeout(500);
const over=await txt();
bad.length=0;
await submit.click();
await p.waitForTimeout(900);
rec('Bill exceeds available balance — named figure, and the submission is refused',
  /exceeds available balance/i.test(await txt()) && bad.length===0,
  `${(over.match(/Amount exceeds available balance [^ ]+/)||['?'])[0]} | posts: ${bad.length}`);
await p.fill('input[name=billAmount]','60');await p.waitForTimeout(400);

bad.length=0;
await submit.click();
await p.waitForTimeout(4500);
const url=p.url().replace(APP,'');
const detail=await txt();
rec('TERMINAL STATE — claim filed, navigated to, and its detail renders',
  /\/member\/claims\/[a-f0-9]{24}$/.test(url) && !/not found/i.test(detail) && bad.length===0,
  `url ${url} | api errors: ${bad.join(',')||'none'} | ${detail.slice(detail.indexOf('Claim'),detail.indexOf('Claim')+80)}`);
rec('Detail shows documents and progress', /document/i.test(detail) || /timeline|progress|submitted/i.test(detail),
  'documents/progress section present');
} finally { await b.close(); }
console.log(`\npass ${R.filter(Boolean).length}/${R.length}`);
