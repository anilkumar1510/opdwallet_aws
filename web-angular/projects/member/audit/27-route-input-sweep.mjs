/**
 * Detector 4 — a component input no route supplies.
 *
 * withComponentInputBinding() sets an input the route does not supply to
 * `undefined`, which OVERRIDES the initializer. So `input<LabKind>(LabKind.Lab)`
 * is `undefined`, not LAB, on any route without `data: { kind: … }`.
 *
 * An input is satisfied by a path param, a `data` key, or a QUERY param supplied
 * at the navigation. Only the first two are visible in the route config, so the
 * third is resolved by searching the source for a navigation that sends it.
 *
 * CONTROLS — stated as what they actually are, not as a claim of soundness.
 *   positive — the extractor must see CartPage's two inputs; if it sees none the
 *              "0 unbound" result below means nothing
 *   negative — must NOT flag `kind` on lab-tests/cart/:cartId, which session 38
 *              fixed, nor `claimId` on claims/:claimId, bound as a path param
 *
 * This file reported 11 unbound inputs on its first run and 4 on its second, and
 * every one was a false positive from a pattern that knew one syntax and not
 * another: `data: { mode }` shorthand has no colon, and `[queryParams]="{…}"` in
 * a template is not `queryParams: {…}` in TypeScript. Kept in the write-up rather
 * than quietly corrected — the failure is the same class the detector hunts.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = new URL('../src', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const routesSrc = readFileSync(join(SRC, 'app', 'app.routes.ts'), 'utf8');

const walk = (d) => readdirSync(d).flatMap((n) => {
  const f = join(d, n);
  return statSync(f).isDirectory() ? walk(f) : f.endsWith('.ts') ? [f] : [];
});

/** input name -> declaring file, for every component input in features/. */
const inputsByComponent = new Map();
for (const file of walk(join(SRC, 'app', 'features'))) {
  const text = readFileSync(file, 'utf8');
  const cls = text.match(/export class (\w+)/)?.[1];
  if (!cls) continue;
  const names = [...text.matchAll(/^\s*(?:readonly |protected readonly )?(\w+)\s*=\s*input(?:\.required)?</gm)]
    .map((m) => m[1]);
  if (names.length) inputsByComponent.set(cls, { file, names });
}

/**
 * Split the routes file into per-route blocks. A block runs from a `path:` to
 * the next one; `data` and the loaded component both sit inside it.
 */
const blocks = [];
const re = /path:\s*[`'"]([^`'"]*)[`'"]|path:\s*`\$\{base\}\/(\w+)`/g;
const marks = [...routesSrc.matchAll(re)].map((m) => ({ path: m[1] ?? m[2], at: m.index }));
for (let i = 0; i < marks.length; i++) {
  const body = routesSrc.slice(marks[i].at, marks[i + 1]?.at ?? routesSrc.length);
  const comp = body.match(/=>\s*m\.(\w+)\)/)?.[1] ?? body.match(/then\(\(m\)\s*=>\s*m\.(\w+)\)/)?.[1];
  // Shorthand counts: `data: { mode }` binds `mode` just as `data: { mode: x }`
  // does. Requiring the colon reported six false positives on the two flatMap
  // groups — a pattern that knew the syntax it expected and not the structure.
  const dataBody = body.match(/data:\s*\{([^}]*)\}/)?.[1] ?? '';
  const dataKeys = [...dataBody.matchAll(/(\w+)\s*[:,}]/g)].map((m) => m[1])
    .concat([...dataBody.matchAll(/^\s*(\w+)\s*$/gm)].map((m) => m[1]));
  const params = [...marks[i].path.matchAll(/:(\w+)/g)].map((m) => m[1]);
  if (comp) blocks.push({ path: marks[i].path, comp, dataKeys, params });
}

// withComponentInputBinding() also binds QUERY params, which no route config
// declares — they come from the navigation. An input supplied as `?name=`
// anywhere in the source is bound, just not here. Collected so they are
// classified rather than reported as defects.
const allSrc = walk(join(SRC, 'app')).map((f) => readFileSync(f, 'utf8')).join('\n');
const queryBound = new Set(
  [...allSrc.matchAll(/[?&](\w+)=/g)].map((m) => m[1])
    // BOTH syntaxes: the TS object literal `queryParams: {…}` and the template
    // binding `[queryParams]="{…}"`. Matching only the first left four inputs
    // looking unbound that are supplied on every navigation to them.
    .concat([...allSrc.matchAll(/\[?queryParams\]?[:=]\s*"?\{([^}]*)\}/g)]
      .flatMap((m) => [...m[1].matchAll(/(\w+)\s*[:,}]/g)].map((x) => x[1]))),
);

const unbound = [];
const viaQuery = [];
for (const b of blocks) {
  const decl = inputsByComponent.get(b.comp);
  if (!decl) continue;
  for (const name of decl.names) {
    if (b.params.includes(name) || b.dataKeys.includes(name)) continue;
    (queryBound.has(name) ? viaQuery : unbound).push({ ...b, input: name });
  }
}

console.log(`routes with a component: ${blocks.length} | components with inputs: ${inputsByComponent.size}`);
const has = (p, i) => unbound.some((u) => u.path === p && u.input === i);
console.log(`${!has('lab-tests/cart/:cartId', 'kind') ? 'PASS' : 'FAIL'}  NEGATIVE CONTROL — session 38's fixed route is not flagged`);
console.log(`${!has('claims/:claimId', 'claimId') ? 'PASS' : 'FAIL'}  NEGATIVE CONTROL — a path-param-bound input is not flagged`);
const posComp = [...inputsByComponent.keys()].find((c) => c === 'CartPage');
console.log(`${posComp ? 'PASS' : 'FAIL'}  POSITIVE CONTROL — the extractor sees CartPage's inputs (${inputsByComponent.get('CartPage')?.names.join(', ')})`);

console.log('');
console.log('UNBOUND — no path param, no data key, never sent as a query param: ' + unbound.length);
for (const u of unbound) console.log('  ' + u.path.padEnd(38) + u.comp + '.' + u.input);
console.log('');
console.log('bound by query param at the navigation, not by the route config — ' + viaQuery.length);
for (const u of viaQuery) console.log('  ' + u.path.padEnd(38) + u.comp + '.' + u.input);
