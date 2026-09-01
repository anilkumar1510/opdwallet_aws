# Parity divergences

Every intentional difference between the Angular member portal and
`web-member/`. A parity failure is either a bug to fix or an entry here — never
something silently skipped.

`web-member/` and `web-member-rn/` are read-only reference. Nothing in this file
proposes changing them, or `api/`.

---

## 1. Benefits cards use wallet figures, not the reference's hardcoded ones

**Route:** `/member/benefits`

web-member fetches `member/benefit-components`, `member/wallet-rules` and
`member/coverage-matrix`. **All three answer 404**, and each call is guarded by
`if (response.ok)`, so the screen silently falls back to eight hardcoded cards
with invented figures (`₹30,000/year`, `40% used`) and hides its wallet-rules
panel entirely.

Angular renders the same eight categories from `wallet/balance`, which is real
and already loaded.

**Why:** the hardcoded figures contradict the member's actual wallet. Live,
CAT001 is ₹3,000 allocated with ₹1,320 consumed; the reference card claims
₹30,000 and 40%. Porting the fake numbers would put two different answers about
the same benefit on two screens of the same app.

**Revisit if:** those three endpoints are ever implemented.

---

## 2. ~~`/member/orders` reuses the transactions screen~~ — RESOLVED, session 54

> **This divergence no longer exists.** Angular now routes exactly as the
> reference does: `/member/transactions` is the **wallet ledger**,
> `/member/orders` is the **service-order list** titled "Order History".
>
> The swap was resolved on the member's instruction after they clicked the home
> balance card and found it opened the wallet page rather than a transaction
> history. It had also left the home quicklink **labelled "Transaction History"
> opening a list of service orders** — a tile naming a screen that did not exist.
>
> The original entry is kept below because it records why the swap was made and
> what it cost. See `audit/38-wallet-ledger-summary.md`.

### Original entry

## 2. `/member/orders` reuses the transactions screen

**Route:** `/member/orders`

web-member has two list screens over different resources:

| Route | Reads | Angular |
|---|---|---|
| `/member/orders` | `transactions` + `transactions/summary` | this screen |
| `/member/transactions` | `wallet/transactions` + `wallet/balance` | `/member/wallet` |

The Angular `TransactionsPage` already renders `transactions` plus the same four
summary cards (Total Orders, Total Spent, From Wallet, Self Paid), so
`/member/orders` points at it rather than duplicating a component.

**Not ported:** the orders screen's two server-side filters, `status` and
`serviceType`. The list is otherwise identical.

**Consequence:** `/member/transactions` and `/member/orders` currently render the
same screen. The wallet ledger that web-member shows at `/member/transactions`
is on `/member/wallet`.

> ### CORRECTED 2026-08-10, session 53 — the ledger did not move, and the real
> ### divergence is sharper than this entry states
>
> The line above implies web-member keeps its ledger at `/member/transactions` and
> Angular relocated it. **It does not. React's `/member/wallet` shows the ledger
> too — it is the default tab.**
>
> `app/member/wallet/page.tsx:111` — `activeTab: 'transactions' | 'categories'`,
> initialised to `'transactions'`; `:399-404` fetches balance and
> `wallet/transactions` in parallel. So **clicking Wallet in React lands on
> transaction history**, exactly as it does in Angular. React simply *also* exposes
> the ledger at a second route.
>
> **The genuine divergence, which this entry never stated:**
> **`/member/transactions` renders a different resource in each app.**
>
> | Route | React | Angular |
> |---|---|---|
> | `/member/wallet` | balance + ledger, tabbed | balance + ledger, one page |
> | `/member/transactions` | **the wallet ledger** | **the service-order list** |
>
> Same URL, different content. **A deep link or bookmark to
> `/member/transactions` shows a member their wallet ledger in one app and their
> service orders in the other.** That is the thing worth revisiting, and it was
> obscured by describing the change as the ledger having moved.
>
> **UI difference on the wallet screen itself, previously unrecorded:** React is
> **tabbed** (*Transactions* | *Categories*) under an *My Wallet* heading; Angular
> is **one scrolling page** headed *Wallet* with three sections — *Used by each
> member*, *Benefits*, *Activity*. Same content, different navigation model, and
> two of the three section labels are renamed (*Categories* → *Benefits*,
> *Transactions* → *Activity*).

**Revisit if:** the two filters are wanted, or — more likely — the URL collision
above is judged a problem for deep links.

---

## 3. Pharmacy is static in both apps

**Route:** `/member/pharmacy`

Not a divergence in content — recorded because the Angular *placeholder* used to
claim the feature "has not moved over yet and is still available in the current
member portal", which was false. web-member's pharmacy page is 121 lines of
static "Coming Soon" copy with no API call. The Angular screen now says the same
thing.

CAT002 still allocates and consumes on the live wallet (₹800 of ₹3,000); that
spend arrives through claims, not through this screen.

---

## 4. The lab/diagnostic booking wizard is two routes, not one

**Reference:** `/member/lab-tests/booking/[cartId]`, `/member/diagnostics/booking/[cartId]`
**Angular:** `/member/{lab-tests,diagnostics}/cart/:cartId` then `.../cart/:cartId/vendor/:vendorId`

web-member runs vendor → slot → payment as three `setStep` stages behind one
URL. Angular splits the same three stages across two routes, so a chosen vendor
is linkable and the back button steps back through the journey rather than
leaving it.

Same flow, same endpoints, same order:

| Step | Endpoint |
|---|---|
| load cart | `member/{lab,diagnostics}/carts/:cartId` |
| quotes | `member/{lab,diagnostics}/carts/:cartId/vendors` |
| slots | `member/{lab,diagnostics}/vendors/:vendorId/slots?date=` |
| pre-flight | `member/{lab,diagnostics}/orders/validate` |
| place | `member/{lab,diagnostics}/orders` |

The inventory tool reports the reference's `booking/:p` route as MISSING because
it compares URLs, not journeys. That row is expected.

**Revisit if:** deep links to the reference's `/booking/:cartId` URL need to
keep working, in which case add a redirect to the cart route.

---

## 5. Payment never precedes booking creation, anywhere

**Routes:** `/member/payments/:paymentId`, `/member/appointments/confirm`,
`/member/online-consult/confirm`, and **every paid journey** — this entry is
scoped to the ordering, not to a screen.

> **WIDENED 2026-08-07** from one screen to a portal-wide rule. It was scoped to
> the payments screen; transcription of the appointments vertical found the same
> ordering inside `web-member`'s own confirm screen, and the per-screen scope
> would have forced the same argument seven more times — once per remaining paid
> journey.

web-member's payment screen creates the underlying booking — dental, lab,
diagnostic or AHC — and *then* marks the payment paid, because those journeys
defer creation until after payment.

Every journey here creates its booking at the confirm step, so by the time a
payment exists the booking already does. The Angular screen therefore performs
only `POST payments/:id/mark-paid`.

`POST vision-bookings/:id/process-payment` is ported and runs on the vision
payment screen: it debits the wallet, and when a copay or excess remains it
returns a `paymentId` and the journey continues at the gateway screen above.

### The widening — appointments confirm, and why booking-first is sanctioned

`web-member/app/member/appointments/confirm/page.tsx:137-157` creates the
appointment **after** payment. Angular does the opposite:
`core/appointments/booking.store.ts:108,120` and
`features/appointments/appointment-confirm-page.ts:210,226` run `validate()` then
`create()`, with no payment step between. **That divergence is sanctioned here**,
where it was previously undocumented.

*Why booking-first, stated without reference to the cost of reverting* (entry 10's
first question): payment-first means a payment can succeed with no booking behind
it. The member is charged and has nothing to point at. Booking-first fails safe;
payment-first fails expensive.

This is not hypothetical. `audit/05-inherited-api-findings.md` §5 and §8 record
**13 COMPLETED payments with no booking, ₹6,520**, including three
(`PAY-20260130-0043/0044/0046`) belonging to a member with **no appointment on any
date**. Those rows are what payment-first produces.

### The copay leg — raised session 33, RULED session 34

**This entry does not merely permit the payment continuation; it prescribes it.**

The question raised was what happens to the member's share once the booking
exists first. Dental and appointments both create their copay payment **on
create**, server side, and Angular's journey used to end at the bookings list —
fourteen PENDING copays accumulated on the test account during this audit, twelve
appointment and two dental, none signposted to the member.

**That was never an ordering question.** The booking is already committed and the
wallet already debited by the time the payment exists, so navigating the member to
settle it is booking-first, payment-second — this entry's own shape, not an
exception to it. Filed as a **defect against Angular**, fixed in session 34: both
stores now carry the `paymentId` their create returns and both confirm pages
navigate to `/member/payments/:paymentId` when something is owed.

**The distinction from the reference, which is the part worth keeping:** React
stashes the booking in `sessionStorage` and creates it *after* payment
(`PaymentProcessor.tsx:227,284`). Angular creates the booking, then navigates to
settle a payment that already exists. **Same destination, opposite mechanism** —
this entry objects to the mechanism, never to the destination.

The unbuilt AHC payment leg inherits the ruling. Evidence and controls:
`audit/20-copay-continuation.md`.

### The general rule this establishes

> **A reference behaviour whose own error handling anticipates the failure it
> causes is a defect, not a specification.**

Apply it without needing this history. The reference's catch block reads
*"Payment successful but failed to book appointment"* and its log reads *"Error
creating appointment after payment"*. A message that names the failure mode is an
acknowledgement of a known defect, not a description of intended behaviour, and it
does not get transcribed into a spec.

"Match the reference" is a method for recovering **intended** behaviour from a
working implementation. It has never been a mandate to reproduce defects — the
no-new-flows exemption list has carried two such cases since session one
(`ResponsiveLayout`'s mock user, `getBalance`'s `this`). This is the third, and
the rule above is what generalises them.

**Revisit if:** a journey genuinely requires payment before a booking record can
exist — in which case the booking should be created in a pending state first, not
skipped.

---

## 6. Endpoints web-member calls that Angular does not

Reported by `node tools/parity-endpoints.mjs`. Each is here on purpose.

| Endpoint | Why not |
|---|---|
| `member/benefit-components`, `member/coverage-matrix`, `member/wallet-rules` | All 404. See divergence 1. |
| `admin/lab/vendors` | **403 for a member.** The reference calls an admin route from its lab vendor screen; it cannot succeed for a member and its result is unused. |
| `location/autocomplete`, `location/reverse-geocode` | Location filter on doctor search. Reverse-geocode works; autocomplete needs a `query` param. Not ported — it is a search enhancement, not part of any booking flow. |
| `clinics/:clinicId` | Single-clinic lookup on the vision confirm screen. The clinic is already in `clinics` from the list call, so a second request would fetch what is in memory. |
| `member/claims/:id/resubmit-documents` | Only reachable from a `DOCUMENTS_REQUIRED` claim. No seeded claim is in that state. |
| `member/profile/:id`, `users/:id/dependents`, `payments`, `payments/:id/complete` | Declared in reachable `lib/` modules; no screen call site found. |
| `video-consultations/join`, `video-consultations/:id/status` | Belong to `/member/consultations/:appointmentId`, which is not ported — it needs `@daily-co/daily-js`. |

---

## 7. Lab and diagnostics follow the viewed family member everywhere

**Routes:** `/member/lab-tests`, `/member/diagnostics`, `/member/bookings`

web-member is inconsistent with itself here. Its **bookings** page passes
`userId=viewingUserId` to `member/lab/{orders,carts,prescriptions}` and
`member/diagnostics/orders`; its **lab-tests** and **diagnostics** pages pass
nothing, so those two screens show the signed-in member's records even while a
dependent is being viewed.

Angular passes `userId` on all of them. Verified the API filters: for shivam@,
`member/lab/prescriptions` returns 5 without the param and for self, and 0 for
the dependent.

**Why:** the alternative is showing one member's prescriptions under another
member's name. The endpoints support the filter; only the reference's two
screens forget to use it.

**This also fixed a gap of my own:** `BookingsStore` previously skipped lab and
diagnostic rows entirely when viewing a dependent, on the mistaken belief that
those routes were session-scoped and could not be filtered.

**Not affected** — verified to ignore `userId` and correctly left session-scoped:
`member/ahc/eligibility`, `member/ahc/orders`, `member/benefits/:id/services`,
`notifications/unread-count`.

---

## 8. Defects deliberately not ported

### 8.1 `ResponsiveLayout.tsx` renders a mock user on auth failure

When `/api/auth/me` fails, the reference layout substitutes a hardcoded user
rather than surfacing the failure. Angular shows an auth error and routes to
login.

**Consequence for any parity harness:** web-member "passes" an auth-failure
scenario that Angular "fails". The Angular behaviour is correct.

### 8.2 `lib/api/wallet.ts` `getBalance` uses `this` in an arrow function

Inside an object literal, so `this` does not resolve to the object. Not
reproduced.

---

## 9. Specialties are category-scoped

**Routes:** `/member/appointments/specialties`, `/member/online-consult/specialties`

Not a divergence — a defect found and fixed. Recorded so it is not "corrected"
back. Angular calls `member/benefits/CAT001/specialties` (in-clinic) and
`member/benefits/CAT005/specialties` (online), matching web-member. It had been
calling the global `/specialties`, which lists all nine regardless of cover and
offered specialties the policy cannot book (live: 9 returned, 1 covered).

---

## 10. Patient and slot pickers commit on tap, not select-then-Continue

> **EXTENDED 2026-08-10, session 53 — a SEVENTH instance, and it is a different
> pattern.** React's **online-consult confirm** takes two clicks to commit
> (*Proceed to Payment* at `online-consult/confirm/page.tsx:425`, then
> *Pay ₹X & Confirm*); Angular takes one. The six instances below are *selection*
> gates collapsed to tap. This is an extra **confirmation** gate — a second screen
> re-presenting the cost. Its in-clinic sibling has no such step, so **the
> reference is inconsistent with itself** and Angular matches the in-clinic side.
> Detail and the corrected step table in `audit/09-step-count-diff.md`; the
> disclosure consequence is register entry 16.
>
> Also newly recorded there: the lab/diagnostics **vendor** page keeps
> select-then-Continue in Angular, and correctly — there the slot is one input to an
> order, not the whole decision, so this entry does not reach it.

**Routes:** `/member/appointments/select-patient`, `/member/vision/select-patient`,
`/member/dental/select-patient`, `/member/appointments/select-slot`,
`/member/vision/select-slot`, `/member/dental/select-slot`

> **Widened 2026-08-07** from three routes to six. The three `select-slot` screens
> carry the identical divergence and were unrecorded until a hand-read of all
> sixteen booking screens found them. Recorded here rather than as a separate
> entry because it is one decision, not two — see *"The two-value gate"* below,
> which is the part that had to be established rather than assumed.

web-member makes choosing a patient two user-committed steps: tapping a card sets
`selectedPatient` state and `isSelected` styling, and a separate **Continue**
button (`disabled={!selectedPatient}`) commits. It also auto-selects the patient
matching `viewingUserId` on load, commented *"PRIVACY: Auto-select patient based
on currently viewed profile"*.

Angular makes it one step: each patient is a link that navigates straight to the
next screen carrying an explicit `patientId`. There is no selection state, no
Continue button, and **no default**.

Reference: `web-member/app/member/appointments/select-patient/page.tsx:39,104-108,185,189,238-243`.

**Why:** restoring select-then-Continue would add a step back *and* introduce a
failure mode Angular does not have. The reference's flow can commit the wrong
patient when someone taps Continue without re-reading the pre-filled selection.
Angular's cannot — with no default, every booking requires an explicit tap on a
named person. On the axis this was escalated over, booking for the wrong patient,
the Angular flow is safer.

The active family member *is* surfaced, as a marker rather than a default: the
picker highlights them and labels them "Currently viewing", reusing the idiom
`profile-menu.ts:59` already uses. This closes the real defect — the pickers
previously injected `FamilyStore` and never read `activeMember()` — without
reintroducing a default that could be committed unread.

**How this entry was decided — read before citing it as precedent:**

This is the **first divergence in this register sanctioned reactively rather than
decided in advance.** Entries 1-9 were chosen, then documented. This one was found
during an audit, then ratified.

**Part of the reason for ratifying it is that reverting is expensive.** That is a
weaker standard than the earlier entries met, and blurring the two would make this
register a record of what was cheap rather than what was chosen. The safety
argument above is genuine and would stand alone — but it was constructed after the
divergence was found, not before it was chosen. Nobody weighed one tap against two
and picked; the divergence arrived by omission.

There are ~58 unspecified routes, so this will be asked for again. The test that
should be applied next time, which this entry passes:

1. Is the divergence defensible on its own merits, **stated without reference to
   the cost of reverting**?
2. Does it remove a failure mode rather than add one?
3. Does it change what a member can *do*, or only how many taps it takes?

A divergence that passes only because reverting is expensive fails this test.
Record it as debt and revert it later; do not ratify it.

**The two-value gate — why the slot screens qualify:**

Widening was not automatic. The patient pickers collapse a step guarding **one**
value, where tap-to-commit provably loses nothing. React's
`appointments/select-slot` gate guards **two** — `disabled={!selectedDate || !selectedSlot}`
(`page.tsx:284-285`) — so the question was whether removing Continue removed the
only thing verifying a date had been chosen. That would be a **dropped guard**,
not a collapsed step, and would not belong here.

It is a collapsed step. In both Angular implementations the tap carries date and
slot together, and the un-dated state is unreachable at commit time:

- `appointment-slot-page.ts:78-79` - the slot link carries `slotId` **and**
  `appointmentDate: date()`. The date signal is defaulted to the first available
  day whenever the loaded days do not contain the current one (`:147`), and the
  slot list is `computed()` from the selected date (`:123`) - so with no date
  there are no slot cards to tap.
- `clinic-booking/select-slot-page.ts:63-64` - carries `slotId` **and**
  `appointmentDate: slot.date`, taken from the slot itself rather than from the
  picker. The date signal is initialised to `days[0].iso` (`:107`) and is never
  empty.

So React's `!selectedDate` clause guards a state Angular cannot enter. Nothing is
lost.

**This widening is contingent, and here is the condition.** The argument rests on
the un-dated state being *structurally unreachable*, not on it being unlikely. If
either date signal is ever changed to start empty - a deliberate "pick a date
first" state, or an initialisation that no longer defaults to
`days[0]` - then a member can reach the slot screen with no date chosen, the
two-value gate becomes real, and **entry 10 stops covering the three `select-slot`
routes.** At that point they need their own decision, not this one.

Watch `appointment-slot-page.ts:147` and `clinic-booking/select-slot-page.ts:107`.
If either stops defaulting, revisit this entry before shipping the change.

**Revisit if:** a patient-picker step is ever wanted for confirmation reasons, or
if the reference's auto-selection turns out to carry a privacy requirement the
marker does not satisfy.

---

## 11. Dead directory links are dropped, not shipped

**Route:** `/member/services`

web-member's service directory links to `/member/reimbursements`,
`/member/notifications` and `/member/help`. Verified 2026-08-07: **neither portal
implements `/member/reimbursements` or `/member/help`.** The reference ships three
entries, at least two of which cannot resolve.

Angular omits them (`features/misc/services-page.ts:13-16`) rather than rendering
navigation to routes that do not exist.

**Why:** a directory exists to tell a member what the portal can do. An entry that
404s is worse than a missing entry — it advertises a capability and then fails,
and the member cannot tell which of the two is true.

Same class as the two defects on the no-new-flows exemption list: the reference
documents a broken state, and reproducing it faithfully would reproduce the break.

**RESOLVED 2026-08-07.** `/member/notifications` was restored to the directory.
It had been dropped correctly — the route did not exist when this entry was
written — but the route was added later in the same audit, and the directory was
the **only** place the screen could be reached from. Restoring the entry closes the
GAP in `audit/02-screens/notifications.md`. `/member/reimbursements` and
`/member/help` remain dropped, verified absent from both portals.

**Falsification condition — this entry expires by default.** A dropped-links list
is a *snapshot of what did not exist at the moment it was written.* It went stale
within one session of being written. **Re-check every dropped link whenever routes
are added**, the same way entry 10 must be re-checked if either date signal stops
defaulting. An entry that is true now, with a stated way to stop being true.

**A fourth dead link, found 2026-08-08.** The reference's *benefits* screen links to
**`/member/providers`** (`app/member/benefits/page.tsx:486,532`), which exists in
**neither portal**. Angular's benefits screen does not reproduce it, so nothing is
broken — but it confirms the falsification condition above is doing real work: this
entry has now been found incomplete twice, once per check.

**Revisit if:** `/member/reimbursements`, `/member/help` or `/member/providers` are
ever implemented.

---

## 12. The claim form is one responsive page, not a three-step wizard

**Route:** `/member/claims/new`

web-member splits claim submission into a **three-step wizard** with per-step
validation (`app/member/claims/new/page.tsx:292-303`). Angular presents **one
responsive form** with whole-form validation.

**Why:** the wizard is a *presentation strategy, not a flow.* Its steps commit
nothing individually — they gate forward navigation through a long form on a small
screen. **One responsive route tree** was an architecture decision for this portal
from the start (see `design.md`), and the wizard is partly a workaround for a
layout approach Angular does not share. A responsive single-page form is a
legitimate implementation of the same capability; the wizard's purpose is served
differently, not abandoned.

Defensible without reference to the cost of reverting: nothing is lost, and unlike
a picker there is no wrong-default failure mode — a form submits what the member
filled in.

**Cross-reference, not a widening of entry 10.** Entry 10 is scoped to pickers and
is about *what a tap commits*; this is about *how a form is laid out*. Two
principles under one entry would make both harder to apply.

**This entry was blocked for one session and is filed only now.** The sanction
rests on "per-step validation becomes whole-form validation", which requires the
rules to match — and two did not (`audit/14-claims-validation-gap.md`). Both were
fixed and verified live before this entry was written:

- a **pre-submission balance guard**, naming the figure as the reference does, sitting
  beside the pre-existing `overLimit` warning and the post-submission `capNotice`;
- **separate prescription and bill controls**, with separate checks, because the
  reference requires one of each and a single combined picker cannot express that.

**Deliberate divergence recorded alongside:** Angular additionally requires
`providerName`, which the reference does not. Stricter, not weaker — recorded so a
future reader comparing the two forms does not file it as a defect.

**Revisit if:** the form grows to a length where a single page stops being usable
on a phone, which is the condition the wizard was answering.

---

## 13. `/member/benefits/:categoryId` — an Angular-only category view

**Route:** `/member/benefits/:categoryId`

The reference has no such screen. `web-member/app/member/benefits/` has no
subroute, and its cards navigate to `/member/providers`, `/member/claims/new` and
`/member/family/add` — never to a per-category detail.

Angular's `features/benefits/benefit-detail-page.ts` composes one from stores the
portal already holds — `WalletStore`, `BookingsStore`, `TransactionsStore` —
showing a single category's balance alongside its bookings and transactions.
**It introduces no endpoint and no data the member cannot already reach.**

**Why this is a divergence and not scope creep:** the test is whether a route
*adds* capability or *re-presents* existing capability. This re-presents. The
reference's cards go elsewhere because the reference's layout puts them elsewhere;
a responsive route tree can afford a subroute where a mobile-first wizard cannot.
That is squarely what the one-responsive-route-tree decision governs.

Entry 10's first question — defensible without reference to the cost of reverting?
**Yes.** Removing it would make Angular worse for no parity gain, because there is
no reference behaviour it conflicts with. Nothing is being kept because ripping it
out would be expensive; there is simply nothing on the other side of the scale.

### The general rule this establishes

> **An Angular-only route that introduces no endpoint and composes only existing
> state is a presentation divergence, not scope creep.**

Applicable without this history, and there will be more: the responsive route tree
makes subroutes cheap in a way the reference's layout did not, so this will recur.
A route that adds an endpoint, or reaches data the member could not otherwise get,
does **not** pass this test and is scope.

**Cross-reference:** entry 1 concerns which figures `/member/benefits` displays and
is scoped to that route. It does not reach this one.

**Revisit if:** the route ever gains an endpoint of its own — at which point it
stops being a re-presentation and needs deciding again.


## 14. Diagnostics carts are fetched on the diagnostics prefix, not the lab one

**Sanctioned 2026-08-09, session 37. A do-not-port reference defect** — the same
category as entry 8, filed separately because entry 8 concerns presentation
defects and this one is a broken request.

The reference's diagnostics **cart** screens fetch the **lab** prefix:

```
web-member/app/member/diagnostics/cart/[id]/page.tsx
    CartDetailPage.fetchCart     -> member/lab/carts/:cartId
    CartDetailPage.fetchVendors  -> member/lab/carts/:cartId/vendors
web-member/app/member/diagnostics/cart/[id]/vendor/[vendorId]/page.tsx
                                 -> member/lab/carts/:cartId
```

while its diagnostics **booking** screen fetches the diagnostics one
(`diagnostics/booking/[cartId]/page.tsx`). The two cannot both be right: the API
backs the prefixes with separate models and separate collections — `LabCart` →
`lab_carts`, `DiagnosticCart` → `diagnostic_carts`.

**Verified live, read-only** (`audit/03-live/probe-cart-prefix.mjs`):

```
POSITIVE  GET member/diagnostics/carts/DIAG-CART-…  -> 200, cart returned
NEGATIVE  GET member/lab/carts                      -> 200 (prefix alive for this member)
CLAIM     GET member/lab/carts/DIAG-CART-…          -> 404 "Cart … not found"
```

So the reference's diagnostics cart and vendor screens fail for **every**
diagnostics cart, ending in `alert('Failed to fetch cart')`. It is not a
divergence Angular chose; it is a reference bug Angular does not have.

**Angular's behaviour, asserted on the network log rather than the render** — a
screen that looks right proves nothing about the URL it called:

```
PASS  diagnostics: /api/member/diagnostics/carts/DIAG-CART-… 200, …/vendors 200
      lab: none
```

Every diagnostics route passes `data: { kind: 'DIAGNOSTIC' }`
(`app.routes.ts:85-111`) and `withComponentInputBinding()` is on, so the shared
`CartPage` and `VendorBookingPage` resolve `LAB_API[Diagnostic]`.

**Why this is not scope creep:** no new endpoint, no new screen, no new data — the
same journey calling the route the API actually serves. The reference is the
acceptance criterion for *intended behaviour*, and the intended behaviour is
plainly "show this member their diagnostics cart".

**Noted, not a finding:** the *lab* cart route (`app.routes.ts:62`) carries no
`data: { kind: 'LAB' }` and relies on the component default
`input<LabKind>(LabKind.Lab)`. Correct today, and the one route in the pair that
would silently follow a change to that default.

> ### THIRD INSTANCE, 2026-08-10 — and this one does not 404
>
> Found by driving both apps (`audit/35-api-integration-parity.md`). React's
> **diagnostics ORDERS** screen fetches the **lab** endpoint:
>
> ```ts
> // web-member/app/member/diagnostics/orders/page.tsx:40
> const response = await fetch('/api/member/lab/orders', { … })
> ```
>
> …and rows navigate to `/member/diagnostics/orders/${order.orderId}` (`:177`).
>
> **This is worse than the two cart screens above.** Those request a diagnostics
> cart from the lab prefix and get a 404 — visibly broken, and a member sees an
> error. This one **succeeds**: a member with lab orders and no diagnostics orders
> sees their lab orders listed under Diagnostics, correctly formatted and wrong.
>
> Angular calls `member/diagnostics/orders`. The do-not-port ruling covers this
> screen too.

**Revisit if:** the API ever merges the two collections, at which point the
reference's call stops being wrong and this entry stops being needed.

## Reading rule — permission is not approval

**Added 2026-08-09, session 41**, from a register entry that got stretched past
its scope. This is not an entry; it is a test to read every entry against.

> **An entry that does not forbid something has not approved it.**

**What happened.** Entry 5 says payment never precedes booking creation. Session
34 read that as prescribing the copay continuation — "entry 5 does not forbid it;
it prescribes it" — and shipped a navigation to `/member/payments/:paymentId`
after confirming. Entry 5 rules **ordering**. It says nothing about where a
journey ends. The continuation is consistent with it, which is not the same as
being mandated by it.

The continuation was reverted in session 40 as an unapproved flow change. The
entry was never wrong; the reading was.

**The test, for any entry:**

1. What does this entry actually rule on? Name the axis — ordering, presentation,
   scope, identifiers.
2. Is the change I am about to make *on that axis*?
3. If it is merely **not prohibited** by the entry, the entry is silent on it, and
   silence is not sanction. Find the entry that does rule it, or file for a
   decision.

**Why this is worth a permanent note.** An entry accumulates authority as it is
cited, and the citations drift outward from what it says. The failure is quiet:
nothing contradicts the entry, so nothing catches it. The same shape appears in
`audit/10-assertion-provenance.md` — a silent spec cannot fail where it is wrong —
and this is its register equivalent.

## 15. "Paid from your wallet", not "Insurance Pays"

**Sanctioned 2026-08-09, session 49.** A label divergence on one line of the
consultation confirm breakdown. Same number, different claim about whose money it
is.

| | |
|---|---|
| React | **Insurance Pays** ₹300 (`components/PaymentProcessor.tsx:389-397`) |
| Angular | **Paid from your wallet** ₹300 |

### Why Angular's wording, and not the reference's

**1. The number rendered is the wallet debit.** Angular's mapper is

```ts
fromWallet: money(breakdown.walletDebitAmount ?? breakdown.insurancePayment)
```

(`core/domain/cover-check.ts`). The API returns both fields; the one displayed is
`walletDebitAmount`. The label matches the value it labels.

**2. It is the member's own money, and it visibly moves.** The ₹300 leaves their
OPD wallet. They can watch that balance drop on the wallet screen, and the
category allowance it came from is finite.

**3. Every other Angular screen says wallet** — the wallet screen itself, the
bookings row (*"₹400 from wallet"*). One screen saying "insurance" would be an
internal inconsistency of exactly the kind this audit keeps finding.

**4. And this is the decisive one — the reference's label is false.**
*"Insurance Pays ₹300"* tells a member a third party paid and their balance is
untouched, at the moment their balance dropped by ₹300. That is **a false
statement about their own money.**

### It sits on a ranking this audit already has

`audit/21-degraded-not-declared.md` ranks what a screen can tell a member when it
cannot tell the truth plainly:

> error < blank < **silence** < **false domain cause**

"Insurance Pays" is the bottom rung — a **false domain cause**, an explanation that
is confidently wrong rather than merely missing. Same family as *"No lab in your
area has quoted"* when the request failed, and *"No claims yet"* served to a member
whose session had been rejected.

**The difference is that this one was avoided rather than committed.** The other two
were found in Angular and fixed. This one was found in the reference and not
ported. Recorded here so that "match the reference" is never read as a reason to
adopt it.

### Scope

The label only. The value, its gating, the line's position in the breakdown and
every other line all match the reference exactly — see
`audit/34-copay-reference-trace.md`.

**Revisit if:** the product ever settles these from something other than the
member's wallet, at which point "insurance" would become the accurate word and
this entry inverts.

## 16. The payment breakdown is shown before the member commits, not after

**Sanctioned 2026-08-09, session 49. NARROWED 2026-08-10, session 52 — the original
entry over-generalised and half of it was wrong.**

> ### Correction, read this first
>
> This entry was written as *"React shows the breakdown only after the member
> commits to proceed"*. **That is true of online consultations and false of
> in-clinic appointments**, and the entry was filed as though it were true of both.
>
> `appointments/confirm/page.tsx:308-331` renders `<PaymentProcessor>` **inline on
> the confirm screen**, gated only on `!loadingUser && userId && patientId`. There
> is no `showPaymentStep`, no *Proceed to Payment* CTA, no swap. **For in-clinic,
> Angular and React already agree** and there is no divergence to sanction.
>
> **How the error was made, because it is instructive:** both confirm pages import
> and render the same `PaymentProcessor` component. Confirming that was treated as
> confirming the screens matched. It establishes only that the component is shared —
> *where each page renders it* is a property of the page, and neither page's render
> structure was read. The enclosing-scope rule, broken in the session that cited it.
>
> **What survives:** the divergence is real for **online consultations only**, and
> is scoped to that below.

### What the reference does — ONLINE CONSULTATIONS ONLY

React's online-consult confirm is **two steps on one route**:

| Step | Gate | What the member sees |
|---|---|---|
| 1 | the default `return` at `online-consult/confirm/page.tsx:616` | Consultation Fee · Platform Fee · **Total Amount** — and a **Proceed to Payment** CTA |
| 2 | `:527` — `if (showPaymentStep && selectedPatient && !paymentProcessed)`, rendering `<PaymentProcessor>` at `:584` | the full breakdown: copay and its percentage, insurance-eligible amount, transaction limit, out-of-pocket, wallet contribution, total, and the explanatory note |

So the working — *why* the member owes what they owe — appears **after** they press
Proceed to Payment. On step 1 they are given a total and asked to proceed.

### What React does for IN-CLINIC — no second step

`appointments/confirm/page.tsx` has one render path. `<PaymentProcessor>` sits
inline at `:308-331`, so the breakdown and the commit control are both on screen
from load. **Angular matches this exactly. Nothing is sanctioned here.**

### What Angular does

**One step, for both modes.** The full breakdown renders on the confirm screen
itself, beside the Confirm booking control, while the member is still reviewing.

For in-clinic that *is* the reference. **For online consultations it is earlier
than the reference**, and that difference is what this entry sanctions.

### Why this is the right way round

The breakdown exists to answer *"why is this ₹500 when the fee is ₹800?"* — a
question a member asks **while deciding**, not after committing to proceed. A
transaction limit they had not seen is exactly the sort of thing that would change
the decision, and on the reference's online path it is disclosed one step too late
to do so.

**And the reference itself is the strongest argument.** Its own in-clinic screen
shows the breakdown inline. Angular is not inventing a preference here; it is
applying the reference's in-clinic structure to the online path, where the
reference happens to be inconsistent with itself.

Angular reaches the same total by the same arithmetic and shows the same lines, in
the same order, with the same gating (`audit/34-copay-reference-trace.md`). Only
the *moment* differs.

### Why it is not scope creep

No new screen, no new destination, no new step, no new endpoint — the confirm
screen already existed and already displayed a summary. This moves content from
the reference's step 2 onto a screen Angular already has. By the test in entry 13,
composing existing state onto an existing route is a presentation divergence.

**The inverse would have been the flow change:** reproducing React's two-step
structure would have added a step to the journey, which is a decision rather than
a fix.

### Related

- **Entry 5** rules payment must never precede booking creation. Untouched — this
  is about when information is *shown*, not when money moves.
- **Entry 15** covers the one label on that breakdown that deliberately differs.
- React's **Platform Fee** row belongs to step 1 and is a hardcoded ₹0 excluded
  from its own total, so it is not carried over. Settled in
  `audit/34-copay-reference-trace.md`.

**Revisit if:** the breakdown ever grows expensive enough to compute that
rendering it before the member commits costs a request they might not need.

## 17. The copay destination — React's bookings list, not RN's consultation hub

**Ruled 2026-08-10, session 50.** Settles the React/RN disagreement recorded in
`audit/34-copay-reference-trace.md`, so it does not get reopened.

### The disagreement

After a paid consultation, the two references go to different places:

| | Destination |
|---|---|
| **React** | `/member/bookings?tab=doctors` (`PaymentProcessor.tsx:214`) |
| **RN** | the consultation hub — `/member/in-clinic-consultation` or `/member/online-consultation` (`payments/[paymentId].tsx:723-727`) |

Every other service type agrees on the bookings tab; consultations were the only
split.

### Adopted: React's

The member has just completed a booking. **The bookings list is where that booking
now is**, and it is where every other service in both apps lands. RN's hub is
where you go to *start* another consultation — a reasonable place to be sent, but
it answers a different question from the one a member has just after paying.

Angular already used `/member/bookings?tab=doctors` as its no-payment terminal
state, so this also keeps one destination for the journey whether or not money was
owed.

### What was NOT adopted — the mechanism

**Both references create the booking *after* payment.** That is the payment-first
ordering **entry 5** rules do-not-port, and it is what left thirteen payments with
no booking behind them on the test account.

Angular creates the booking first and then navigates to the payment the API
returned. **This entry adopts the reference's destination only.** Entry 5 is
unchanged and still governs the ordering.

### The limit of what this buys, recorded because it was the basis of the ruling

On the payment screen **Cancel sits directly beneath Pay, and both use the same
`redirectUrl`** (`payments/[paymentId]/page.tsx:23`, success `:479`, cancel
`:634-639`). So the continuation guarantees the member is **told** what is owed. It
does not guarantee collection.

And for consultations it tells them **once**: `GET appointments/user/:id` returns
no payment fields, so a member who cancels returns to a list that shows nothing
outstanding (inherited finding 13). Dental and vision rows do disclose.

**Revisit if:** finding 13 is fixed, at which point the list carries the
information too and the redirect stops being the only disclosure after booking.

---

## 18. "Invoice available" was shown for lab orders that have reports, not invoices

**Angular, both before and after — a defect found while closing a gap, not a
divergence from the reference.**

`Booking.hasInvoice` was filled by two mappers meaning two different things:
`invoiceGenerated` for dental and vision (`booking.mapper.ts:262`), and
`reportCount > 0` for a lab or diagnostic order (`:152`). The bookings row
rendered **"Invoice available"** for both.

**Resolved, session 52.** A separate `invoicePath` field carries the download
target and is set only where an invoice route exists; the lab row now reads
**"Reports available"**, which is what its flag always meant.

**Why it is in this register rather than only in the audit folder:** the near-miss
generalises. A shared boolean whose meaning depends on which mapper filled it in
looks safe at the call site, because the mapper is not in view there. The gate
`if (booking.hasInvoice)` was correct-looking and would have fired a vision/dental
endpoint for a lab order.

See `audit/36-invoice-download.md`.

---

## 19. React derives the copay client-side; Angular takes the server's figure

**Angular diverges, and is the safer of the two.**

React fetches `assignments/my-policy` and computes the copay percentage in the
browser (`web-member/lib/paymentValidator.ts:69-120`). Angular never calls that
endpoint: the copay comes back on the cover-check response, which is the server's
own computation (`core/domain/cover-check.ts`).

**Why it is not merely a different route to the same number.** React's fallback
when the policy fetch fails is:

```ts
// Return NO copay if API fails (likely no assignment)
return { copay: { percentage: 0, mode: 'PERCENT', value: 0 }, walletEnabled: false };
```

**A failed policy read silently charges the member no copay**, on a screen that
looks like it worked. Angular cannot reach that state because it never derives
the figure.

`MEMBER_API.myPolicy` was deleted in session 53 rather than wired. Recorded here
so the deletion is not later mistaken for an omission.

See `audit/37-fix-all-apis.md`.

---

## 20. The active-appointment nudge is mobile-only, and invisible on desktop React

**Ported as-is, including the part that looks like a reference bug.**

`appointments/user/:id/ongoing` appeared REACT-ONLY on all 30 routes, which read
as "a nudge on every screen". It is not. `layout.tsx:69-73` mounts it inside a
`lg:hidden` wrapper, so **a desktop web-member user never sees it** — the
component mounts and fetches behind the CSS, which is what the traffic recorded.
`member/page.tsx:32` imports a `section` variant for desktop and never renders it.

Angular matches the mobile placement and did **not** port the unrendered variant.

**The general point:** traffic shows where a fetch happens, not where a feature
is. A per-route endpoint diff cannot distinguish a component that renders from one
that is mounted and hidden.

See `audit/37-fix-all-apis.md`.
