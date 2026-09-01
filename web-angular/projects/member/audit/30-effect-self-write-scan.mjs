/**
 * Detector 5 — an effect() that writes a signal it also reads.
 *
 * Such an effect re-runs on its own write. When the write is conditional on the
 * signal being empty ("prefill only if unset"), that condition is not a guard:
 * the member clears the field, the effect re-runs, and it puts the value back.
 * The field cannot be emptied.
 *
 * KNOWN INSTANCES:
 *   - ONLINE contact number  (session 25) — fixed by latching on a class field
 *     AND no longer reading contactNumber(), so it is correctly not
 *     self-referential today and this scan does not flag it. Recorded because
 *     an early control asserted the scan *would* find it, which asserted that a
 *     fixed thing stays broken. The control was wrong, not the scan.
 *   - upload patient prefill (session 41) — fixed with a one-shot latch
 *   - upload address prefill (session 41) — fixed with a one-shot latch. This one
 *     let the form UPLOAD a real prescription instead of refusing, because the
 *     address could not be cleared.
 *
 * The session-25 rule was prose describing what went wrong, not something
 * checkable, and it did not prevent the session-41 recurrence. Second time a
 * method rule has failed that way, after the schema rule between AHC and lab.
 * This is the mechanical version.
 *
 * TWO STAGES, because the known instances are already fixed:
 *   stage 1 — effects that read and write the same signal
 *   stage 2 — of those, the ones with no one-shot guard   <- the defects
 *
 * CONTROLS
 *   positive (stage 1) — must find both upload effects
 *   positive (stage 2) — a synthetic unguarded effect must be flagged; without it
 *                        "0 unguarded" is indistinguishable from a broken scan
 *   negative (stage 2) — the two upload effects are guarded now and must not be
 *                        flagged
 *
 * TWO FALSE POSITIVES from the first run, both fixed here and kept on the record:
 *   - an expression-bodied `effect(() => this.store.select(...))` has no block, and
 *     scanning to the next `{` swallowed the FOLLOWING effect, producing a phantom
 *     row at vendor-booking-page.ts:305.
 *   - a read inside `.then()` is not a tracked dependency, so writing what you read
 *     there does not re-trigger. appointment-confirm-page's `laterDate` is that.
 *
 * Static. No writes, no network.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC = new URL('../src', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const NL = String.fromCharCode(10);

const walk = (d) =>
  readdirSync(d).flatMap((n) => {
    const f = join(d, n);
    return statSync(f).isDirectory() ? walk(f) : f.endsWith('.ts') ? [f] : [];
  });

/** Paren- or brace-matched span starting at `open`, which must be `(` or `{`. */
function matchSpan(text, open) {
  const close = text[open] === '{' ? '}' : ')';
  const openCh = text[open];
  let depth = 1;
  let i = open + 1;
  while (i < text.length && depth > 0) {
    if (text[i] === openCh) depth++;
    else if (text[i] === close) depth--;
    i++;
  }
  return { body: text.slice(open + 1, i - 1), end: i };
}

/** Every effect() body, block-bodied or expression-bodied. */
function effectBodies(text) {
  const out = [];
  const re = /\beffect\s*\(/g;
  let m;
  while ((m = re.exec(text))) {
    const line = text.slice(0, m.index).split(NL).length;
    const rest = text.slice(re.lastIndex);
    const arrow = /^\s*\([^)]*\)\s*=>\s*/.exec(rest);
    if (!arrow) continue;
    const at = re.lastIndex + arrow[0].length;
    // Block body starts right here, or the arrow returns an expression that runs
    // to the paren closing `effect(` — never to some later brace.
    const open = text[at] === '{' ? at : re.lastIndex - 1;
    out.push({ body: matchSpan(text, open).body, line });
  }
  return out;
}

/** Spans inside .then()/.catch()/.finally() — reads there are not tracked. */
function asyncSpans(body) {
  const spans = [];
  const re = /\.\s*(?:then|catch|finally)\s*\(/g;
  let m;
  while ((m = re.exec(body))) spans.push([m.index, matchSpan(body, re.lastIndex - 1).end]);
  return spans;
}

function analyse(body) {
  const spans = asyncSpans(body);
  const isAsync = (i) => spans.some(([a, z]) => i >= a && i < z);

  const written = new Set();
  for (const m of body.matchAll(/(?:this\.)?([A-Za-z_]\w*)\s*\.\s*(?:set|update)\s*\(/g)) {
    if (!isAsync(m.index)) written.add(m[1]);
  }
  const read = new Set();
  const readAsync = new Set();
  for (const m of body.matchAll(/(?:this\.)?([A-Za-z_]\w*)\s*\(\s*\)/g)) {
    (isAsync(m.index) ? readAsync : read).add(m[1]);
  }

  const selfWritten = [...written].filter((n) => read.has(n));
  const asyncOnly = [...written].filter((n) => !read.has(n) && readAsync.has(n));

  // A one-shot guard is a NON-signal boolean latched inside the effect, or
  // untracked(). `flag = true` where `flag` is never called as `flag()`.
  const latched = [...body.matchAll(/(?:this\.)?([A-Za-z_]\w*)\s*=\s*true\s*;/g)]
    .map((m) => m[1])
    .filter((n) => !read.has(n));
  const guarded = latched.length > 0 || /\buntracked\s*\(/.test(body);

  return { selfWritten, asyncOnly, guarded, latched };
}

const rows = [];
const asyncRows = [];
for (const file of walk(join(SRC, 'app'))) {
  const text = readFileSync(file, 'utf8');
  if (!text.includes('effect(')) continue;
  for (const { body, line } of effectBodies(text)) {
    const { selfWritten, asyncOnly, guarded, latched } = analyse(body);
    const rel = relative(SRC, file);
    if (selfWritten.length) rows.push({ file: rel, line, signals: selfWritten, guarded, latched });
    if (asyncOnly.length) asyncRows.push({ file: rel, line, signals: asyncOnly });
  }
}

const SYNTHETIC =
  'const active = this.family.activeMember();' +
  NL +
  'if (active && !this.patientId()) this.patientId.set(active.id);';
const synth = analyse(SYNTHETIC);
const synthFlagged = synth.selfWritten.includes('patientId') && !synth.guarded;

const KNOWN = [
  { file: 'upload-prescription-page', sig: 'patientId', label: 'upload patient prefill' },
  { file: 'upload-prescription-page', sig: 'addressId', label: 'upload address prefill' },
];
const has = (k) => rows.some((r) => r.file.includes(k.file) && r.signals.includes(k.sig));

console.log('self-referential effects found: ' + rows.length);
for (const k of KNOWN) {
  console.log((has(k) ? 'PASS' : 'FAIL') + '  POSITIVE CONTROL (stage 1) — finds the ' + k.label);
}
console.log(
  (synthFlagged ? 'PASS' : 'FAIL') +
    '  POSITIVE CONTROL (stage 2) — flags a synthetic unguarded prefill',
);
const guardedKnown = KNOWN.every((k) =>
  rows.some((r) => r.file.includes(k.file) && r.signals.includes(k.sig) && r.guarded),
);
console.log(
  (guardedKnown ? 'PASS' : 'FAIL') +
    '  NEGATIVE CONTROL (stage 2) — the two fixed instances read as guarded',
);

if (asyncRows.length) {
  console.log(NL + 'read only inside .then()/.catch() — not a tracked dependency, not a defect:');
  for (const r of asyncRows) console.log('  ' + r.file + ':' + r.line + '  ' + r.signals.join(', '));
}

console.log(NL + 'SELF-REFERENTIAL EFFECTS — ' + rows.length);
for (const r of rows) {
  console.log(
    '  ' +
      (r.guarded ? 'guarded  ' : 'UNGUARDED') +
      ' ' +
      r.file +
      ':' +
      r.line +
      '  ' +
      r.signals.join(', ') +
      (r.latched.length ? '   [latch: ' + r.latched.join(', ') + ']' : ''),
  );
}
const unguarded = rows.filter((r) => !r.guarded);
console.log(NL + 'UNGUARDED — ' + unguarded.length);
for (const r of unguarded) {
  console.log('  ' + r.file + ':' + r.line + '  writes+reads ' + r.signals.join(', '));
}
