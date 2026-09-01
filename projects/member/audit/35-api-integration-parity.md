# 35 — API integration parity, driven

**2026-08-10.** `03-live/api-parity-diff.mjs` — both running apps, same member, same
30 routes, comparing the endpoints each **actually calls** rather than the endpoint
strings in their source. Non-mutating: every route is a page load, nothing clicked.

`01-endpoint-diff.md` did the static half in phase 1. Static extraction cannot see a
declared-but-unreached call, a call made by a shared store, or a call fired only
once data arrives. All three appear below.

## Controls, and why they are shaped this way

The first version of this harness compared UI text and **passed its controls while
React sat unauthenticated on its login page** for all 30 routes. Its positive
control was *"the wallet screens must differ"* — satisfied by total failure.

Replaced with controls that cannot pass on a broken run:

| Control | Assertion |
|---|---|
| positive | each app is signed in **and on the intended screen**, by a heading unique to it — Angular *Wallet*, React *My Wallet* |
| positive | a route silent on both sides is **reported, not scored as agreement** — two silent pages agree about nothing (0 of 30 were silent) |
| negative | the same app loaded twice shows no endpoint difference |

> **A control that asserts a difference is satisfied by any difference, including
> the failure of the thing under test.** Assert a specific expected value instead.

---

## Finding 1 — WITHDRAWN. It was a harness artifact.

**Originally reported as:** Angular issues 8–9 requests React does not on
`/member/dental`, `/member/vision`, `/member/appointments` and
`/member/online-consult`, because those pages inject `BookingsStore`.

**That measurement is wrong, and the error is in this harness.**
`api-parity-diff.mjs` reaches every route with `page.goto()` — a **full page load**,
which boots the Angular app cold and re-instantiates every root-provided store. A
load that happens **once per session** therefore appears once per route.

**Measured properly** (`03-live/probe-spa-refetch.mjs` — one page load, then in-app
navigation):

| Step | booking-source calls |
|---|---|
| after sign-in, on `/member` | **0** |
| in-app nav → `/member/bookings` | **10** |
| in-app nav → dental | **0** |
| in-app nav → vision | **0** |
| in-app nav → appointments | **0** |
| in-app nav → dental again | **0** |
| **full reload of `/member/dental`** | **10** |

`BookingsStore` loads on first injection and the `activeId === loadedFor` guard
holds. **Navigating between hubs costs nothing.** There is no per-visit
over-fetch, and the scoped-load refactor this finding implied would have been work
against a problem that does not exist.

### What remains, much smaller

If a hub is a member's **cold entry point** — a deep link, a bookmark, or a refresh
on `/member/dental` — that page triggers the full ten-source load for data it does
not display. One load, on cold entry to four routes. Worth knowing; not worth a
store redesign.

### And a correction to `08-empty-vs-unfetched.md`

That file says stores *"load through an `effect()` keyed on
`session.isAuthenticated()`, so they begin fetching **at sign-in**"*. For
`BookingsStore` that is not what happens: **0 calls on `/member` after sign-in**. It
loads when a page first injects it. The effect is keyed on `activeMember()`, and the
store is only constructed when something asks for it.

### The lesson, which is the durable part

**A harness that navigates by reload measures cold-boot cost, not navigation cost.**
Every "Angular only" row in this document was produced that way, so any of them
attributable to a root store being re-instantiated is inflated the same way —
`member/addresses` on profile, settings and the lab/diagnostics screens is the
likely other case. Rows reflecting what a page genuinely fetches for itself
(`transactions/summary` on `/member/transactions`, `member/claims/summary` on
`/member/claims`) are unaffected.

**This was caught by being pushed to fix the finding**, not by review. The
correction came from reading the store before refactoring it — the fix would have
shipped, verified green, and removed nothing real.

## Finding 2 — React's diagnostics ORDERS screen lists LAB orders. NEW, and it is a third instance of entry 14.

`web-member/app/member/diagnostics/orders/page.tsx:40`:

```ts
const response = await fetch('/api/member/lab/orders', { … })
```

…then rows navigate to `/member/diagnostics/orders/${order.orderId}` (`:177`).

**So React's diagnostics orders screen fetches lab orders and presents them as
diagnostics orders.** Angular calls `member/diagnostics/orders`, correctly.

**Worse than the two cart screens entry 14 already records.** Those request a
diagnostics cart from the lab prefix and get a **404** — visibly broken. This one
**succeeds** and shows the member the wrong domain's data. A member with lab orders
and no diagnostics orders sees their lab orders listed under Diagnostics.

Entry 14 extended.

## Finding 3 — the Health checkup tab was permanently empty. FIXED.

React calls `member/ahc/orders` on the bookings list; Angular did not. The read
that traffic could not settle:

- **`bookings-page.ts:27` renders a "Health checkup" tab.**
- **`BookingKind.Ahc` was never produced anywhere** — no mapper emitted it, and
  `BookingsStore` loaded five sources, none of them AHC.
- **The member has a real AHC order** — `AHC-ORD-1786182053508-8GHNX7JM9`, PLACED,
  ₹240 outstanding.

So the tab was not merely unpopulated, it was **stating something false**: a member
with a health checkup on record saw an empty state telling them they had none. That
puts it on the `21-degraded-not-declared.md` ranking with *"No claims yet"* served
to a signed-out member — a screen asserting a fact about the member's situation
that its own data contradicts.

**Fixed:** `AhcOrderDto`, `ahcOrderToBooking`, and AHC added as a sixth source in
`BookingsStore`. The endpoint is reused from `AHC_API.orders` rather than
redeclared — two declarations of one path is the stale-duplicate shape
`22-dead-endpoint-scan.mjs` flags. The all-sources-failed threshold moved 5 → 6;
leaving it would have declared total failure while one source still worked.

**Verified** — `03-live/verify-ahc-bookings-tab.mjs`, **5/5**, non-mutating: the
list now calls `member/ahc/orders`, the order appears under the tab with its
package name, and the dental tab gained no AHC rows (negative control).

**A side effect worth naming:** the row renders **"₹240 still to pay"**, because
`outstanding` is set from `finalPayable` when `paymentStatus` is PENDING. So the
AHC debt from `14-ahc-commit-contract.md` — a committed order with no payment
record — is now at least **visible** to the member. It is still unpayable from the
portal. Disclosure improved; the missing payment leg is untouched and still gated
on inherited finding 11.

## Finding 4 — the AHC payment screen does not re-fetch what it displays

React calls `member/ahc/eligibility` and `member/ahc/package` on
`/member/ahc/booking/payment`; Angular calls neither, relying on its signal store.

**This is the reload defect, visible in the network.** A member who refreshes on
that screen has nothing to render, which is the already-filed AHC reload finding —
recommendation on file: sanction the loss. Traffic confirms the mechanism.

---

## Confirmations of existing findings, now with live evidence

**The active-appointment nudge is on every screen.** `appointments/user/:p/ongoing`
appears **React-only on all 30 routes** — it is mounted in React's member layout.
Filed as a GAP in `02-screens/shell-nav.md` and found dead by the endpoint scan
(`BOOKINGS_API.ongoingByUser`, declared, no caller). The finding is not new; **the
scale is** — it is not one missing screen element, it is one missing on every
member screen.

**`/member/transactions` is a URL collision**, and the traffic is unambiguous:

| | React | Angular |
|---|---|---|
| `/member/transactions` | `wallet/balance` · `wallet/transactions` | `transactions` · `transactions/summary` |

Same URL, different resource — the wallet ledger versus the service-order list.
Corrected in register entry 2 earlier today from reading the source; independently
confirmed here from traffic.

**React's benefits screen 404s three times per visit.** `member/benefit-components`,
`member/coverage-matrix` and `member/wallet-rules` all return **404** live. Recorded
as divergence #1; now measured. Angular calls `wallet/balance` and
`wallet/transactions` instead and renders the same figures.

**Angular fetches `member/addresses` on more screens than React** — profile,
settings, lab/diagnostics orders, AHC booking. `ProfileStore.load()` is called from
several pages. Harmless, cached, noted so it is not re-reported as a difference.

---

## Coverage

**30 routes, 0 silent on both sides**, so every row compared something real.

**Not covered:** routes requiring a journey to reach (cart, vendor, select-slot,
confirm, order and payment detail) — those need navigation, not a page load, and
their endpoints are exercised by the per-vertical harnesses. Write traffic is out of
scope by design: nothing here clicks, and any non-GET seen on a page load would have
been reported. None was.
