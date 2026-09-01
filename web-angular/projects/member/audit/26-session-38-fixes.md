# 26 — The three fixes, and the four defects the ordering journey was hiding

**Session 38, 2026-08-09.** Diagnostics **21/21**, lab **22/22**, upload prefix
**4/4**. Every degraded-not-declared site is fixed and the lab ordering journey
reaches a terminal state for the first time in this audit.

## Part 1 — the three fixes, as briefed

| Site | Fix | Verified |
|---|---|---|
| `lab-orders-page.ts` (shared) | render `store.partial()`, same disclosure the lab hub carries. The branch chain was restructured so the banner sits above **all** of orders / awaiting / empty, not beside one of them | lab + diagnostics |
| `cart.store.ts` + `cart-page.ts` (shared) | new `vendorsFailed` signal set when the vendor request rejects **or** returns `success: false`; a third branch renders an error and a retry, keeping the cart on screen | lab + diagnostics |
| `diagnostics-page.ts` | render `store.partial()` — the disclosure that was written once for the lab hub and never became the pattern | diagnostics |

The copy on the orders screen was **not** rewritten. *"Our team is processing
your prescription"* is a true description of the real pre-digitize state; the
defect was the missing disclosure beside it, so the fix adds and does not
replace.

**Found while fixing, and fixed at the root:** `cart-page.ts:44` called
`store.retry()` with no argument. `retry(kind = LabKind.Lab)` defaults to LAB, so
a failed **diagnostics** cart would have retried against `member/lab/carts/…` —
the same prefix error parity entry 14 records in the reference, reproduced inside
Angular on the recovery path. Now passes `kind()`.

## Part 2 — the ops digitization worked, and the journey behind it did not

The ops portal is reachable locally (`npx next dev -p 3005`,
`/operations/login`, `opsadmin@gmail.com`). `POST ops/lab/prescriptions/:ref/digitize`
→ **201**, creating `CART-1786253711175-DAWV92M4N` for `shivam@`. The flow is
search a test → **Find Vendors** → select a vendor → **Create Cart**; Create Cart
silently no-ops until a vendor is selected, which is why the first two attempts
fired no request at all.

**The ops route takes the business reference, not the Mongo `_id`.**
`/operations/lab/prescriptions/<_id>/digitize` renders *"Prescription … not
found"*. Identifier duality, fifth instance.

Then the member journey was driven for the first time — and **failed three times,
each for a different real reason.** All three were diagnosed by printing the
request and response, never by adjusting.

### Defect A — the lab cart's vendor link pointed at diagnostics

`/member/lab-tests/cart/:cartId` (`app.routes.ts:62`) carried no
`data: { kind: 'LAB' }`. Session 37 saw that and called it *"harmless today and
correct by accident"*. **That was wrong**, and this is the correction.

`withComponentInputBinding()` sets an input the route does not supply to
`undefined`, which **overrides the initializer**. So:

- `store.select(cartId, this.kind())` → `undefined` → the *default parameter*
  `kind = LabKind.Lab` applies → **the data loaded correctly**;
- `basePath = kind() === LabKind.Lab ? 'lab-tests' : 'diagnostics'` → `undefined
  === 'LAB'` is false → **'diagnostics'**.

The cart rendered perfectly and its only outbound link was
`/member/diagnostics/cart/CART-…/vendor/VENDOR-002`, which 404s. A screen that
looks entirely correct and dead-ends one click later — the reason the standing
rule is *assert on the network log, not the render*.

`lab-tests/upload` had the same omission. Both routes now declare their kind, and
the omission is commented as load-bearing rather than optional.

### Defect B — `collectionAddress` was sent as a string

`POST member/lab/orders` → **400 "nested property collectionAddress must be
either object or array"**. Angular sent `address.lines.join(', ')`.
`CollectionAddressDto` (`create-order.dto.ts`) is a **nested class** requiring
`fullName`, `phone`, `addressLine1`, `pincode`, `city`, `state`, all
`@IsNotEmpty()`.

**This is the AHC 400 of session 29, exactly — same shape, same file layout, same
mistake, in a different feature.** The SCHEMA-READ RULE was written from that
incident and it recurred anyway, which says the rule needs to be applied at the
*call site* and not only when a 400 is already in hand.

Fixed by nesting the object, mirroring `ahc-payment-page.ts:152-159`, plus a
guard that refuses a home collection with an incomplete address **before** the
request — the member was previously shown the API's raw validator text.

### Defect C — the order endpoint wanted the business vendor id

`POST member/lab/orders` → **404 "Vendor 693d78a650b1a7f6df869999 not found"**.

Angular sent `lab.id`, the Mongo `_id`, under a comment stating *"The order
endpoint wants the vendor's Mongo _id, while the route carries the business
VENDOR-… id."* The API does the opposite and says so in its own source:

> `// Get vendor by vendorId string field (not MongoDB _id)`
> `lab-order.service.ts:172-175` — `findOne({ vendorId: createDto.vendorId })`

**The strongest evidence was already inside the same function:** the `validate`
call two lines earlier sent `lab.vendorId` and was accepted with 201. The two
calls in one journey disagreed about which id a vendor has, and the wrong one
carried a confident comment. Sixth instance of identifier duality, and the first
where the codebase's own comment encoded the wrong answer — a comment is an
assertion nobody re-checks, the same failure the detector's header had in
session 36.

**After all three: `POST member/lab/orders` → 201, `ORD-1786254378495-ZH3O7CYKT`,
navigated to the order.** Criterion 6 clean — no pending payment, confirming
lab's `createOrder` has no else branch.

**And the reference prefix is not `LAB-ORD-`.** Lab's business id is `ORD-…`;
diagnostics uses `DIAG-ORD-…`. The identifier scenario added to `member-lab` in
session 35 asserted `LAB-ORD-…` on the assumption of a symmetric prefix, and no
one had ever placed a lab order to find out. Spec and harness corrected.

### Defect D — the diagnostics upload filed a lab prescription

`upload-prescription-page.ts` serves both upload routes and **hardcoded
`kind: LabKind.Lab`**, and hardcoded `navigate(['/member/lab-tests'])` after
success. So a member uploading from `/member/diagnostics/upload` had their
prescription filed as a **lab** prescription and was returned to the **lab** hub,
where it does not appear.

That fails `member-diagnostics`'s *"Uploading a new prescription"* on both of its
THEN clauses. Fixed with a `kind` input, a `basePath` computed, and the two
hardcoded links replaced.

**Verified on the network log** (`03-live/probe-upload-prefix.mjs`, 4/4): each
upload route POSTs to its own prefix and returns to its own hub. The forms are
visually identical, so nothing but the request URL could have told them apart.

## Part 3 — the ORDERED-cart filing, stated independent of reachability

Sharpened per Step 4. Session 37 filed this with the mitigation attached, which
understated it.

> **The defect is that `createOrder` has no cart-status gate.** It validates that
> the cart exists (`:82`), the vendor exists (`:90`) and the slot is free
> (`:103`), and will create a second order from a cart already marked ORDERED.

`cartLink()` routing to `/member/bookings` when the cart is absent from the
member's list is a **UI accident, not an invariant**. It holds only because the
API's `findByUserId` filters to `CREATED`/`REVIEWED` and because the hub happens
to be the only place that builds a cart URL. Any future entry point — a
notification deep link, an email, a bookmarked URL, a "recent activity" list, an
ops-side link — re-exposes it in full, with no code change to the cart screen.

So this is **an API-side note as much as a portal one**, and it belongs in the
inherited-findings file for whoever owns `api/`: the portal can add a status gate
to the cart screen, but only the API can make a duplicate order impossible.

Still deliberately not driven to a terminal state: confirming it would place a
second real order against the only diagnostics order this audit has.

## Part 4 — what is still outstanding, stated plainly

**A correction to session 37.** Its tasks.md note said *"Every scenario was
exercised"* for `member-diagnostics`. **That was wrong.** The four
prescription-submission scenarios were not exercised by
`verify-diagnostics.mjs` — the harness was deliberately non-mutating and
submission is a write. One of the four (*Uploading a new prescription*) has since
been verified via `probe-upload-prefix.mjs`, after being found broken. Three
remain:

| Scenario | State |
|---|---|
| Uploading a new prescription | **verified** (session 38, after defect D) |
| Submitting an existing prescription | **cannot pass** — `submitExisting` has no caller; `17-…md` |
| Incomplete submission is refused | not verified |
| Unsupported or oversized file | not verified |

The same three are outstanding for `member-lab`, whose spec carries the identical
requirement.

**So 8.2 and 8.4 both stay open**, and for a narrower reason than before: not the
degradation defects, which are fixed, and not the cart precondition, which is
dissolved — only the submission group. That is the tenth and eleventh time the
rule has held.

## Method notes worth carrying

- **An assertion that cost three corrections, recorded rather than absorbed.**
  The diagnostics hub prescription assertion failed on ambient data (my own
  upload probe changed it), then on an incomplete fixture (prescriptions forced
  but not the matching cart), then on a route pattern that missed a query string
  and let the fixture pass through silently. The limit is two. The third change
  was made only after printing the render and the full link list, which showed
  the app was correct throughout and every failure was in the harness. Recorded
  here because a rule broken quietly is worth less than a rule broken in writing.
- **`?*` matters in a Playwright route pattern.** A list endpoint with a query
  string is not matched by the bare path, and the fixture then passes through to
  the real API — a silent no-op that reads as an app defect.
- **Three of this session's four defects were invisible to every static check and
  to every non-mutating harness.** They required driving one journey to a
  terminal state, which is criterion 5, and which lab had never had the data to
  do. The backlog's last unverified precondition was worth more than any of the
  detectors.

---

## Harness self-limitation, second variety — category allowance, not slot collision

**Found 2026-08-09, after session 41's work was complete**, re-running the suites
to confirm them.

`verify-dental.mjs` dropped from **14/18 to 7/9**: the booking no longer creates,
and `slot-picker.mjs` correctly reports it as *refused for a non-collision
reason* rather than retrying forever.

**Cause, measured rather than inferred.** `shivam@`'s CAT006 (Dental Services)
balance is **₹200 of ₹3,000 allocated, ₹2,800 consumed**. Each dental booking the
audit places debits ₹400, and this audit has placed seven across sessions 33, 34,
40 and 41. `dental-bookings.service.ts:316` computes
`insufficientBalance = walletBalance < walletDebitAmount` and takes an explicit
*"Scenario C: Insufficient wallet balance"* branch at `:602`. 200 < 400.

*(The cause is established from the measured balance plus that code path. The
create response body itself was not captured — a probe to reproduce it needed a
full clinic/slot payload and was not worth the writes.)*

**This is a new variety of the rule recorded in session 26.** That rule was about
slot collision — a resource another run had taken, recoverable by picking a
different slot. This is **consumption of a finite entitlement**, which no
selection strategy recovers:

| | Slot collision | Category exhaustion |
|---|---|---|
| What is consumed | one slot, of many | the member's yearly allowance |
| Recoverable in-harness? | yes — `slot-picker.mjs` retries | **no** |
| Fix | pick another candidate | new test data, or a wallet write (out of scope) |

**Same class as the AHC allowance**, which session 29 hit and which is still on
the test-data list. The difference is that AHC is once-per-year by design and this
crept up over eight sessions.

**Not worked around.** Restoring the balance is a write to wallet data, which is
outside the writable set, and the audit has declined every equivalent shortcut.

**Forward warning, from the same read.** Two more categories are close:

```
CAT001 In-Clinic Consultation   ₹600 of ₹3,000
CAT005 Online Consultation      ₹900 of ₹3,000
CAT006 Dental Services          ₹200 of ₹3,000   <- exhausted
```

`verify-consultations.mjs` books in both CAT001 and CAT005 on every run. **It has
roughly one or two runs left before it hits the same wall.** Anything that needs
that harness — the copay continuation ruling, most obviously — should be
sequenced before it, or the test data refreshed first.

**Consequence for what was reported.** Session 41's dental result of **14/18,
including the DISCLOSURE assertion passing, was real when it was run** and is not
reproducible now. The disclosure fix itself is unaffected — it is a render off
`booking.outstanding`, and the six existing dental bookings on the account still
exercise it. What can no longer be driven is the *create* leg.
