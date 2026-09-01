# 37 — "fix all": every unintegrated endpoint, closed one way or the other

**2026-08-10, session 53.** Brief: *"fix all"*, in answer to the ledger in
`36-invoice-download.md` — six endpoints declared and never called, two items
called blocked, and roughly 35 reference endpoints Angular does not consume.

**Dead-endpoint count: 6 → 0.** Three were wired, three were deleted, and the
distinction between those two groups is the whole content of this document.

| Endpoint | Outcome |
|---|---|
| `BOOKINGS_API.ongoingByUser` | **wired** — active-appointment nudge |
| `LAB_API[kind].cancelPrescription` | **wired** — cancel an uploaded prescription |
| AHC copay payment (`PAYMENTS_API.create`) | **wired** — the leg that never existed |
| `LAB_API.activeCart` ×2 | **deleted** — no reference calls it; the diagnostics twin pointed at the collection |
| `LAB_API.vendorPricing` ×2 | **deleted** — Angular already has this data from `cartVendors`; see part two, where the reason given here was corrected |
| `MEMBER_API.myPolicy` | **deleted** — Angular gets the copay from a better source |
| `AUTH_API.refresh` | **deleted** — no reference implements refresh |

---

## The rule used to decide wire-or-delete

**An endpoint is a defect when a screen makes a claim the portal cannot honour.
It is merely unused when nothing on screen depends on it.**

That is the rule `36-invoice-download.md` applied to pick the invoice out of nine,
and it holds here: the three that were wired were all cases where the member
could see a thing they could not act on, or owed money with nowhere to pay it.
The four that were deleted were absent, not dishonest.

**Deleting is a fix, not an evasion — but only with the shape recorded.** Each
removal leaves a comment naming the path, whether the route exists, and why it
was not wired, because `22-dead-endpoint-scan.mjs`'s standing rule is that a dead
endpoint is not closed by quietly deleting it.

---

## Wired 1 — the active-appointment nudge

`appointments/user/:id/ongoing` was **REACT-ONLY on all 30 routes** in
`35-api-integration-parity.md`. That made it the largest dead endpoint by reach:
not one missing screen element, one missing on every member screen.

**A correction to how that was reported.** The finding said the nudge "is on every
screen". It is not. React mounts it in the layout inside a `lg:hidden` wrapper,
so **a desktop web-member user never sees it** — the component still mounts and
fetches behind the CSS, which is why a desktop-sized harness recorded the call on
all 30 routes while nothing was visible on any of them. **Traffic showed where the
fetch happened, not where the feature was.**

`member/page.tsx:32` imports a `section` variant for desktop and never renders
it. That dead import was not ported: building it would have invented a placement
the reference does not ship.

Angular now matches: a mobile-only banner, a shared store so two mounts cannot
mean two requests, silent on failure because it is an extra affordance over
screens that work without it.

**Side effect:** `RECORDS_API.uploadedDownload` — one of the two declarations the
scan reported as *referenced only inside its own file* — now has a real caller,
because the nudge opens the prescription exactly as the reference does.

## Wired 2 — cancelling an uploaded prescription

The reference offers this on its bookings screen (`bookings/page.tsx:824-885`).
Angular had nine lab and six diagnostic prescriptions on this account and no way
to withdraw any of them.

**Gated on UPLOADED**, because the API refuses everything else
(`lab-prescription.service.ts:322`) — the same gate shape as the invoice's
COMPLETED rule, and found the same way, by reading the service before wiring.

**A flag that could not be reused.** `isCancellable` already exists on `Booking`
and drives cancelling a *booking*, routing to three different endpoints. A lab
ORDER and a lab PRESCRIPTION are both `BookingKind.Lab`, so reusing it would have
sent a prescription cancellation to a booking-cancel route. A separate
`cancelPrescriptionPath` carries it — the same separation `invoicePath` needed
yesterday, for the same reason.

## Wired 3 — the AHC copay payment, and finding 11 answered

**The blocked item from session 51 is unblocked, by evidence rather than by a
ruling.** Finding 11 asked whether AHC payment should be bill-gated as vision's
is. It cannot be: **there is no bill anywhere in the AHC module.** Ops goes
collection → reports → complete (`ahc-ops.controller.ts`), and the word does not
appear in the module at all. There is nothing to gate on, so the payment is
created directly.

This was the one genuine hole in the portal's money handling:
`AHC-ORD-1786182053508-8GHNX7JM9`, PLACED, `copayAmount: 240`,
`paymentStatus: PENDING`, **`paymentId: undefined`**. Dental and appointments
never needed this leg because their create endpoints make the payment themselves
and hand back its id — those journeys only had to stop discarding it. **AHC's
create makes no payment at all**, so there was nothing to discard and nothing to
navigate to.

**Entry 5 is untouched.** The order is committed before the payment is created,
which is the opposite of the reference's payment-first stash-and-redirect.

**Pre-existing debt is not retroactively fixed.** `AHC-ORD-1786182053508-8GHNX7JM9`
predates this and still has no payment record. Making old orders payable would
need an on-demand control on the bookings row — a new affordance, a design call,
and real money writes to test. Filed, not built. The row does at least disclose
the ₹240 (session 51).

---

## Deleted, with the shape recorded

**`LAB_API.activeCart`** — `member/lab/carts/active` exists
(`lab-member.controller.ts:196`) but **nothing in either reference calls it**, and
Angular's cart flow reads the `carts` list. The DIAGNOSTIC twin was worse: declared
as `member/diagnostics/carts`, the **collection** path, because diagnostics has no
`carts/active` route. A silent wrong answer rather than a 404.

**`LAB_API.vendorPricing`** — ⚠ **the reason first given here was wrong; see part
two.** It said no reference calls it. Both reference vendor screens do, from
`web-member/app/`, which the grep behind that claim did not cover. The deletion
survived on a better reason: **Angular already receives this data** on
`carts/:cartId/vendors` and maps it to `CartVendor.prices`, so calling the
endpoint would re-fetch what it holds. What was missing was rendering it, which
part two fixed.

The DIAGNOSTIC twin was additionally a **wrong path** — diagnostics serves pricing
cart-scoped only, at `carts/:cartId/vendors/:vendorId/pricing`
(`diagnostic-member.controller.ts:227`), while the reference's diagnostics screen
calls the **lab** route. **A fourth instance of parity register entry 14.**

**`MEMBER_API.myPolicy`** — and this one is a divergence where **Angular is the
safer app**. React fetches `assignments/my-policy` to derive the copay percentage
client-side (`lib/paymentValidator.ts:69-120`). Angular takes the copay from the
cover-check response, which is the server's own computation. React's fallback when
that fetch fails is `percentage: 0` — **a failed policy read silently charges the
member no copay**, a money error presented as a working screen. Registered as
entry 19.

**`AUTH_API.refresh`** — the API serves it and login returns a `refreshToken`, so
this is an unused API capability rather than a missing feature. **Neither
reference implements refresh**; both ride the 7-day JWT, and `api/.env` is pinned
at `JWT_EXPIRY=7d` for this audit. Building one would invent authentication
behaviour with no reference to check against, on the path where getting it wrong
either logs members out or keeps them signed in when they should not be.

---

## Verification

`03-live/verify-api-integration-fixes.mjs` — **24/24**.

| | Assertion |
|---|---|
| ✔ | the ongoing endpoint is called, and **once** despite two potential mounts |
| ✔ | the banner renders on mobile for a member with an active appointment |
| ✔ | it lands on the doctors tab |
| negative | **the nudge is not visible at 1440px**, matching the reference |
| positive | cancellable prescriptions exist to test against |
| negative | the account holds prescriptions that must **not** be cancellable |
| ✔ | exactly the UPLOADED ones offer a control |
| ✔ | the commit is refused below 10 characters **before any request** |
| ✔ | the POST carries the reason and the `PRES-…` business reference |
| ✔ | the list re-reads and the row is gone (7 → 6) |
| positive | the AHC journey reached a committable step |
| ✔ | the copay payment is created with amount, type and order reference |
| ✔ | the journey continues to that payment |
| negative ×6 | each deleted declaration is absent from source |
| positive | the scanner can still see declarations that do exist |

### One real mutation, and why

The harness **cancels one real UPLOADED lab prescription**. The member held seven;
a prescription is replenishable through the upload flow, unlike a CAT allowance,
which is not. Interception cannot prove the three things that matter — that the
API accepts the body, that the reason rule is satisfied, and that the row
disappears — and those are exactly the class of defect that killed three lab-order
attempts in session 38. Nothing touched policy, assignment or wallet data.

**AHC was NOT run for real.** The allowance is once per member per policy year and
this account's is consumed (`isEligible: false, "Already booked AHC for this
policy year"`). The branch is forced by interception; no payment record exists.

### Three harness faults, recorded rather than quietly fixed

- **`goto()` between journey steps wiped the store.** The AHC selection lives in a
  signal store, and re-navigating by URL re-boots the app, so the harness reached
  *"Nothing to confirm"* and reported the feature broken. It was not. Same family
  as the withdrawn over-fetch finding: **a harness that navigates by reload is not
  navigating.**
- **An ambiguous accessible name.** The commit button and every other row's
  trigger both read "Cancel prescription", so `.last()` matched a different row's
  enabled trigger and the disabled-below-10-characters control failed while the
  code was correct. The commit now reads "Yes, cancel it" — a usability fix as
  much as a harness one.
- **A gate control that passed by construction.** Counting `PRES-` on screen
  counted only uploaded rows, because a DIGITIZED prescription renders as a cart.
  7 of 7 "passed" while proving nothing. Replaced with a count from the API.

### A defect this session introduced and caught

The prescription gate was written but **silently not applied** — the patch matched
on a field order that no longer existed after an earlier edit, and the script
asserted only a total count, which still passed. The control caught it: zero
cancel buttons against seven UPLOADED prescriptions. **An assertion on a count is
not an assertion on the thing you changed.**

---

## What was NOT done, and why

**The ~35 reference endpoints Angular does not consume** — address editing, claim
document download, order cancellation, AHC report download. Angular has no
affordance for any of them, so nothing on screen lies to the member. Porting them
is a migration-completeness decision, not an integration fix, and it remains the
scope call reserved for the user.

**Retroactively paying the existing AHC debt** — see above.

**Three unguarded prefill effects** still stand (`clinics-page.ts:114`,
`vendor-booking-page.ts:308`, `ahc-booking-page.ts:147`). They are a separate
filed finding about effects, not about API integration.

**Finding 13** — `GET appointments/user/:id` returns no payment fields. API-side,
and `api/src/**` is read-only for this audit. Unchanged and unfixable from here.

**AHC has no spec of its own.** The new payment requirement went into
`member-transactions-payments`, and the nudge into `member-consultations`, because
the spec set has no AHC capability at all. That is a real gap in the spec set,
recorded here rather than papered over by inventing one in passing.

## What a reader should NOT conclude

**Not that the migration is now API-complete.** Zero *dead declarations* is not
zero *missing features*; the ~35 above are untouched.

**Not that the AHC payment leg is proven.** Its client logic is verified by forced
branch. No real AHC order has ever exercised it, and none can on this account
until the allowance resets — test-data item 1.

---

# PART TWO — *"fix if left dont change flow"*

The same session, after the endpoint work. The remaining list was re-measured
rather than re-quoted, and the flow-change constraint from `36` was reapplied.

## The ~35 was wrong. It is 15, and most of those are not gaps

`~35 unconsumed reference endpoints` had been carried across several sessions
from `01-endpoint-diff.md`. Re-measured: **15**, and the first run of the
re-measurement said 24 because **my own matcher required a slash**, so Angular's
single-segment declarations (`payments`, `transactions`, `appointments`,
`notifications`, `doctors`) counted as missing while being called everywhere.

**A number repeated across sessions without re-measurement is a claim, not a
finding.** It had been quoted three times.

Of the 15, after triage:

| Not a gap | Why |
|---|---|
| `member/benefits/CAT006\|CAT007/services` | Angular **has** it, parameterised (`benefit-services.ts:18`); the reference hardcodes the category |
| `wallet/balance:p`, `member/prescriptions:p`, `member/digital-prescriptions:p` | normalisation artifacts of `?query` strings |
| `wallet/update` | the reference debits the wallet from the client; Angular lets the API do it — the booking-first architecture, working |
| `payments/:p/complete` | **the API has no such route** — `mark-paid` and `cancel` are the only two. The reference calls an endpoint that cannot answer |

| Left deliberately | Why |
|---|---|
| `video-consultations/join`, `/:id/status` | joining a call is a new destination — **a flow change** |
| `location/autocomplete`, `/reverse-geocode` | address autocomplete; an enhancement, not a claim the portal fails to honour |
| `member/claims/:id/resubmit-documents` | responding to a rejected claim needs an upload form and a state the portal does not model yet |
| `clinics/:id` | the reference re-fetches a clinic Angular already holds |

## Fixed — three, none of them a flow change

**Claim documents are downloadable.** The detail screen said *"3 documents
submitted with this claim"* beside no way to open any of them — the same shape as
the invoice, and the same fix. `CLAIMS_API.file` is now declared and called.
The `:userId` segment is decorative: the API resolves the claim **by filename**
and authorises against the session (`memberclaims.controller.ts:327-355`).

**Per-test prices on the vendor screen** — and this one reversed twice, which is
the most useful part of this section:

1. Deleted `vendorPricing` in part one, saying *"no reference calls it"*.
2. **That was false.** The grep covered only `web-member/lib/api/`; both vendor
   screens call it from `web-member/app/`. Restored it.
3. **The restore was also wrong.** `GET carts/:cartId/vendors` already returns
   `pricing[]` per vendor and `toCartVendor` already maps it to
   `CartVendor.prices` (`cart.ts:201`). Angular had the data and never rendered
   it. Deleted again — and the gap closed by **rendering**, with no new request.

The deletion was right, the stated reason was wrong, and a wrong reason is not a
harmless thing to leave in a comment: it is what the next reader will act on.
The note in `lab.mapper.ts` now records both the error and the real reason.

*(The diagnostics twin was additionally a wrong path — diagnostics prices only
cart-scoped. The reference's diagnostics vendor screen calls the **lab** route.
Entry 14, again.)*

**The three unguarded prefill effects are latched.** Reading `pincode()` inside
the seeding effect made it a dependency, so **clearing the field re-filled it** —
a member could not search any pincode but their own. One-shot latch plus
`untracked`. Detector: **UNGUARDED 3 → 0**, controls passing.

## Verification

`03-live/verify-remaining-gaps.mjs` — **8/8, and 1 explicitly blocked.**
Non-mutating throughout.

Claim documents: listed not counted · a download control each · the previously
uncalled file route requested · failure disclosed rather than silent.
Latch: seeded from the profile · **a cleared pincode stays cleared** · a
different pincode can be searched.

**Blocked, and deliberately not scored as a pass:** the per-test pricing rows.
This account has **no lab or diagnostic cart** — both endpoints return `[]` — so
the vendor screen cannot be reached at all. The harness prints `SKIP` and counts
it separately. *An unrunnable assertion that scores green is how a harness comes
to report success for a feature nobody exercised.*

## Still not done

- **`resubmit-documents`**, address autocomplete, video consultations — reasons
  above.
- **The existing AHC debt** and **finding 13** — unchanged from part one.
- **Per-test pricing is unverified**, pending a cart on the test account.
