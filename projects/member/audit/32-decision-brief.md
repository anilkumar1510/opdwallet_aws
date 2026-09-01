# 32 — Decision brief

**Session 45, 2026-08-09. This is not `SUMMARY.md`.** The audit has no unblocked
work left; everything outstanding sits with someone outside it. This document puts
each open question in front of the person who owns it.

Each decision below is self-contained. You should not need to read the audit to
answer the one that is yours.

**Two of the four are now closed.** Decision 1 (copay continuation) and decision 2
(vaccination) were ruled in session 50. **Decisions 3 and 4 remain open** — native
packaging, which still needs a figure nobody in this loop has gathered, and the
AHC reload, which has a recommendation on file awaiting a yes.

---

## 1. The copay continuation — ✅ CLOSED, ruled and implemented (session 50)

> **RULED:** after a booking with an outstanding copay the member is taken to the
> payment screen, landing on **`/member/bookings?tab=doctors`** on success —
> React's destination. **The mechanism stays Angular's:** booking first, then
> payment. Entry 5 unchanged. RN's consultation hub not adopted (register entry
> 17).
>
> **Implemented and verified** — 6/6 forced branch tests costing nothing, then
> **23/23** on one real consultations run. The amount asked for matched the confirm
> breakdown in both modes; criterion 6 clean. One CAT001 run remains.
>
> **What it buys and what it does not:** Cancel sits beside Pay, so the member is
> **told**, not necessarily collected from — that was the basis of the ruling. And
> for consultations they are told **once**: finding 13 means the bookings list
> still cannot show it. **Claims remain open** — same mechanism, different meaning.
>
> Detail in `20-copay-continuation.md`. The section below is kept as the record of
> how the decision was framed.

### (as it stood before the ruling)

**The question:** when a member owes money after booking, should the portal take
them to a payment screen, or is a truthful bookings row plus an ops-side
settlement enough?

### What is established

Not in dispute, verified live:

- `POST dental-bookings` and `POST appointments` debit the wallet **and create a
  PENDING copay payment server-side**, returning its `paymentId`.
- The portal carries that `paymentId` and does not act on it. The journey ends on
  the bookings list.
- **Fourteen unsettled copays accumulated during this audit — twelve
  consultations, two dental.** Found by criterion 6, not by inspection.
- **Dental and vision now disclose the amount** on the bookings row ("₹600 still
  to pay"), added in session 41. That was a display change to a screen the journey
  already ends on, so it needed no ruling.
- **Consultations structurally cannot disclose it.** `GET appointments/user/:id`
  returns only `consultationFee` across all 27 rows — no `copayAmount`, no
  `paymentStatus`, no `paymentId` (inherited finding 13). The row has nothing to
  render.

**So the question is now mostly about consultations specifically**, which is also
where twelve of the fourteen copays are.

### Read finding 11 first

`05-inherited-api-findings.md` §11 asks the API owner: **who collects the copay
that `POST dental-bookings` and `POST appointments` create?** If an ops or clinic
process settles them, the portal is right to stop where it does. If the member is
expected to pay at the gateway, the portal is missing a leg.

**That answer may make option 1 unnecessary**, which is why it comes first.

### Options

| | Option | Consequence |
|---|---|---|
| 1 | **Continue to the payment screen** | One line at each confirm page; `paymentId` is already carried. **Adds a destination to two journeys — a flow change.** |
| 2 | ~~Disclose on the bookings row~~ | **DONE, session 41**, dental and vision. Blocked for consultations by finding 13. |
| 3 | **Settle it API-side** | If ops clears these, the portal owes the member only a truthful row. Depends on finding 11. |
| 4 | **Do nothing further** | More defensible than before — the member can see the amount on two of three. Still no way to act on it, and consultations stay silent entirely. |

**No recommendation is on file for this one.** The options are recorded so the
decision does not have to be re-derived; choosing between them is a domain call
about who collects money.

### NARROWED, session 47 — the reference was traced, and it splits the question

`34-copay-reference-trace.md` traced both reference apps end to end.

**Dental and vision are settled — no decision needed.** React's bookings row
already discloses (a payment badge, `bookings/page.tsx:2016-2023`, plus a copay
line, `:2060-2074`). Angular does the same thing on the same screen, and **more
accurately**: React renders `copayAmount` and omits `excessAmount`, so a booking
owing ₹600 displays "₹200". Angular renders `totalMemberPayment`. Session 41's
disclosure was matching the reference without knowing it. **Nothing to decide
here; do not port React's version.**

**Consultations are the whole of the remaining question.** React's doctors tab
(`:1023-1292`) renders only `₹{appointment.consultationFee}` — the gross fee,
twice. No badge, no copay, no marker. A paid consultation and an unpaid one look
identical. RN is the same, and its `Appointment` interface (`bookings.tsx:58-78`)
does not even declare the payment fields.

So for consultations the reference discloses **only** at confirm
(`PaymentProcessor.tsx:364`) and on the payment screen (`:604`) — the two screens
on the way to paying. **The disclosure is inseparable from the redirect**, which
is why this remains a flow-change decision rather than a display fix.

**Finding 13 is confirmed as an API problem, not a portal one.** Three independent
confirmations: the API returns only `consultationFee`; React renders only that; RN
does not declare the fields. No reference app is reading data Angular is missing.

**One thing whoever rules this must choose, because the references disagree.**
After a consultation payment succeeds, React goes to `/member/bookings?tab=doctors`
(`PaymentProcessor.tsx:214`); **RN goes to the consultation hub**
(`payments/[paymentId].tsx:723-727`). There is no single "what the reference does"
for that step.

**Also worth knowing before ruling, now OBSERVED rather than read (session 48).**
The payment screen was opened live. It is a real, working screen — Payment
Details, **Amount to Pay ₹500.00**, a **Mark as Paid (Dummy Gateway)** button, and
**Cancel** directly beneath it.

> **Cancel sits next to Pay.** Option 1 guarantees the member is **told** what is
> owed. It does **not** guarantee anything is collected.

**And the exit routes turn out not to fork.** The `redirect` query param is read
once into `redirectUrl` (`payments/[paymentId]/page.tsx:23`) and **both** exits use
it — success at `:479`, Cancel at `:634-639`. So cancel and success reach the same
place and the param decides where; there is no third candidate. What remains is the
recorded React/RN disagreement: React sends a paid consultation to the bookings
list or the online-consult hub by service type, RN to the consultation hub
(`payments/[paymentId].tsx:723-727`). **Two candidates to choose between, not
three.**

**Related, and it removes part of the pressure:** Angular's consultation confirm
screen now shows the reference's full payment breakdown — fee, wallet balance,
copay with percentage, insurance-eligible amount, transaction limit, out-of-pocket,
wallet contribution, total, and an explanatory note (session 48, verified 17/17).
React shows that breakdown only on a **second step after the member commits to
proceed**; Angular shows it while they are still reviewing. So the member is now
told the full arithmetic **before** booking regardless of how this decision goes.
What the decision still governs is whether they are taken anywhere **afterwards**.

### One thing to be clear about

Session 34 shipped option 1 as a defect fix. **Session 40 reverted it**: adding a
destination is a flow change, and a flow change is a decision rather than a fix.
Parity register entry 5 governs *ordering* — payment must not create the booking —
and **permits** the continuation without mandating it. *Permission is not
approval.* Entry 5 cannot be cited as authority for option 1.

### Cost of leaving it

**This is the one that degrades.** `verify-consultations.mjs` books one CAT001 and
one CAT005 consultation per run. CAT001 holds ₹600 at ₹300 per booking — **two
runs**. After that the harness cannot run until allowances are refreshed, and a
ruling would land with nothing able to verify it.

Meanwhile copays keep accumulating on the test account, and members on any real
deployment are in the same position: a committed booking, money gone from the
wallet, a balance owed, and — for consultations — no indication anywhere.

---

## 2. Vaccination scheduling — ✅ CLOSED, ruled IN (session 50)

> **RULED: in scope.** Built as its own change against `12-vaccination-sizing.md`,
> which was written to outlive the RN app it was sized from.
> `openspec/changes/member-vaccination/` moves from *proposed* to **scheduled**.
> **Not built this session** — it is a separate piece of work: five screens,
> ~2,738 lines, 8 live endpoints, no React reference.
>
> The sizing document is now the specification source. Angular's
> `PlaceholderPage` stays until the change lands, which keeps an unbuilt screen
> distinguishable from a typo.
>
> The section below is kept as the record of how the decision was framed.

### (as it stood before the ruling)

**The question:** is vaccination in scope for the Angular portal — in, later, or
out?

### What is established

- **Five screens** in `web-member-rn/app/member/vaccination/`, plus behaviour in
  three screens outside it. **2,738 lines.**
- **8 API endpoints, all live, none consumed by Angular.**
- **No React reference exists at all.** Vaccination is RN-only.
- Angular routes it to `PlaceholderPage` deliberately, so an unbuilt screen is
  distinguishable from a typo.
- **Sized into `12-vaccination-sizing.md`**, with `file:line` citations
  throughout, and set up as its own OpenSpec change.

### Options

**In** — build it as its own change against the sizing document. **Later** — the
sizing document keeps it buildable indefinitely. **Out** — retire the capability
with RN, and the API surface becomes dead.

### Cost of leaving it

**None today, and that is a deliberate change of state.** This was perishable
until it was sized: the only description of the behaviour lived in an app being
retired. `12-vaccination-sizing.md` was written to outlive that app, so the
decision can now be taken against the document rather than against a running
system. **It stopped being urgent when it was written down.**

---

## 3. Native packaging

**The question:** does the member portal need to ship through app stores after
`web-member-rn` is retired?

### What is established

- Angular is **responsive web only** — no Capacitor, no PWA manifest, no native
  wrapper. One route tree for every viewport; no device-based redirects.
- `web-member-rn` is the current app-store channel.
- **Replacing it retires that channel** unless a wrapper is chosen.
- Part of open task 7.2.

### What is actually at stake

**This is a distribution decision, not an engineering one.** Nothing in the
migration forces it either way, and no work done so far depends on the answer. The
question is whether members must be able to install the portal from an app store —
which is a question about how members are reached, not about the code.

If the answer is yes, a wrapper is a separate piece of work with its own
requirements (push notifications, deep links, store review). If no, nothing
changes.

**No recommendation is on file.** The audit has no basis for one: it never had
visibility into how members currently obtain the app or how many use it.

### The one input this brief cannot supply

Every other decision here can be answered from what the audit has already
established. **This one cannot.** It turns on how many members reach the portal
through the app store today, and that figure has not been gathered by anyone in
this loop — it is not in the repo, the specs or the audit.

If the owner already holds it, this is answerable now. **If not, gathering it is a
prerequisite and belongs on the blocked list**, alongside the test-data items —
the difference being that it is a question for whoever owns distribution
analytics, not for whoever owns test data.

Named explicitly because a decision that quietly needs an ungathered number is how
a "pending decision" becomes a stall nobody can explain.

### Cost of leaving it

Low, and it does not compound — but it is the one decision that could invalidate
an assumption late. If a wrapper is required, deep-link behaviour and the RN URL
divergence (`online-consultation` vs `online-consult`, filed as a NOTE contingent
on exactly this) come back into scope.

---

## 4. The AHC reload behaviour

**The question:** should the AHC booking journey survive a page reload?

### What is established

- React carries the in-progress booking in `sessionStorage` and survives a
  refresh.
- Angular's signal store does not. A member who reloads mid-journey re-picks a
  vendor and a package.
- Normal click-through is unaffected. This is the reload path only.

### Recommendation on file — sanction the loss

**Marked as a recommendation, not a conclusion.** Do not port `sessionStorage`:

- It is the mechanism the reference uses to stash a booking and create it **after
  payment**, which is the payment-first ordering parity entry 5 rules do-not-port.
  Reintroducing the mechanism reintroduces the temptation.
- **The cost is bounded**: two screens of re-entry. No data loss, no payment
  involved, no order to orphan — nothing has been committed at that point in the
  journey.

The alternative is to persist journey state by some other means, which is real
work for a path a member reaches by reloading mid-booking.

### Cost of leaving it

Low. It affects one journey on one path, and the recommendation is already
written — this needs a yes rather than an investigation.

---

## 5. Test data — four items and one condition

**These go to different people.** The distinction matters: three are missing
fixtures, one is capacity this audit consumed, and one of the three is not a seed
at all.

| # | Item | Unblocks | Kind |
|---|---|---|---|
| 1 | A member with an **unused AHC allowance** | AHC transcription, and observing the AHC commit through the app rather than by `curl` | never-ran. AHC is once per member per policy year; verification consumed `shivam@`'s |
| 2 | A **dependent credential** | 5.8 *"dependent signs in directly"* — open since session 12 | never-ran |
| 3 | A **doctor-authored digital prescription for `shivam@`** | *Submitting an existing prescription*, both lab and diagnostics | **an action with an owner and a UI — NOT a seed** |
| 4 | Refreshed **CAT001 / CAT005 / CAT006** allowances | the dental create leg now; consultations within two runs | capacity the audit itself consumed |

**On item 3:** `shivam@` holds zero health records; four exist globally, none his;
`doctorprescriptions` is empty for everyone. No member-side route creates one — the
only writer is `DigitalPrescriptionWriter` on the doctor portal's appointment
screen. This is the same shape as the ops digitize that unblocked lab: someone
performs an action through an existing UI. Sending it as a seeding request will
send it to the wrong person.

**On item 4:** the only item the audit caused rather than inherited, and the only
one that recurs. Every verification run of a booking journey spends real
entitlement. CAT001/CAT005/CAT006 are **one ask** — requesting them separately a
week apart is how a request gets deprioritised.

### THE CONDITION — read this before any reseed

> **If the test account is reseeded, `PAY-20260808-0188` must survive.**

Every criterion-6 harness proves it can see a real obligation by finding that one
payment. Criterion 6 is what found the twelve orphaned consultation copays. There
is **no cheap substitute** — a synthetic payment is not queryable through the same
path, so unlike the other stale controls this one cannot be fixture-anchored.

**And the failure is silent:** a criterion-6 query that returns nothing looks
identical whether the run is clean or the check is dead.

This is a constraint on *how* the refresh is done, not a fifth item. Refreshing
category allowances is wanted; reseeding the account wholesale is not. If it
cannot survive, say so **before** the reseed so the harnesses get a new anchor
chosen deliberately rather than discovered afterwards.

---

## 6. Filed, not fixed — the register

Everything found and deliberately left, with why. Without this, whoever picks the
project up reconstructs it from forty session reports.

### Defects, unfixed by choice

| Item | Why not fixed |
|---|---|
| **Three unguarded prefill effects** — `clinic-booking/clinics-page.ts:114` (`pincode`), `lab/vendor-booking-page.ts:308` (`addressId`), `wellness/ahc-booking-page.ts:147` (`pincode`) | Each reads the signal it writes, so the field cannot be cleared. The remedy is one line each. **Their harnesses are out of budget**, and shipping unverifiable fixes is what the interleaving rule exists to prevent. |
| **`vendor-booking-page.ts:308` carries a pairing** | Session 38 added an `addressBlocked` guard to that same file. **The guard is unreachable** — the member cannot clear the address to make it incomplete. Whoever fixes the effect must re-verify the guard in the same pass. |
| **The AHC payment leg — a committed order that owes ₹240 and cannot be paid** | `AhcBookingStore.place()` correctly omits `paymentAlreadyProcessed` (entry 5), so the order is `PLACED`/`PENDING` with no wallet debit — but **nothing then creates the payment**, and `AHC_API` declares no payment endpoint. Unlike the copay continuation there is no PENDING payment to navigate to; there is nothing at all. **Blocked on inherited finding 11**: if AHC payment should be bill-gated as vision's is, the design changes, and building first risks building the wrong half twice. `14-ahc-commit-contract.md` |
| **The invoice action** | `/member/bookings` renders "Invoice available" with no control, while `CLINIC_BOOKING_API[area].invoice` has zero callers. The reference downloads the PDF. Vision and dental are closed verticals; reopening them is a separate call. |
| **The 30-second termination window** | A rejected session is detected only by the next notification poll, so a member can browse for up to one interval. A **spec gap, not a code gap** — `member-session` has no scenario for detection latency. Belongs under 7.4. |
| **Dead injections** | `ahc-booking-page:124`, `member-shell:214`, `MemberSwitcher` — injected and unused. Harmless; recorded so they are not mistaken for wiring. |

### For the `api/` owner

| Finding | Question |
|---|---|
| **11** | Should AHC payment be bill-gated as vision's is? **And who collects the copay** that dental and appointments create? — gates decision 1 |
| **12** | `createOrder` has no cart-status gate; a consumed cart can produce a second order. Current safety is a UI accident, not an invariant |
| **13** | `GET appointments/user/:id` omits every payment field the dental and vision list endpoints return. Blocks consultations disclosure |
| **§3** | Can the API emit the shapes 6.11's scenarios specify — `CAT999`, `isFloater: true` with populated `memberConsumption[]`? If not, those scenarios defend against states that cannot occur |

---

## 7. Two conventions worth adopting

Both are cheap, and both would have prevented a defect this audit found late.

### A message describing form state must be a `computed()`, not a stored signal

Session 41 stored a refusal message; it stayed on screen after the member fixed
the field — the form asserting something that had stopped being true. Fourth
arrival of a class that also produced "No claims yet" to a signed-out member, a
false lab-cart cause, and "Invoice available" with no control.

**The detector was not built, deliberately.** The codebase has many legitimately
stored message signals — `uploadError`, `fileError`, `orderError`, `submitError` —
set in a handler and correctly cleared on the next attempt. Separating those from
stale ones means modelling when each condition changes, and that produces a fuzzy
candidate list nobody trusts. **That would burn the credibility the five working
detectors earned.**

**With the convention, grep is exact:** any `signal<string | null>` rendered in a
`role="alert"` that describes form validity is a violation. Convention first, then
the detector is trivial.

### A control anchored to a detector's own first finding will die if the detector succeeds

`18-write-sweep.mjs` looked for features with no commit path. It found AHC. Its
negative control was *"AHC shows none"*. **Session 27 built AHC's commit path, and
the detector has been exiting "output meaningless" for sixteen sessions.**

That is worse than ordinary control expiry, because it is **guaranteed**: the
control is anchored to the thing the detector exists to get fixed. Success kills
it.

> **Fixture-anchor that class of control from the start. It is not a
> nice-to-have.**

Both this and `22-dead-endpoint-scan.mjs` are now anchored to in-memory fixtures
nothing in the codebase can retire. The full three-way taxonomy — expired,
drifted, fragile — is in `10-assertion-provenance.md`.
