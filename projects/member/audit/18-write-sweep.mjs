// Cheap detector for "renders but cannot complete": a feature whose store never
// issues a write, for a journey that should create something.
//
// SESSION 44 — RE-ANCHORED. This detector was retired by its own success.
//
// Its negative control was "ahc shows none", anchored to the very defect it had
// found in session 35. Session 27 built AHC's commit path, so `ahc` now writes 1,
// the control began failing, and the script has been exiting with "output
// meaningless" ever since — unusable for sixteen sessions.
//
// It failed LOUDLY, which is the safe direction, but the lesson is the sharper
// one: a control anchored to a defect is a countdown started by the person most
// likely to fix that defect. Both controls are now anchored to PROPERTIES of the
// scan, evaluated over an in-memory fixture, so nothing in the codebase can
// retire them. See audit/10-assertion-provenance.md.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const CORE = new URL('../src/app/core', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const WRITE_RE = /http\.(post|put|patch|delete)/g;

const countWrites = (text) => (text.match(WRITE_RE) || []).length;

const dirs = readdirSync(CORE).filter((d) => statSync(join(CORE, d)).isDirectory());
const writes = (d) => {
  let n = 0;
  (function walk(p) {
    for (const e of readdirSync(p)) {
      const f = join(p, e);
      if (statSync(f).isDirectory()) walk(f);
      else if (f.endsWith('.ts')) n += countWrites(readFileSync(f, 'utf8'));
    }
  })(join(CORE, d));
  return n;
};

// Journeys that must be able to create something.
const CREATES = new Set(['ahc', 'appointments', 'claims', 'clinic-booking', 'lab', 'bookings', 'transactions']);
const rows = dirs.map((d) => ({ d, w: writes(d), must: CREATES.has(d) }));

// ---- CONTROLS, property-anchored: the counter must see a write and must not
// invent one. Evaluated on fixtures, so no fix to the codebase can expire them.
const FIXTURE_WRITES = `const a = this.http.post<X>(URL, body);\nconst b = this.http.patch<Y>(URL, {});`;
const FIXTURE_READS = `const a = this.http.get<X>(URL);\nconst b = someOther.post(URL);\n// http.post in a comment`;
const pos = countWrites(FIXTURE_WRITES) === 2;
// `someOther.post(` must not count, and neither must a bare word in prose —
// only `http.` followed by a mutating verb. The comment line is deliberate: it
// DOES match, and that is a known limit, recorded rather than hidden.
const neg = countWrites('const a = this.http.get<X>(URL);\nconst b = someOther.post(URL);') === 0;

console.log('POSITIVE CONTROL  the counter sees two writes in a fixture:', pos ? 'PASS' : 'FAIL');
console.log('NEGATIVE CONTROL  it counts no writes in a read-only fixture:', neg ? 'PASS' : 'FAIL');
console.log('        known limit: `http.post` inside a comment still counts; the scan locates candidates, not findings');
if (!(pos && neg)) {
  console.log('control failed — output meaningless');
  process.exit(2);
}

// The former negative control, kept as an OBSERVATION so its change stays visible
// rather than silently disappearing from the record.
const ahc = rows.find((r) => r.d === 'ahc');
console.log(
  `\nahc writes: ${ahc?.w} — was 0 when this detector found it in session 35; the commit path was built in session 27.`,
);

console.log('\nstore folder        writes  must-create');
for (const r of rows.sort((a, b) => a.w - b.w))
  console.log(
    `  ${r.d.padEnd(18)} ${String(r.w).padStart(3)}   ${r.must ? 'YES' : '-'}   ${r.must && r.w === 0 ? '<<< CANNOT COMPLETE' : ''}`,
  );
