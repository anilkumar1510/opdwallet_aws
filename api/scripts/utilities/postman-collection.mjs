#!/usr/bin/env node
/**
 * Generates Postman v2.1 collections from the API's own OpenAPI spec.
 *
 *   npm run postman            # needs the API running on :4000
 *
 * Emits three files:
 *   opdwallet-api.postman_collection.json             every route the API serves
 *   opdwallet-admin.postman_collection.json           what web-admin calls
 *   opdwallet-member-angular.postman_collection.json  what web-angular/member calls
 *
 * The spec is the source of truth, not a hand-maintained list — main.ts already
 * serves it at /api/docs-json (non-production only). Postman can import that URL
 * directly; this script exists for two reasons: descriptions and scoping.
 *
 * DESCRIPTIONS. Most operations have no `@ApiOperation({ summary })`, so a raw
 * import gives folders of unlabelled requests. Every request here gets a line,
 * with its provenance marked:
 *   - authored — the `summary` a developer wrote in @ApiOperation.
 *   - derived  — generated from the operationId (`WalletController_getTransactions`
 *                -> "Get transactions"). A restatement of the handler name, NOT
 *                documentation: it says what the method is called, not what it
 *                does, and cannot describe side effects or auth rules.
 * To replace a derived line, add @ApiOperation to the controller and re-run.
 * Never edit the collection by hand — the next run overwrites it.
 *
 * SCOPING. The per-consumer collections are built from what each frontend
 * actually calls, recovered by scanning its source for request paths, not from
 * route prefixes or role decorators. A prefix split would be wrong in both
 * directions: `/api/categories` and `/api/policies` carry no `admin` segment
 * but are admin screens, and `/api/admin/*` routes are called by ops tooling too.
 *
 * The scan is a regex over source text, so it is a lower bound with a known
 * blind spot: a path assembled at runtime from a variable is invisible to it.
 * Candidates matching no spec route are dropped and reported rather than
 * guessed at — such a path is either a dead call site or a route that moved.
 *
 * Auth: the API uses an httpOnly `opd_session` cookie. Log in once via the
 * auth folder and Postman's cookie jar carries it. There is no bearer token.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const SPEC = process.env.SPEC_URL ?? 'http://localhost:4000/api/docs-json';
const REPO = join(new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'), '../../..');
const DERIVED = ' _(derived from handler name — not authored documentation)_';

/** Where each consumer's source lives, and how its request paths are written. */
const CONSUMERS = [
  {
    file: 'opdwallet-admin.postman_collection.json',
    name: 'OPD Wallet API — web-admin',
    root: join(REPO, 'web-admin'),
    // apiFetch('/api/policies/${id}') — already carries the /api prefix.
    pattern: /apiFetch\(\s*[`'"]([^`'"?]+)/g,
    prefix: '',
  },
  {
    file: 'opdwallet-member-angular.postman_collection.json',
    name: 'OPD Wallet API — web-angular member',
    // core/ only. Every request path in this app is an endpoint constant here
    // (verified: the three feature files that call HttpClient directly import
    // those constants). Scanning app/ instead sweeps up app.routes.ts and
    // reports ~60 Angular *router* paths as missing API routes.
    root: join(REPO, 'web-angular/projects/member/src/app/core'),
    // Endpoint constants hold bare paths ('wallet/balance'); apiUrlInterceptor
    // prepends the base, so /api has to be added back to match the spec.
    pattern: /[`'"](?!\/)([a-z][a-zA-Z0-9/_-]*\/[a-zA-Z0-9/_${}.-]*)[`'"]/g,
    prefix: '/api/',
  },
];

const spec = await fetch(SPEC)
  .then((r) => {
    if (!r.ok) throw new Error(`${SPEC} -> HTTP ${r.status}`);
    return r.json();
  })
  .catch((e) => {
    console.error(`Could not read the OpenAPI spec: ${e.message}`);
    console.error('Start the API first: npm run start:dev');
    process.exit(1);
  });

/** `WalletController_getTransactions` -> `Get transactions`. */
function fromOperationId(id = '') {
  const method = id.includes('_') ? id.slice(id.indexOf('_') + 1) : id;
  const words = method
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .toLowerCase()
    .trim();
  return words ? words[0].toUpperCase() + words.slice(1) : '';
}

function describe(op, method, path) {
  if (op.summary?.trim()) return op.summary.trim();
  const derived = fromOperationId(op.operationId);
  // No operationId to work from: the route itself is all we honestly have.
  return derived ? derived + DERIVED : `${method.toUpperCase()} ${path}${DERIVED}`;
}

/**
 * Collapses every parameter form to `*` so a client path and a spec path can be
 * compared: `/api/policies/${id}` and `/api/policies/{policyId}` both become
 * `/api/policies/*`.
 */
const shape = (p) =>
  p
    .replace(/\$\{[^}]*\}/g, '*')
    .replace(/\{[^}]*\}/g, '*')
    .replace(/\/+$/, '');

/** OpenAPI `/wallet/{id}` -> Postman `/wallet/:id` plus a path-variable entry. */
function toPostmanPath(path) {
  const variables = [];
  const segments = path
    .replace(/^\//, '')
    .split('/')
    .map((s) => {
      const m = s.match(/^\{(.+)\}$/);
      if (!m) return s;
      variables.push({ key: m[1], value: '', description: `${m[1]} path parameter` });
      return `:${m[1]}`;
    });
  return { segments, variables };
}

/** Every operation the spec declares, flattened. */
const operations = [];
for (const [path, ops] of Object.entries(spec.paths)) {
  for (const [method, op] of Object.entries(ops)) {
    if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue;
    operations.push({ path, method, op, shape: shape(path) });
  }
}

function buildRequest({ path, method, op }) {
  const description = describe(op, method, path);
  const { segments, variables } = toPostmanPath(path);
  const query = (op.parameters ?? [])
    .filter((p) => p.in === 'query')
    .map((p) => ({
      key: p.name,
      value: '',
      // Optional params ride along disabled so a request runs unedited.
      disabled: !p.required,
      description: p.description ?? '',
    }));

  const request = {
    method: method.toUpperCase(),
    header: [],
    url: {
      raw: `{{baseUrl}}/${segments.join('/')}`,
      host: ['{{baseUrl}}'],
      path: segments,
      ...(query.length ? { query } : {}),
      ...(variables.length ? { variable: variables } : {}),
    },
    description,
  };

  if (op.requestBody) {
    request.header.push({ key: 'Content-Type', value: 'application/json' });
    request.body = { mode: 'raw', raw: '{}', options: { raw: { language: 'json' } } };
  }
  return { name: `${method.toUpperCase()} ${path}`, request, description };
}

function collection(name, note, ops) {
  const folders = new Map();
  let authored = 0;
  let derived = 0;
  for (const o of ops) {
    const item = buildRequest(o);
    if (item.description.endsWith(DERIVED)) derived++;
    else authored++;
    const tag = o.op.tags?.[0] ?? 'untagged';
    if (!folders.has(tag)) folders.set(tag, []);
    folders.get(tag).push({ name: item.name, request: item.request, response: [] });
  }
  return {
    doc: {
      info: {
        name,
        description:
          `${note}\n\n` +
          `Generated from ${SPEC} — do not hand-edit, it is overwritten on regeneration.\n\n` +
          'Auth: httpOnly `opd_session` cookie. Log in via the auth folder first; ' +
          "Postman's cookie jar carries it to every other request.\n\n" +
          `${authored} descriptions authored via @ApiOperation, ${derived} derived from ` +
          'handler names and marked as such.',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      // No /api suffix: setGlobalPrefix('api') is already baked into every spec
      // path, so a suffixed baseUrl would produce /api/api/....
      variable: [{ key: 'baseUrl', value: spec.servers?.[0]?.url ?? 'http://localhost:4000' }],
      item: [...folders.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([n, item]) => ({ name: n, item })),
    },
    authored,
    derived,
    folders: folders.size,
  };
}

/** Recursively collect source files, skipping build output and dependencies. */
function sources(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (['node_modules', '.next', 'dist'].includes(e.name) || e.name.startsWith('.')) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) sources(full, out);
    else if (['.ts', '.tsx'].includes(extname(e.name))) out.push(full);
  }
  return out;
}

const report = [];

// 1. Everything the API serves.
{
  const c = collection(spec.info?.title ?? 'API', spec.info?.description ?? '', operations);
  const file = 'opdwallet-api.postman_collection.json';
  writeFileSync(file, JSON.stringify(c.doc, null, 2) + '\n');
  report.push(
    `${file}\n  ${c.authored + c.derived} requests, ${c.folders} folders ` +
      `(${c.authored} authored, ${c.derived} derived)`,
  );
}

// 2. One per consumer, scoped to what that frontend actually calls.
for (const consumer of CONSUMERS) {
  const wanted = new Set();
  for (const file of sources(consumer.root)) {
    for (const m of readFileSync(file, 'utf8').matchAll(consumer.pattern)) {
      wanted.add(shape(consumer.prefix + m[1]));
    }
  }

  // Pass 1: exact shape match.
  const matched = new Set(operations.filter((o) => wanted.has(o.shape)));
  const resolved = new Set([...matched].map((o) => o.shape));

  /**
   * Pass 2, for candidates pass 1 missed. A client wildcard can stand for a
   * literal the spec spells out: `services/${id}/${action}` is really
   * `services/{id}/activate` and `.../deactivate`, so its shape carries one
   * more `*` than any single route. Only a client `*` is permissive here — a
   * client literal must still match a spec literal exactly, or `/cugs/active`
   * would swallow `/cugs/{id}`.
   */
  for (const w of wanted) {
    if (resolved.has(w)) continue;
    const want = w.split('/');
    for (const o of operations) {
      const got = o.shape.split('/');
      if (got.length !== want.length) continue;
      if (want.every((seg, i) => seg === '*' || seg === got[i])) matched.add(o);
    }
  }

  // Whatever still matches nothing: a dead call site, a route that moved, or —
  // for the liberal Angular pattern — a string that was never a URL at all.
  const orphans = [...wanted].filter(
    (w) =>
      w.startsWith('/api/') &&
      // Doc comments cite source files (`audit/05-findings.md`,
      // `web-member/components/Nudge.tsx`); no route ends in a file extension.
      !/\.[a-z]{2,4}$/.test(w) &&
      !operations.some((o) => {
        const got = o.shape.split('/');
        const want = w.split('/');
        return got.length === want.length && want.every((s, i) => s === '*' || s === got[i]);
      }),
  );

  const c = collection(
    consumer.name,
    `Scoped to the routes ${consumer.root.replace(REPO, '')} is seen to call. ` +
      'Recovered by scanning source for request paths, so it is a lower bound: ' +
      'a path assembled at runtime from a variable does not appear here.',
    [...matched].sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method)),
  );
  writeFileSync(consumer.file, JSON.stringify(c.doc, null, 2) + '\n');
  report.push(
    `${consumer.file}\n  ${c.authored + c.derived} requests, ${c.folders} folders ` +
      `(${c.authored} authored, ${c.derived} derived)` +
      (orphans.length
        ? `\n  ${orphans.length} candidate paths matched no route: ${orphans.slice(0, 6).join(', ')}${orphans.length > 6 ? ' …' : ''}`
        : ''),
  );
}

console.log(report.join('\n'));
