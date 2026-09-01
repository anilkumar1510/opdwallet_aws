#!/usr/bin/env node
/**
 * Route inventory diff: web-member (Next.js) vs web-angular vs web-member-rn.
 *
 *   node tools/parity-inventory.mjs
 *   node tools/parity-inventory.mjs --missing   # only rows needing attention
 *
 * Catches the failure this rewrite is most exposed to: a whole screen nobody
 * noticed was never ported. Both React apps are read-only reference; this only
 * reads them.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
const WEB = join(ROOT, 'web-member', 'app');
const RN = join(ROOT, 'web-member-rn', 'app');
const ANGULAR_ROUTES = join(
  ROOT,
  'web-angular',
  'projects',
  'member',
  'src',
  'app',
  'app.routes.ts',
);

/** `[id]`, `[cartId]`, `:claimId` all become `:p` so param names cannot cause false diffs. */
const normalise = (route) =>
  route
    .replace(/\[([^\]]+)\]/g, ':p')
    .replace(/:[A-Za-z0-9_]+/g, ':p')
    .replace(/\/+/g, '/')
    .replace(/^\/|\/$/g, '');

function walk(dir, onFile) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, onFile);
    else onFile(full);
  }
}

/** Next.js app router: every page.tsx is a route. */
function nextRoutes() {
  const routes = new Set();
  walk(WEB, (file) => {
    if (!file.endsWith(`${sep}page.tsx`)) return;
    const rel = relative(WEB, file).split(sep).slice(0, -1).join('/');
    // Skip route groups like (auth) — they do not appear in the URL.
    routes.add(normalise(rel.replace(/\([^)]*\)\//g, '')));
  });
  return routes;
}

/** expo-router: every .tsx is a route except _layout; index means the folder itself. */
function rnRoutes() {
  const routes = new Set();
  walk(RN, (file) => {
    if (!file.endsWith('.tsx')) return;
    const rel = relative(RN, file).split(sep).join('/').replace(/\.tsx$/, '');
    const base = rel.split('/').pop();
    if (base === '_layout') return;
    routes.add(normalise(base === 'index' ? rel.slice(0, -'index'.length) : rel));
  });
  return routes;
}

/**
 * Angular routes are a nested literal, so this reads paths rather than
 * evaluating the file. Two blocks build paths from a base array via flatMap;
 * those template literals are expanded against the nearest preceding array.
 */
function angularRoutes() {
  const source = readFileSync(ANGULAR_ROUTES, 'utf8');
  const built = new Set();
  const placeholders = new Set();

  // Everything inside the placeholder block is "declared but not built".
  const placeholderBlock = source.match(/not been ported yet[\s\S]*?\]\.map\(/);
  if (placeholderBlock) {
    for (const [, path] of placeholderBlock[0].matchAll(/path:\s*'([^']*)'/g)) {
      placeholders.add(normalise(`member/${path}`));
    }
  }

  let bases = [];
  for (const line of source.split('\n')) {
    const baseDecl = line.match(/\(\[([^\]]+)\] as const\)\.flatMap/);
    if (baseDecl) {
      bases = [...baseDecl[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
      continue;
    }

    const literal = line.match(/path:\s*'([^']*)'/);
    if (literal) {
      const path = literal[1];
      if (path === '**') continue;
      // '' is either the app root (redirects to member) or the member index.
      const full = path === '' || path === 'member' ? 'member' : `member/${path}`;
      if (!placeholders.has(normalise(full))) built.add(normalise(full));
      continue;
    }

    const templated = line.match(/path:\s*`\$\{base\}([^`]*)`/);
    if (templated) {
      for (const base of bases) built.add(normalise(`member/${base}${templated[1]}`));
    } else if (/path:\s*base\b/.test(line)) {
      for (const base of bases) built.add(normalise(`member/${base}`));
    }
  }
  // 'login' sits outside /member; the app root redirects into it.
  if (source.includes("path: 'login'")) built.add('login');
  if (/redirectTo:\s*'member'/.test(source)) built.add('');
  return { built, placeholders };
}

const web = nextRoutes();
const rn = rnRoutes();
const { built, placeholders } = angularRoutes();

const all = [...new Set([...web, ...built, ...placeholders])].sort();
const onlyMissing = process.argv.includes('--missing');

const status = (route) => {
  if (built.has(route)) return web.has(route) ? 'built' : 'built (extra)';
  if (placeholders.has(route)) return 'placeholder';
  return 'MISSING';
};

const rows = all
  .map((route) => ({ route, web: web.has(route), status: status(route) }))
  .filter((row) => row.web || row.status !== 'built (extra)')
  .filter((row) => !onlyMissing || row.status !== 'built');

const pad = (value, width) => String(value).padEnd(width);
const width = Math.max(28, ...rows.map((r) => r.route.length + 2));

console.log(`\n${pad('REACT ROUTE (web-member)', width)}  ANGULAR`);
console.log('-'.repeat(width + 22));
for (const row of rows) {
  console.log(`${pad(row.web ? `/${row.route}` : `-  (/${row.route})`, width)}  ${row.status}`);
}

const missing = rows.filter((r) => r.status === 'MISSING').length;
const placed = rows.filter((r) => r.status === 'placeholder').length;
console.log(
  `\nweb-member routes: ${web.size}   angular built: ${built.size}   ` +
    `placeholder: ${placed}   missing: ${missing}`,
);

// RN-only screens are a feature difference, not a porting gap — listed, never
// counted as missing, because web-member is the agreed reference.
const rnOnly = [...rn].filter((route) => !web.has(route) && route.startsWith('member/')).sort();
if (rnOnly.length) {
  console.log(`\nRN-only screens (web-member-rn, no web equivalent) — ${rnOnly.length}:`);
  for (const route of rnOnly) {
    console.log(`  /${route}${built.has(route) ? '   [angular: built]' : ''}`);
  }
}

process.exitCode = missing > 0 ? 1 : 0;
