/**
 * Detector 3 — a declared endpoint with zero callers.
 *
 * The other two detectors in this audit cannot see this shape:
 *   - the write sweep counts writes per feature, so `lab` looks healthy at 3
 *   - terminal-state verification only reaches a control a scenario drives
 *
 * Both known instances were found by accident while reading something else:
 * `AHC_API.orders` (session 22) and `LAB_API[kind].submitExisting` (session 35).
 * Both are the same failure — the UI kept the affordance and the wiring never
 * landed.
 *
 * Method: pull every plain-identifier key out of each `export const *_API = {…}`
 * in core/, then look for `.key` anywhere in src/ outside the file that declares
 * it. Computed keys (`[LabKind.Lab]:`) are branch selectors, not endpoints, and
 * are skipped.
 *
 * The rule is deliberately conservative — a bare `.key` search over-counts uses
 * (`store.orders()` looks like `API.orders`), so it can MISS a dead endpoint but
 * will not invent one. Every flag it does raise is real. The positive control is
 * what proves it is still sensitive enough to be worth running.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC = new URL('../src', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const CORE = join(SRC, 'app', 'core');

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : full.endsWith('.ts') ? [full] : [];
  });

const files = walk(SRC);
const source = new Map(files.map((f) => [f, readFileSync(f, 'utf8')]));

/** The `{ … }` following `export const NAME_API =`, brace-matched. */
function apiBlocks(text) {
  const out = [];
  const re = /export const ([A-Z0-9_]*_API)\s*=\s*\{/g;
  let m;
  while ((m = re.exec(text))) {
    let depth = 1;
    let i = re.lastIndex;
    while (i < text.length && depth > 0) {
      if (text[i] === '{') depth++;
      else if (text[i] === '}') depth--;
      i++;
    }
    out.push({ name: m[1], body: text.slice(re.lastIndex, i - 1) });
  }
  return out;
}

const declared = [];
for (const [file, text] of source) {
  if (!file.includes(`${join('app', 'core')}`)) continue;
  for (const { name, body } of apiBlocks(text)) {
    for (const key of new Set([...body.matchAll(/^\s*([a-zA-Z][\w]*)\s*:/gm)].map((k) => k[1]))) {
      declared.push({ map: name, key, file });
    }
  }
}

// Group by key: the same endpoint name under two branches (LAB / DIAGNOSTIC) is
// one endpoint for this purpose — one live caller redeems both.
const byKey = new Map();
for (const d of declared) {
  const entry = byKey.get(d.key) ?? { key: d.key, maps: new Set(), files: new Set() };
  entry.maps.add(d.map);
  entry.files.add(d.file);
  byKey.set(d.key, entry);
}

const usesOutside = (key, ownFiles) => {
  const re = new RegExp(`\\.${key}\\b|\\['${key}'\\]`);
  return files.filter((f) => !ownFiles.has(f) && re.test(source.get(f)));
};

const dead = [];
const sameFileOnly = [];
for (const entry of byKey.values()) {
  const outside = usesOutside(entry.key, entry.files);
  if (outside.length) continue;
  // Used only within its own declaring file, or nowhere at all.
  //
  // The line that DECLARES this key is `<key>:` at the start of the line, and
  // only that line. An earlier version excluded every `<identifier>:` line,
  // which threw away real uses sitting in an object literal
  // (`downloadPath: RECORDS_API.digitalDownload(id)`) and reported two live
  // endpoints as dead. Exclude the key's own declaration, nothing else.
  const re = new RegExp(`\\.${entry.key}\\b`);
  const decl = new RegExp(`^\\s*${entry.key}\\s*:`);
  const selfUse = [...entry.files].some((f) =>
    source.get(f).split('\n').some((line) => re.test(line) && !decl.test(line)),
  );
  (selfUse ? sameFileOnly : dead).push(entry);
}

const label = (e) => `${[...e.maps].join('/')}.${e.key}`;

console.log('files scanned:', files.length, '| endpoint keys declared:', byKey.size);

// ---- CONTROLS
const isDead = (k) => dead.some((e) => e.key === k);

/**
 * POSITIVE CONTROL — SYNTHETIC, and re-anchored in session 43.
 *
 * It used to assert the scan finds `submitExisting` dead. Session 39 wired that
 * up, so the control began FAILING — the safe direction, but it left the scan
 * with no working positive control, and "9 dead endpoints" is unverified output
 * without one.
 *
 * A control anchored to a specific defect expires the moment the defect is
 * fixed. This one is anchored to the scan's PROPERTY instead: a declared key
 * with no `.key` use anywhere must be flagged. Nothing in the codebase can
 * retire it.
 */
const FIXTURE = `export const FIXTURE_API = {
  liveOne: 'member/fixture/live',
  deadOne: 'member/fixture/dead',
} as const;`;
const fixtureKeys = apiBlocks(FIXTURE).flatMap(({ body }) =>
  [...body.matchAll(/^\s*([a-zA-Z][\w]*)\s*:/gm)].map((m) => m[1]),
);
const fixtureUser = 'const x = API.liveOne;';
const synthDead = fixtureKeys.filter((k) => !new RegExp(`\\.${k}\\b`).test(fixtureUser));
const positive = fixtureKeys.length === 2 && synthDead.length === 1 && synthDead[0] === 'deadOne';

// Kept as a deliberately preserved example, NOT as a control:
// `CLINIC_BOOKING_API.invoice` is declared with no caller and is filed
// not-fixed (`17-renders-but-cannot-complete.md`). If it ever gains a caller the
// scan should stop reporting it — which is a result, not a broken control.
const preserved = isDead('invoice');

const negative = !isDead('orderById') && !isDead('create');
// Second negative control, added after the first run reported two live endpoints
// as dead: a key whose ONLY caller sits in its own declaring file, inside an
// object literal. `digitalDownload` is called at prescription.mapper.ts:57.
const negativeSelf = !isDead('digitalDownload') && !isDead('uploadedDownload');
console.log(
  `${positive ? 'PASS' : 'FAIL'}  POSITIVE CONTROL — flags a synthetic declared-but-uncalled key (property-anchored, cannot expire)`,
);
console.log(
  `        note: CLINIC_BOOKING_API.invoice still ${preserved ? 'reads as dead (deliberately preserved, filed not-fixed)' : 'HAS A CALLER — update 17-…md'}`,
);
console.log(`${negative ? 'PASS' : 'FAIL'}  NEGATIVE CONTROL — does not flag endpoints with live callers (orderById, create)`);
console.log(
  `${negativeSelf ? 'PASS' : 'FAIL'}  NEGATIVE CONTROL — does not flag a key called only inside its declaring file (digitalDownload, uploadedDownload)`,
);

console.log(`\nDECLARED, NEVER CALLED — ${dead.length}`);
for (const e of dead.sort((a, b) => a.key.localeCompare(b.key)))
  console.log(`  ${label(e)}\n      declared in ${[...e.files].map((f) => relative(SRC, f)).join(', ')}`);

if (sameFileOnly.length) {
  console.log(`\nreferenced only inside their own declaring file — review, not necessarily dead:`);
  for (const e of sameFileOnly) console.log(`  ${label(e)}`);
}
