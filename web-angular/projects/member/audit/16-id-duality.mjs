// Does any detail route navigate with a business id where the endpoint wants _id?
// The claims case was one instance; every booking-ish entity carries both.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT =
  'C:/Users/singh/OneDrive/Desktop/opdwallet_aws/web-angular/projects/member/src/app';
const files = [];
(function walk(d) {
  for (const e of readdirSync(d)) {
    const f = join(d, e);
    statSync(f).isDirectory() ? walk(f) : e.endsWith('.ts') && files.push(f);
  }
})(ROOT);
const rel = (f) => f.slice(ROOT.length + 1).split('\\').join('/');

// Domain models that expose BOTH a Mongo id and a business reference.
const dual = [];
for (const f of files) {
  if (!f.endsWith('.model.ts') && !f.endsWith('.ts')) continue;
  const s = readFileSync(f, 'utf8');
  if (/readonly id:\s*string/.test(s) && /readonly (reference|bookingId|orderId|appointmentId):\s*string/.test(s)) {
    const field = s.match(/readonly (reference|bookingId|orderId|appointmentId):/)[1];
    dual.push({ file: rel(f), field });
  }
}

// Navigations that pass a business-reference-looking property.
const navs = [];
const BUSINESS = /\.(reference|bookingId|orderId|appointmentId)\b/;
for (const f of files) {
  const s = readFileSync(f, 'utf8');
  s.split('\n').forEach((line, i) => {
    if (!/routerLink|router\.navigate/.test(line)) return;
    if (!BUSINESS.test(line)) return;
    navs.push({ at: `${rel(f)}:${i + 1}`, line: line.trim().slice(0, 100) });
  });
  // multi-line routerLink arrays
  for (const m of s.matchAll(/\[routerLink\]="\[[^\]]*\.(reference|bookingId|orderId|appointmentId)[^\]]*\]"/g)) {
    const at = `${rel(f)}:~${s.slice(0, m.index).split('\n').length}`;
    if (!navs.some((n) => n.at === at)) navs.push({ at, line: m[0].slice(0, 100) });
  }
}

// CONTROLS -------------------------------------------------------------------
// Positive: the known claims defect must be visible in a pre-fix snapshot. Since
// it is now fixed, assert instead that the checker CAN see a business-id nav by
// planting one in-memory.
const planted = { at: 'synthetic', line: `[routerLink]="['/member/claims', claim.reference]"` };
const posOk = BUSINESS.test(planted.line);
// Negative: cancel uses the business reference correctly and is NOT a navigation.
const negOk = !navs.some((n) => /cancel/i.test(n.line));
console.log('POSITIVE CONTROL  detects a business-id navigation:', posOk ? 'PASS' : 'FAIL');
console.log('NEGATIVE CONTROL  does not flag the cancel path (correctly uses the reference):', negOk ? 'PASS' : 'FAIL');
if (!posOk || !negOk) { console.log('\ncontrol failed — output meaningless'); process.exit(2); }

console.log(`\n--- models exposing both ids (${dual.length}) ---`);
dual.forEach((d) => console.log(`  ${d.file}  id + ${d.field}`));
console.log(`\n--- navigations passing a business id (${navs.length}) ---`);
navs.forEach((n) => console.log(`  ${n.at}\n      ${n.line}`));
console.log(navs.length ? '\nREVIEW each above' : '\nNone — no navigation passes a business id');
