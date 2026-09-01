/**
 * Does BookingsStore re-fetch on in-app navigation, or once per session?
 *
 * api-parity-diff.mjs used page.goto() for every route — a full reload, which
 * boots the Angular app cold and re-instantiates every root store. That would
 * make a once-per-session load look like a per-visit load.
 *
 * Here: ONE page load, then navigate by clicking, counting the booking-source
 * calls each time. Non-mutating.
 */
import { chromium } from 'playwright';
const APP='http://localhost:4200';
const SRC=/appointments\/user\/|dental-bookings\/user\/|vision-bookings\/user\/|member\/(lab|diagnostics)\/(orders|carts|prescriptions)|member\/ahc\/orders/;
const b=await chromium.launch();
const p=await (await b.newContext()).newPage();
let calls=[];
p.on('response',r=>{const u=new URL(r.url()).pathname;if(SRC.test(u))calls.push(u.replace('/api/',''));});

await p.goto(APP+'/login',{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');
await p.getByLabel(/email/i).fill('shivam@gmail.com');await p.getByLabel(/password/i).fill('12345678');
await p.getByRole('button',{name:/sign in/i}).click();await p.waitForURL('**/member**',{timeout:20000});
await p.waitForTimeout(2500);
console.log('after sign-in (home):'.padEnd(42), calls.length, 'booking-source calls');

const hop = async (label, url) => {
  calls=[];
  // In-app navigation: push the route through the router, no reload.
  await p.evaluate((u)=>{history.pushState({},'',u);window.dispatchEvent(new PopStateEvent('popstate'));},url);
  await p.waitForTimeout(2600);
  console.log(`${label.padEnd(42)} ${String(calls.length).padStart(2)}  ${[...new Set(calls)].join(' ')||'—'}`);
};

await hop('nav -> /member/bookings', '/member/bookings');
await hop('nav -> /member/dental', '/member/dental');
await hop('nav -> /member/vision', '/member/vision');
await hop('nav -> /member/appointments', '/member/appointments');
await hop('nav -> /member/dental (again)', '/member/dental');

console.log('\n--- for contrast: a FULL RELOAD of /member/dental ---');
calls=[];
await p.goto(APP+'/member/dental',{waitUntil:'domcontentloaded'});
await p.waitForLoadState('networkidle');await p.waitForTimeout(2600);
console.log('full reload:'.padEnd(42), calls.length, 'booking-source calls');
await b.close();
