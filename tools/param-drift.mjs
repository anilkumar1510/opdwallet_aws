#!/usr/bin/env node
/**
 * Query-param and request-body diff, per endpoint.
 *
 *   node tools/param-drift.mjs
 *
 * The endpoint diff proves a call is made; this proves it is made with the same
 * inputs. A missing query param does not error — several of these routes answer
 * 200 with an empty list, which renders as "nothing to show". That is how the
 * lab collection slots stayed empty for every date: the API needs `pincode` as
 * well as `date`, and only `date` was sent.
 *
 * Reads web-member/ only; never writes to it.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
const WEB = join(ROOT, 'web-member');
const CORE = join(ROOT, 'web-angular', 'projects', 'member', 'src', 'app', 'core');

/** Route params and ids collapse so only the endpoint shape is compared. */
const shape = (path) =>
  path
    .replace(/(?<=[A-Za-z0-9-])\$\{[^}]*\}$/g, '')
    .replace(/\$\{[^}]*\}/g, ':p')
    .replace(/:[A-Za-z0-9_]+/g, ':p')
    .replace(/\bCAT\d{3}\b/g, ':p')
    .replace(/^\/+|\/+$/g, '')
    .replace(/^api\//, '')
    .split('?')[0];

function walk(dir, onFile) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === '.next' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, onFile);
    else if (/\.tsx?$/.test(full)) onFile(full);
  }
}

/** Query keys written inline in a URL, e.g. `?pincode=${x}&date=${y}`. */
function inlineQuery(url) {
  const index = url.indexOf('?');
  if (index === -1) return [];
  return [...url.slice(index + 1).matchAll(/(?:^|&)([A-Za-z0-9_]+)=/g)].map((m) => m[1]);
}

/**
 * Params web-member sends. Covers three idioms: inline `?a=`, URLSearchParams
 * `.append('a')`, and axios `{ params: { a, b } }`.
 */
function referenceParams() {
  const found = new Map();
  const add = (path, keys) => {
    if (!keys.length) return;
    const key = shape(path);
    if (!key) return;
    if (!found.has(key)) found.set(key, new Set());
    for (const name of keys) found.get(key).add(name);
  };

  walk(join(WEB, 'app'), (file) => {
    const source = readFileSync(file, 'utf8');

    for (const [, url] of source.matchAll(/fetch\(\s*[`'"]\/api\/([^`'"]+)[`'"]/g)) {
      add(url, inlineQuery(url));
      // A bare `?${params}` means the nearby appends belong to this call.
      if (/\?\$\{(params|queryString|searchParams)/.test(url)) {
        add(url, [...source.matchAll(/params\.append\(\s*'([^']+)'/g)].map((m) => m[1]));
      }
    }
    for (const [, url] of source.matchAll(
      /apiClient\.(?:get|post|put|patch|delete)\s*(?:<[^>]*>)?\(\s*[`'"]\/?([^`'"]+)[`'"]/g,
    )) {
      add(url, inlineQuery(url));
    }
  });

  // lib/api modules pass axios `{ params: { … } }` beside the path.
  walk(join(WEB, 'lib'), (file) => {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(
      /apiClient\.(?:get|post)\s*(?:<[^>]*>)?\(\s*[`'"]\/?([^`'"]+)[`'"]\s*,\s*\{\s*params:\s*\{([^}]*)\}/g,
    )) {
      const [, url, block] = match;
      add(url, [...block.matchAll(/([A-Za-z0-9_]+)\s*[,:}]/g)].map((m) => m[1]));
    }
  });

  return found;
}

/** Params the Angular stores send: HttpParams().set(), or a params object. */
function angularParams() {
  const found = new Map();
  const files = [];
  walk(CORE, (file) => files.push(file));

  // Endpoint constants are defined per resource; a call site references them by
  // name, so params are attributed to every endpoint that file declares.
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    const paths = [
      ...source.matchAll(
        /[`']((?:member|auth|wallet|transactions|payments|appointments|doctors|doctor-slots|specialties|assignments|policies|vision-bookings|dental-bookings|notifications|clinics)\/?[^`'\s]*)[`']/g,
      ),
    ].map((m) => shape(m[1]));
    if (!paths.length) continue;

    const keys = new Set([
      ...[...source.matchAll(/\.set\(\s*'([^']+)'/g)].map((m) => m[1]),
      ...[...source.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) =>
        [...m[1].matchAll(/([A-Za-z0-9_]+)\s*[,:}]/g)].map((x) => x[1]),
      ),
      ...[...source.matchAll(/form\.append\(\s*'([^']+)'/g)].map((m) => m[1]),
    ]);
    if (!keys.size) continue;

    for (const path of paths) {
      if (!found.has(path)) found.set(path, new Set());
      for (const key of keys) found.get(path).add(key);
    }
  }
  return found;
}

const reference = referenceParams();
const angular = angularParams();

const rows = [];
for (const [path, keys] of reference) {
  const mine = angular.get(path);
  // Only compare endpoints Angular actually calls.
  if (!mine) continue;
  const missing = [...keys].filter((key) => !mine.has(key));
  if (missing.length) rows.push({ path, missing, mine: [...mine] });
}

console.log(`\n${reference.size} reference endpoints carry params; comparing those Angular calls\n`);

if (rows.length) {
  console.log(`Params web-member sends that Angular may not — ${rows.length}:`);
  for (const row of rows.sort((a, b) => a.path.localeCompare(b.path))) {
    console.log(`  ${row.path}`);
    console.log(`      missing: ${row.missing.join(', ')}`);
    console.log(`      sends:   ${row.mine.join(', ') || '(none)'}`);
  }
  console.log(
    '\nHeuristic: params are attributed per file, so a shared resource file can\n' +
      'mask a real gap. Verify each against the store before acting.',
  );
} else {
  console.log('No param differences found on shared endpoints.');
}
