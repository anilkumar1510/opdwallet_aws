// Prints actual renders behind absence-based assertions in closed tasks.
import { chromium } from 'playwright';
const APP='http://localhost:4200';
const b=await chromium.launch();
const txt=async p=>(await p.locator('body').innerText()).replace(/\s+/g,' ').trim();
const login=async(p,e,pw)=>{await p.goto(`${APP}/login`,{waitUntil:'networkidle'});
  await p.fill('#email',e);await p.fill('input[type=password]',pw);
  await p.click('button[type=submit]');await p.waitForURL('**/member**');};

// 4.8 "Single member - no switch offered": absence of "Switch profile".
{
  const p=await (await b.newContext()).newPage();
  await login(p,'standard@gmail.com','User@123');
  const before=await txt(p);
  await p.locator('button[aria-label^="Account menu for"]').click();
  await p.waitForTimeout(400);
  const after=await txt(p);
  console.log('--- 4.8 single-member: did the menu ACTUALLY open? ---');
  console.log('menu opened (text changed):', before!==after);
  console.log('menu contains own items    :', /Profile|All Services|Settings|Log Out/.test(after));
  console.log('contains "Switch profile"  :', /Switch profile/i.test(after));
  console.log('menu text:', after.slice(after.indexOf('Wallet')+6, after.indexOf('Wallet')+190));
}
// 3.9 "Signing back in": absence of prior member's data.
{
  const p=await (await b.newContext()).newPage();
  await login(p,'standard@gmail.com','User@123');
  await p.goto(`${APP}/member/wallet`,{waitUntil:'networkidle'});
  await p.waitForTimeout(1200);
  const t=await txt(p);
  console.log('\n--- 3.9 second-session render (must be a REAL loaded screen, not blank) ---');
  console.log('names the new member:', /Standard User/i.test(t));
  console.log('wallet screen loaded:', /Wallet/.test(t));
  console.log('text:', t.slice(t.indexOf('Wallet'), t.indexOf('Wallet')+170));
}
await b.close();
