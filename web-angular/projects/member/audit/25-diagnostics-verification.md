# 25 — Diagnostics verified: 18/21, and the three failures are the app's

**Run:** 2026-08-09, session 37. `03-live/verify-diagnostics.mjs`, **non-mutating
throughout** — criterion 6 clean, no order placed, no prescription uploaded.

Unlike lab, this account has real diagnostics data: one cart
(`DIAG-CART-1782129431229-MFGEHVOLQ`, status ORDERED), one order
(`DIAG-ORD-1782129504669-XF1CC92BQ`), one DIGITIZED prescription and one
UPLOADED one. So the cart, vendor, slot and order screens were exercised against
real payloads rather than fixtures, and only the failure states were forced.

## The result

**18 pass, 3 fail. All three failures are the degraded-not-declared class**, and
they are the reason 8.4 does not close.

Everything else holds: the prefix question, both identifier clauses, vendors and
prices on a real cart, slots on a real vendor, the wallet summary, orders listed
with status, the empty state distinguishable from a failure, family-member
following, and criterion 6.

## Step 1 — the spec did NOT inherit lab's endpoints, and Angular does not either

This vertical was flagged because the reference is incoherent about which prefix
serves a diagnostics cart. Confirmed, and it is worse than "incoherent":

| Reference screen | Enclosing scope | Fetches |
|---|---|---|
| `diagnostics/cart/[id]/page.tsx` | `CartDetailPage.fetchCart` / `.fetchVendors` | `member/**lab**/carts/:id` and `/vendors` |
| `diagnostics/cart/[id]/vendor/[vendorId]/page.tsx` | vendor page fetch | `member/**lab**/carts/:id` |
| `diagnostics/booking/[cartId]/page.tsx` | booking page fetch | `member/**diagnostics**/carts/:id` |

The API backs the two prefixes with **separate models and separate collections**
— `LabCart` → `lab_carts`, `DiagnosticCart` → `diagnostic_carts`. They cannot
both be right.

**Proved live, read-only** (`03-live/probe-cart-prefix.mjs`, three GETs):

```
PASS  POSITIVE CONTROL — GET member/diagnostics/carts/DIAG-CART-…  -> 200, cart returned
PASS  NEGATIVE CONTROL — GET member/lab/carts                      -> 200 (prefix alive, 0 carts)
      THE CLAIM        — GET member/lab/carts/DIAG-CART-…          -> 404
                         "Cart DIAG-CART-1782129431229-MFGEHVOLQ not found"
```

So **the reference's diagnostics cart and vendor screens are broken for every
diagnostics cart.** Their failure path is `throw` → `catch` →
`alert('Failed to fetch cart')`.

**Angular does not repeat it, and that is asserted on the network log rather than
on the render** — a screen that renders correctly proves nothing about which URL
it called:

```
PASS  PREFIX — diagnostics: /api/member/diagnostics/carts/DIAG-CART-… 200
                            …/vendors 200          | lab: none
```

Every diagnostics route passes `data: { kind: 'DIAGNOSTIC' }`
(`app.routes.ts:85-111`) and `withComponentInputBinding()` is on
(`app.config.ts:21`), so the shared `CartPage`/`VendorBookingPage` resolve
`LAB_API[Diagnostic]`. **The spec carried no endpoint claim to inherit** — its
stated difference 2 is about *pricing* and is accurate. Silence again, as with
lab's cart origin, rather than a wrong statement.

Filed as **parity register entry 14**, do-not-port. This is the constraint's
"the reference is the acceptance criterion for intended behaviour, not for
defects it documents in its own error handling" applied literally.

**One trap avoided:** `CartPage` at `app.routes.ts:62` (the *lab* cart route)
carries **no** `data: { kind: 'LAB' }` and relies on the component's default
`input<LabKind>(LabKind.Lab)`. Harmless today and correct by accident; noted
because it is the one route in the pair that would silently follow a change to
that default.

## Step 1 — cart origin: diagnostics works exactly as lab does

`POST ops/diagnostics/prescriptions/:id/digitize`
(`diagnostic-ops.controller.ts:136`) calls `createCart` at `:153`, gated on
`status === DIGITIZED && items`. Same mechanism as
`lab-ops.controller.ts:93`/`:134`. **Read rather than inherited**, as instructed —
and the read found one difference lab does not have: diagnostics also exposes a
standalone `@Post('prescriptions/:id/delay')` (`:101`) where lab folds delay into
`digitize`/`status`. Ops-side only, no member-visible consequence; recorded so it
is not re-derived.

`member-diagnostics` got the same addition `member-lab` got: a cart-origin Rule
plus an awaiting-digitization scenario.

## The three defects

All three are the class named in `21-degraded-not-declared.md`, and they are
**not three copies of one bug** — the sites differ in kind, which matters for
how they get fixed.

### 1. The diagnostics HUB does not name a partial failure — NEW, its own component

`diagnostics-page.ts` never reads `store.partial()`. `lab-tests-page.ts:200-205`
does, and renders *"Could not load orders. Everything else is shown below."*
The two hubs are deliberately different components (spec difference 1 — the
reference gives diagnostics its own layout), so the disclosure was written once
and not carried across.

Forced from a cold context with `member/diagnostics/orders` 500ing, the hub
renders **completely normally**: Get Started, Upload New Prescription, Use
Existing Prescription, Recent Prescriptions, Review Cart, View Diagnostic
Bookings. Nothing indicates anything failed.

**This is the finding that makes the class two verticals rather than one.** It is
also the one that removes the comfortable reading of session 35 — that lab's hub
being correct meant the pattern was "mostly right, two sites missed". Across both
verticals the tally is **one site correct out of four**.

| Site | Component | Tells the member? |
|---|---|---|
| lab hub | `lab-tests-page.ts` | **yes** — the class's only positive control |
| **diagnostics hub** | `diagnostics-page.ts` | **no — NEW** |
| lab/diagnostics orders | `lab-orders-page.ts` (shared) | no |
| lab/diagnostics cart | `CartPage` + `cart.store.ts` (shared) | no, and wrongly |

### 2. The orders screen does not say the order list failed — SHARED, so diagnostics inherits it

Same component and same store as lab, so this is lab's defect 1 reached by a
second route rather than a new one. Worth recording anyway: it **doubles the
blast radius** of a defect that was filed as a lab defect.

The render under a forced 500 is verbatim lab's:

> Awaiting the lab · Uploaded prescription DIAG-RX-1786007360488-ZWLYJP5V2 ·
> 6 Aug 2026 · Our team is processing…

### 3. A failed vendor request is reported as "no lab has quoted" — SHARED

`cart.store.ts:170-174`, reached through the diagnostics cart route. Contradicts
`member-diagnostics`'s own *"an error state is shown, distinct from the no-vendor
empty state, and a retry is offered"* exactly as it contradicts lab's.

**Discriminated on branch-unique copy**, not on `/try again/` — the empty branch
ends *"Try again shortly."*, which is what made the lab version of this assertion
pass on the wrong branch for a whole session. Both branches were rendered and
printed; they are textually identical, which is the defect.

A cosmetic aggravation, not filed separately: the copy says **"No lab partners
available yet — No lab in your area has quoted"** on a *diagnostics* cart, where
the vendor is a diagnostic centre.

## A finding that is not a defect: the awaiting notice is conditional

`lab-orders-page.ts` branches `loading → error → orders → actionable → empty`
(`:35,37,39,76,103`). **"Awaiting the lab" is an else-branch of the orders list**,
so a member with even one past order is never told that a newly submitted
prescription is being processed. The comment at `:78` says the block exists so an
upload does not read as lost — it does that job only for members with no orders.

Verified both ways: forced-empty orders → the notice appears with the pending
`DIAG-RX-…`; real orders present → the notice is absent and the pending
prescription is not mentioned on that screen at all.

**Not filed as a defect**, because the hub does show the prescription with its
status either way, and the reference answers this question on the hub too. It is
recorded because it corrected a spec: the scenario added to `member-lab` in
session 36 named "the lab screen" with no precondition, which described behaviour
the portal does not have. Both specs now carry the precondition.

**Method note.** This assertion failed twice — first on the hub, then on the live
orders screen. It was adjusted **once** and then the component was read. The
second failure was not fixed by a third adjustment; the scenario was restated to
match what the code does and the conditionality became its own finding. Printing
the render located the copy; reading the branch chain explained it.

## The ORDERED cart re-opens as a live cart — filed, not driven

Deep-linking `/member/diagnostics/cart/DIAG-CART-…` for a cart whose status is
**ORDERED** renders a fully live cart: an `ORDERED ✓` chip beside *"Select a
lab"*, a selectable vendor, a slot picker, and an enabled **Confirm booking**.
`createOrder` (`diagnostic-order.service.ts`) checks the cart exists (`:82`), the
vendor exists (`:90`) and the slot (`:103`) — **there is no cart-status gate**.

**Exposure is low, and Angular is the reason.** `cartLink()`
(`diagnostics-page.ts:196-199`) routes to `/member/bookings` when the cart is not
in the member's list, and the API's `findByUserId` filters to
`CREATED`/`REVIEWED` — so an ORDERED cart is unreachable from the hub and is
reached only by a stale link, history entry or direct URL.

**Deliberately not driven to a terminal state.** Confirming would place a second
real order against a consumed cart, destroying the only diagnostics order this
audit has. Recorded as observed-affordance plus a read of the API's gates, and
explicitly **not** as a proven duplicate-order path.

## Task status

**8.4 does not close.** Every scenario in `member-diagnostics` was exercised, and
*Vendor list fails to load* is failed by the app. The rule that a task is not
checked while a scenario is outstanding has held ten times and holds here — a
scenario the app fails is a stronger reason not to check it than one that was
never run.

What would close it: fixes 1 and 3 above. Both are the one-line-of-state shape
already described in `21-degraded-not-declared.md` §"The shape of the fix", plus
one `store.partial()` render on the diagnostics hub.
