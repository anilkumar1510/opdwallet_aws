// Extracts code-span identifiers from the design docs, specs and ADRs, then
// greps each against the Angular source. Read-only.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'C:/Users/singh/OneDrive/Desktop/opdwallet_aws';
const SRC = join(ROOT, 'web-angular/projects/member/src');

const DOCS = [
  join(ROOT, 'openspec/changes/angular-member-portal/design.md'),
  ...['member-session', 'member-shell', 'member-family-context', 'member-wallet'].map((s) =>
    join(ROOT, `openspec/changes/angular-member-portal/specs/${s}/spec.md`),
  ),
  ...readdirSync(join(ROOT, 'adr'))
    .filter((f) => /^000[1-4]/.test(f))
    .map((f) => join(ROOT, 'adr', f)),
];

// All source text, once.
const files = [];
(function walk(d) {
  for (const e of readdirSync(d)) {
    const f = join(d, e);
    statSync(f).isDirectory() ? walk(f) : /\.(ts|html)$/.test(e) && files.push(f);
  }
})(SRC);
const SOURCE = files.map((f) => readFileSync(f, 'utf8')).join('\n');

// Code spans that look like symbols, not prose or paths.
const SYMBOL = /^[A-Za-z_$][A-Za-z0-9_$]*(\(\))?$/;
const NOISE = new Set([
  'true', 'false', 'null', 'undefined', 'string', 'number', 'boolean', 'any',
  'GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'API', 'DTO', 'URL', 'HTTP', 'CSS',
  'id', 'ids', 'limit', 'offset', 'page', 'date', 'status', 'error', 'data',
  'kind', 'mode', 'area', 'leg', 'title', 'label', 'path', 'icon', 'exact',
]);

const found = new Map(); // symbol -> Set(doc)
for (const doc of DOCS) {
  const name = doc.split(/[\\/]/).slice(-2).join('/');
  for (const m of readFileSync(doc, 'utf8').matchAll(/`([^`\n]{2,60})`/g)) {
    const raw = m[1].trim();
    // Dotted spans (`SessionStore.terminate()`, `family.activeMember()`) are the
    // interesting ones — a member name is exactly where a dropped behaviour hides.
    // Split them and test each part, or the whole span is silently skipped.
    const parts = raw.includes('.') && /^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)+(\(\))?$/.test(raw)
      ? raw.replace(/\(\)$/, '').split('.')
      : [raw];
    for (const part of parts) {
      if (!SYMBOL.test(part)) continue;
      const bare = part.replace(/\(\)$/, '');
      if (NOISE.has(bare) || bare.length < 3) continue;
      if (!found.has(bare)) found.set(bare, new Set());
      found.get(bare).add(name);
    }
  }
}

const absent = [], present = [];
for (const [sym, docs] of [...found].sort()) {
  const re = new RegExp(`\\b${sym.replace(/\$/g, '\\$')}\\b`);
  (re.test(SOURCE) ? present : absent).push({ sym, docs: [...docs] });
}

console.log(`symbols extracted: ${found.size}`);
console.log(`present in source: ${present.length}`);
console.log(`ABSENT from source: ${absent.length}\n`);
console.log('=== SPECIFIED, ABSENT ===');
for (const a of absent) console.log(`- ${a.sym}   [${a.docs.join(', ')}]`);
