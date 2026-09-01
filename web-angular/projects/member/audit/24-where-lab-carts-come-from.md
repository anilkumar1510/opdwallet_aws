# 24 — Where lab carts come from

**Settled:** 2026-08-09, session 36.
**Supersedes:** session 35's *"BLOCKER, structural: a member cannot create a lab
cart."* **That is not a blocker, and it is not a seeding request.** It is an
unstated precondition, and the fix is one Rule in the spec.

## The question

Session 35 found `createCart` called from exactly one place —
`lab-ops.controller.ts:134` — with no cart POST on the member controller and
`lab_carts` empty for the test account. It filed that as a structural blocker on
every ordering scenario in `member-lab` and routed it to whoever owns test data,
alongside the AHC allowance and the dependent credential.

The prompt for this session put the right question to it: **does the reference
create carts, and through what endpoint?** Two possible answers, with different
consequences —

- reference creates them, Angular does not → a fourth lab finding, a real gap;
- reference does not either → the spec describes an ops-initiated flow as if it
  were member-initiated, and needs rewriting rather than seeding.

## The answer: nobody creates a cart from the member side, on either app

**The API has no cart-creation route at all.** Every `carts` route in the live
route table (`00-inventories/api-routes.md`) is a read or a delete:

```
GET    /api/member/lab/carts                 GET  /api/member/diagnostics/carts
GET    /api/member/lab/carts/:cartId         GET  /api/member/diagnostics/carts/:cartId
GET    /api/member/lab/carts/:cartId/vendors GET  /api/member/diagnostics/carts/:cartId/vendors
GET    /api/member/lab/carts/active          GET  …/carts/:cartId/vendors/:vendorId/pricing
DELETE /api/member/lab/carts/:cartId
```

No `POST` matching `carts` exists anywhere in the table — not on the member
prefix, not on the ops prefix.

**Every reference call is a GET.** All 15 cart call sites in `web-member/` read:
the two hubs list them (`lab-tests/page.tsx:86`, `diagnostics/page.tsx:69`), the
cart, vendor and booking screens fetch one by id, and the bookings screen lists
them per profile (`bookings/page.tsx:412,466`). Not one is a write.

**A cart is created when ops digitizes the member's prescription.** `createCart`
sits in the body of `POST /api/ops/lab/prescriptions/:id/digitize` — the
`@Post('prescriptions/:id/digitize')` handler at `lab-ops.controller.ts:93`,
under `@Controller('ops/lab')`. The cart is a *product of digitization*, not a
member action, which is why there is no route to create one directly.

So the real lab journey is:

> member uploads a prescription → **ops digitizes it, which creates the cart** →
> member opens the cart, compares vendors, picks a slot, places the order.

**The portal's own copy already said so.** The lab hub's pre-digitize state reads
*"Awaiting the lab — our team is processing your prescription. You will be
notified once it is ready for ordering."* That is an accurate description of
waiting for ops, and it was sitting in front of this audit for two sessions
(see the sharpening note in `21-degraded-not-declared.md`).

## What this changes in the spec — less than expected

**Checked before asserting, and the expected finding was not there.**
`member-lab`'s cart scenarios do **not** claim the member creates a cart:

> #### Scenario: Vendors listed for a cart
> - **GIVEN** a cart containing lab tests
> - **WHEN** the member opens it

`GIVEN a cart` — provenance unstated, and every ordering scenario is phrased the
same way. So the prompt's second branch ("the spec describes an ops-initiated
flow as if it were member-initiated") is **not what happened**. The spec is not
wrong; it is **silent**, and the silence is what let session 35 read the missing
POST as a defect rather than as the design.

Recording that plainly because the framing was mine to check and the check said
no: *the spec needs an addition, not a rewrite.* Four sessions of this audit have
now corrected a premise by reading the artifact instead of arguing from it, and
this is the fifth.

**Amendment made:** a Rule under *Cart and vendor selection* stating that a cart
comes into existence when the lab digitizes a submitted prescription, that the
member never creates one, and that a submitted prescription with no cart yet is a
normal waiting state rather than a failure. That last clause is load-bearing —
it is the thing that distinguishes "awaiting the lab" from a broken screen, and
it is what defect 1 in `21-…md` fails to honour.

## Consequences

1. **The lab ordering scenarios are unblocked in principle, and their precondition
   is an ops action, not a seed.** A cart for `shivam@` requires someone to
   digitize the pending prescription through the ops portal
   (`POST ops/lab/prescriptions/:id/digitize`). That is a different ask, with a
   different owner, from the two genuine seeding requests — and unlike them it is
   reachable through an existing UI rather than requiring a DB write.
2. **The seeding request shrinks back to two items**: an unused AHC allowance and
   a dependent credential. The lab cart should be **removed** from it. Session 35
   joined the three on the reasonable-looking grounds that all three were "test
   data we do not have"; they are not the same kind of thing.
3. **`8.2` stays open** and its remaining leg is now precisely stated: lab's
   ordering scenarios need a digitized prescription. Everything else in
   `member-lab` has been verified or filed.
4. **Diagnostics inherits the question, and must not inherit the answer.** Its
   controller is a different file and was not read here. `ops/diagnostics` does
   appear in the route table (`PATCH /api/ops/diagnostics/carts/:cartId/display`),
   so an ops surface exists — but whether its cart is created by the same
   digitize step is unverified. **Read it; do not assume lab's shape.**

## A reference inconsistency, noted for the diagnostics vertical

The reference's diagnostics cart screens call the **lab** endpoints:

```
web-member/app/member/diagnostics/cart/[id]/page.tsx:62,84
    /api/member/lab/carts/${cartId}
    /api/member/lab/carts/${cartId}/vendors
web-member/app/member/diagnostics/cart/[id]/vendor/[vendorId]/page.tsx:91
    /api/member/lab/carts/${cartId}
```

while its diagnostics *booking* screen calls the diagnostics ones
(`diagnostics/booking/[cartId]/page.tsx:125,129`). The reference is internally
inconsistent about which prefix serves a diagnostics cart.

**Not resolved here** — it needs the diagnostics reference read that Step 3 was
going to do, and it is exactly the kind of thing that would be mis-transcribed by
copying lab. Whether the lab prefix works for a diagnostics cart id is an API
question; if it does, the two prefixes share storage and the "same contract on
two prefixes" premise in `lab.mapper.ts:8-11` is stronger than documented. If it
does not, the reference has a live bug on its diagnostics cart screens.

Flagged in advance so the diagnostics session checks it rather than discovering it.
