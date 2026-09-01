# 20 — The copay leg has no continuation

**Found:** 2026-08-08, session 33, while verifying `member-dental`.
**Status: RULED AND IMPLEMENTED, session 50 — option 1.**

| Half | State |
|---|---|
| **Disclosure at booking** | fixed. Dental/vision on the bookings row (41); the full breakdown on the confirm screen (48); consultations blocked on the list by finding 13 |
| **Continuation** | **RULED and implemented (50)** — dental and consultations navigate to the payment the API opened |
| **Claims** | **still open** — a different question, see below |

Shipped in 34, reverted in 40 for want of a ruling, **reinstated in 50 once the
ruling existed.** Verified on one consultations run: **23/23**, both modes, the
amount asked for matching the confirm breakdown, criterion 6 clean.

## Session 41 — the half that needed no ruling

The finding always had two halves, and only one of them required a decision:

| | Question | State |
|---|---|---|
| **Disclosure** | is the member *told* money is owed? | **fixed for dental/vision**; blocked for consultations |
| **Continuation** | is the member *taken somewhere* to pay it? | **open, unruled** — adding a destination is a flow change |

Surfacing the amount on the bookings row is a display change to a screen the
journey already ends on. No new screen, no new destination. It needed no ruling,
and **it was available for four sessions** — session 34 jumped from "the member is
in debt" straight to "navigate them to pay" and the cheaper half was never
considered.

**What the row does now:** `booking.outstanding` is rendered as "₹600 still to
pay" beside the wallet line. It is set only when `paymentStatus` is PENDING **and**
`totalMemberPayment > 0` — both conditions, because a wallet-only vision booking
reports PENDING with a zero balance and would otherwise cry wolf. That pair is the
negative control.

**Consultations cannot have it, and this is the second finding of the session.**
`GET appointments/user/:id` returns, across all 27 rows on the test account, only
`consultationFee`. No `copayAmount`, no `paymentStatus`, no `paymentId`
(`03-live/probe-appt-keys.mjs`). Dental and vision return the full set on the same
kind of list call. **Twelve of the fourteen accumulated copays are consultations**,
so the disclosure fix reaches the smaller share of the problem. Raised for the
`api/` owner as **inherited finding 13**.

**What is still certain and still unfixed:** the member is not taken anywhere to
settle the amount, and for a consultation they are still not told about it at all.

## What is certain, and has not changed since session 33

> The wallet is debited, a PENDING payment is created server-side, the portal
> discards the `paymentId`, and the member sees a screen saying the booking is
> complete with nothing about the amount still owed.

A real booking exists, ₹400 is gone from the wallet, ₹600 is outstanding, and the
row reads "₹1,000 · ₹400 from wallet". A member who never pays holds a
partially-settled appointment they believe is complete. **They are not
uninformed; they are in debt.** None of that is in question.

**The count that made it visible**, found by criterion 6 sweeping the closed
verticals: **twelve** unsettled consultation copays and **two** dental. Not one
instance, and not a hypothesis — an accumulation nobody had looked for.

## The ruling — the remedy is a flow change, so it is a decision

Session 34 navigated the member to `/member/payments/:paymentId` after confirming
and recorded it as a defect fix. **It is not a defect fix.** It adds a destination
to the journey — a change to where the journey ends — and that is a flow change.
The standing instruction is not to change flows; where a defect can only be fixed
by changing one, it is filed and stopped on.

**So the finding stands and the remedy is unapproved.** Both are true at once, and
the file used to record only the first half of that.

**What the earlier ruling got right, kept for whoever decides:** entry 5 governs
*ordering* — payment must not create the booking — and the continuation does not
violate it. `POST dental-bookings` already commits the booking and debits the
wallet before any payment screen is reached, so booking-first holds either way.
The reference reaches the same screen the opposite way round, stashing the booking
in `sessionStorage` and creating it after payment. **Same destination, opposite
mechanism.** Entry 5 rules the mechanism do-not-port; it does not settle the
destination, and the destination is the open question.

**What the earlier ruling got wrong:** it treated "entry 5 prescribes it" as
authority to ship it. Entry 5 permits the continuation; it does not approve adding
it. Permission and approval are different, and conflating them is how a flow
change entered as a fix.

## What session 40 reverted, and what it kept

| | Session 34 | Now |
|---|---|---|
| `clinic-booking.store.ts` | `create()` returns `ClinicBookingResult` — `bookingId` **and** `paymentId` | **kept** — data correctness, not a flow change |
| `appointments/booking.ts` | `toAppointmentBookingResult` reads both fields from their real positions, fixing an `appointmentId` that was read off the top level of an envelope that nests it under `appointment` and so always returned `''` | **kept** — a real bug, unrelated to the flow |
| both confirm pages | navigate to `/member/payments/:paymentId` when one is owed | **REVERTED** — the journey ends on the bookings list |

`paymentId` is deliberately left **carried and unused** on both result types, with
that stated at each declaration. Deleting it would make the remedy a rewrite
instead of one line, and the filing depends on it being available.

`toBookingResult` and `ClinicBookingResult` already existed and had **no callers**
— dead code from an earlier design. They are now the live result type, trimmed to
the two fields that are used.

**Identifier duality applies here too, and is guarded.** Dental stores the
business `PAY-…` reference on the booking; vision stores a Mongo ObjectId. `GET
payments/:paymentId` resolves via `findOne({ paymentId })`, so only the business
reference is navigable — both mappers treat anything else as absent rather than
navigating somewhere that 404s.

**Verified live, session 34:** dental 17/17 + 8/8 forced, consultations 20/20,
vision 10/10 (unchanged, as its create still creates no payment). Every copay the
runs opened was navigated to, settled, and left nothing pending.

---

## The finding as originally filed

## What happens

A member books dental care for ₹1,000. ₹400 is covered by the wallet, ₹600 is
their copay. Angular creates the booking, the API debits the ₹400 **and creates a
PENDING ₹600 payment**, and the member is taken to `/member/bookings?tab=dental`.

The bookings row reads:

> Dental · DEN-BOOK-1786186303112-0248 · Dental Checkup & Cleaning · Pending
> confirmation · **₹1,000 · ₹400 from wallet** · Cancel booking

Nothing on that screen says ₹600 is owed and nothing offers to collect it. The
journey ends there. The obligation is reachable — the transactions list carries
`TXN-20260808-0245` as `PENDING_PAYMENT` and its **detail** screen links to the
payment (`transaction-detail-page.ts:105`, verified in session 31) — but only if
the member goes looking.

## It is a class, not an instance

Checked before filing, because generalising from one instance has been wrong
three times out of three in this audit. Every payment created since this audit
began driving the Angular portal (2026-08-05 onward), by status and service:

| serviceType / status | rows |
|---|---|
| APPOINTMENT / PENDING | **12** |
| DENTAL / PENDING | **2** |
| APPOINTMENT / COMPLETED | 3 |
| CLAIM / PENDING | 4 |

The twelve appointment rows are the same shape: `appointments.service.ts:572,704,805`
creates a copay or out-of-pocket payment on **create**, and Angular's appointment
confirm navigates to `/member/bookings?tab=doctors` without it. Dental
(`dental-bookings.service.ts:586,608`) is identical.

**POSITIVE CONTROL** — the query finds a known-good row: `PAY-20260808-0188`
appears in it, and session 31 reached and paid that payment through the
transaction detail. So these are real, well-formed obligations, not artifacts.

**NEGATIVE CONTROL** — vision. Vision creates **no** payment at create time, so
its absence from the table is deferral, not collection: `createPaymentRequest`
sits inside `processPaymentForBilling` (`vision-bookings.service.ts:1174,1192`),
which is the bill-gated step (finding 11). When that step does run it returns a
`paymentId` and Angular **does** continue to `/member/payments/:id` — observed
live in session 32. So Angular is not incapable of the continuation. It performs
it exactly where the API hands the id back through a call the portal makes.

## The mechanism — one discarded field

Dental's create returns the saved booking document
(`dental-bookings.service.ts:662`, `return booking`), which carries
`paymentId: 'PAY-20260808-0190'` and `paymentStatus: 'PENDING'`. Angular's
`ClinicBookingStore.create()` reads `bookingId` and discards the rest
(`clinic-booking.store.ts:153`). Same for appointments.

So the continuation is not missing from the API. It is present in a response
field the mapper drops — **the same mapper-gap shape session 27 found on AHC**
(`Address.city`, `AhcPackage.id`): a model written for read-only screens that is
missing what a write path needs. Session 31 predicted the next mapper gap would
appear in lab/diagnostics. It appeared here instead.

## Why entry 5 does not cover it

Entry 5 rules the **ordering**: payment never precedes booking creation. Angular's
dental and appointments journeys satisfy it — the booking exists first. Entry 5
also records what the continuation looks like where it exists, quoting vision's
`process-payment` returning a `paymentId` "and the journey continues at the
gateway screen above."

What it does not say is what happens to the copay when there is no second call.
Booking-first fails safe against the failure entry 5 was written for — a payment
with no booking behind it. This is the mirror: **a booking with an uncollected
payment in front of it**, and the member is not told.

## The decision needed

> After a booking-first create that returns a `paymentId`, should the journey
> continue to `/member/payments/:paymentId`, as vision's does and as the
> reference's `PaymentProcessor` does — or is landing on the bookings list
> acceptable because the obligation is discoverable under Transactions?

The reference answers it one way. `PaymentProcessor.tsx:227,284` redirects to
`/member/payments/:paymentId?redirect=/member/bookings?tab=dental` on both the
copay and out-of-pocket paths. It gets there payment-first, which entry 5 rules
do-not-port — but the *destination* is not the part entry 5 objects to.

Not ruled here. Three verticals are affected (dental, appointments, and vision's
post-bill path already conforms), plus the unbuilt AHC payment leg, which is why
it belongs in the register rather than in one spec.

**Answered in session 34 — see the ruling at the top.** The AHC payment leg
inherits it: when built, it navigates to the payment its create returns.

## THIRD INSTANCE — claims, and it is NOT fixed here

Found by running the extended criterion across the already-closed verticals, which
is the first thing the criterion was used for. **Four PENDING `CLAIM` copays** have
accumulated on the test account since 2026-08-05:

```
PAY-20260805-0170  ₹60  COPAY -> CLM-20260805-0001
PAY-20260807-0177  ₹10  COPAY -> CLM-20260807-0001
PAY-20260808-0178  ₹12  COPAY -> CLM-20260808-0001
PAY-20260808-0179  ₹12  COPAY -> CLM-20260808-0002
```

The mechanism is identical. `MemberClaimsService.submitClaim()` — Scenario B,
"sufficient balance + copay" (`memberclaims.service.ts:565-600`) — debits the
wallet, creates the copay as a PENDING payment, sets `claim.paymentId` and
`paymentRequired = true`. Angular's `ClaimsStore.submit()` reads `wasCapped` off
that same response and returns the Mongo `_id`; **`paymentId` and
`paymentRequired` are discarded**, and `claim-detail-page.ts` mentions no payment
at all.

**Deliberately not fixed in session 34, and 8.14 is left checked.** Not because
it is small, but because it is **not the same question**, and answering it the
way bookings were answered would be assuming rather than checking:

> A booking copay is money the member **owes** for a service they have committed
> to. A claim copay is the unreimbursed share of a bill they have **already
> paid** to the provider. Whether the portal should route them to "pay" it — or
> whether the record exists only to balance the ledger — is a domain ruling, and
> it changes whether this is a defect at all.

What is certain either way: the wallet is debited and the member is told nothing.
Whichever way the ruling goes, the claim detail screen should account for the
copay.

**Do not read this as "the class is now three."** Two of three share a mechanism
*and* a meaning; the third shares only the mechanism. The check that produced it
is cheap and should be run on lab, diagnostics and AHC as they are verified —
each of those places an order the wallet part-covers.

## What still stands — updated session 40

- **The API-side half of inherited finding 11's second question.** Whether an ops
  process settles these is still unanswered, and it decides whether "Mark as paid"
  is the whole story. **Now more load-bearing than before:** with the portal not
  routing the member anywhere, an ops settlement path may be the only way these
  are ever cleared.
- **The bookings row does not distinguish a settled copay from an unsettled one.**
  The row reads "₹1,000 · ₹400 from wallet" either way. Session 34 downgraded this
  to a display question on the grounds that the journey took the member to pay.
  **That downgrade is withdrawn** — the journey no longer does, so the row is once
  again the only thing the member sees, and it says nothing about the debt. It is
  part of this finding, not separate from it.
- **The copays on the test account are the evidence.** Left alone deliberately:
  deleting them would delete what the finding was built from, and payment records
  are sanctioned to accumulate. Re-verification under criterion 6 adds to them,
  which is expected and is the point.

## Options, for whoever rules this

Recorded so the decision does not have to be re-derived. Not a recommendation.

1. ~~**Continue to the payment screen**~~ — **CHOSEN, session 50.** Destination is
   React's `/member/bookings?tab=doctors` after payment; RN's consultation hub not
   adopted (register entry 17). Booking-first unchanged — entry 5 untouched.
2. ~~**Say it on the screen the member already lands on**~~ — **DONE, session 41**,
   for dental and vision. Blocked for consultations by inherited finding 13.
3. **Settle it API-side** — if ops clears these, the portal may owe the member
   only a truthful row. Depends on inherited finding 11.
4. **Do nothing further** — now more defensible than it was, because the member can
   at least see the amount on two of the three. Still leaves them with no way to
   act on it from the portal, and leaves consultations silent entirely.

**The decision is now narrower than it was.** With disclosure done, the remaining
question is only whether the portal should carry the member to payment, or whether
a truthful row plus an ops-side settlement is enough. Whoever rules it should read
finding 11 first, since option 3 may make option 1 unnecessary.


---

# Ruled and implemented — session 50

**Option 1, with React's destination and Angular's mechanism.**

## What was reinstated

Session 34's code, not a rebuild — the revert was clean and the plumbing was left
in place for exactly this. `paymentId` was already carried on
`ClinicBookingResult` and `AppointmentBookingResult`, marked unused pending the
ruling. The navigation went back into the **two confirm pages**, which is where
session 40 established it had lived; **no store was touched.**

Four comments that session 40 had corrected to say the journey does *not* continue
were corrected back, in `clinic-booking.ts`, `clinic-booking.store.ts`,
`appointments/booking.ts` and both pages.

Navigation fires **only when something is owed**. A booking with nothing
outstanding goes where it always went.

## Verified — and most of it cost nothing

**Forced first, deliberately** (`03-live/verify-copay-continuation.mjs`, **6/6**,
no booking written): the create POST was intercepted, so all three branches were
proven for free —

- `paymentId` present → `/member/payments/:paymentId`
- absent → `/member/bookings?tab=doctors`
- **a Mongo `_id` in the field → the bookings list, not a payment screen.** The
  `PAY-` guard in `toAppointmentBookingResult` holds; identifier duality checked
  rather than assumed.

**Then one real run** (`verify-consultations.mjs`, **23/23**), spending one CAT001
and one CAT005. Both modes navigated to the copay the API created; the payment
screen named it; **the amount asked for equalled the amount the confirm screen
quoted**; settling left nothing unexplained.

**Run two was not spent.** Nothing was left open, and the brief's instruction was
not to spend it chasing what interception could answer. CAT001 has one run left.

## Criterion 6 did not change, and its reading did

> A pending payment the journey **navigated the member to** is the flow working;
> one left behind on a screen saying the booking is complete is the defect.

That wording is from session 34 and is unchanged. Before the ruling the assertions
failed against it; now they pass against it. **No predicate was edited** — session
40 relabelled without touching them precisely so this would be cheap. Only the
labels and the harness banners changed, and the banners now state what a green run
means and what it does not.

## What this does not fix, stated plainly

**The member is told, not necessarily collected from.** Cancel sits directly
beneath Pay on the payment screen and both use the same `redirectUrl`. That was
the basis on which the ruling was made, not an oversight.

**And for consultations, told once.** `GET appointments/user/:id` returns only
`consultationFee` — no copay, no `paymentStatus`, no `paymentId` — so a member who
cancels returns to a bookings list that still shows nothing outstanding.
**Inherited finding 13 stands.** The redirect addresses disclosure at the moment of
booking; the list still cannot address it afterwards. Dental and vision rows do.

**Claims remain open.** The third instance shares the mechanism and not the
meaning: a booking copay is money owed for a service committed to; a claim copay is
the unreimbursed share of a bill already paid to the provider. Whether the portal
should route there is a separate domain question and this ruling does not settle
it.

## Dental is implemented but not re-verified

CAT006's allowance is spent, so the dental create leg cannot run
(`31-run-budget.md`). Its assertions are re-aimed and will execute when the
allowance is refreshed. The code path is the same one the consultations run
exercised.
