// Traces every patient-identifying route input back to what supplies it.
// The census asked "who injects FamilyStore and ignores it". This asks the
// question that missed the online-consult BLOCKER: "who never receives it".
//
// ============================================================================
// READ THIS BEFORE ACTING ON THE OUTPUT — session 44
//
// THIS IS A STRUCTURAL FACT LIST, NOT A DEFECT LIST.
//
// The output flags `online-consult/confirm` as taking a `patientId` route input
// nothing supplies. That is still true and the control still passes correctly —
// but the DEFECT it was written from was fixed in session 25, by resolving the
// patient from FamilyStore instead of from the route. The route legitimately
// does not supply it.
//
// So a row here means "this component takes a patient input the route does not
// fill", which is a fact about wiring. Whether that is a defect depends on
// whether something else supplies the patient. Anyone reading this output as a
// list of broken journeys will chase a bug fixed nineteen sessions ago.
//
// This control DRIFTED rather than expired: it kept passing while its meaning
// changed underneath it. That is the more dangerous of the two failure modes,
// because nothing announces it — an expired control at least goes red. Recorded
// in audit/10-assertion-provenance.md.
// ============================================================================
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

// 1 — components declaring a patient-identifying route input
const consumers = [];
for (const f of files) {
  const s = readFileSync(f, 'utf8');
  const m = [...s.matchAll(/readonly\s+(patientId|memberId)\s*=\s*input<[^>]*>\(([^)]*)\)/g)];
  if (m.length) consumers.push({ file: rel(f), inputs: m.map((x) => ({ name: x[1], dflt: x[2].trim() || '(no default)' })) });
}

// 2 — every routerLink into a patient-bearing route, and whether it passes patientId
const links = [];
for (const f of files) {
  const s = readFileSync(f, 'utf8');
  // Take each [routerLink] and read to the end of its own tag, so queryParams
  // spanning many lines are inside the window. A bounded lookahead with an
  // optional group matched empty and broke the negative control.
  let i = 0;
  for (;;) {
    const at = s.indexOf('[routerLink]=', i);
    if (at === -1) break;
    i = at + 13;
    const close = s.indexOf('>', at);
    const tag = s.slice(at, close === -1 ? at + 800 : close);
    const tm = tag.match(/\[routerLink\]="\[([^\]]*)\]/);
    if (!tm) continue;
    const target = tm[1].replace(/['\s]/g, '');
    if (!/confirm|select-slot|select-patient/.test(target)) continue;
    links.push({ from: rel(f), target, hasPatient: /patientId\s*:/.test(tag) });
  }
}

const posCtl = links.some((l) => l.target.includes('online-consult/confirm') && !l.hasPatient);
const negCtl = links.some((l) => l.target.includes('appointments/select-slot') && l.hasPatient);
console.log('POSITIVE CONTROL  flags online-consult/confirm with no patientId:', posCtl ? 'PASS' : 'FAIL');
console.log('NEGATIVE CONTROL  does NOT flag the IN_CLINIC chain (select-slot carries it):', negCtl ? 'PASS' : 'FAIL');
if (!posCtl || !negCtl) {
  console.log('\nA control failed — this trace is broken, and its output is meaningless rather than clean.');
  process.exit(2);
}

console.log('\n--- components taking a patient route input ---');
for (const c of consumers) for (const i of c.inputs) console.log(`  ${c.file}  ${i.name} default=${i.dflt}`);

console.log('\n--- inbound links into patient-bearing routes ---');
let miss = 0;
for (const l of links.sort((a, b) => a.target.localeCompare(b.target))) {
  const ok = l.hasPatient;
  if (!ok) miss++;
  console.log(`  ${ok ? 'ok  ' : 'MISS'} ${l.target.padEnd(50)} from ${l.from}`);
}
console.log(`\nlinks into patient-bearing routes: ${links.length}  without patientId: ${miss}`);
