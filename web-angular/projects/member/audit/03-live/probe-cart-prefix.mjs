/**
 * Does a diagnostics cart resolve on the LAB prefix?
 *
 * The reference's diagnostics cart screen (`diagnostics/cart/[id]/page.tsx`,
 * inside `CartDetailPage.fetchCart`/`fetchVendors`) fetches
 * `member/lab/carts/:cartId`, while its diagnostics *booking* screen fetches
 * `member/diagnostics/carts/:cartId`. The API backs the two prefixes with
 * separate Mongoose models and separate collections (`lab_carts` /
 * `diagnostic_carts`), so the two cannot both be right.
 *
 * Read-only: three GETs, no writes.
 *
 * CONTROLS
 *   positive  — the diagnostics prefix returns the cart
 *   negative  — the lab prefix is alive and authenticated for this member
 *               (its collection GET succeeds), so a miss on the id is about the
 *               id and not about a dead or unauthorised route
 */
const API = 'http://localhost:4000/api';
const CART = 'DIAG-CART-1782129431229-MFGEHVOLQ'; // shivam@, status ORDERED

const login = async () => {
  const r = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'shivam@gmail.com', password: '12345678' }),
  });
  const cookie = (r.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ');
  if (!r.ok || !cookie) throw new Error(`login failed: ${r.status}`);
  return cookie;
};

const get = async (cookie, path) => {
  const r = await fetch(`${API}/${path}`, { headers: { cookie } });
  let body = null;
  try {
    body = await r.json();
  } catch {
    /* non-JSON error page */
  }
  return { status: r.status, body };
};

const cookie = await login();

const diag = await get(cookie, `member/diagnostics/carts/${CART}`);
const lab = await get(cookie, `member/lab/carts/${CART}`);
const labList = await get(cookie, 'member/lab/carts');

// A cart is "resolved" when the payload carries the cartId back. A 200 with a
// null/empty data field is a miss, not a hit — checked rather than assumed,
// because this API returns 200 with `data: null` in places.
const resolved = (r) => r.status === 200 && JSON.stringify(r.body?.data ?? null).includes(CART);

console.log(`${resolved(diag) ? 'PASS' : 'FAIL'}  POSITIVE CONTROL — diagnostics prefix resolves the cart`);
console.log(`        GET member/diagnostics/carts/${CART} -> ${diag.status}`);
console.log(`${labList.status === 200 ? 'PASS' : 'FAIL'}  NEGATIVE CONTROL — the lab prefix is alive for this member`);
console.log(`        GET member/lab/carts -> ${labList.status}, ${(labList.body?.data ?? []).length} carts`);

console.log(`\nTHE CLAIM — the same id on the lab prefix:`);
console.log(`        GET member/lab/carts/${CART} -> ${lab.status}`);
console.log(`        resolved: ${resolved(lab)}`);
console.log(`        body: ${JSON.stringify(lab.body).slice(0, 200)}`);
