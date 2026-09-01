/**
 * API integration parity — which endpoints each app actually calls, per screen.
 *
 * `01-endpoint-diff.md` compared endpoint STRINGS extracted from source. This
 * compares endpoints ACTUALLY CALLED by both running apps on the same route, as
 * the same member. Static extraction cannot see a declared-but-unreached call, a
 * call made from a shared store, or a call fired only after data arrives.
 *
 * **NON-MUTATING.** Every route is loaded with GET and nothing is clicked. Only
 * GET traffic is compared; any POST/PUT/PATCH/DELETE seen on a bare page load is
 * reported separately, because a page load should not be writing.
 *
 * ⚠ KNOWN LIMIT — READ BEFORE INTERPRETING ANY "ANGULAR ONLY" ROW.
 * This harness reaches each route with page.goto(), a FULL PAGE LOAD. That boots
 * the Angular app cold and re-instantiates every root-provided store, so a load
 * that happens ONCE PER SESSION appears once per route. It measures cold-boot
 * cost, not navigation cost.
 *
 * It produced a withdrawn finding on exactly this: four "over-fetching" hubs that
 * cost nothing on real in-app navigation (probe-spa-refetch.mjs). React is a
 * multi-page app and fetches per page anyway, so its side is unaffected — the
 * distortion is one-directional.
 *
 * Before filing an Angular-only row, check whether it comes from a root store
 * that would already be warm.
 *
 * CONTROLS — the first two exist because the UI version of this harness passed its
 * controls while React was sitting unauthenticated on its login page.
 *   positive — each app must be signed in and on the intended screen, asserted by a
 *              heading unique to that app's wallet page. A control that merely
 *              asserts "the two differ" is satisfied by total failure.
 *   positive — a route that produces ZERO API calls on both sides is reported, not
 *              scored as agreement. Two silent pages agree about nothing.
 *   negative — the same app loaded twice must show no difference.
 */
import { chromium } from 'playwright';

const NG = 'http://localhost:4200';
const RE = 'http://localhost:3002';

const ROUTES = [
  '/member', '/member/wallet', '/member/transactions', '/member/orders',
  '/member/bookings', '/member/claims', '/member/benefits',
  '/member/health-records', '/member/profile', '/member/services',
  '/member/settings', '/member/helpline', '/member/pharmacy',
  '/member/health-checkup', '/member/wellness', '/member/family',
  '/member/lab-tests', '/member/lab-tests/orders', '/member/lab-tests/upload',
  '/member/diagnostics', '/member/diagnostics/orders', '/member/diagnostics/upload',
  '/member/dental', '/member/vision',
  '/member/appointments', '/member/appointments/specialties',
  '/member/online-consult', '/member/online-consult/specialties',
  '/member/ahc/booking', '/member/ahc/booking/payment',
];

/** Ids out, so the same endpoint with different data is one endpoint. */
const norm = (p) =>
  p
    .replace(/^\/api\//, '')
    .replace(/\/[0-9a-f]{24}(?=\/|$)/g, '/:p')
    .replace(/\/(PAY|TXN|CLM|APT|DEN-BOOK|VIS-BOOK|ORD|DIAG-ORD|CART|DIAG-CART|PRES|DIAG-RX|AHC-ORD|USR|MEM|POL|DOC|VENDOR|DIAG-VEN)[-0-9A-Za-z]*(?=\/|$)/g, '/:p')
    .replace(/\/\d+(?=\/|$)/g, '/:p')
    .replace(/\?.*$/, '');

const b = await chromium.launch();

const signIn = async (pg, base, loginPath) => {
  await pg.goto(base + loginPath, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await pg.waitForLoadState('networkidle').catch(() => {});
  const email = pg.locator('input[type=email]').first();
  if (await email.count()) {
    await email.fill('shivam@gmail.com');
    await pg.locator('input[type=password]').first().fill('12345678');
    await pg.getByRole('button', { name: /sign in|log ?in/i }).first().click().catch(() => {});
    await pg.waitForTimeout(6000);
  }
};

const visit = async (pg, base, route, sink) => {
  sink.length = 0;
  const res = await pg.goto(base + route, { waitUntil: 'domcontentloaded' }).catch(() => null);
  await pg.waitForLoadState('networkidle').catch(() => {});
  await pg.waitForTimeout(2200);
  const headings = [...new Set(
    (await pg.locator('h1, h2').allInnerTexts().catch(() => [])).map((t) => t.replace(/\s+/g, ' ').trim()),
  )];
  return { status: res ? res.status() : 0, calls: [...sink], headings };
};

const only = (a, c) => [...new Set(a.filter((x) => !c.includes(x)))].sort();

try {
  const ngPage = await (await b.newContext()).newPage();
  const rePage = await (await b.newContext()).newPage();
  const ngSink = [];
  const reSink = [];
  const attach = (pg, sink) =>
    pg.on('response', (r) => {
      const u = new URL(r.url());
      if (!u.pathname.includes('/api/')) return;
      sink.push(`${r.request().method()} ${norm(u.pathname.replace(/^\/[a-z-]+\/api\//, '/api/'))} ${r.status()}`);
    });
  attach(ngPage, ngSink);
  attach(rePage, reSink);

  await signIn(ngPage, NG, '/login');
  await signIn(rePage, RE, '/');

  const ngW = await visit(ngPage, NG, '/member/wallet', ngSink);
  const reW = await visit(rePage, RE, '/member/wallet', reSink);
  const ngOk = ngW.headings.some((h) => /^wallet$/i.test(h));
  const reOk = reW.headings.some((h) => /my wallet/i.test(h));
  console.log(`${ngOk ? 'PASS' : 'FAIL'}  POSITIVE CONTROL — Angular signed in, on the wallet screen`);
  console.log(`${reOk ? 'PASS' : 'FAIL'}  POSITIVE CONTROL — React signed in, on the wallet screen`);
  if (!ngOk || !reOk) {
    console.log(`\n  ABORT — an app is unauthenticated; every row would be noise.`);
    console.log(`  angular: ${ngW.headings.join(' · ') || '(none)'}`);
    console.log(`  react:   ${reW.headings.join(' · ') || '(none)'}`);
    throw new Error('auth control failed');
  }

  const a1 = await visit(ngPage, NG, '/member/claims', ngSink);
  const a2 = await visit(ngPage, NG, '/member/claims', ngSink);
  const selfDiff = only(a1.calls.map((c) => c.split(' ')[1]), a2.calls.map((c) => c.split(' ')[1])).length;
  console.log(`${selfDiff === 0 ? 'PASS' : 'FAIL'}  NEGATIVE CONTROL — same app twice, no endpoint difference (${selfDiff})`);

  const rows = [];
  for (const route of ROUTES) {
    const ng = await visit(ngPage, NG, route, ngSink);
    const re = await visit(rePage, RE, route, reSink);
    rows.push({ route, ng, re });
  }

  const ep = (calls) => calls.map((c) => c.split(' ')[1]);
  const writes = (calls) => calls.filter((c) => !c.startsWith('GET '));

  console.log('\n\n================ PER-ROUTE ENDPOINT DIFF ================');
  let silent = 0;
  for (const { route, ng, re } of rows) {
    const nOnly = only(ep(ng.calls), ep(re.calls));
    const rOnly = only(ep(re.calls), ep(ng.calls));
    const both = ep(ng.calls).filter((x) => ep(re.calls).includes(x));
    if (!ng.calls.length && !re.calls.length) {
      silent++;
      console.log(`\n${route}\n   ⚠ ZERO API calls on BOTH sides — nothing compared here`);
      continue;
    }
    const tag = nOnly.length || rOnly.length ? '✱' : '=';
    console.log(`\n${tag} ${route}   [shared ${both.length}]`);
    if (rOnly.length) console.log(`   REACT ONLY:   ${rOnly.join('  ')}`);
    if (nOnly.length) console.log(`   ANGULAR ONLY: ${nOnly.join('  ')}`);
    const bad = [...ng.calls, ...re.calls].filter((c) => /\s(4|5)\d\d$/.test(c));
    if (bad.length) console.log(`   NON-2xx:      ${[...new Set(bad)].join('  ')}`);
    const w = [...writes(ng.calls), ...writes(re.calls)];
    if (w.length) console.log(`   WRITES ON LOAD: ${[...new Set(w)].join('  ')}`);
  }
  console.log(`\n\nroutes compared: ${rows.length} · silent on both sides: ${silent}`);
} finally {
  await b.close();
}
