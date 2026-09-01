#!/usr/bin/env node
/**
 * Endpoint diff: every API path web-member calls vs every path the Angular
 * mappers declare.
 *
 *   node tools/parity-endpoints.mjs
 *
 * This is the check that catches a screen rendering plausibly while a call it
 * should be making never fires — the failure mode a route diff cannot see. It
 * found `member/lab/orders/validate` missing from the lab booking flow, which
 * is what gates the confirm button and shows the wallet split.
 *
 * Reads web-member/ only; never writes to it.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
const WEB = join(ROOT, 'web-member');
const CORE = join(ROOT, 'web-angular', 'projects', 'member', 'src', 'app', 'core');

/** `${cartId}` / `:id` / `CAT007` all collapse so only the shape is compared. */
const shape = (path) =>
  path
    // A trailing `${queryString}` is a query, not a path segment — glued
    // straight onto the path with no slash, so drop it before the rest.
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

/**
 * Files reachable from a page, following imports.
 *
 * Scanning lib/ wholesale is misleading: web-member carries dead API modules
 * (lib/api/lab.ts, lib/api/doctors.ts) that nothing imports, and every endpoint
 * in them reads as a parity gap when it is really unused code in the reference.
 */
function reachableFiles() {
  const seen = new Set();
  const queue = [];

  walk(join(WEB, 'app'), (file) => {
    queue.push(file);
    seen.add(file);
  });

  const resolve = (spec, from) => {
    const base = spec.startsWith('@/')
      ? join(WEB, spec.slice(2))
      : spec.startsWith('.')
        ? join(from, '..', spec)
        : null;
    if (!base) return null;
    for (const candidate of [
      `${base}.ts`,
      `${base}.tsx`,
      join(base, 'index.ts'),
      join(base, 'index.tsx'),
    ]) {
      try {
        if (statSync(candidate).isFile()) return candidate;
      } catch {
        /* not this one */
      }
    }
    return null;
  };

  const enqueue = (file) => {
    if (file && !seen.has(file)) {
      seen.add(file);
      queue.push(file);
    }
  };

  while (queue.length) {
    const file = queue.pop();
    let source;
    try {
      source = readFileSync(file, 'utf8');
    } catch {
      continue;
    }

    for (const match of source.matchAll(
      /import\s+(?:([\w*\s{},]+)\s+from\s+)?['"]([^'"]+)['"]/g,
    )) {
      const [, clause, spec] = match;
      const target = resolve(spec, file);
      if (!target) continue;

      // A barrel re-exports far more than any one importer uses. Following it
      // whole marks dead modules reachable — web-member's lib/api/index.ts
      // re-exports labApi and doctorsApi, which no screen calls. So resolve
      // the named symbols through the barrel instead of taking all of it.
      const barrel = readFileSync(target, 'utf8');
      const named = [...(clause ?? '').matchAll(/([A-Za-z_$][\w$]*)/g)].map((m) => m[1]);
      const reExports = [...barrel.matchAll(/export\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)];

      if (reExports.length && named.length) {
        enqueue(target);
        for (const [, symbols, from] of reExports) {
          const exported = [...symbols.matchAll(/([A-Za-z_$][\w$]*)/g)].map((m) => m[1]);
          if (exported.some((symbol) => named.includes(symbol))) enqueue(resolve(from, target));
        }
        continue;
      }
      enqueue(target);
    }
  }
  return seen;
}

/** Paths web-member requests, via fetch('/api/…') or apiClient.get('…'). */
function referenceEndpoints() {
  const found = new Map();
  {
    for (const file of reachableFiles()) {
      const source = readFileSync(file, 'utf8');
      const patterns = [
        /fetch\(\s*[`'"]\/api\/([^`'"]+)[`'"]/g,
        /apiClient\.(?:get|post|put|patch|delete)\s*(?:<[^>]*>)?\(\s*[`'"]\/?([^`'"]+)[`'"]/g,
      ];
      for (const pattern of patterns) {
        for (const [, raw] of source.matchAll(pattern)) {
          const path = shape(raw);
          if (!path || path.startsWith('http')) continue;
          if (!found.has(path)) found.set(path, new Set());
          found.get(path).add(file.slice(WEB.length + 1).split(sep).join('/'));
        }
      }
    }
  }
  return found;
}

/** Paths the Angular mappers declare. */
function angularEndpoints() {
  const found = new Set();
  walk(CORE, (file) => {
    const source = readFileSync(file, 'utf8');
    // Every path prefix the API uses. A prefix missing here under-reports
    // coverage, which reads as a parity gap that does not exist.
    for (const [, raw] of source.matchAll(
      /[`']((?:member|auth|wallet|transactions|payments|appointments|doctors|doctor-slots|specialties|assignments|policies|vision-bookings|dental-bookings|notifications|clinics|location|admin)\/?[^`'\s]*)[`']/g,
    )) {
      const path = shape(raw);
      if (path) found.add(path);
    }
  });
  return found;
}

const reference = referenceEndpoints();
const angular = angularEndpoints();

const missing = [...reference.keys()].filter((path) => !angular.has(path)).sort();
const extra = [...angular].filter((path) => !reference.has(path)).sort();

console.log(`\nweb-member endpoints: ${reference.size}   angular declared: ${angular.size}\n`);

if (missing.length) {
  console.log(`Called by web-member, NOT declared in Angular mappers — ${missing.length}:`);
  for (const path of missing) {
    const callers = [...reference.get(path)].slice(0, 2).join(', ');
    console.log(`  ${path}\n      ${callers}`);
  }
} else {
  console.log('Every endpoint web-member calls is declared in an Angular mapper.');
}

if (extra.length) {
  console.log(`\nDeclared in Angular, not called by web-member — ${extra.length}:`);
  for (const path of extra) console.log(`  ${path}`);
}

process.exitCode = missing.length ? 1 : 0;
