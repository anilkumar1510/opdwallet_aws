# Audit progress — a chronological log, newest first

> **If you opened this by accident, you probably want [`README.md`](README.md).**
>
> This file is **session-by-session history**, not current state. It is
> append-only and it contradicts itself on purpose: figures that moved are
> recorded as they were measured, and the earlier number stays where it was
> written. Use it for provenance — *when was this decided, and on what evidence* —
> and use `README.md` for what is true now.
>
> **Do not "continue from the first unchecked box".** The Screens checklist far
> below is mostly DEBT routes that were deliberately scoped out; its unchecked
> boxes are not a work queue. What is actually outstanding is in
> [`32-decision-brief.md`](32-decision-brief.md), and none of it is code.
>
> *The instruction that used to sit here — "on restart, continue from the first
> `todo`" — was written in phase 2 and stopped being right somewhere around
> session 20. It is preserved in this note because a stranger following it was the
> first thing session 46's cold-read test caught.*

**Numbered "entry N" citations throughout this file** refer to the parity
divergence register at
[`../../../tools/parity-divergences.md`](../../../tools/parity-divergences.md) —
14 sanctioned entries, each with its reasoning. The register is cited by number
below without repeating the path; this is where it lives.

The two tables immediately below are **historical headline state from
2026-08-07**, kept for provenance. Task verdicts changed repeatedly after them —
8.8 and 8.18 in particular reopened in session 40.

## Session 55 — 2026-08-13 — the desktop home rebuilt to a supplied design

**The mock is not the reference.** Captured both apps at 1600px first: Angular's
desktop was already close to React's, and the supplied design matches neither. It
is a design instruction that overrides parity for this screen — recorded so a
later reader does not "fix" the divergence back.

**Built:** Quick Actions as a full-width row of six pills (was a sidebar stack),
the blue illustrated balance card moved into the sidebar under the policy, Health
Benefits four-across → two-across, More Services as a full-width pill row. All of
it reuses surfaces that already existed for mobile; nothing new was designed.

**Not built, and the reason is the same in each case:** the top utility bar
(Habit Coins, My Files, Cart — none exist) and the dark secondary nav, where
**six of eleven destinations have no screen**. Navigation to nothing is the defect
class this audit exists to remove.

**Verified 13/13** from bounding boxes rather than class names, with mobile
asserted unchanged section by section. The control that earned its place: the six
pills must sit on ONE row — they wrapped on the first attempt and truncated on the
second, and a count-only assertion passes through both.

**Header (part two):** the phone header promoted to desktop — avatar, "Hi
{name}! ⌄", subtitle, bell/wallet/cart — with the four destinations as underline
tabs and the navy bar reduced, then removed. `Claim` → `Claims`. It rendered
white-on-white at first (styled for the blue phone hero); the harness now checks
the **computed colour**, which is the only kind of assertion that catches it.

**A correction:** I had said the mock's cart does not exist. It does — it links to
`/member/lab-tests` and badges real open lab carts, and was in the phone header
all along.

**The regression that mattered (part three):** with the bar gone and the tabs
inside the HOME PAGE, every other desktop screen had **no navigation at all** —
`/member/claims` measured zero. Navigation belongs to the shell, not a page. Both
greeting and tabs now live in the shell; three assertions cover it.

**Typography and sizing (parts four to seven):** the header adopted the page's
type scale; measuring that exposed **two drifted headings** nobody had reported
(`Your Wallet Balance` bold/black, `Your Policies` stuck at 18px) — the assertion
is collective, requiring ONE distinct spec across every visible heading, because a
per-heading check needs you to already know which one is wrong. The balance card
was rebuilt to a supplied design, and the benefit cards to an exact 355.5 x 99.

**A build trap:** `[class.lg:h-[212px]]="…"` does not apply — Angular class-binding
names containing brackets fail silently, no error, previous value kept. Replaced
with `[style.height.px]`. Static class attributes with arbitrary values are fine;
only the bindings break.

Full write-up: `40-home-desktop-layout.md`.


## Session 54 — 2026-08-11 — the wallet ledger's missing summary

**Found by the user clicking the home balance card**, not by any detector.

React's card opens a dedicated **Transaction History** screen with Total Credits /
Total Debits / Net Change. Angular's card opens the wallet page — same rows, same
endpoint, **none of the figures**. The link was never broken; the destination was
missing content.

**Added:** credits/debits/net computed over the WHOLE history (not the 15-row
page — page-derived figures would move on every "Show more"), the per-row running
balance (`newBalance.total`, in the payload all along and never mapped), and a
back control (`Location.back()`, since the ledger has three entry points).

**Reported missing but wasn't: "load more".** Present, visible, working — 15 → 30
on click. Measured before building. A fix for a working feature is pure risk.

**Not ported:** React's Analytics Overview — `recharts` bar charts, and adding a
charting dependency for two charts was not a call to make unasked.

**A labelling error, corrected by the user.** I first called "build a Transaction
History screen" a *flow change*. It is not: porting a screen the reference already
has, reached by a control that already navigates, is the migration working. The
real obstacle is **routing** — Angular's `/member/transactions` is occupied by
service orders (entry 2) — and it did not block this fix, which needed no route.

Verified 13/13, asserted against the reference's own figures (₹5,100 / ₹14,792 /
−₹9,692) rather than "three numbers rendered".

**Part two — back was shell-wide, not a wallet problem.** Reported a second time
after the wallet fix, which was the signal I had scoped it to the screen in front
of me. **Eight of 23 nav-reachable screens had no way back**; the reference has
one on 21 pages. Fixed with a shared `opd-back-link`, and the wallet's inline copy
replaced by it. Runtime re-audit: *still missing NONE, duplicated NONE*.

**Source grep was the wrong instrument** and said 39 pages were missing: journey
screens implement back as `[routerLink]="backLink()"` with an inline SVG, so
searching for `location.back()` found pages lacking that *implementation*, not
pages lacking the *affordance*.

**"Load more" was reported twice and is not missing** — present and working where
lists page (wallet 15→30 of 70, transactions 24 of 50), unnecessary where every
row renders (bookings 65, claims 12). No list truncates silently. The reference
has no load-more at all.

**Part three — the card's destination, ruled.** `/member/transactions` is now the
wallet ledger and `/member/orders` the service-order list, as the reference routes
them. **Register entry 2 resolved.** The swap had left the home quicklink
*labelled* "Transaction History" opening service orders, and briefly left two
screens under one name — the order list is now "Order History".

**Part four — cancel is one click**, both booking and prescription. The API still
demands a 10-character reason, so a fixed neutral one is sent; ops reads that
field and inventing a motive would be worse than saying none was collected.

**Part five — back looped, and I picked the wrong primitive.** `Location.back()`
retraces history, so a member alternating between wallet and transactions walked
back through their own visits and never reached home. Now a `routerLink` to a
fixed parent. It cannot loop because it never consults history.

**Part six — the nudge is removed** at the member's request: it covered the Health
Benefits cards. Component, store and endpoint declaration all deleted, and
recorded as a **declined port** so the next sweep does not file it as missing and
rebuild it.

**Six of this session's changes came from the member using the running app**, none
from a detector. The detectors stayed green and were not wrong — they cannot see a
banner covering a card or a back button that retraces.

Full write-up: `38-wallet-ledger-summary.md`.


## Session 53 — 2026-08-10 — "fix all": dead endpoints 6 → 0

**Three wired, four deleted.** The rule that decided which: *an endpoint is a
defect when a screen makes a claim the portal cannot honour; it is merely unused
when nothing on screen depends on it.*

**Wired:**
- **The active-appointment nudge** (`ongoingByUser`) — REACT-ONLY on all 30
  routes, the largest dead endpoint by reach. **And a correction:** it is not "on
  every screen". React mounts it `lg:hidden`, so desktop users never see it; the
  component fetches behind the CSS. *Traffic shows where a fetch happens, not
  where a feature is.* The unrendered desktop variant was deliberately not ported.
- **Cancel an uploaded prescription** (`cancelPrescription`) — gated on UPLOADED,
  which is all the API allows. Needed its own `cancelPrescriptionPath`: a lab
  ORDER and a lab PRESCRIPTION are both `BookingKind.Lab`, so `isCancellable`
  could not be reused.
- **The AHC copay payment** — and **inherited finding 11 is answered by evidence,
  not by a ruling**: AHC cannot be bill-gated because **there is no bill anywhere
  in the AHC module**. Entry 5 untouched — the order is committed first.

**Deleted, with the shape recorded** — `activeCart` ×2, `vendorPricing` ×2,
`myPolicy`, `refresh`. Two were latent traps: diagnostics' `activeCart` pointed at
the **collection** path, and diagnostics' `vendorPricing` was a **wrong path**
(pricing is cart-scoped there) — a fourth instance of entry 14. `myPolicy` is a
divergence where **Angular is safer**: React derives the copay client-side and
falls back to **0% on failure**, silently charging no copay.

**Verified 24/24.** One real mutation, deliberately: a single prescription
cancelled, since interception cannot prove the API accepts the body. AHC forced by
interception — the allowance is consumed and cannot be re-run.

**Three harness faults and one real defect, all caught by controls:**
`goto()` between journey steps wiped the signal store and reported the AHC feature
broken when it was not; an ambiguous button name made a passing control fail; a
gate control passed by construction. And the prescription gate was **silently not
applied** — the patch matched a stale field order while the script asserted only a
total count. *An assertion on a count is not an assertion on the thing you
changed.*

**Part two — "fix if left dont change flow":** claim documents made
downloadable (the screen counted them and offered nothing), per-test prices
rendered on the vendor screen **with no new request**, and the three unguarded
prefills latched — a cleared pincode now stays cleared. Detector UNGUARDED 3 → 0.
Verified 8/8 with one check explicitly SKIPPED, not passed, for want of a cart.

**The ~35 unconsumed endpoints was wrong: it is 15**, and most of those are not
gaps. It had been quoted across three sessions without re-measurement. *A number
repeated without re-measuring is a claim, not a finding.*

**And `vendorPricing` reversed twice** — deleted for a false reason, restored,
then deleted again for the true one: Angular already had the data mapped from
`cartVendors` and simply never rendered it. The deletion was right; the reason in
the comment was wrong, and a wrong reason is what the next reader acts on.

Register entries 19 and 20. Full write-up: `37-fix-all-apis.md`.


## Session 52 — 2026-08-10 — the invoice download, and why the other five stayed dead

Brief: *"fix the api but dont change flow."*

**Wired `CLINIC_BOOKING_API[area].invoice`**, dead since it was declared, while the
bookings row rendered the bare label "Invoice available". A control, a fetch, a
blob — no new screen, no new destination, no new step.

**Two defects caught before shipping, both by reading the data and the service
first:**

- **`hasInvoice` means two different things.** `invoiceGenerated` for dental and
  vision; `reportCount > 0` for lab and diagnostics. The row said "Invoice
  available" for a lab order's *reports*, and gating the download on that flag
  would have fired the vision/dental invoice route for a lab order. Split into a
  separate `invoicePath`; the lab label corrected to "Reports available".
- **`invoiceGenerated` alone is not the API's rule** — it also requires COMPLETED,
  and the database holds `VIS-BOOK-1769701879987-3994`, CONFIRMED with the flag
  set. A button there could only ever fail.

**Verified 13/13**, non-mutating, no run budget spent
(`03-live/verify-invoice-download.mjs`). Two harness faults recorded rather than
quietly fixed: a wrong-shaped interception that reported as "Could not load"
(dental/vision take a bare array, lab takes an envelope — **two response shapes in
one store**), and a lab assertion that first passed *vacuously* because the
account has no report-bearing order.

**What is NOT verified:** that a PDF arrives. Every stored `invoicePath` is a
macOS path from the original developer's machine and `api/uploads/invoices/` is
empty here, so every download 500s. That makes the *disclosure* assertion the real
one — it is what this machine actually does.

**Deleted two stale duplicates** (`BOOKINGS_API.dentalClinics` / `visionClinics`).
Dead endpoints **9 → 6**. The remaining six were left deliberately: none has a
screen asserting a capability it cannot honour, which is what separated this one.

**Corrected three stale spots in `member-dental/spec.md`** — the session-50 copay
ruling was recorded in one scenario while three others still called it open,
including **two adjacent scenarios with the same GIVEN/WHEN sending the member to
two different destinations**. Added a bookings-list requirement to
`member-vision/spec.md`, which had none.

Register entry 18. Full write-up: `36-invoice-download.md`.

## Phases

| Phase | State |
|---|---|
| 0 — inventories | **done** — `00-inventories/` incl. `rn-only-unscoped.md` |
| 1 — endpoint diff | **done** — `01-endpoint-diff.md` (headline corrected; method limit recorded) |
| 2 — screen parity | **spec-covered screens done** (6 files). Unspecified routes deliberately not started. |
| 3 — live verification | **done, scoped** — `03-live/{session-expiry-spike,spec-verification}.md` |
| SUMMARY.md | not started |

## Task closure status — updated 2026-08-07 after the Playwright unblock

| Task | Verdict | Blocked by |
|---|---|---|
| **3.9 `member-session`** | **CLOSES** ✅ | — 11/11 observed after the `terminate()` fix |
| **4.8 `member-shell`** | **CLOSES** ✅ | — all 11 scenarios pass, all observed |
| 5.8 `member-family-context` | **unresolved** | my earlier FAIL call is in question — see `07-familystore-census.md` §5 |
| **6.11 `member-wallet`** | **CLOSES** ✅ | — 8/8 observed; see the fixture caveat in fix session 3 |

## Fix session 54 — 2026-08-10 — API integration audited live; the Health checkup tab was lying

`03-live/api-parity-diff.mjs` — both apps driven over 30 routes, comparing endpoints
**actually called** rather than strings extracted from source. Then one fix.

- **FIXED — the Health checkup tab on `/member/bookings` was permanently empty.**
  `bookings-page.ts:27` rendered the tab; **`BookingKind.Ahc` was never produced by
  anything**; `BookingsStore` loaded five sources and none was AHC. The member has a
  real order (`AHC-ORD-1786182053508-8GHNX7JM9`, PLACED, ₹240 owed), so the tab was
  not merely unpopulated — **it stated something false**, the same shape as "No
  claims yet" to a signed-out member.
  - Added `AhcOrderDto`, `ahcOrderToBooking`, and AHC as a sixth source. Endpoint
    reused from `AHC_API.orders`, not redeclared — a second declaration is the
    stale-duplicate shape the dead-endpoint scan flags. All-sources-failed threshold
    moved **5 → 6**; leaving it would have declared total failure while a source
    still worked.
  - `verify-ahc-bookings-tab.mjs` **5/5**, non-mutating, with a negative control
    that the dental tab gained no AHC rows.
  - **Side effect worth having:** the row shows **"₹240 still to pay"**, so the AHC
    debt found in session 51 is now at least *visible*. Still unpayable — the
    missing payment leg is untouched and still gated on inherited finding 11.
- **WITHDRAWN, same session — the over-fetch finding was a harness artifact.**
  Pushed to fix it, I read `BookingsStore` before refactoring and found the premise
  wrong. `api-parity-diff.mjs` reaches every route with `page.goto()` — a **full
  page load**, which boots Angular cold and re-instantiates every root store, so a
  once-per-session load shows up once per route.
  - Measured properly (`probe-spa-refetch.mjs`, in-app navigation): **0** calls
    after sign-in on `/member`, **10** on first nav to `/member/bookings`, then
    **0 · 0 · 0 · 0** across dental, vision, appointments and dental again. A full
    reload of `/member/dental` costs 10.
  - **Navigating between hubs costs nothing.** The scoped-load refactor would have
    been work against a problem that does not exist — and it would have shipped
    green, because the harness proving it "fixed" had the same flaw.
  - **What remains is small:** a hub reached cold — deep link, bookmark, refresh —
    triggers the ten-source load for data it does not display. Not worth a store
    redesign.
  - **Two corrections follow.** `08-empty-vs-unfetched.md` says stores fetch "at
    sign-in"; `BookingsStore` issues **zero** calls on `/member` after sign-in,
    because a root store's effect cannot run until a page injects it. And every
    "Angular only" row in `35-…md` measures **cold-boot cost, not navigation
    cost** — a warning now sits at the top of the harness.
  - **Caught by being pushed on it, not by review.** The original text below is kept
    for the record.
- **~~FILED, NOT FIXED — Angular over-fetches on four journey hubs.~~** Dental, vision,
  appointments and online-consult each issue 8–9 requests React does not, because
  they inject `BookingsStore` (`benefit-services-page.ts:147`,
  `consult-hub-page.ts:148`) and it loads every booking source. Both hubs then call
  `.all()` and filter to one kind.
  - **Not fixed for a correctness reason, not effort.** A scoped load would leave the
    singleton store believing it is loaded while holding one kind, so a member going
    from the dental hub to `/member/bookings` would see only dental rows. That trades
    an invisible inefficiency for a visible wrong list. Per-kind caching is a design
    change.
  - **It got one worse today, deliberately** — AHC is a sixth source, so those hubs
    now issue ten. Recorded rather than hidden.
  - This is the **measured cost of a design the audit had only ever praised**:
    `08-empty-vs-unfetched.md` credits eager loading for Angular having no
    empty-state flash. The benefit was written down; the price never was.
- **Entry 14 extended to a THIRD instance, and this one does not 404.** React's
  **diagnostics orders** screen fetches `member/lab/orders`
  (`diagnostics/orders/page.tsx:40`) and links rows as diagnostics orders. The two
  cart screens 404 visibly; this one **succeeds and shows the wrong domain's data**.
  Read-only reference — recorded do-not-port, Angular already correct.
- **Confirmed live:** the active-appointment nudge is React-only on **all 30 routes**
  (the gap was known, the scale was not); the `/member/transactions` URL collision,
  independently of the morning's source read; React's benefits screen **404ing three
  times per visit**.
- **Harness note — a control passed for the wrong reason again.** The first version
  of this compared UI text and passed while React sat unauthenticated on its login
  page for all 30 routes; its positive control was *"the wallet screens must
  differ"*, which total failure satisfies. Replaced with per-app expected headings,
  plus a rule that a route silent on both sides is reported rather than scored as
  agreement. **Second time in one day**, and the lesson is the same: assert a
  specific expected value, never a difference.
- validate → valid, pairing → OK, build green.

## Fix session 52 — 2026-08-10 — a sanctioned divergence was resting on a wrong generalisation

Reads and corrections only, no code. Prompted by the user pointing out that the
appointment booking process is different from what the record described. It was,
and the record was wrong in three places.

- **The two confirm screens are structurally different, and only one was ever read.**
  - **In-clinic** — `appointments/confirm/page.tsx:308-331` renders
    `<PaymentProcessor>` **inline**, gated only on
    `!loadingUser && userId && patientId`. No second step, no CTA.
  - **Online** — `online-consult/confirm/page.tsx` puts it on a **second step**,
    gated at `:527`, behind *Proceed to Payment*.
  - Session 48 read the online page and wrote the conclusion as "React". **The
    reference is inconsistent with itself**, and Angular's single screen matches the
    in-clinic structure exactly.
- **Register entry 16 corrected and NARROWED.** It sanctioned "Angular shows the
  breakdown before the member commits" as a divergence in the member's favour. For
  in-clinic **there is no divergence** — that is what React already does. The entry
  now scopes to online consultations only, and notes the stronger argument it
  previously missed: **the reference's own in-clinic screen is the precedent.**
- **How the error was made, recorded because it is the transferable part.** Both
  pages import and render the same `PaymentProcessor`; that was checked and treated
  as showing the screens matched. It shows only that the component is shared — where
  a page renders it is a property of the page. **A shared import is not an enclosing
  scope.** The rule was cited in the same session it was broken.
- **Two further corrections to `34-copay-reference-trace.md`**, found reading both
  payment screens in full:
  1. **VISION does not create a booking after payment** — it already exists and the
     backend completes it (React `:151`, RN `:448-463`). Five creating branches,
     not six.
  2. **React and RN are not equivalent on orphan risk.** With no stash React logs
     three warnings and **marks the payment paid anyway** (`:449-453`); **RN throws**
     on a missing stash (`:408-411`) and on a `paymentId` mismatch (`:416-422`). The
     **thirteen orphans are React-specific**. Session 50's ruling is unaffected —
     booking-first avoids the class rather than guarding it — but the file had been
     convicting both references on evidence against one.
- **`member-consultations` corrected** — its breakdown note described the two-step as
  "React"; it now states both placements, since the requirement covers both modes.
- **Also still open from session 51:** the AHC order owing ₹240 with no payment
  record, filed in `14-ahc-commit-contract.md` and gating on inherited finding 11.
- validate → valid, pairing → OK. No source changed.

## Fix session 51 — 2026-08-10 — reference reads, and an AHC defect found in the data

Reads only, no code. Prompted by a walk through both references' payment screens.

- **AHC: a committed order that owes ₹240 and cannot be paid.**
  `AHC-ORD-1786182053508-8GHNX7JM9` — `PLACED`, `copayAmount: 240`,
  `paymentStatus: PENDING`, **`paymentId: undefined`**. No payment record exists.
  - **Not the same defect session 50 just ruled on**, which is why it survived: there
    the API created a PENDING payment and the portal discarded its id, so the fix was
    one line. **Here nothing creates the payment at all** — `AHC_API` declares five
    keys and none is a payment, and `core/` declares no `POST payments` anywhere.
  - **Criterion 6 is blind to it.** The criterion hunts pending *payments*; AHC leaves
    a pending *order* with no payment, so the query returns nothing. A detector tuned
    to one artifact cannot see the same failure expressed in another.
  - **AHC is the only vertical where booking-first shipped without its other half.**
    Dental and consultations get a payment from the API; vision has
    `process-payment`; lab and diagnostics owe nothing without
    `paymentAlreadyProcessed`. AHC has none of these.
  - Proof the leg is possible: `PAY-20260330-0134`, COMPLETED ₹240, against a
    different AHC order via the reference's payment-first path.
  - **Filed, not fixed, and blocked on inherited finding 11** — which is now
    escalated from a documentation question to the gate on a live defect. If AHC
    payment should be bill-gated as vision's is, the leg waits for a bill; building
    before the answer risks building the wrong half a second time, which is how this
    arose.
- **Two corrections owed to `34-copay-reference-trace.md`, from reading both payment
  screens in full:**
  1. It lists VISION among the branches that create a booking after payment. **It is
     not** — in both apps the vision booking already exists and the backend completes
     payment (React `:151`, RN `:448-463`). Five creating branches, not six.
  2. It treats React and RN as equivalent on orphan risk. **They are not.** React,
     with no stash, logs three warnings and **marks the payment paid anyway**
     (`:449-453`) — the mechanism behind the thirteen orphans. **RN throws** on a
     missing stash (`:408-411`) *and* on `bookingData.paymentId !== paymentId`
     (`:416-422`). The ordering is identical; the guarding is not, so the orphans are
     a React-specific consequence. Session 50's ruling is unaffected — booking-first
     avoids the class rather than guarding against it — but the record overstates the
     case against RN.
- Also noted: RN stashes from **eight** journeys to React's three, passes
  `existingPaymentId` on both appointment payloads where React passes only
  `paymentAlreadyProcessed`, and carries a full **vaccination** branch — now relevant,
  since vaccination is ruled in and RN's is the only implementation of its payment leg.

## Fix session 50 — 2026-08-10 — the copay continuation is RULED and implemented; vaccination ruled in

A decision open since session 34 is closed. Built in 34, reverted in 40 for want
of a ruling, **reinstated in 50 now that one exists.**

- **Reinstated, not rebuilt.** `paymentId` was already carried on both result
  types and marked unused pending exactly this decision. The navigation went back
  into the **two confirm pages** — **no store touched**, as session 40 established.
  Four comments corrected back. Navigation fires **only when something is owed**.
- **Mechanism unchanged, destination adopted.** Booking-first stands; entry 5
  untouched. Both references create the booking *after* payment, which is what left
  thirteen payments with no booking. **Register entry 17** settles the React/RN
  split in React's favour — `/member/bookings?tab=doctors`, not RN's consultation
  hub — so it does not get reopened.
- **Most of the verification cost nothing.** `verify-copay-continuation.mjs`
  **6/6**, create intercepted so no booking written, proving all three branches:
  owed → payment screen; nothing owed → bookings list; **a Mongo `_id` in the
  field → bookings list, not a payment screen** (the `PAY-` guard holds —
  identifier duality checked, not assumed).
- **Then ONE real run: `verify-consultations.mjs` 23/23.** Both modes navigated to
  the copay the API created, the payment screen named it, **the amount asked for
  equalled the amount the confirm screen quoted**, and criterion 6 left nothing
  unexplained.
  - **Run two was NOT spent** — nothing was left open. CAT001 has **one** run left;
    CAT005 two. The session-42 sequencing dependency is discharged with budget to
    spare.
- **Criterion 6 was not weakened — no predicate was edited.** Session 40 relabelled
  without touching the assertions precisely so this would be cheap; only labels and
  banners changed. The banners now state **what a green run means** (the member is
  taken to what they owe) **and what it does not prove** (that anything is
  collected — Cancel sits beside Pay and shares the redirect; and that the list
  reflects it afterwards).
- **Stated plainly, because it was the basis of the ruling:** this guarantees the
  member is **told**, not collected from. And for consultations, told **once** —
  finding 13 means a member who cancels returns to a list showing nothing
  outstanding. **Dental is implemented but not re-verified**: CAT006 is spent, so
  its create leg still cannot run; assertions re-aimed for when it is refreshed.
- **Claims remain open** — same mechanism, different meaning. A booking copay is
  money owed for a service committed to; a claim copay is the unreimbursed share of
  a bill already paid. Not settled by this ruling.
- **Vaccination ruled IN**, as a separate change. `12-vaccination-sizing.md` is the
  specification source; `openspec/changes/member-vaccination/` moves from proposed
  to **scheduled**. Not built this session.
- **Decision brief: 1 and 2 closed, 3 and 4 open** — native packaging still needs
  an app-store reach figure nobody in this loop has gathered; the AHC reload has a
  recommendation on file awaiting a yes.
- validate → valid, pairing → OK, build green.

## Fix session 49 — 2026-08-09 — two register entries filed, the Platform Fee closed, corrections propagated

No code, no booking runs. Follow-ons from session 48.

- **Register entry 15 — "Paid from your wallet", not "Insurance Pays".** Filed with
  the reasoning, not just the verdict: the mapper renders `walletDebitAmount`; the
  money leaves the member's own wallet; every other Angular screen says wallet; and
  **the reference's label is false** — it tells a member their balance was untouched
  at the moment it dropped ₹300. Cross-referenced to the ranking in `21-…md` as the
  **false domain cause** rung — *avoided rather than committed*, unlike the two
  instances found in Angular and fixed.
- **Register entry 16 — the breakdown is shown before the member commits.**
  Recorded as a **deliberate divergence in the member's favour** rather than left
  as an accident. React puts the working on step 2, after *Proceed to Payment*
  (`confirm/page.tsx:527`/`:584`); its step 1 shows only fee/platform/total
  (`:616`). Angular shows it on the one confirm screen while the member is still
  deciding — which is when the question it answers actually gets asked. Not scope
  creep by entry 13's test; reproducing React's two-step structure would have been
  the flow change.
- **STEP 2 — the Platform Fee is CLOSED, and the stop condition does not apply.**
  It is a **hardcoded `₹0` string literal in both reference apps**
  (`web-member/…/confirm/page.tsx:861`, `web-member-rn/…/confirm.tsx:1191`) and
  **neither adds it to its total** — both totals are `₹{consultationFee}`. Nothing
  computes it: no `platformFee` variable anywhere in the reference, and **no
  fee-like field anywhere in `api/src/**`**. It cannot be non-zero, so Angular's
  total is missing nothing and there is nothing to file for the API owner.
  - **The brief mis-attributed the reason, and the correction matters.** "Derived
    from its own client-side validator… reproducing it means writing a second
    calculator" was true of the **Payment Method badge** (session 48), not of
    Platform Fee, which needs no calculator at all. Two different reasons not to
    port, now stated separately.
  - Cleanest reason of the three: Platform Fee belongs to React's **step-1 summary
    card**, which Angular's confirm supersedes. It is not in the `PaymentProcessor`
    line set Angular matched — that set has no such row.
- **STEP 3 — corrections propagated, and one was still drifting.** The
  confirm/second-step error survives only *as corrections* in `34-…md` and this
  log, and **has not reached any spec** — the spec's two "confirm screen" hits are
  unrelated. But `34-…md:225` still led with the bold heading *"a third exit
  candidate"* and only resolved it in the body; **a cold reader scanning headings
  would have taken away the wrong number.** Heading rewritten to carry the
  conclusion: Cancel and success share `redirectUrl`, so **two candidates — React
  vs RN — not three.**
  - The spec and the decision brief now both state the earlier-disclosure point
    positively and cite entry 16; the README's register count corrected 14 → 16,
    with entries 15 and 16 described as cases where Angular is deliberately better.
- validate → valid, pairing → OK, build green (no source changed).

## Fix session 48 — 2026-08-09 — the confirm breakdown matches the reference; the payment screen observed

One display change on one screen, plus one read. No flow change. No booking run
spent — every case forced by interception.

- **Part A — the consultation confirm screen now renders the reference's full
  breakdown.** `03-live/verify-confirm-breakdown.mjs` **17/17**, asserting on
  rendered text and value per line, not on a pass count. As rendered:
  *Consultation fee ₹800 · Wallet balance ₹11,508 · Your copay (20%) − ₹160 ·
  Insurance eligible amount ₹640 · Service transaction limit applied Max ₹300 ·
  Additional out-of-pocket − ₹340 · Paid from your wallet ₹300 · You pay total
  ₹500*, plus the explanatory note. Three cases: the screenshot case, no
  transaction limit (limit lines and note **absent**), and wallet covers nothing
  (**still renders** — where the reference goes blank).
- **The brief's premise needed correcting: React does NOT show this on its confirm
  screen.** Its confirm renders only *Consultation Fee / Platform Fee / Total* and
  a **Proceed to Payment** CTA (default `return` at
  `online-consult/confirm/page.tsx:616`). The breakdown lives on a **second step**
  of the same route, gated at `:527` and rendering `<PaymentProcessor>` at `:584`.
  **So React shows the working only after the member commits to proceed; Angular
  shows it while they are still reviewing.** Adding lines to an existing screen is
  display; adding React's second step would have been a flow change and was not
  done. Session 47's "rendered inline on the confirm screen" corrected in place.
- **In-clinic needs nothing separate** — `appointments/confirm/page.tsx:309`
  renders the same `PaymentProcessor`, so both branches share one reference.
- **Label decision, made and reported: "Paid from your wallet", not React's
  "Insurance Pays".** The mapper is
  `fromWallet: money(breakdown.walletDebitAmount ?? breakdown.insurancePayment)` —
  the number rendered **is** the wallet debit; the money leaves the member's own
  wallet, which they watch deplete; and every other Angular screen says wallet.
  "Insurance Pays ₹300" would imply their balance was untouched. **A sanctioned
  label divergence warranting a register entry** — `tools/parity-divergences.md`
  was outside this session's writable set, so it is recorded in `34-…md` for
  whoever adds it.
- **One reference line deliberately NOT reproduced** — the *Payment Method* badge.
  `getPaymentMethodDisplay(validationResult.paymentMethod)` reads from React's own
  client-side validator (`lib/paymentValidator`); `appointments/validate-booking`
  does not return that field. Reproducing it means writing a second calculator,
  which is arithmetic, and the instruction there is to stop.
- **Two passthrough fields added** to the cover-check DTO/model —
  `copayPercentage` and `insuranceEligible`, both already returned by the API. No
  arithmetic changed.
- **Part B — the payment screen observed, and it SIMPLIFIES the decision.** A real,
  working screen; **Cancel sits directly beneath Pay**, so sending the member there
  guarantees they are *told*, not that anything is collected.
  - **The exit routes do not fork.** `redirect` is read once into `redirectUrl`
    (`payments/[paymentId]/page.tsx:23`) and **both** exits use it — success `:479`,
    Cancel `:634-639`. The observed `/member/online-consult` is the else branch of
    `PaymentProcessor.tsx:213-227` for ONLINE_CONSULTATION, not a separate rule.
    **Two destination candidates to choose between (React vs RN), not three.**
- **Unchanged:** the bookings-list gap after payment stands — finding 13, an API
  problem. Angular's bookings row was not touched and remains ahead of the
  reference's, which understates a ₹500 debt as ₹200.
- validate → valid, pairing → OK, build green.

## Fix session 47 — 2026-08-09 — the reference traced; the copay decision narrows to consultations alone

A read of `web-member/` and `web-member-rn/` only. No code, no harnesses, no
consultations runs. `34-copay-reference-trace.md`.

- **The question was whether React discloses an outstanding amount on a screen
  Angular already has. It splits by service, and the split is the finding.**
- **Dental and vision — SETTLED, no decision needed.** React's bookings row shows a
  payment badge (`bookings/page.tsx:2016-2023`, text from `getPaymentStatusText`
  `:683-696`) and a copay line (`:2060-2074`). Angular does the same thing on the
  same screen. **Session 41's disclosure was matching the reference without knowing
  it.**
  - **And Angular's is more accurate.** React renders `copayAmount` and omits
    `excessAmount` — a booking owing ₹600 displays **"₹200"**. Angular renders
    `totalMemberPayment`. Filed as a reference defect: **do not port it.** Two more
    beside it — React's breakdown is gated on `walletDebitAmount > 0`, so a
    full out-of-pocket booking shows no money at all; and its copay line renders
    whether or not it has been settled, leaving only the badge to distinguish them.
- **Consultations — the whole of the remaining question, and (b) not (a).** React's
  doctors tab (`:1023-1292`) renders only `₹{appointment.consultationFee}`, twice —
  the gross fee. No badge, no copay, no marker; **a paid consultation and an unpaid
  one render identically.** RN is the same. The reference discloses only at confirm
  (`PaymentProcessor.tsx:364`) and on the payment screen (`:604`) — the two screens
  on the way to paying. **The disclosure is inseparable from the redirect**, so this
  stays a flow-change decision.
- **STOP CONDITION 1 — not tripped, and the negative result is the valuable one.**
  React's consultations row shows no outstanding amount, so there was no hidden
  data source to find. **Finding 13 is confirmed as an API problem from three
  independent directions**: the API returns only `consultationFee`; React renders
  only that; **RN's `Appointment` interface (`bookings.tsx:58-78`) does not even
  declare the payment fields**, while its dental, vision and vaccination interfaces
  all do. No reference app is reading data Angular is missing.
- **STOP CONDITION 2 — React and RN disagree on the destination, for consultations
  only.** React sends a paid consultation to `/member/bookings?tab=doctors`
  (`PaymentProcessor.tsx:214`); **RN sends it to the consultation hub**
  (`payments/[paymentId].tsx:723-727`). Every other service agrees on the bookings
  tab. Reported rather than merged — there is no single "what the reference does"
  for that step, and whoever rules the redirect must choose.
- **Two other facts worth having before the ruling:**
  - React's payment screen has a **"Cancel" button that leaves without paying**,
    to the same destination a successful payment reaches
    (`payments/[paymentId]/page.tsx:634-639`). Option 1 would guarantee the member
    is *told*, not that anything is collected.
  - That screen **creates the booking after payment** (`:146`, `:211`, `:268`,
    `:349`, `:424`) — the payment-first ordering entry 5 rules do-not-port, seen
    directly rather than inferred.
- **Net effect on the decision:** it was "mostly about consultations"; it is now
  **only** about consultations, with dental and vision closed and the reference's
  own version identified as worse than what Angular ships. `32-decision-brief.md`
  decision 1 updated.
- validate → valid, pairing → OK.

## Fix session 46 — 2026-08-09 — the audit's own documents, read cold

No code, no harnesses, no test data, no consultations runs. Subject: whether these
documents are legible to someone who was not here.

- **Method, with its limit stated.** A true cold read was unavailable — the reader
  wrote most of the material. The approximation was mechanical: start at
  `progress.md`, follow **only links that physically exist in the text**, refuse
  anything not written down. Breaks recorded only where the document failed to
  carry the reader.
- **One pass, two breaks, and the entry point itself was the first break.**
  - **PASS (positive control)** — *"which findings are open, and which need a
    decision?"* lands on `32-decision-brief.md` §6.
  - **BREAK, unlinked** — *"why does Angular book before payment?"*: **"entry 5" is
    cited eleven times in this file and never once with a path.** Zero
    co-occurrences with "parity-divergences".
  - **BREAK, unlinked** — *"can I run the suite, and what will it cost?"*:
    `31-run-budget.md` was named **once**, at line 220, inside a session report.
    The most consequential operational fact in the audit — two runs left — was
    reachable only by scrolling.
  - **Second defect on the same path:** the register was cited as
    `tools/parity-divergences.md`, which **does not resolve from `audit/`**. Fixed
    in all six places, at the right depth for each file.
  - **The header sent strangers to do scoped-out work** — *"continue from the first
    todo"* was phase-2 framing, ~26 sessions stale, pointing into a DEBT checklist
    deliberately not started.
- **STOP CONDITION — a contradiction of fact, fixed first.**
  `17-renders-but-cannot-complete.md:72` said **56 completable routes**;
  `progress.md:1235` said **57**. Neither marked provisional. The passage now
  carries a superseded note; the current figure is **57 and provisional**, with
  the full 55→60→59→56→57 sequence and the reason for each move reconciled in
  `README.md`.
- **`README.md` written — the entry point that never existed.** A map, not a
  report: what the audit is, what state it is in, a question→document table, the
  numbers that moved, and **what a stranger must not conclude** — a green harness
  is not a correct flow, divergence is not defect, "filed not fixed" is a decision
  not a backlog, and a silent spec passes for the wrong reason.
- **`progress.md` is now self-describing** — a chronological log that contradicts
  itself on purpose, whose unchecked boxes are not a work queue, with the register
  path given once in the header so the eleven bare "entry N" citations resolve.
- **`33-method-rules.md` written** — the transferable rules with the instance that
  earned each, extracted from files that only made sense in sequence. Usable on a
  different project; the instances are kept because the rules without them read as
  platitudes.
- **The finding under the findings:** every break was **a link that existed in
  someone's head and not in the text.** The information was present and correct in
  all three cases; the path from the question to it was missing.
  > Legibility is not a property of a document. It is a property of the path from
  > a question to it, and the only way to test it is to start from the question.
- validate → valid, pairing → OK.

**Still blocked, unchanged:** three decisions answerable now (copay continuation —
**two consultations runs**, vaccination, AHC reload); one needing a figure nobody
in this loop has gathered (native packaging); four test-data items plus the
`PAY-20260808-0188` condition.

## Fix session 45 — 2026-08-09 — the decision brief; the audit has no unblocked work left

**STATE: STOPPING POINT, NOT A STALL.** Every remaining item is a decision or a
piece of test data, and all of them sit with someone outside this loop. No code
changed this session; no mutating harness was run.

- **`32-decision-brief.md` written** — one document, four decisions, each
  self-contained enough that its owner can answer without reading the audit. For
  each: the question in a sentence, what is established, options with
  consequences, the recommendation **only where one is on file**, and the cost of
  leaving it.
  - **Decision 1 (copay continuation) is the only one that degrades** — two
    consultations runs left, after which a ruling lands with nothing able to
    verify it. Narrowed to consultations specifically: dental and vision now
    disclose, and consultations structurally cannot (finding 13). Finding 11 is
    flagged as read-first because **option 3 may make option 1 unnecessary**.
    Recorded plainly that entry 5 permits the continuation and does not mandate
    it — *permission is not approval* — so it cannot be cited as authority.
  - **Decision 2 (vaccination) has no cost today, and that is a change of state**:
    it stopped being perishable when `12-vaccination-sizing.md` was written to
    outlive the app it describes.
  - **Decision 4 (AHC reload)** carries the on-file recommendation to sanction the
    loss — bounded at two screens of re-entry, and porting `sessionStorage`
    reintroduces the mechanism entry 5 rules against.
- **STOP CONDITION, partially met and named rather than waved through.**
  **Decision 3 (native packaging) is the one question this brief cannot supply the
  input for.** It turns on how many members reach the portal through the app store
  today; that figure is not in the repo, the specs or the audit, and nobody in
  this loop has gathered it. If the owner holds it, the decision is answerable
  now; **if not, gathering it is a prerequisite and belongs on the blocked list** —
  a question for whoever owns distribution analytics, not test data. Named because
  a decision that quietly needs an ungathered number is how a pending decision
  becomes a stall nobody can explain. The other three are answerable from what is
  already established.
- **The test-data ask consolidated** into one section: four items with their
  owners and what each unblocks, plus **the condition** — if the account is
  reseeded, `PAY-20260808-0188` must survive, because every criterion-6 positive
  control dies at once and *a query returning nothing looks identical whether the
  run is clean or the check is dead.*
- **The filed-not-fixed register is in one place** — the three unguarded effects
  with the `vendor-booking-page.ts:308` pairing, the invoice action, the 30-second
  window, the dead injections, and a table of the four questions for the `api/`
  owner (findings 11, 12, 13 and the §3 producibility question).
- **Two conventions recorded**, both cheap, both would have caught a defect found
  late:
  - *A message describing form state must be a `computed()`, not a stored signal.*
    The detector was **deliberately not built** — separating legitimately stored
    messages from stale ones needs modelling when each condition changes, which
    produces a fuzzy candidate list and **would burn the credibility the five
    working detectors earned.** Convention first; then grep is exact.
  - *A control anchored to a detector's own first finding will die if the detector
    succeeds.* `18-write-sweep.mjs` is the proof — sixteen sessions unusable.
    **Fixture-anchor that class from the start.**
- validate → valid, pairing → OK.

### What would restart the audit

| Unblocks | Needs |
|---|---|
| the copay continuation, verified | decision 1 **within two runs**, or refreshed CAT001/CAT005 |
| AHC transcription | a member with an unused AHC allowance |
| 5.8 | a dependent credential |
| the submission scenario, both kinds | a doctor-authored prescription for `shivam@` |
| the dental create leg | refreshed CAT006 |
| `SUMMARY.md` | all of the above — it stays unwritten while four decisions are open and four verification items are blocked, because writing it now would record blocked work as finished |

## Fix session 44 — 2026-08-09 — a second expired control found; the audit reaches the end of its unblocked work

- **No consultations run spent.** CAT001 still at two.
- **A SECOND expired control, found by running the detectors session 43 did not.**
  `18-write-sweep.mjs`'s negative control was *"ahc shows none"* — anchored to the
  very defect it discovered. **Session 27 built AHC's commit path, so it has been
  exiting "output meaningless" for sixteen sessions.**
  - **The detector was retired by its own success.** Its purpose was to find a
    feature with no commit path; it found AHC; AHC was built; the control died.
    *A control anchored to a defect is a countdown started by the person most
    likely to fix that defect.*
  - It failed **loudly** — expiry, not drift — so the stop condition is not
    tripped. But an honest script nobody re-runs is still sixteen sessions of
    nothing, which is the real lesson.
  - **Re-anchored** to property-based fixture controls. AHC's write count is kept
    as a printed observation so the change stays on the record. Re-run: no
    must-create feature has zero writes; `lab` is now 4 (submitExisting).
- **Step 1 — the criterion-6 constraint is in the ask**, as a condition on the
  refresh rather than a fifth item: **if the account is reseeded,
  `PAY-20260808-0188` must survive**, or every criterion-6 positive control dies at
  once. No cheap substitute exists — a synthetic payment is not queryable through
  the same path, so this one cannot be fixture-anchored like the other two. Stated
  with the reason: a criterion-6 query that returns nothing looks identical whether
  the run is clean or the check is dead.
- **Step 2 — the stale-message rule written, with what would run it.**
  > A message derived from a past evaluation will outlive the condition it
  > described. Derive user-facing state from current state, or clear it when the
  > condition changes.
  - Fourth arrival of the same class, alongside "No claims yet", the false lab
    cart cause, and "Invoice available".
  - **The scan was NOT built, and the reason is the finding:** a sound version is
    not cheap, because the codebase has many legitimately-stored message signals
    cleared correctly on the next attempt, and separating those from stale ones
    means modelling when each condition changes. **The cheap check needs a
    convention first** — *a message describing form state must be a `computed`* —
    after which grep is exact. **Convention, then detector**; the check is
    expensive because the convention is missing, not because the property is hard
    to see.
- **Step 3 — the control taxonomy recorded as three distinct failures**, with the
  altitude point: an unmechanised method rule, a stale control, and a spec whose
  precondition cannot arise are **one shape at three altitudes — a check that
  exists but is never run against what it protects.** The common remedy is the
  same as the stale-message rule: evaluate against current state, not a remembered
  one.
  - **Drift remains at one instance** (`13-trace.mjs`), now carrying a header
    saying its output is a structural fact list and not a defect list. A second
    would make it a class and justify requiring every detector to state what a row
    means.
- **THE AUDIT IS OUT OF UNBLOCKED VERIFICATION WORK.** Everything remaining is a
  decision or waiting on test data. Recording that as a state, not a gap:
  - **4 decisions**, copay continuation first and on a two-run deadline.
  - **4 test-data items + 1 constraint**, one request.
  - **Filed, not fixed:** three unguarded prefill effects (harnesses out of
    budget), the invoice action, inherited findings 11/12/13, the 30-second
    termination window.
  - **`SUMMARY.md` stays unwritten** while four decisions are open and four
    verification items are blocked — writing it now would record blocked work as
    finished.
- validate → valid, pairing → OK, build green.

## Fix session 43 — 2026-08-09 — one effect fixed, the controls swept for expiry, and a defect I introduced in session 41

- **No consultations run spent.** CAT001 still at 2 runs.
- **`new-claim-page.ts:297` fixed** — one-shot guard, the same shape as the upload
  prefills. `03-live/verify-claim-form-states.mjs` **8/8**, non-mutating.
  - **CORRECTION to session 42's framing.** It is line-for-line the upload prefill
    *in code*, and **not in consequence.** The upload form's address select carries
    a blank "Select an address" option, so a member could clear it — that is what
    let the form upload instead of refusing. The claims patient select is built
    from the family list with **no blank option** (verified live: two options,
    neither empty), so the loop was never reachable from the UI. The fix removes a
    latent hazard; it is not a member-visible fix, and saying otherwise would
    overstate it. *Identical code does not mean identical exposure* — the same
    distinction the audit has had to make about specs and about controls.
  - Verifying "the submit path refuses with the field named" required the inline
    messaging here too, since `canSubmit()` gated the button. Applied, matching
    session 41.
- **A defect I introduced in session 41, found by the claims harness.** Storing the
  refusal message meant it **stayed on screen after the member fixed the field** —
  a screen asserting something no longer true, the `21-degraded-not-declared.md`
  family. Replaced on **both** forms with `attempted` + a computed that recomputes
  the current first unmet requirement, so it clears itself. `verify-claims.mjs`
  **10/10**, `verify-submission-states.mjs` **24/24**.
  - It surfaced because re-running an existing harness after a change is what
    catches the change's own side effects. Two of its assertions also had to be
    re-aimed off `!isEnabled()` — they were asserting the disabled-button model
    session 40 ruled against, i.e. **asserting the defect.**
- **STEP 2 — the controls swept for expiry.** `10-assertion-provenance.md`. Three
  anchor types: **instance** (fragile, expires when the defect is fixed),
  **property** (durable), **deliberately preserved example** (durable only if the
  record says so).
  - **One expired control, and it FAILS rather than passing wrongly** — the safe
    direction. `22-dead-endpoint-scan.mjs` asserted it finds `submitExisting`
    dead; session 39 wired it up, so the count went 10 → 9 and the control broke.
    **The scan had therefore been running without a valid positive control since
    session 39.** Re-anchored to a synthetic two-key fixture — property-anchored,
    cannot expire. `invoice` demoted from control to a preserved-example *note*.
  - **One control whose meaning drifted without breaking:** `13-trace.mjs` still
    correctly flags `online-consult/confirm` as taking a `patientId` no route
    supplies — structurally true — but the defect it was written from was fixed in
    session 25 by resolving the patient from `FamilyStore`. **Its output is no
    longer a defect list.** Control fine; reading it as findings would not be.
  - **Fragile, marked not re-anchored:** every criterion-6 harness keys its
    positive control on `PAY-20260808-0188`, a real obligation. If that is settled
    or the account reseeded, they all lose their positive control at once. No
    one-line fix — a synthetic payment is not queryable through the same path.
  - Rule recorded: **if what would falsify a control is "someone fixes the bug",
    it is a timer, not a control.**
- **STEP 3 — two rules written where a future migration reads them** (`23-…md`):
  *a detector's first output is a candidate list, never a findings list* (five
  detectors, five first-run false positives, all syntax-not-structure); and *the
  test for a method rule is what would run it* (two prose rules failed to prevent
  their own recurrence; both worked once mechanised). Control expiry is the third
  at a different altitude — a check that exists but is never run against what it
  protects.
- **`vendor-booking-page.ts:308` filed with the pairing stated explicitly** — the
  `addressBlocked` guard session 38 added to that file is **unreachable** because
  the unguarded effect prevents clearing the address. Neither half looks wrong
  alone; only a mechanical scan connects them. Same shape as "GIVEN a cart": a
  check that passes because the condition it guards cannot arise.
- **Three unguarded effects left filed and unfixed** — `clinics-page.ts:114`,
  `vendor-booking-page.ts:308`, `ahc-booking-page.ts:147`. Their journeys' harnesses
  are out of budget, and shipping unverifiable fixes is what section 9 prevents.
- validate → valid, pairing → OK, build green.

## Fix session 42 — 2026-08-09 — the run budget is measured; a fourth defect class found; no mutating work

- **No mutating harnesses run.** The session's purpose was to record consumed
  capacity properly and run the one overdue detector.
- **SEQUENCING DEPENDENCY, written as a dependency and not a note.**
  `31-run-budget.md`. **The copay continuation must be ruled while
  `verify-consultations.mjs` can still run — it has TWO runs left.**
  - Measured from `wallet_transactions`, not estimated: **CAT001 ₹600 at ₹300 per
    booking = 2 runs**; CAT005 ₹900 at ₹300 = 3; CAT006 ₹200 against a ₹400 debit
    = 0. The harness books one of each per run, so **CAT001 binds at two.** The
    brief's "one or two" holds at its pessimistic end.
  - **Twelve of the fourteen copays are consultations**, so that harness is what
    would verify the ruling. Rule it now, or refresh CAT001/CAT005 first — doing
    neither spends the budget re-confirming what is already known.
- **The test-data request is now a resource-refresh request, four items.** CAT001,
  CAT005 and CAT006 go as **one ask**; asking piecemeal a week apart is how a
  request gets deprioritised. The fourth item is the only one the audit caused
  rather than inherited, and the only one that recurs — every booking verification
  spends real entitlement.
- **Two varieties of harness self-limitation, recorded as a pair** because
  treating them as one left the second unbudgeted:
  > A harness that mutates shared state is not repeatable by default. Where the
  > mutation is a **collision**, a selection strategy recovers it. Where it
  > **consumes a finite entitlement**, nothing does — the harness has a total run
  > budget, and that budget should be known before it is spent.
  - Practical form: **divide the allowance by the per-booking debit and write the
    number down before building the harness.** Dental had seven runs in it; nobody
    counted, and the eighth failed.
- **The dental banner now says which nine of the eighteen still run**, that the
  create leg is unrunnable on a spent entitlement rather than a defect, that the
  disclosure fix is still verified off `booking.outstanding` and the six existing
  bookings, and that **14/18 was accurate when taken and cannot be reproduced.**
  First measurement in this audit that is *gone* rather than stale.
- **STOP CONDITION — detector 5 found FOUR unguarded sites.**
  `30-effect-self-write-scan.mjs`, all four controls passing, every site read by
  hand before reporting:
  - `claims/new-claim-page.ts:297` — `patientId`, **line-for-line the upload
    prefill fixed in session 41**, in a different feature
  - `clinic-booking/clinics-page.ts:114` — `pincode`
  - `lab/vendor-booking-page.ts:308` — `addressId`
  - `wellness/ahc-booking-page.ts:147` — `pincode`
  - **The consequential one is `vendor-booking-page.ts:308`.** Session 38 added an
    `addressBlocked` guard to that same page for incomplete home-collection
    addresses — **the member cannot reach it**, because they cannot clear the
    address to make it incomplete. A guard added in one session is unreachable
    because of a defect in the same file, and only a mechanical scan connected them.
  - **Not fixed.** Four is a class; two of the four sit in journeys whose harnesses
    are out of budget, so fixing now would produce unverifiable changes.
- **The detector was wrong twice, and one of its CONTROLS was wrong** — the more
  useful error. It asserted the scan must still find the ONLINE contact number;
  session 25 fixed that by latching **and no longer reading** the signal, so it is
  correctly not self-referential. The control asserted a fixed thing stays broken.
  Surfaced that there are **two valid remedies**: latch the prefill, or stop
  reading what you write.
  - Two false positives fixed before reporting: a phantom row from an
    expression-bodied `effect()` with no block, and a `.then()` read that is not a
    tracked dependency. **Five detectors, five first-run false positives, all from
    matching syntax rather than structure** — recorded in `23-…md`. A detector's
    first output is a candidate list, never a findings list.
- **"A rule that cannot be run is a reminder, and reminders decay"** added to
  `10-assertion-provenance.md`. Two prose method rules have now failed to prevent
  the recurrence they were written for — the schema rule (AHC → lab) and the effect
  rule (session 25 → 41). Both were fixed by mechanising them. The test for a
  method rule is **what would run it**.
- validate → valid, pairing → OK, build green.

## Fix session 41 — 2026-08-09 — two defect fixes land; the copay disclosure reaches two verticals of three, and the third is an API omission

- **Step 1 — inline messaging on the upload forms. `verify-submission-states.mjs`
  24/24, both kinds, every clause.** The control is now enabled and validates on
  attempt, naming the first missing field, matching
  `appointment-confirm-page.confirmProblem` and `vendor-booking-page`'s address
  guard rather than inventing a fourth style. *Incomplete submission is refused*
  was unreachable as written; it is now driveable and passes.
  - **The assertion was built to test the clause, not the appearance of a
    message.** Three cases per kind, each leaving exactly ONE field missing and
    requiring the message to name *that* field and not the others. "Some alert
    appeared" would have passed on all three without testing anything.
  - **A second defect, found by driving it — the session-25 shape, still present.**
    Both prefill effects on the upload form read the signal they write, so
    clearing the address made the effect put it straight back and the form
    submitted a real prescription instead of refusing. *"The effect fought the
    user"* was diagnosed and fixed on the ONLINE contact number in session 25;
    the same shape had survived here. One-shot guards on both.
  - Cost: **several stray prescriptions** uploaded on the test account by the runs
    before that was understood. Accretion, same sanctioned class as bookings, and
    noted rather than cleaned up.
- **Step 2 — the bookings row names what is owed. Dental and vision only.**
  `booking.outstanding`, rendered as "₹600 still to pay" beside the wallet line.
  A display fix on the screen the journey already ends on — **no new screen, no
  new destination, not a flow change.**
  - **Both conditions, not one:** set only when `paymentStatus` is PENDING **and**
    `totalMemberPayment > 0`. A wallet-only vision booking reports PENDING with a
    zero balance and would otherwise show a false debt. That pair is the negative
    control.
  - **This is the option session 34 skipped.** It was available for four sessions;
    the jump from "the member is in debt" to "navigate them to pay" crowded it out.
- **STOP CONDITION — the disclosure cannot reach consultations, and that is where
  most of the problem is.** `GET appointments/user/:id` returns, across all 27
  rows, only `consultationFee` — no copay, no `paymentStatus`, no `paymentId`
  (`03-live/probe-appt-keys.mjs`, union of keys across every row). Dental and
  vision return the full set on the same kind of call. **Twelve of the fourteen
  accumulated copays are consultations**, so the fix reaches the smaller share.
  Filed as **inherited finding 13** for the `api/` owner; no portal workaround
  exists short of a per-row request.
- **Step 3 — the harness banners are split, not flipped.** Dental **14/18**: a new
  DISCLOSURE assertion passes, the four CONTINUATION assertions still fail by
  design. Consultations **15/21**: a BLOCKED assertion records the API omission
  with its cause, and the six continuation assertions still fail. A harness that
  went green on both would have hidden the reverted flow change, which is what the
  banner exists to prevent.
- **Register — "permission is not approval"** written into
  `../../../tools/parity-divergences.md` as a reading rule rather than an entry, with a
  three-step test to read any entry against. Entry 5 rules ordering; session 34
  read "does not forbid" as "prescribes" and shipped a flow change on it. **The
  entry was never wrong; the reading was**, and the failure is quiet because
  nothing contradicts the entry. Register equivalent of the silent-spec danger in
  `10-assertion-provenance.md`.
- **What the copay filing now says:** the finding always had two halves, and only
  one needed a ruling. Disclosure — fixed for dental/vision, blocked for
  consultations. Continuation — still open and unruled for all three. Option 2 is
  struck through as done; the remaining decision is narrower, and whoever rules it
  should read finding 11 first because option 3 may make option 1 unnecessary.
- **8.2/8.4 now open only on *Submitting an existing prescription*** (blocked on a
  doctor-authored health record). 8.8 and 8.18 stay open on the continuation.
- **POST-SESSION CORRECTION — the dental harness has exhausted its category
  allowance.** Re-running the suites to confirm the session's work, `verify-dental.mjs`
  fell from **14/18 to 7/9**: the create is refused and `slot-picker.mjs` correctly
  reports it as non-collision rather than retrying.
  - **Measured, not inferred:** CAT006 Dental is at **₹200 of ₹3,000**, ₹2,800
    consumed by the audit's own seven dental bookings across sessions 33/34/40/41.
    Each debits ₹400, and `dental-bookings.service.ts:316` refuses when
    `walletBalance < walletDebitAmount` ("Scenario C" at `:602`).
  - **A second variety of harness self-limitation.** Session 26's rule covered slot
    collision — recoverable by picking another candidate. This is **consumption of
    a finite entitlement**, which no selection strategy recovers. Same class as the
    AHC allowance. Written up in `26-…md`.
  - **Not worked around** — restoring the balance is a write to wallet data.
  - **Forward warning:** CAT001 is at ₹600 and CAT005 at ₹900, and
    `verify-consultations.mjs` books in both on every run. **It has roughly one or
    two runs left.** Anything needing that harness should be sequenced before it.
  - **Session 41's dental 14/18 was real when run** and is not reproducible now.
    The disclosure fix is unaffected — it renders off `booking.outstanding` and the
    six existing dental bookings still exercise it; only the *create* leg is blocked.
- **Test-data list is now four items** — the fourth is a refreshed category
  allowance for `shivam@` (dental now, consultations imminently).
- validate → valid, pairing → OK, build green.

## Fix session 40 — 2026-08-09 — the copay continuation is REVERTED; 8.8 and 8.18 reopen; the refusal turns out to be a defect

- **Reverted: the booking journeys no longer navigate to `/member/payments/:paymentId`.**
  `29-session-40-revert.md`. Session 34 added that destination and recorded it as
  a defect fix; it is a **flow change**, made under a standing instruction not to
  change flows. The user has ruled. Both confirm pages now end on the bookings
  list, as before.
  - **The navigation was in the two confirm pages, not the stores** — the brief
    named the stores, and the stores only carried `paymentId`. Same split either
    way: plumbing kept, navigation dropped.
  - **Kept, both data-correctness fixes:** `ClinicBookingResult.paymentId`, and
    `toAppointmentBookingResult` reading `appointmentId` from under `appointment`
    rather than the top level, where it always resolved to `''`.
  - **`paymentId` left carried and unused, deliberately**, with that stated at
    each declaration. Deleting it would make the remedy a rewrite.
  - **Four stale comments corrected** — `clinic-booking.ts`,
    `clinic-booking.store.ts`, `appointments/booking.ts` and both pages all
    asserted the journey continues to a payment screen. Session 39's rule: a
    comment has no more authority than a stale register entry, and one describing
    a reverted flow is exactly the kind that survives unchallenged.
  - **Vision untouched** — its `process-payment` navigation is pre-existing.
- **8.8 and 8.18 REOPEN, and that is correct.** Dental **17/17 → 13/17**,
  consultations **20/20 → 14/20**, with **no assertion weakened**. The ten
  failures are the continuation assertions and criterion 6 in both flows.
  - Each failing assertion is relabelled `OPEN DEFECT (awaiting ruling)` and each
    harness carries a banner saying the red is deliberate and that **a green run
    would mean the revert had been undone or criterion 6 weakened**. No predicate
    touched. A permanent explained red beats a suite that forgets what it waits for.
- **`20-copay-continuation.md` restored to OPEN for all three** — dental,
  consultations, claims — with what is certain unchanged: wallet debited, PENDING
  payment created server-side, `paymentId` discarded, screen says complete.
  **Twelve** unsettled consultation copays and two dental.
  - **The transferable correction:** session 34 read *"entry 5 prescribes the
    continuation"* as authority to ship it. Entry 5 rules **ordering**, not
    destination — it *permits* the continuation. **Permission is not approval**,
    and conflating them is how a flow change entered as a fix.
  - **Four options recorded** so the decision is not re-derived. One is worth
    flagging: **surfacing the amount on the bookings row the member already lands
    on** is not a flow change — no new destination — and it also fixes the
    settled/unsettled ambiguity in that same row. Never considered in session 34;
    the jump from "the member is in debt" to "navigate them to pay" skipped it.
  - Session 34's downgrade of the ambiguous row to "a display question" is
    **withdrawn** — it rested on the journey taking the member to pay, and it no
    longer does.
- **STOP CONDITION — Step 5 makes the refusal a DEFECT, not a divergence.** The
  app **does** name missing fields inline elsewhere, with the control enabled and
  validation on attempt:
  - `appointment-confirm-page.ts:407-419` — *"Enter a contact number so the doctor
    can reach you."*, *"Choose a time for your consultation."*, *"We could not tell
    who this appointment is for…"*
  - `vendor-booking-page.ts` — *"We need a complete address before a home
    collection — line, city, state and pincode."*
  - `new-claim-page.ts:238` — *"Amount exceeds available balance …"*
  - So the upload forms are **inconsistent with their own codebase**, and entry
    10's reasoning does not carry — it sanctions a divergence applied
    consistently, and this one holds in two screens out of the set. **The fix
    needs no flow change**: inline messaging adds no screen and no destination.
  - The clinching evidence is a comment written against this exact failure
    (`appointment-confirm-page.ts:403-405`): *"A silent return here is why the
    ONLINE journey was dead for the whole audit: the button was enabled, clicking
    it did nothing, and nothing said why."* A disabled button with no explanation
    is that failure with the click removed.
  - **Not fixed and not ruled** — reporting it is the stop condition.
- **Test-data bundle, three items and three owners** (`29-…md` §Step 6). Item 3 —
  a doctor-authored digital prescription for `shivam@` — is **an action with an
  owner and a UI, not a seed**, and must not be sent as a seeding request.
  - **Why it was not worked around:** a records fixture would have gone green
    while the GIVEN — *"a member who already holds a digital prescription"* — was
    satisfied by no path a member can reach. The silent-spec danger arriving one
    step later: not a spec omitting its precondition, but a harness supplying one
    the product cannot.
- validate → valid, pairing → OK, build green.

## Fix session 39 — 2026-08-09 — `submitExisting` built; the backlog does NOT close, on a precondition and a ruling

- **Route-input sweep first, because it was a stop condition — and it is clean.**
  `27-route-input-sweep.mjs`, detector 4: 48 routes with a component, 26
  components with inputs, **0 unbound**. `app.routes.ts:62` was not one of a
  class; it was the only one. Both negative controls pass.
  - **The detector was wrong twice before it was right, and both errors were the
    class it hunts.** It reported 11 unbound, then 4, then 0. `data: { mode }`
    shorthand has no colon, so six flatMap routes looked unsupplied; and
    `[queryParams]="{…}"` in a template is not `queryParams: {…}` in TypeScript,
    so four inputs that are sent on every navigation looked unbound. **A pattern
    that knows one syntax and not the structure**, third and fourth instances.
    Kept in the file header rather than quietly corrected.
- **`submitExisting` is BUILT, on the hub, matching the reference.**
  `features/lab/prescription-selector.ts`, shared by both hubs; the host keeps its
  own trigger and calls `open()` on a template ref. **No submit control added to
  the records browser** — the reference has no such flow.
  - **Send-site schema check, per the rule earned last session:** the DTO is
    **flat**, seven strings, so the nested-object trap does not apply. Confirmed,
    not assumed.
  - **`healthRecordId` is the Mongo `_id`** (`findById`, then `new Types.ObjectId`).
    Seventh instance of identifier duality and **the first checked before it cost
    anything.**
  - **Two reference defects not ported:** it sends `patientId: 'current'` /
    `patientName: 'Current Member'` / `patientRelationship: 'Self'` under comments
    claiming the backend resolves them — **it stores all three verbatim**. Angular
    sends the active family member, which `member-lab`'s patient Rule requires.
  - Found while wiring: the diagnostics hub had **neither** upload notice the lab
    hub carries, so a failed submission would have said nothing. One-site-of-four
    again, caught before shipping this time.
- **STOP CONDITION 1 — the scenario is blocked, and deliberately not forced.**
  `shivam@` holds **zero** health records; `digitalprescriptions` has 4 rows, none
  his, and `doctorprescriptions` is globally empty. **No member-side route creates
  one** — a health record is written by a doctor through
  `DigitalPrescriptionWriter`. Attempted via the doctor portal (it starts,
  `anil@doctor.com` signs in, and he is the doctor on all of shivam's
  appointments) but the appointment screen returns *"Failed to fetch appointment
  details"* on both id forms. **Not diagnosed further — `web-doctor` is read-only
  and not this audit's subject.**
  - **A records fixture would have made this green and would have been a false
    pass** — the GIVEN is *"a member who already holds a digital prescription"*.
    Declined on exactly the ground Step 3 asked to be written down.
  - **Third test-data item, and a different kind:** the other two need seeding,
    this needs *a doctor to issue a prescription* — an action with an owner and a
    UI, like the ops digitize.
- **STOP CONDITION 2 — a refusal scenario fails for an app reason, both kinds.**
  *Incomplete submission is refused* passes clause 2 (no request sent) and **fails
  clause 1**: the submit button is disabled and **nothing names what is missing**.
  The reference names each field (`upload/page.tsx:213-231`, four `alert()` calls)
  because its button is enabled and it validates on submit.
  - The scenario is also **unreachable** as built — it says *"WHEN they attempt to
    submit"*, and under a disabled control no attempt is possible.
  - **An interaction-model divergence, filed for a ruling, not picked.** Parity
    entry 10 is precedent for Angular diverging deliberately here. Either sanction
    it and amend both specs to describe the disabled control, or port the
    behaviour in Angular's idiom — an inline message, never the `alert()`.
- **Verified and closed: *Unsupported or oversized file*, both clauses, both
  kinds.** The form was filled **before** the bad file was attached, so "the rest
  of the form is preserved" is a real assertion and not a check on an empty form.
- **Two harnesses, kept apart on purpose** — `verify-submission.mjs` writes,
  `verify-submission-states.mjs` cannot (both its scenarios assert that no request
  is sent). Session 37 claimed a vertical was fully exercised when this group was
  not; two files each stating their coverage is what answers that next time.
- **Step 3 done — `10-assertion-provenance.md` now states the danger.** "Every fix
  was an addition" reads as reassuring and is not: a silent spec **cannot fail
  where it is wrong**. `member-lab`'s "GIVEN a cart" was satisfiable in the
  harness while no member could obtain one. The low correction cost is a
  **selection effect** — these are the silent specs something happened to force.
  Operational rule added: when a scenario passes, ask what had to be true for it
  to pass, and whether the portal is what made it true.
- **8.2 and 8.4 stay open on two items, neither of them portal work** — one needs
  data with an owner, one needs a decision. Eleventh and twelfth time the rule has
  held. validate → valid, pairing → OK.

## Fix session 38 — 2026-08-09 — every degradation site fixed; lab's ordering journey reaches a terminal state for the first time, and hid three defects

- **The three fixes land. Diagnostics 21/21, lab 22/22, upload prefix 4/4.**
  `26-session-38-fixes.md`. Two fixes plus one render, because the orders and cart
  sites are shared: `lab-orders-page.ts` now renders `store.partial()` (branch
  chain restructured so the banner sits above orders/awaiting/empty, not beside
  one of them); `cart.store.ts` gains a `vendorsFailed` signal and `cart-page.ts`
  a third branch with a retry; `diagnostics-page.ts` gets the disclosure the lab
  hub has always had. **Copy not rewritten** — "our team is processing your
  prescription" is true, the disclosure beside it was missing.
  - **Found while fixing:** `cart-page.ts:44` called `store.retry()` bare, and
    `retry()` defaults to LAB — a failed *diagnostics* cart would have retried
    against `member/lab/carts/…`. Parity entry 14's error, inside Angular, on the
    recovery path. Now passes `kind()`.
- **The ops UI works and the blocker is gone.** `npx next dev -p 3005`,
  `opsadmin@gmail.com`, `POST ops/lab/prescriptions/:ref/digitize` → **201**,
  cart created for `shivam@`. The flow is search → **Find Vendors** → select a
  vendor → **Create Cart**, and Create Cart silently no-ops until a vendor is
  chosen. **The ops route takes the business reference, not the Mongo `_id`** —
  identifier duality, fifth instance.
- **STOP-CONDITION-ADJACENT: driving the journey found three defects, each a
  different real cause, each diagnosed by printing the request and response.**
  1. **The lab cart's vendor link pointed at diagnostics.** `app.routes.ts:62`
     had no `data: { kind: 'LAB' }`. **Session 37 called that "harmless today and
     correct by accident" — wrong, and this is the correction.**
     `withComponentInputBinding()` sets an unsupplied input to `undefined`, which
     overrides the initializer. `select(cartId, undefined)` still hit LAB via the
     *default parameter*, so the data loaded perfectly, while
     `kind() === LabKind.Lab` was false and `basePath` became `'diagnostics'`.
     A correct-looking screen that dead-ends one click later — precisely why the
     rule is *assert on the network log, not the render*.
  2. **`collectionAddress` sent as a string.** 400 *"nested property
     collectionAddress must be either object or array"*. **The AHC 400 of session
     29, exactly** — same nested-DTO shape, different feature. The SCHEMA-READ
     RULE was written from that incident and it recurred anyway, which says it
     must be applied at the call site, not once a 400 is in hand.
  3. **The order endpoint wants the business `VENDOR-…` id, not the Mongo `_id`**
     — under an Angular comment asserting the opposite. The API says so itself
     (`lab-order.service.ts:172`), and **the disproof was two lines up in the same
     function**: `validate` already sent the business id and got 201. Sixth
     instance of identifier duality, and the first where a confident comment
     encoded the wrong answer.
  - Then **201, `ORD-1786254378495-ZH3O7CYKT`**, navigated to the order,
    criterion 6 clean — confirming lab's `createOrder` has no else branch.
  - **Lab's reference is `ORD-…`, not `LAB-ORD-…`.** The identifier scenario
    written in session 35 assumed a prefix symmetric with `DIAG-ORD-…`; nobody
    had ever placed a lab order to find out. Spec and harness corrected.
- **A fourth defect, and a correction to session 37's record.** Session 37's
  tasks note said every `member-diagnostics` scenario was exercised. **It was
  not** — the four submission scenarios sat outside the non-mutating harness.
  Verifying one found **defect D**: `upload-prescription-page.ts` hardcoded
  `LabKind.Lab` *and* `navigate(['/member/lab-tests'])`, so a diagnostics upload
  filed a **lab** prescription and returned the member to the **lab** hub. Both
  THEN clauses of that scenario failed. Fixed, and asserted on the network log —
  the two forms are visually identical, so nothing else could tell them apart.
- **ORDERED-cart filing sharpened and escalated** to `05-inherited-api-findings.md`
  **finding 12**: the defect is that `createOrder` has **no cart-status gate**.
  `cartLink()`'s bookings fallback is a **UI accident, not an invariant** — it
  holds only because the hub is currently the only place that builds a cart URL.
  Any future entry point re-exposes it with no change to the cart screen, so only
  the API can make the duplicate impossible.
- **An assertion that cost three corrections, recorded rather than absorbed.** The
  hub prescription assertion failed on ambient data (my own upload probe changed
  it), then on an incomplete fixture, then on a route pattern that missed a query
  string and let the fixture pass through silently. The limit is two. The third
  change was made only after printing the render and the full link list, which
  showed the app correct throughout and every failure in the harness. Also worth
  keeping: **`?*` matters in a Playwright route pattern** — a bare path does not
  match a list endpoint with a query string, and the fixture then silently hits
  the real API.
- **"Silent, not wrong" recorded as a method note** in `10-assertion-provenance.md`.
  Five specs have now under-claimed rather than mis-claimed, every fix an addition
  rather than a rewrite. It is what transcribing from a *working* reference
  produces: you can see what a screen does, not what it assumes, because the
  assumption is already satisfied in front of you. **The danger is therefore a
  false pass** — `member-lab`'s "GIVEN a cart" was satisfiable while no member
  could obtain one. Ask a transcribed spec not "is this true?" but "what does this
  screen need in order to be true?"
- **8.2 and 8.4 both stay open, on a much narrower reason: the submission group
  only.** *Submitting an existing prescription* cannot pass (`submitExisting` has
  no caller); *Incomplete submission is refused* and *Unsupported or oversized
  file* are unverified. Tenth and eleventh time the rule has held.
- validate → valid, pairing → OK.
- **Backlog: 6 of 6 verified.** No degradation defects remain, no cart
  precondition remains, and nothing in the backlog is unread or unrun.

## Fix session 37 — 2026-08-09 — diagnostics verified 18/21; the class is two verticals; 8.4 does not close

- **STOP CONDITION — diagnostics turns up degraded-not-declared, so it is two
  verticals rather than one.** `25-diagnostics-verification.md`. All three
  failures in the run are this class, and they are **not three copies of one bug**:
  - **NEW, its own component — the diagnostics HUB names no partial failure.**
    `diagnostics-page.ts` never reads `store.partial()`; `lab-tests-page.ts:200-205`
    does. The two hubs are deliberately different components (spec difference 1),
    so the disclosure was written once and not carried across. Under a forced 500
    on `member/diagnostics/orders` the hub renders **completely normally**.
  - **Two inherited by construction** — the orders screen and the cart screen are
    the *same* component and store as lab, so lab's two filed defects reach
    diagnostics by a second route. Their blast radius doubles.
  - **The ratio is what changed the reading: one site correct out of four**, not
    "two missed out of three". The generous reading of session 35 — that the
    pattern is mostly right — does not survive the second vertical.
- **Step 1a — the spec did NOT inherit lab's endpoints, and neither does Angular.**
  The reference is not merely inconsistent, it is **broken**: its diagnostics cart
  and vendor screens fetch `member/lab/carts/:id`, and the API backs the two
  prefixes with **separate collections** (`lab_carts` / `diagnostic_carts`).
  Proved read-only in `03-live/probe-cart-prefix.mjs` — diagnostics prefix **200**,
  lab prefix **404 "Cart DIAG-CART-… not found"**, with the lab prefix's collection
  GET as the negative control proving the route is alive. Angular's correctness is
  asserted **on the network log, not the render**. Filed as **parity entry 14**,
  do-not-port. The spec carried no endpoint claim to inherit — silent again, as
  with lab's cart origin, rather than wrong.
- **Step 1b — cart origin read, not inherited, and it matches lab.**
  `POST ops/diagnostics/prescriptions/:id/digitize`
  (`diagnostic-ops.controller.ts:136`) calls `createCart` at `:153`. The read also
  found a difference lab does not have — a standalone
  `@Post('prescriptions/:id/delay')` where lab folds delay into `digitize` — ops-side
  only, recorded so it is not re-derived. `member-diagnostics` got the same
  addition lab got: a cart-origin Rule plus an awaiting-digitization scenario.
- **Everything else passes, against real data.** Unlike lab, this account has a
  real diagnostics cart and order, so the cart, vendor, slot and order screens were
  exercised on real payloads and only failure states were forced. Both identifier
  clauses, vendors and prices, slots on a real vendor, wallet summary, orders with
  status, empty-vs-failed, family-member following, **criterion 6 clean**.
  Non-mutating throughout — no order placed, no prescription uploaded.
- **A spec I wrote last session was wrong, and verification caught it.** The
  awaiting-digitization notice is an **else-branch of the orders list**
  (`lab-orders-page.ts:39,76`), so it shows only to a member with **no orders**, and
  it lives on the orders screen rather than the hub. My session-36 `member-lab`
  scenario said "the lab screen" with no precondition — describing behaviour the
  portal does not have. **Both specs corrected to carry the precondition.**
  - **Method, stated because it nearly went the other way:** the assertion failed
    twice. It was adjusted **once**, then the component was read. The second
    failure was not fixed by a third adjustment — the scenario was restated to
    match the code and the conditionality became its own finding. Printing the
    render located the copy; reading the branch chain explained it.
- **Filed, not driven: an ORDERED cart re-opens as a live cart.** Deep-linking a
  consumed cart renders `ORDERED ✓` beside *"Select a lab"*, a slot picker and an
  enabled **Confirm booking**; `createOrder` checks cart, vendor and slot but has
  **no cart-status gate**. Exposure is low and Angular is why — `cartLink()`
  routes to `/member/bookings` when the cart is not in the member's list, and the
  API filters that list to `CREATED`/`REVIEWED`. **Deliberately not confirmed**:
  it would place a second real order against the only diagnostics order this audit
  has. Recorded as observed affordance plus a read of the gates, not as a proven
  duplicate-order path.
- **Step 3 done — the invoice finding cross-referenced into `21-…md`**, with where
  it sits on that file's ranking: at **silence**, not at *false cause*. The
  statement is true; the action is missing. The unifying reviewer test both files
  now share: not *"is this string true?"* but **"can the member act on what this
  screen just told them?"**
- **8.4 does not close.** Every scenario was exercised and *Vendor list fails to
  load* is failed by the portal. Tenth time the rule has held, and the first time
  it was a **failing** scenario rather than an unrun one — a stronger reason, not a
  weaker one. What closes it: the two one-line-of-state fixes in `21-…md` plus one
  `store.partial()` render on the diagnostics hub.
- validate → valid, pairing → OK.
- **Backlog: 5 of 6 verified, 4 closed.** Diagnostics verified but open on three
  defects; lab open on the same two plus an ops digitization. **Nothing in the
  backlog is now unread.**

## Fix session 36 — 2026-08-09 — STOPPED on the detector's results; lab's "blocker" dissolves; diagnostics not started

- **STOP CONDITION — the third detector found four new instances, not one.**
  `23-three-detectors.md`. 66 endpoint keys, **10 with no caller**, all three
  controls passing. The stop condition was written for "more than one new
  instance", and the reason it was right is that **the 10 are not one class** —
  they are four sub-classes with four different owners, and shipping them as a
  defect list would have produced four wrong fixes.

  | Sub-class | Members |
  |---|---|
  | action lost in the move | `submitExisting` (known), **`invoice` (NEW)** |
  | feature not ported | **`cancelPrescription` (NEW)**, `ongoingByUser` (filed GAP) |
  | latent wrong path | `vendorPricing` (filed), **`activeCart` (NEW)** |
  | orphan / stale duplicate | `refresh`, `myPolicy` (both filed), **`dentalClinics` + `visionClinics` (NEW, trivial)** |

- **The detector was wrong on its first run, and the flags are what caught it.**
  It reported **12**, two of which — `RECORDS_API.digitalDownload` and
  `uploadedDownload` — are called at `prescription.mapper.ts:57,79`. The self-use
  filter skipped **any** `identifier:` line, so it discarded real uses sitting in
  an object literal (`downloadPath: RECORDS_API.digitalDownload(id)`). Anchored to
  the key's own declaration; a **second negative control** added for exactly that
  shape. The file's own header claimed it "will not invent one" — **that claim was
  false as written**, and only reading the flags found it.
- **Fourth member of the "renders but cannot complete" class, and the first found
  on purpose.** `/member/bookings` renders **"Invoice available"**
  (`bookings-page.ts:143-145`) — a `<p>`, no control — while
  `CLINIC_BOOKING_API[area].invoice` has zero callers. `hasInvoice` is correctly
  mapped from `invoiceGenerated`, so the statement is **true**; the reference
  downloads the PDF (`bookings/page.tsx:761-793` + `InvoiceModal.tsx:55`) and
  Angular ported the gate and the notice without the action. **Not fixed** — the
  vision and dental verticals are closed and the stop condition fired. Route
  accounting unaffected: **57 completable routes** stands.
- **Step 2 settled, and it dissolves session 35's blocker.**
  `24-where-lab-carts-come-from.md`. **No cart-creation route exists anywhere in
  the API** — every `carts` route is a GET or a DELETE, on both prefixes. **All 15
  reference call sites are reads.** A cart is created inside
  `POST ops/lab/prescriptions/:id/digitize` (`lab-ops.controller.ts:93`, with
  `createCart` in its body), so *a cart is a product of digitization*.
  - **"A member cannot create a lab cart" is not a blocker and not a seeding
    request.** The precondition is an **ops action** reachable through an existing
    UI, not a DB write. **Removed from the seeding request, which is back to two
    items** — the AHC allowance and the dependent credential. Session 35 grouped
    all three as "test data we do not have"; they are not the same kind of thing.
  - **The prompt's second branch did not hold either, and I checked before
    asserting it.** `member-lab` does **not** describe cart creation as
    member-initiated — every ordering scenario reads *"GIVEN a cart"*. The spec is
    not wrong, it is **silent**, and the silence is what let the missing POST read
    as a defect. **Addition, not a rewrite:** one Rule plus an "awaiting
    digitization" scenario. validate → valid, pairing → OK.
  - **It also sharpens `21-…md` defect 1.** *"Our team is processing your
    prescription"* is a **true** description of the real pre-digitize state. The
    copy is correct; the missing disclosure beside it is the defect. Fix by adding,
    not by rewriting.
- **The degraded-not-declared class is named** in `21-…md`, with the ranking that
  makes it actionable — error < blank < **silence** < **false domain cause** — and
  the precedent that makes it a class rather than an instance: *"No claims yet"*
  served to a signed-out member (`08-empty-vs-unfetched.md`). Two features, two
  mechanisms, one shape.
- **Diagnostics NOT started.** Tenth time the rule has held, and the first time it
  was the stop condition rather than context that stopped it. Two things are
  pre-filed for that session: `ops/diagnostics` may or may not create carts the
  way `ops/lab` does — **read it, do not inherit lab's answer** — and the
  reference's diagnostics **cart** screens call the **lab** endpoints
  (`diagnostics/cart/[id]/page.tsx:62,84`) while its diagnostics **booking** screen
  calls the diagnostics ones. The reference is internally inconsistent about the
  prefix, which is precisely what a copy-from-lab transcription would get wrong.
- **Costs:** the cheapest session of the audit and among the most productive —
  four findings and a dissolved blocker, from one static scan and two reference
  reads. Both were cheap because they were *structural* questions asked of the
  route table and the reference, not of a running app.
- **Backlog still 4 of 6.** Lab: two degradation defects unfixed, ordering awaiting
  an ops digitize. Diagnostics untouched.

## Fix session 35 — 2026-08-08 — lab STOPPED on two defects and a seeding blocker; a carried item closes; diagnostics not started

- **STOP CONDITION — lab turned up defects, not spec gaps. Two, filed, not fixed.**
  `21-degraded-not-declared.md`.
  1. **The orders screen swallows its own failure.** `LabStore.load()` catches a
     failed orders fetch into `_partial`, not `_error`, deliberately
     (`lab.store.ts:276-277` says so). The **hub renders `store.partial()`**;
     `lab-orders-page.ts` never reads it. With `member/lab/orders` 500ing, the
     member is told *"Awaiting the lab — our team is processing your
     prescription"* and nothing about the failure. **Positive control passing
     right beside it:** the hub under the same interception says *"Could not load
     orders."* One class, three sites, one of them correct.
  2. **A failed vendor request is reported as "no lab has quoted".**
     `cart.store.ts:170-174` catches vendors to `null` on purpose — correct
     intent, but the vendor-less branch is the only branch left and its copy
     names a cause that did not happen. **Contradicts the spec directly**:
     *"an error state is shown, distinct from the no-vendor empty state, and a
     retry is offered"* — neither clause holds.
  - **The check hid the defect from itself first.** The assertion was
    `/could not|went wrong|try again/` and **passed** — on the empty state, whose
    copy ends *"Try again shortly."* Re-aimed at copy unique to each branch and
    the failure is unambiguous. Found by printing the render, not by adjusting.
- **A third variety of "renders but cannot complete", appended to `17-…md`.**
  The hub's **"Use a saved one"** links to `/member/health-records`, which has no
  control that submits a saved prescription — verified live, its only per-record
  button is Show/Hide medicines. `LAB_API[kind].submitExisting` is declared for
  both kinds and has **zero callers**, the same shape as `AHC_API.orders`.
  - The reference **does** have it, and elsewhere: inside `handlePrescriptionSelect`
    on the lab **hub** (`lab-tests/page.tsx:122`), from a selector modal. Angular
    kept the control and replaced the modal with a link to a browsing screen.
  - **Neither existing detector sees it** — the write sweep counts 3 writes for
    `lab` so the store looks healthy, and terminal-state verification only catches
    it if a scenario drives that control. A third detector is proposed:
    **declared endpoint, no caller**, which would have found this *and* AHC.
- **BLOCKER, structural, not work: a member cannot create a lab cart.**
  `createCart` is called only from `lab-ops.controller.ts:134`; the member
  controller has no cart POST (`@Post` is prescriptions ×3 and orders ×2, nothing
  else). `lab_carts` for `shivam@` is **0**. So every ordering scenario in
  `member-lab` has no terminal state on this account. Same shape as AHC's
  blocker, and it goes to whoever owns test data rather than being worked around
  — the session-29 precedent.
- **CARRIED ITEM CLOSED — `lab-orders-page.ts:44`.** Recorded unverified since
  session 20 for want of order rows. The component is shared, and **diagnostics
  has one order**, so the same line was exercised there: the row links
  `/member/diagnostics/orders/DIAG-ORD-1782129504669-XF1CC92BQ`, the detail route
  resolves and renders, **no 24-hex id anywhere**. Confirmed against the API:
  `LabOrderService.getOrderById()` is `findOne({ orderId })` — the business id, so
  passing `order.reference` is right. **Opposite of claims**, checked not assumed.
  - Identifier scenario added to `member-lab`; it passes on the shared component
    and lab's own leg awaits a cart, so **8.2 stays open**.
- **Criterion 6 clean for lab** — nothing in the run created a pending payment, and
  lab's create genuinely differs from dental's: `createOrder()` has **no else
  branch**, so without `paymentAlreadyProcessed` there is no wallet debit and no
  payment record at all. Lab is not dental's shape; not inherited, read.
- **Diagnostics NOT started.** Lab could not be closed and there was no room to
  take a second vertical properly. Ninth time the rule has held.
- **Costs:** lab was the most expensive verification so far and produced the least
  closure — three findings, zero tasks checked. The expense was all reference and
  API reading; the harness itself is cheap and non-mutating, so it re-runs free
  once a cart exists.
- **Backlog still 4 of 6.** Lab blocked on seeding + two fixes; diagnostics untouched.

## Fix session 34 — 2026-08-08 — the copay continuation is BUILT; dental and appointments re-verified; a third instance found in claims

- **Criterion 6 extended, and the hole it closes was real.** *A terminal state is
  not terminal while money is owed* — where a scenario involves money, the
  verification must establish that no **unexplained** pending payment was created.
  A pending payment the journey **navigated the member to** is the flow working;
  one left behind on a screen that says the booking is complete is the defect.
  - `member-consultations` passed **9/9** in session 26 under the criterion as
    written, while leaving **twelve** unsettled copays behind it.
  - Shared implementation: `03-live/pending-payments.mjs` — snapshot before,
    diff after, plus the criterion's own two controls (positive: it must find
    `PAY-20260808-0188`; negative: it must not find an id that cannot exist).
    Read-only, driver taken from the API's own `node_modules`.
- **Fixed — and the fix is three files plus two navigations.**
  - `ClinicBookingStore.create()` returned `bookingId` and discarded the
    response. It now returns `ClinicBookingResult` — which **already existed with
    no callers**, dead from an earlier design, and is now the live type trimmed
    to the two fields used.
  - `BookingStore.create()` had the same discard **and a second bug found while
    reading it**: it took `appointmentId` from the top level of an envelope that
    nests it under `appointment`, so it always returned `''`. Nothing caught it
    because the id was never used — the journey navigates to a list.
  - Both confirm pages now go to `/member/payments/:paymentId` when something is
    owed, and to the bookings list when nothing is.
  - **Identifier duality guarded:** dental stores the business `PAY-…` reference,
    vision a Mongo ObjectId; `GET payments/:paymentId` resolves via
    `findOne({ paymentId })`, so anything not `PAY-…` is treated as absent rather
    than navigated to.
- **Re-verified to a terminal state under the extended criterion. 8.8 and 8.18
  both close.**
  - **Dental 25/25** — 17/17 journey (`POST dental-bookings 201` → landed on
    `PAY-20260808-0191` → screen named ₹600 and offered to pay → paid → **no
    unexplained PENDING remained**) plus 8/8 forced states, still non-mutating.
  - **Consultations 20/20** — both modes: IN_CLINIC → `PAY-…0194` ₹456,
    ONLINE/LATER → `PAY-…0195` ₹700, each settled, each leaving nothing pending.
  - **Vision 10/10, unchanged in substance** — its create still makes no payment,
    which is the criterion's own negative control.
  - The "nothing is owed" branch is unreachable with seeded data (every service
    carries a copay), so it is **forced** in both harnesses by fulfilling the
    create — which also means those checks write nothing.
- **The consultations spec already said what the portal did not do.** *"the
  appointment record is created first **and** only then is any outstanding amount
  taken to payment"* — session 26 verified the first half of that AND. Exactly the
  failure criterion 6 exists to prevent, one level deeper than it reached.
- **Two harness defects in `verify-vision.mjs`, both pre-existing, both fixed at
  the root.** Its inline collision regex knew "already"/"not available" but not
  **"fully booked"**, so a plain slot collision reported as a defect and stopped
  the retry loop — it now uses `ALREADY_BOOKED` from `slot-picker.mjs`, the shared
  constant that exists for this. And its stale cold-clinics check (no
  `serviceCode`, superseded in session 33) was removed rather than left to report
  a permanent false FAIL. **Diagnosed by printing the response body, not by
  adjusting**: `probe-vision-400.mjs` returned *"This slot is fully booked"*.
  - One assertion corrected, once, with the reason recorded rather than the
    assertion loosened: vision's `process-payment` **cannot** succeed on a fresh
    booking (inherited finding 11 — no bill), so the check is now that the
    refusal is *surfaced*. It is, verbatim.
- **STOP CONDITION — a third instance, in an already-closed vertical.** Running
  the extended criterion across the closed verticals found **four PENDING `CLAIM`
  copays**. `submitClaim()` Scenario B debits the wallet and creates the copay;
  `ClaimsStore.submit()` reads `wasCapped` off that response and **discards
  `paymentId` and `paymentRequired`**; the claim detail screen mentions no payment.
  - **Not fixed, and 8.14 left checked deliberately.** It is not the same
    question: a booking copay is money **owed** for a service committed to; a
    claim copay is the unreimbursed share of a bill **already paid** to the
    provider. Whether the portal should route the member to "pay" it is a domain
    ruling, and fixing it by analogy would be the generalising error this audit
    has got wrong three times out of three. Filed in
    `20-copay-continuation.md`; the wallet debit with no notice stands either way.
- **Lab NOT started.** Six routes, 14 scenarios, and an own reference read — not
  completable in the room left. Eighth time the rule has held.
- **Backlog 4 of 6 closed.** Remaining: lab (6), diagnostics (6).

## Fix session 33 — 2026-08-08 — vision CLOSES; dental verified but GATED on a register ruling

- **Vision's last scenario closed. 8.6 checked.** The diagnosis was right and the
  fix was one input: `selectClinics` returns early on an empty `serviceCode`
  (`clinic-booking.store.ts:61`), so session 32's cold run fired no request at all.
  Supplying the `serviceCode` the journey carries
  (`/member/vision/clinics?serviceCode=CONTACT_LENS_FITTING`, read off the services
  screen rather than guessed) forced it: **3 intercepted requests, error state
  rendered.** Read, not merely asserted — *"We could not load this / Something went
  wrong at our end. / Try again"*, against the empty branch's *"No clinics found"*.
  Positive and negative controls both pass. **Vision 8/8.**
- **Dental verified — 17/17, every one of its 13 scenarios covered — and 8.8 is
  NOT checked.** Two harnesses: `verify-dental.mjs` (10/10, journey to terminal
  state, mutates) and a new `verify-dental-states.mjs` (7/7, every remaining state
  forced by interception, **no writes**, so it is repeatable).
  - Entry 5's *live* facts hold: no payment call anywhere, journey ends at
    `/member/bookings?tab=dental`. **Identifier check added and passing** —
    `DEN-BOOK-1786186303112-0248` renders, no 24-hex id.
  - Dental is again not vision: CAT006, 5 routes, no `clinics/:id`, all confirmed.
- **What gates it: the reference's dental confirm HAS a payment step, and session
  12 misread it.** `confirm/page.tsx:141` is not the journey's create — it sits
  inside `handlePaymentSuccess`. The screen renders an inline `PaymentProcessor`;
  on a copay it creates a pending payment, stashes the booking in `sessionStorage`
  and redirects to `/member/payments/:paymentId` — the AHC mechanism, and
  payment-first. Only the no-copay branch creates at confirm.
  - So **"entry 5 is unviolatable for dental" was wrong**. It is satisfied by the
    same sanctioned divergence as appointments. Spec and carve-outs corrected.
  - The stop condition read "dental turns out to have a payment step" — it did, in
    the reference. **Angular's dental still has none**, which is the divergence.
- **The finding that stops the session — `20-copay-continuation.md`. It is a class,
  checked before filing.** `POST dental-bookings` debits ₹400 and creates a
  **PENDING ₹600 copay** server-side; Angular reads `bookingId` off the response
  and discards the `paymentId` that is right next to it
  (`clinic-booking.store.ts:153`). The member lands on a bookings row that says
  *"₹1,000 · ₹400 from wallet"* and nothing about the ₹600.
  - **14 PENDING copays** have accumulated on the test account during this audit —
    **12 appointment, 2 dental**. Not one instance.
  - **POSITIVE CONTROL:** the query returns `PAY-20260808-0188`, which session 31
    reached and paid through the transaction detail — real obligations, not artifacts.
  - **NEGATIVE CONTROL:** vision, and it is a *deferral* not a collection — vision
    creates its payment inside the bill-gated `processPaymentForBilling`, and when
    that runs Angular **does** navigate to `/member/payments/:id`. The portal is not
    incapable of the continuation; it performs it wherever the API hands the id back
    through a call the portal makes.
  - **Not covered by entry 5**, which rules ordering only. Booking-first fails safe
    against a payment with no booking; this is the mirror — a booking with an
    uncollected payment in front of it. Filed for a ruling, **not ruled here**.
  - This is the **mapper-gap class session 27 named** (a read-only model missing what
    the write path needs). Session 31 predicted it would next appear in
    lab/diagnostics. It appeared in dental — the prediction was cheap and the check
    is what produced the finding, exactly as rule 1 says.
- **Two API questions filed** under inherited finding 11: whether AHC payment should
  be bill-gated as vision's is, and **who settles the copay** dental and appointments
  create. The second decides the ruling above.
- **AHC's bill precondition recorded** in `14-ahc-commit-contract.md` — "the vision
  analogy has a limit", with the instruction not to write *"as vision does"*
  unqualified when AHC is transcribed. Entry 5 unaffected.
- **Costs:** dental verification was the cheapest vertical yet in harness terms —
  the vision lesson transferred first time, no adjustment cycles, and splitting the
  forced states into a non-mutating file makes them free to re-run. The expensive
  half was the reference read, which is the half that found the defect.
- **Backlog 3 of 6 closed** (profile & misc, transactions & payments, vision).
  Dental is verified but gated. Remaining: lab (6), diagnostics (6).

## Fix session 32 — 2026-08-08 — vision verified; entry 5 holds; one precondition found

- **Vision: 6/8, and the two failures are mine, not the app's.**
  - **Entry 5 confirmed live, and it matters beyond this vertical:** booking created
    **first** (`POST vision-bookings 201`, slot-aware, first attempt), member landed on
    `/member/vision/payment/VIS-BOOK-1786184922451-5672` — the payment screen keyed by
    the **existing** bookingId — and **no booking-creation call fired during payment**.
    The pattern AHC is specified against is real.
  - **Identifier check passed:** the payment screen renders `VIS-BOOK-…`, no 24-hex
    Mongo id anywhere. This vertical was transcribed before that lesson and did not
    assert it; it does now.
  - **Active-member marker present** on the patient picker.
- **New finding — `process-payment` has an undocumented precondition.**
  `400 "Bill has not been generated for this booking"`. Payment is possible only once
  a **bill exists**, and nothing in the portal generates one — it is an ops/clinic
  step. So the real journey is **book -> wait for a bill -> pay**, not book -> pay.
  Filed as inherited finding 11. **Not a defect**, but it weakens the AHC analogy: the
  AHC spec is written against "vision's payment path", and that path has a precondition
  AHC has no equivalent for.
- **The cold clinics-failure scenario is NOT verified**, and is recorded as such rather
  than passed. The store *does* set an error (`clinic-booking.store.ts:186`) and the
  template *does* render it — but my cold context navigated to `/member/vision/clinics`
  **without the `serviceCode`** the journey supplies, so no request fired and the empty
  state rendered. Diagnosed by reading the store and template; **stopped at two harness
  adjustments** per rule 3 rather than fitting a third.
- **No mapper gap on vision's create** — the predicted shape did not appear here. Third
  time a predicted class has not materialised; the create takes ids the model already
  carried.
- **Dental NOT started.** Context. The rule against starting a vertical that cannot be
  finished has held every time.
- **Backlog 2 of 6 closed; vision is 90% verified with one scenario outstanding.** 8.6
  left unchecked deliberately — one unverified scenario is not a verified vertical.

## Fix session 31 — 2026-08-08 — cold context made a rule; transactions & payments closed

- **Cold context is now criterion 5 in section 9**, not a habit. Warm-context
  interception proves nothing — the store already holds the data. Recorded with the
  `member-profile-misc` case that produced it, so the reasoning survives the rule.
- **Checked whether the shape repeats — it does not.** The other backlog
  forced-failure scenarios (orders, clinics, vendors) all name routes their screens
  genuinely fetch. Profile was distinctive because the member came from the
  **session**. Verified rather than assumed, per rule 4 applying to my own hypothesis.
- **`member-transactions-payments` verified — 8.12 checked. Backlog 2 of 6.**
  **7/7.** validate -> valid, pairing -> OK.
  - Cold-context forced failure on `transactions` produced a real error state,
    distinct from empty.
  - **Identifier check passed where claims failed:** order detail renders
    `TXN-20260808-0241` and the payment screen `PAY-20260808-0188` — business
    references, no 24-hex Mongo id anywhere on screen.
  - **Entry 5 conformance confirmed live, not re-derived:** loading the payment screen
    issues **no** booking-creation calls to any of the six create endpoints the
    reference uses.
  - One harness correction: the payment link lives on the transaction **detail**
    (`transaction-detail-page.ts:105`), not the list. Found by reading, not by
    widening a selector.
- **No mapper gap surfaced** — this vertical's one write is `mark-paid`, which takes
  only an id. The first real mapper-gap risk is still ahead, in lab/diagnostics.
- **Vision and dental NOT started.** Context. Not starting a vertical that cannot be
  finished has held every time it has been tested.
- **Backlog remaining, in the survey's safe order:** vision (6), dental (5), lab (6),
  diagnostics (6).

## Fix session 30 — 2026-08-08 — allowance survey clean; first backlog vertical closed

- **Step 2 first, because it gated Step 3. AHC is the only allowance-limited action**
  (`15-allowance-limited-actions.md`). Both controls pass: it flags AHC
  (`ahc-order.service.ts:61`) and does **not** flag appointments, whose only match is
  a *slot* collision — contention for a resource, not a spent entitlement.
  - **The distinction that mattered:** every module has an *eligibility* check and it
    would be easy to read those as allowance limits. They gate **whether a benefit is
    covered**, not whether it has been used. Only AHC refuses on a prior record.
  - **Consequence: the whole backlog is verifiable with the accounts on hand.** No
    second wall, and no risk of burning the only account that could test something.
- **Step 1 — one seeding request, two blockers, filed in the handoff:** a member with
  an unused AHC allowance, and a dependent credential. Same owner, neither workable
  around, each with what it unblocks. The survey means this is the **whole** exposure,
  not the first of a pattern.
- **Step 3 — `member-profile-misc` verified. 8.10 checked; first backlog vertical
  closed.** 10/10. validate -> valid, pairing -> OK.
  - **The backlog found what it exists to find, on its first vertical.** The scenario
    *"Profile fails to load — error state"* described a failure that **cannot occur**:
    the screen renders the member from the **session**, not from `member/profile`, so
    500ing that route changes nothing. It had passed transcription because nothing
    forced it.
    - Caught only by forcing from a **cold context** — intercepting after sign-in did
      nothing, because the store already held the data. Then the cold run *still*
      rendered the member, which is what exposed the real source.
    - Spec amended: the member's own details render from the session and cannot fail
      independently; the failure scenario retargeted to **saved addresses**, which is
      the request the screen actually depends on.
  - Also confirmed: no dead destinations in the services directory, `/member/notifications`
    present (session 26's GAP closure holding), placeholders state unavailability with
    a way back.
- **Costs:** verification of a no-write vertical is the cheapest yet — no slot-aware
  tooling needed, one cold-context setup. Fifth data point; the comparable-cost finding
  holds.
- **Backlog: 1 of 6 done.** Remaining in the safe order the survey established —
  transactions & payments (one write), then vision, dental, lab, diagnostics.

## Fix session 29 — 2026-08-08 — the 400 is read; payload fixed; commit proven by curl, not yet by the app

- **Step 1 done — and the answer was my own error, not a mapper gap.**
  `curl` returned the message the logs never did:
  *"property fullName should not exist, property phone should not exist, …"*.
  **`CreateAhcOrderDto` requires only `packageId`.** The five member/address fields
  belong to `CollectionAddressDto` — a **different class in the same file** — reached
  via the optional `labCollectionAddress`, which also requires **`addressLine1`**,
  something no earlier read had noticed.
  - My session-23 contract read attributed all of them to the top-level DTO. **I
    grepped field names across a file and called it a schema read.** That single
    mistake cost sessions 27 and 28.
  - Correction filed in `14-ahc-commit-contract.md` with the working payload.
- **Payload fixed** — `PlaceAhcOrderInput` now nests `collectionAddress`, and the
  page supplies `addressLine1` from the member's address. Build green.
- **The commit path is proven — by `curl`, which returned `201` with
  `orderId: AHC-ORD-1786182053508-8GHNX7JM9`** for the exact shape the app now
  sends. The app's request body was printed and matches structurally.
- **But the app's own commit has still not been observed succeeding**, and I am not
  claiming it has. The app now returns
  `400 "Already booked AHC for this policy year"` — **because my curl test consumed
  the year's allowance.** The payload is right; the business rule is refusing a
  second order.
  - **New constraint, worse than slot collisions: AHC is once per member per policy
    year.** It cannot be re-verified for `shivam@` without touching policy data,
    which is outside the writable set. Verifying the app end to end needs **a
    different member** — `standard@` has no cover, so it needs a seeded one.
  - NEGATIVE CONTROL still passes: wallet unchanged at ₹13,844 throughout.
- **Steps 3 and 4 not started.** AHC still not transcribed — fifth time declining to
  start a transcription that cannot be verified in the same session.
- **Next session:** verify the app's commit as a member who has not used their AHC
  allowance this policy year. That is a seeding question, the same shape as 5.8's
  dependent credential — and it should go to whoever owns test data rather than being
  worked around.

## Fix session 28 — 2026-08-08 — commit fires and is rejected; 400 undiagnosed

- **Step 1 answered, and it prevented a wrong build.** **Vision never calls
  `POST /api/payments`** — it calls `vision-bookings/:id/process-payment`, and the
  **server** creates the payment record and returns its `paymentId`
  (`clinic-booking.store.ts:118-132`, `vision-payment-page.ts:142-147`).
  **AHC cannot copy that:** it has no `process-payment`, and its order-create
  returns **no `paymentId`**. The API service says so itself — *"Payment page
  created payment record, but wallet debit happens here"*.
  - So the AHC payment leg needs `POST /api/payments` after the order, keyed by
    `serviceReferenceId = orderId` — React's mechanism in the correct order.
    Recommendation and two alternatives filed in `14-ahc-commit-contract.md`.
    `AhcOrderService` already injects `PaymentService`, so an AHC `process-payment`
    would be small on the API side and is worth raising.
- **Correction carried out.** Session 22 called Review & Pay a screen with nothing
  to press that reads as *still loading*. **Wrong, and it inverted the comparison:**
  the screen carried a literal notice, *"Confirming an AHC order is not available
  yet."* A declared stub is a better artifact than a silent dead end — **AHC was
  better than ONLINE on that axis, not worse.** Fixed in `17-…md`.
- **Step 2 done — harness fixed by reading the markup.** The control is a button
  labelled **"Select and continue"**, and vendor cards only render after **Find**.
  Both legs now set; steps 1 and 2 pass.
- **Found while fixing it: the journey does not survive a reload.** A `page.goto`
  to step 3 wiped the signal store and produced "Nothing to confirm". The reference
  carries this in **sessionStorage** and *does* survive a refresh; a root-provided
  signal store does not. Normal click-through is unaffected — but a member who
  reloads on step 3 loses the booking, where the reference member would not. **Not
  yet filed as a divergence; it needs a ruling.**
- **Step 3 — NOT achieved. `POST member/ahc/orders` returns 400.**
  - The commit path is wired end to end: Review & Pay reaches its populated branch,
    the Confirm control fires, the request goes out.
  - **The 400 is undiagnosed.** Nest logs only "Bad Request Exception" with no
    validation detail. One fix was tried — omitting empty optional fields rather
    than sending `''`, since the booking screens deliberately leave slot and time
    blank — and it did not change the result. **Stopped at two adjustments per
    rule 3** rather than guessing at payload shapes a third time.
  - **NEGATIVE CONTROL still passes:** wallet unchanged at ₹13,844 across the whole
    attempt, so nothing debits without `paymentAlreadyProcessed`. The contract read
    holds.
  - My attempt to capture the request/response bodies broke the harness file; it has
    been **reverted to its last runnable state** and syntax-checked.
- **Step 4 NOT started — AHC still not transcribed.** Fourth time declining to start
  a transcription that cannot be verified in the same session.
- **Next session, first move:** capture the response body of the failing POST — the
  validation message is the one thing not yet read, and everything else about this
  build is confirmed working.

## Fix session 27 — 2026-08-08 — AHC commit path BUILT, not yet observed end to end

- **Gate cleared first.** `GET member/ahc/orders/:orderId` resolves via
  `getOrderByOrderId` -> `findOne({ orderId })` — the **business** id, exactly what
  create returns. **Opposite of claims**, where the detail route wanted the Mongo
  `_id`. Checked before wiring, per the precedent.
- **Built — booking-first, ordering from vision:**
  - `AhcBookingStore.place()` POSTs `member/ahc/orders` with the member, address,
    package and both legs, **omitting `paymentAlreadyProcessed`** so the order is
    created `PENDING` with no wallet debit. Returns the business `orderId`.
  - `ahc-payment-page` gains a real **Confirm booking** control, replacing the
    literal notice *"Confirming an AHC order is not available yet"* — a documented
    stub, not an oversight.
  - Navigates to `/member/bookings?tab=ahc`, matching where the reference lands.
- **Two mapper gaps found while wiring, both the same shape:** the domain models
  had **dropped fields the write path needs** — `Address.city`/`.state` (folded into
  display `lines`) and `AhcPackage.id` (`packageId` discarded entirely). Both added
  at the mapper. **Generalisable:** these mappers were written for read-only screens,
  so any feature that gains a commit path should expect its model to be missing
  identifiers the API requires.
- **Verification: 2/4 — the build is NOT yet observed end to end, and I am not
  claiming it is.**
  - **PASS** — step 1 renders; **PASS (negative control)** — wallet unchanged
    (₹13,844 before and after), so nothing debits without `paymentAlreadyProcessed`.
  - **FAIL x2** — Review & Pay rendered *"Nothing to confirm"*, so the commit control
    never appeared. **That is the harness, not the build:** my step-1 vendor/slot
    selectors did not set a leg, and the button lives in the populated branch behind
    `@if (store.lab() || store.diagnostic())`. Same branch-visibility shape as ONLINE
    and the benefits route.
  - Stopped rather than starting a third adjustment cycle without room to finish it.
- **AHC NOT transcribed.** Section 9 requires transcribe and verify together, and
  the commit is not yet observed. Declining to start is the same call made twice
  before.
- **Next session, in order:** drive step 1 properly (read the vendor-card markup
  first — the harness needs to *set a leg*, not merely click), confirm the order is
  created `PENDING`, then transcribe and verify AHC as one vertical. The payment leg
  after that: the reference creates a payment via `POST /api/payments` with
  `serviceReferenceId` = the booking id, which booking-first supplies as the
  `orderId`. Angular does not declare that endpoint yet.
- `ahc-booking-page:124`'s dead `FamilyStore` injection **stays dead** — the build
  did not make it live. Filing unchanged.

## Fix session 26 — 2026-08-08 — the last vertical transcribed AND verified

- **Step 1 — slot-aware selection built** (`03-live/slot-picker.mjs`). Tries
  candidates until one is not already booked, distinguishing a collision from a
  refusal for any other reason. **General rule recorded:** *a harness that mutates
  shared state is not repeatable by default, and where the mutation is
  deterministic it cannot be made repeatable without diverging from the reference.*
  - **ONLINE/NOW is the deterministic case** and is deliberately left alone. Its
    slot id is `<doctorId>_ONLINE_<date>_<time>` by the reference's own formula, so
    a same-day rerun collides with its own booking. Changing the formula to suit
    the tooling would be diverging from the reference to make a test pass.
  - Session 20's accretion decision still stands — deleting the wrong record is
    worse — but its cost has moved from "`shivam@`'s booking list is meaningless"
    to "reruns need slot-aware selection."
- **`member-consultations` transcribed AND verified — 8.17/8.18 both checked.**
  **10 routes, 6 requirements, 20 scenarios** — the largest vertical, as **one spec
  with a mode distinction**, matching the loop at `app.routes.ts:133` rather than
  compromising with it. validate -> valid, pairing -> OK.
- **Verified 9/9, both modes to terminal state:**
  - IN_CLINIC — specialty -> doctor -> patient -> slot -> confirm -> `201` ->
    bookings, appointment present. Active-member marker confirmed on the picker.
  - ONLINE/LATER — `201` **after 2 attempts**, the retry visibly earning its place:
    the first candidate slot was already taken by an earlier run.
  - Contact number prefilled and editable; **negative control** — cleared number
    blocks with a message and **zero POSTs**.
  - Both hubs list consultations and offer booking; specialties populate for both
    modes (entry 9 conformance).
- **Costs:** transcription the largest so far (10 routes, but one spec); **verification
  again comparable, not a multiple** — fourth consecutive data point, so the
  interleaved plan holds for the six-vertical catch-up backlog.
- **All ten verticals are now transcribed. Four are verified** (claims,
  policy & benefits, consultations, plus the backlog outstanding).

## Fix session 25 — 2026-08-08 — ONLINE confirm form built; booking works on both branches

- **Built: the three inputs, copied from the reference.** Contact number (required,
  prefilled from the member's own record), call preference (VOICE/VIDEO/BOTH,
  default BOTH), NOW/LATER with a slot picker on LATER. Both branches stay on the
  one shared confirm component, as `app.routes.ts:133` assumes.
  - **NOW** sends today's date and the literal `'Immediate'`; **LATER** sends the
    picked date and slot. `slotId` is built as
    `` `<doctorId>_ONLINE_<date>_<time>` `` — the reference's own `generateSlotId`.
  - The malformed `DOC10002___` is gone: it was three empty values joined, and the
    values are now real.
  - LATER reuses `store.days(doctorId, '')` rather than a new endpoint.
- **Verified live — every branch reached a terminal state at least once, observed:**
  - **ONLINE / NOW** — `POST /api/appointments 201`, navigated to
    `/member/bookings?tab=doctors`, booking present in the list.
  - **ONLINE / LATER** — `201`, same navigation, after picking a real slot from 16
    offered for that doctor.
  - **IN_CLINIC** — `201`, unchanged, and the ONLINE form does **not** leak onto it.
  - **Negative control** — clearing the contact number blocks with a message and
    issues **zero** POSTs.
- **A defect I introduced, found by the negative control.** My prefill effect
  re-filled the contact number whenever it was empty, so the member could not clear
  it — the effect fought the user. The reference prefills once. Fixed with a
  one-shot guard.
- **The harness is not idempotent, and that is the accretion cost surfacing in the
  tooling.** Every run books a real appointment, so the slot it picks is taken by
  the next run — three separate `400 "This time slot has already been booked"`
  results, each diagnosed from the API log rather than guessed at. Two harness
  adjustments (pick the last day/slot instead of the first); a third would have been
  assertion-fitting, so I stopped.
  - **ONLINE/NOW cannot be idempotent even in principle:** its slot id is
    deterministic per doctor per day, exactly as the reference builds it. Repeat
    runs on the same day collide with their own earlier booking. Recorded in the
    assertion rather than papered over.
- **Step 3 NOT started.** Section 9 requires transcribe and verify together, and
  there was no room for both. A spec written and unverified is what the rule exists
  to prevent.
- **Route accounting: 57 completable routes** (55 -> 60 -> 59 -> 56 -> 57).
  Provisional until every vertical is verified.

## Fix session 24 — 2026-08-08 — policy & benefits closed; the last unblocked vertical

- **Entry 13 filed** — `/member/benefits/:categoryId` sanctioned as an Angular-only
  **presentation** divergence, cross-referenced to entry 1, with the general rule
  stated so it applies without this thread:
  > An Angular-only route that introduces no endpoint and composes only existing
  > state is a presentation divergence, not scope creep.
  Recorded that a route which *adds* an endpoint or reaches otherwise-unreachable
  data fails the test and is scope.
- **Inherited finding 10 filed** — `POST /member/ahc/orders/validate` passes six
  `null` services under `// TODO: Inject dependencies`. Member-visible consequence
  stated for the API owner: **a member commits to an AHC order without seeing what
  it costs from their wallet, where every other journey shows them first.**
- **`member-policy-benefits` transcribed AND verified — 8.15/8.16 both checked.**
  3 routes, 3 requirements, **14** scenarios. validate -> valid, pairing -> OK.
  **10/10 live**, with forced state for load failure, unlimited, unrecognised
  category and exhausted category.
- **The verification corrected the spec — which is the point of interleaving.**
  Three assertions failed on the first run and **all three were mine**, but chasing
  the third found real behaviour I had specified wrongly:
  `/member/benefits/:categoryId` **forwards** to a category's dedicated journey where
  one exists (`benefit-detail-page.ts:185-199`, "covers anyone arriving on this URL
  directly or from a stale link") and renders the composed view only for categories
  without one. My spec described only the composed half. **Added a Rule and a
  scenario for the forwarding behaviour**, then verified both paths: CAT005 forwards
  to `online-consult/specialties`, CAT002 (Pharmacy) renders the composed view.
  - The other two were a wallet-screen string asserted against the benefits screen,
    and looking for the policy link on `/member/wallet` when it lives on `/member`
    (`dashboard-cards.ts:22`).
- **Costs:** transcription in line with prior verticals; **verification again
  comparable, not a multiple** — third data point, so the interleaved plan holds for
  the catch-up backlog.
- **Nine verticals transcribed, 42 of 58 routes. Three verified** (claims,
  policy & benefits, plus the six-vertical backlog still outstanding).
- **Only appointments + online consult remains untranscribed**, blocked on the ONLINE
  confirm form. AHC is transcribable once its commit path is built.

## Fix session 23 — 2026-08-08 — AHC unblocked; policy & benefits gated

- **Step 2 done, and it is the session's result: AHC is buildable, not blocked on
  the API owner.** `14-ahc-commit-contract.md`.
  - **Booking-first is supported.** `CreateAhcOrderDto` requires **no payment
    reference**; `paymentAlreadyProcessed` is optional and exists to serve the
    reference's payment-first path. Omitting it yields `paymentStatus: PENDING` and
    debits no wallet — exactly the vision ordering, with no API change.
  - Returns **201** with a business `orderId` (`AHC-ORD-…`). Identifier duality
    applies; check which id `GET orders/:orderId` takes before wiring navigation,
    per the claims precedent.
  - **No `process-payment` equivalent** — payment goes through the generic
    `payments/:id` + `mark-paid`, as every other paid journey already does.
  - **Found while answering: `POST orders/validate` is a stub.** The controller
    passes **six `null` services** into `validateOrder` under
    `// TODO: Inject dependencies` (`ahc-member.controller.ts:190-206`). So AHC
    **cannot show a wallet split before commitment**, which every other booking
    vertical's spec requires. It does not block the build — create returns the
    breakdown, so the split can be shown on the pending order — but the spec must
    say the pre-commitment split is deferred. **That part is the API owner's.**
- **Step 1 GATED — `/member/benefits/:categoryId` has no reference counterpart.**
  `19-benefits-detail-gate.md`. It composes existing stores into a per-category view;
  the reference has no such screen (its cards go to `/member/providers`,
  `/member/claims/new`, `/member/family/add`). Entry 1 is scoped to `/member/benefits`
  and does not cover it. Sanction it or fold it into DEBT — not my call.
  - **Policy & benefits NOT transcribed.** The other two routes are clean, but
    specifying two of three would leave the vertical half-covered and its paired
    verification unable to cover it.
- **Entry 11's falsification condition fired a second time.** A **fourth** dead link
  in the reference: `/member/providers` (`benefits/page.tsx:486,532`), absent from
  both portals. Angular does not reproduce it. The entry has now been found
  incomplete once per check — which is the condition earning its place.
- **Route accounting is provisional and has moved every time it was checked:**
  55 -> 60 -> 59 -> **56**, each from looking closer rather than counting differently.

## Fix session 22 — 2026-08-08 — STOPPED: AHC is the ONLINE shape, and the shape is a class

- **AHC NOT transcribed — stop condition fired.** The own-reference read went one
  level deeper than the route list and found the journey cannot complete.
  - **No write exists anywhere in `core/ahc/`.** `AHC_API.orders`
    (`core/ahc/ahc.ts:20`) has **no caller**; no `http.post/put/patch` in the feature.
  - Live: `/member/ahc/booking` "Select a Lab — **Step 1 of 3**",
    `/booking/diagnostic` "**Step 2 of 3**", `/booking/payment`
    "**Review & Pay** — Step 3 of 3" with **no buttons at all** beyond shell chrome.
    Its only outbound action is a link back to `/member/wellness`.
  - **Worse than ONLINE in one way:** ONLINE offered an enabled button that did
    nothing, which a member might report. AHC offers nothing to press, which reads
    as "still loading".
  - Transcribing it would have described a working booking journey. The route list
    and endpoint diff both said it was built.
- **"Renders but cannot complete" is a CLASS, not an instance** — `17-…md`. Two of
  eight verticals examined. No static check in this audit sees it.
- **Bounded by a sweep with both controls passing** (`18-write-sweep.mjs`): **AHC is
  the only must-create feature that never writes.** No third instance of that variety.
  - **Detector blind spot recorded:** the sweep would **not** have caught ONLINE —
    `appointments` writes twice, and ONLINE's failure was a route-level unsupplied
    input on one branch. Two varieties, two detectors; only terminal-state
    verification catches the second.
- **Route accounting again:** AHC's 3 routes are "built" as ONLINE's confirm was.
  **56 genuinely-completable routes, not 59.**
- **How to build AHC, for whoever does:** React is payment-first — it stashes a
  `pendingBooking` in `sessionStorage` (`ahc/booking/payment/page.tsx:175-198`) and
  lets `/member/payments/:id` create the order afterwards. **Entry 5 rules that
  do-not-port.** AHC must create the booking first, then take payment, as vision does.
- `ahc-booking-page:124` **confirmed still dead** (import + inject only), not removed.
- **policy & benefits NOT started** — stop condition fired first.

## Fix session 21 — 2026-08-08 — interleaving lands; claims transcribed AND verified

- **Step 1 — interleaving written into section 9.** A vertical's transcribe task is
  not complete until its paired verify task passes, with the three-defect table as
  the reasoning so it reads as earned rather than stylistic. The six pre-rule
  verticals are recorded as a **fixed catch-up backlog** (lab, diagnostics, vision,
  dental, profile & misc, transactions & payments) — known debt, no longer growing.
- **Step 2 — `member-claims` transcribed and verified in one session. 8.13 and 8.14
  both checked — the first vertical to close under the new rule.** 3 routes,
  3 requirements, 16 scenarios. validate -> valid, pairing -> OK.
  - **Verification: 10/10 including terminal state** (`03-live/verify-claims.mjs`).
    Forced states for list-load failure and empty list; both controls passing.
  - **The verification found a regression I introduced in session 20.** Fixing the
    navigation to use the Mongo `_id` meant the detail header, which rendered the
    route param, started showing `6a76af06c1c499b2b38c0c6d` to the member. That is
    both a member-facing wart and a violation of the "no Mongo-shaped values reach
    components" rule. Header now renders `claim.value()?.reference` — verified
    showing `CLM-20260808-0002` while the URL keeps the `_id`.
    - **Caught by reading the output, not by an assertion** — the run was 10/10
      before the fix, because no scenario asserted *which* identifier is displayed.
- **Costs, separately, first real verification figure:**
  - **Transcription** ~ in line with previous verticals (one reference read + write).
  - **Verification cost is comparable to transcription, not a multiple of it** —
    one harness, ten scenarios, two forced states. It is **not** the bottleneck the
    batched backlog implied, which supports applying interleaving to the remaining
    verticals rather than re-sizing.
- **Step 3 — shell guard applied and verified.** `member-shell.ts` renders the
  outlet only while `session.isAuthenticated()`. Live with a 60s token: the member
  is redirected to login, and in the gap sees **no false empty state and no
  spinner**. `.env` restored to `JWT_EXPIRY=7d`, verified identical to backup,
  backup deleted, API restarted on it.
  - Two self-inflicted build breaks worth noting: `session` was `private` (templates
    cannot reach private members), and my inline comment used backticks around
    `terminate()` **inside** the backtick template literal, which closed the string.
    Both are properties of this codebase's inline-template style.

## Fix session 20 — 2026-08-07 — claim navigation fixed; duality is not a class

- **Fixed and verified to a terminal state.** `submit()` now returns the Mongo `_id`
  while still calling the submit endpoint with the business reference; list rows and
  post-submit navigation both use `_id`. Opening a claim lands on
  `/member/claims/6a75cda4…`, renders it, **no API errors**.
- **Not a class — checked, both controls passing** (`16-id-duality.mjs`). Seven models
  carry both ids; three other navigations pass the business one and are **correct**:
  `/member/orders/TXN-…` verified live (renders, no errors), payments the same
  contract. **`lab-orders-page.ts:44` is untested** — no order rows on the test
  account — and is recorded as unverified rather than clean.
- **Cancel path untouched and correct**, as the negative control required: it takes
  the business reference, and the mapper documents why (`_id` answers 404).
- **API-side hardening still filed:** `new ObjectId(id)` throws, so any malformed id
  from anywhere yields **500** instead of 400/404.
- **Method note recorded in the handoff — run section 8 sooner.** The two worst
  defects in this audit were invisible to every static check and each surfaced within
  one session of the check that could see them. Both needed a **terminal state**.
  Transcription and verification should interleave rather than sequence; eight
  verification tasks queued behind ten transcriptions means the next defect of this
  shape waits for all of them.
- **Step 2 NOT started** — claims/AHC/policy & benefits untranscribed. Claims is now
  unblocked (its terminal state works), but starting a group here would have produced
  a spec I could not finish.

## Fix session 19 — 2026-08-07 — both gaps fixed, entry 12 filed, new defect found

- **GAP 1 fixed — pre-submission balance guard**, naming the figure, added *beside*
  `overLimit` (per-claim limit, warned) and `capNotice` (API cap, reported after).
  Three neighbouring mechanisms now, each documented for what it answers.
- **GAP 2 fixed — prescription and bill are separate controls with separate checks.**
- **Verified live, 6/6 with both controls** (`03-live/claims-validation.mjs`):
  prescription-only is refused; a valid claim is not blocked; no false balance error
  at ₹100; the guard fires at ₹9,999,999 naming **₹1,080** — the real category balance,
  which also proves the wallet-category match resolves.
- **Entry 12 filed** — the single-page claim form, cross-referenced to entry 10 rather
  than folded into it, with `providerName` recorded as a deliberate stricter divergence.
- **NEW DEFECT, found only by verifying to a terminal state** —
  `15-claim-detail-id.md`. The claim is created (201) and submitted (200), then the
  detail page **500s** and renders *"Claim not found"*. Angular navigates with the
  **business id**; the endpoint takes the Mongo `_id`
  (`memberclaims.service.ts:765`, `BSONError`). The reference distinguishes them —
  `claim.id` for detail, `claim.claimId` for cancel. **Angular's defect, and
  writable.** Secondary API-side note: a malformed id returns 500 rather than 400/404.
  - **This is criterion 5 paying for itself within one session of being added.**
    Guards, rendering and network all looked correct; only the terminal state failed.
- **Step 4 NOT started** — claims/AHC/policy & benefits untranscribed. Claims should
  not be transcribed until the detail navigation is fixed: a scenario asserting
  "the member is taken to the claim" currently lands on an error screen.

## Fix session 18 — 2026-08-07 — STOPPED: the claims precondition failed

- **The precondition caught a real defect. The register entry waits.**
  Sanctioning Angular's single-page claim form was conditional on it enforcing every
  rule React's three steps did. **Two are unmatched** — `14-claims-validation-gap.md`:
  - **GAP 1 — no pre-submission balance guard.** React blocks a bill exceeding the
    member's available balance, naming the figure (`claimValidation.ts:44-54`).
    Angular has no equivalent. Its `capNotice` (`claims.store.ts:180-186`) reports the
    API's **per-claim limit** *after* submission — a different limit, checked later.
    Deliberate and well-commented; not a substitute. A member can submit a claim
    exceeding their balance and learn only once it is filed.
  - **GAP 2 — document types not distinguished.** React requires at least one
    **prescription** and at least one **bill** separately (`:66-70`). Angular requires
    one file of any kind behind a single "Add bills and prescriptions" control
    (`new-claim-page.ts:197`), so a claim can be filed with two prescriptions and no bill.
  - Angular is *stricter* on one rule (`providerName` required, React does not) — not
    a blocker.
  - **The layout argument is unaffected and still sound.** The sanction rests on
    "per-step validation becomes whole-form validation", which requires the rules to
    match. Fix the two, and the entry is filable as written.
  - **Not fixed here:** both change a submitting flow, and GAP 1 needs a decision on
    *which* limit to guard (available balance, per-claim limit, or both) — the
    reference guards one, the API enforces the other.
- **Method note — the gating rule is two-for-two in opposite directions.**
  `select-slot` **carried** entry 10's reasoning; claims **does not**. A gate that
  always says yes invites being skipped; this one has now discriminated, and it did so
  by way of a *precondition read* rather than an argument. Worth keeping precisely
  because it is cheap and has twice changed the answer.
- **claims (3), AHC (3), policy & benefits (3) NOT transcribed.** Claims is blocked by
  the above; the other two were not started rather than begun and left thin.
- Still six verticals transcribed, 33 of 58 DEBT routes.

## Fix session 17 — 2026-08-07 — one group transcribed, claims GATED

- **Step 1 done.** DB rule corrected in the handoff — it was false as written:
  > **No writes to policy, assignment, or wallet data.** Booking records created by
  > harness runs are expected and accumulate.
  **Accretion accepted deliberately**, with reasoning: a cleanup routine that deletes
  the wrong record is a worse failure than a cluttered test account. `shivam@`'s
  booking list should not be read as meaningful.
- **Step 2 answered — the class IS covered, but only implicitly, and now explicitly.**
  Section 8's verify tasks inherit terminal clauses from the scenarios themselves
  (`member-lab`: *"the order is placed **and** the member is taken to the order"*), so
  a silent no-op like ONLINE would fail them. That depended on how carefully a verifier
  reads the AND, so **section 9 gains criterion 5**: any scenario asserting something is
  created/booked/placed/submitted must be verified **to a terminal state** — the record
  exists and the named navigation happened. Rendering plus clicking is not evidence.
  - **Accounting corrected:** `/member/online-consult/confirm` was counted as built. It
    routes and renders and does nothing — closer to `vaccination`'s placeholder except
    nothing marks it unbuilt. **Angular is 59 built routes, not 60**, until the form exists.
- **Step 3 — one of four groups transcribed.**
  - **transactions & payments (4 routes)** — `specs/member-transactions-payments/spec.md`,
    3 requirements, 10 scenarios. validate -> valid, pairing -> OK.
    **Entry 5 conformance recorded, not divergence:** the reference's payment screen
    creates bookings via five endpoints; Angular calls only `payments/:id/mark-paid`
    (`transaction.mapper.ts:25`, reasoning at `transactions.store.ts:99`).
  - **claims (3 routes) — GATED, not transcribed.** The reference's new-claim is a
    **3-step wizard** with per-step validation (`new/page.tsx:292-303`); Angular is a
    **single-page form** (`<form (ngSubmit)="submit()">`).
    - **Checked for the ONLINE shape and it is not that.** Angular's form completes —
      real submit path, and it *does* collect documents (`type="file"` at `:186`,
      `documents: this.files()` at `:337`), which React requires in step 2.
    - So it is a **step-count divergence, 3 -> 1, not covered by entry 10** (scoped to
      patient/slot pickers). Gated per the standing rule rather than assumed to carry.
      A spec cannot be written until it is ruled — it would have to describe either
      three steps or one.
  - **AHC (3) and policy & benefits (3) not started.**
- **Six verticals transcribed; 33 of 58 DEBT routes.** Cost per route flat.

## Fix session 16 — 2026-08-07 — STOPPED AT STEP 3 (the 400 is a missing feature, not a payload bug)

- **Step 1 done — notifications GAP CLOSED**, after carrying three sessions.
  `/member/notifications` restored to the services directory; verified live that the
  link exists, lands on `/member/notifications`, and the page renders.
  - **Negative control initially looked like a failure and was not.** A
    `getByRole('link',{name:/reimbursement/i})` matched — but by *accessible name*,
    which includes the description text. Checked by **href** instead: no link to
    `/member/reimbursements` or `/member/help` exists; the match was the Claims entry
    ("File a new reimbursement claim" -> `/member/claims/new`). Resolved by reading,
    not by loosening the pattern.
  - Register entry 11 marked RESOLVED and given a **falsification condition**: a
    dropped-links list is a snapshot of what did not exist when written and must be
    re-checked whenever routes are added. It went stale within one session.
- **Step 2 done — and it reframes the 400.** `web-member/app/member/online-consult/confirm/page.tsx`:
  - **Endpoint:** same, `POST /api/appointments` (`:394`). Unambiguous.
  - **Payload** (`:365-388`): `appointmentType: 'ONLINE'`, `clinicId/clinicName/clinicAddress`
    explicitly `''`, plus **`appointmentDate`, `timeSlot`, `slotId`, `contactNumber`,
    `callPreference`**.
  - `appointmentDate`/`timeSlot` are **never empty**: `timeChoice === 'NOW'` gives
    today + the literal `'Immediate'`; `'LATER'` gives a member-picked date and time
    (`:344-354`). `slotId` is `selectedSlotId` for LATER, else
    `` `${doctorId}_ONLINE_${date}_${time}` `` (`:357-362`).
  - **Success:** returns `appointmentId`; the screen shows an in-page success state
    rather than navigating.
- **STOPPED: this is not a payload correction.** The reference's ONLINE confirm is a
  **form** Angular does not have — required `contactNumber` (`validateBookingForm:330`),
  a NOW/LATER choice, and a slot picker when LATER. Angular's confirm collects none
  of it, which is why it can only send empty date/time and a malformed
  `DOC10002___` slot id.
  - A minimal fix — hardcoding NOW/today/`Immediate` and omitting `contactNumber` —
    would **remove a choice the reference offers and drop a field it requires**. That
    is a new flow by omission, and the standing constraint forbids it in both directions.
  - **So the remaining work is a feature: build the ONLINE confirm form.** That needs
    a decision, not a bug fix, and it is why appointments + online consult is still
    not transcribed.
- **Method note recorded:** a `computed()` whose name reads like dead state and which
  is referenced **only in a template binding** is easy to mistake for unused — I nearly
  deleted `blocked` last session. That is a property of this codebase's style
  (inline templates, `protected` members), not a one-off.
- **Disclosure — the harness mutates.** Driving IN_CLINIC end to end as the harness's
  positive control issues a real `POST /api/appointments 201`. Sessions 15 and 16 each
  created appointment records for `shivam@gmail.com`. Sayani's assignment row is
  untouched, but "the DB stays unmutated" is **not** strictly true of live booking
  verification, and any future run of `03-live/consult-flows.mjs` adds another.

## Fix session 15 — 2026-08-07

- **Step 1 — harness fixed, once.** Root cause of the two prior failures: `.first()`
  on broad selectors matched the `Skip to content` link, and no `finally` close hung
  the run. Stable strategy now: `getByRole` with accessible names + `networkidle` +
  `try/finally`. **Proved on IN_CLINIC end-to-end** (its own positive control):
  specialty -> doctor -> select-patient -> select-slot -> confirm ->
  `POST /api/appointments 201` -> `/member/bookings`.
- **Step 2 — the static trace is CONFIRMED, all four steps, nothing refuted.**
  ONLINE: confirm URL has no `patientId`, **no wallet split**, `PATIENT` renders
  **blank**, confirm button enabled, clicking it produced **zero API calls and no
  navigation**.
- **Step 3 — `13-patient-input-trace.md`. One unbound patient input. An instance,
  not a class.** Both controls pass — **the negative control failed first and the
  trace was rebuilt**: a bounded lookahead with an optional group matched empty, so
  every multi-line `[queryParams]` read as "no patientId". Uncaught, it would have
  reported *every* link as unbound.
  - 4 components take `patientId` as `input<string>('')`; 11 inbound links traced.
  - The confirm back-link looked like a second instance and **is not** — it binds
    `[queryParams]="backParams()"`, which returns `patientId` on IN_CLINIC
    (`:197-206`). Resolved by reading, not by loosening the pattern.
  - **Consequence: the five transcribed specs need no rewriting.** No other flow has
    this defect.
- **Step 4 — fixed, and the fix exposed the next defect.**
  - `patient` is now a `computed()`: use `patientId` when supplied, else fall back to
    `activeMember()` — what the reference does, and it keeps both branches on one
    component per the loop at `app.routes.ts:133`.
  - **The generalizable half: `confirm()` no longer returns silently.** It sets
    `confirmProblem` and the screen renders it. That silence is why a dead journey
    survived fourteen sessions.
  - **Live after the fix:** `PATIENT` shows *Shivam Jha*, **wallet split renders**,
    and confirm now issues `POST /api/appointments` — **which returns 400.**
  - **So ONLINE is no longer dead, but still cannot book.** Probable cause, unverified:
    `confirm()` synthesises `slotId` as
    `` `${doctor.id}_${clinicId()}_${appointmentDate()}_${timeSlot()}` `` and on ONLINE
    all three are empty, giving `DOC10002___`. The reference builds its own ONLINE
    payload. **Needs the reference read before any further change** — do not guess the
    payload.
  - **Caught during the fix:** I removed `[disabled]="… || blocked()"` believing it
    was stray; `blocked` is a pre-existing computed (`:213`) meaning validation
    rejects the booking. Restored, and my new signal renamed `confirmProblem`.
- **Step 5 (register maintenance) NOT DONE.** Notifications directory entry still
  unrestored; entry 11's staleness note still unwritten.
- **Appointments + online consult NOT transcribed** — the flow still does not complete.

## Fix session 14 — 2026-08-07 — STOPPED AT STEP 1 (BLOCKER found)

- **Step 1 found a live defect. Steps 2 and 3 not started, per the instruction to
  file and report before continuing.**
- **BLOCKER: online consultation cannot be booked at all.** Not the wrong-patient
  case — the **flow is dead**. `doctors-page.ts:67-71` links the ONLINE branch to
  confirm **without `patientId`**; `appointment-confirm-page.ts:145` defaults it to
  `''`; the validation effect (`:162-166`) returns early so **no wallet split is ever
  computed**; and `confirm()` (`:221-223`) looks up a family member with id `''`,
  finds none, and **returns silently — no booking, no error.**
  - IN_CLINIC is unaffected: its `select-patient` step supplies the value.
  - Filed in `02-screens/family.md`.
  - **Static evidence only.** Two live-harness attempts failed on selectors; per
    rule 3 I stopped adjusting rather than fit a third. The citations are exact and
    the path is short, but **it has not been observed end to end** — that is the one
    thing outstanding on this finding.
- **Census limitation recorded** in `07-familystore-census.md`. It answered "who
  injects `FamilyStore` and ignores it", not "who never receives family context".
  `appointment-confirm-page` is classified **correct** there and is correct *about the
  store* — its failure is an **unbound route input**, which no census of store
  consumers can surface. The census is complete for store consumers and **incomplete
  for family-context propagation**; that trace has not been done for any other vertical.
- **Appointments + online consult NOT transcribed.** Transcribing a spec for a flow
  that cannot complete would have described intended behaviour as though it shipped.

## Fix session 13 — 2026-08-07 — STOPPED IN STEP 3 (online consult is a variant)

- **Method rules recorded.** (1) **Stop grepping hand-written markdown — read it.**
  Four line-based failures, all against wrapped lines / blockquotes / tables, all
  failing toward a plausible answer; the last nearly produced a *fabricated repair*.
  (2) **Inheriting resemblance is a method defect** — 3 of 4 verticals where "looks
  like the last one" was false. Every vertical gets its own reference read.
- **Step 1 done — pairing is now mechanical.** `audit/check-spec-pairing.mjs` asserts
  every transcribed spec has both a transcribe and a verify task in section 8.
  Both controls pass; **no existing mismatch** (5/5 paired), so the drift has not
  recurred. Runs alongside `openspec validate --strict`.
- **Step 2 done — profile & misc** (`specs/member-profile-misc/spec.md`, 6 routes,
  4 requirements, 10 scenarios). validate -> **valid**; pairing -> **OK**.
  - **Own reference read changed the spec.** Only **1 of 6** routes calls an API.
    Three are "Coming Soon" placeholders; `services` is a static directory;
    `settings` has password fields with **no form, no handler, no endpoint** on
    either side. Specified as presentational rather than as a capability.
  - **New register entry 11 — dead directory links are dropped, not shipped.**
    Verified `/member/reimbursements` and `/member/help` exist in **neither** portal.
  - **Connected two findings:** entry 11's inline comment is **stale** — it lists
    `/member/notifications` as non-existent, but that route was added during this
    audit, and its absence from the directory is part of why the notifications page
    has **no entry point anywhere**. **Restoring that one entry closes the GAP in
    `02-screens/notifications.md`.**
- **Step 3 STOPPED — online consult is a variant of appointments, not its own flow.**
  - React's `online-consult` has **no shared component imports** with appointments,
    but calls the **same API**: `/api/appointments/validate-booking`
    (`confirm/page.tsx:296`).
  - **Patient selection is folded into confirm** (`selectedPatient` at `:186`,
    defaulted from `viewingUserId` at `:261`) rather than being its own route, and
    **slot selection is omitted entirely**.
  - So online consult = the appointments journey minus the slot step, with the
    patient step relocated. **Angular models this correctly** — one loop, `mode:
    'ONLINE'`, at `app.routes.ts:133`.
  - **Implication for the appointments session:** the two cannot be transcribed as
    independent verticals without duplicating requirements. They should be **one
    spec with a mode distinction**, which also means the appointments vertical is
    ~10 routes rather than 6.
  - **Also noted, unverified:** React's online confirm *defaults* the patient from
    `viewingUserId`. Angular's shared confirm page takes `patientId` as a route
    input, and the ONLINE branch has no `select-patient` route to supply it — worth
    checking where it comes from before that spec is written.
- **Online consult NOT transcribed.**

## Fix session 12 (continued) — vertical four

- **Session 12's four steps were re-verified against disk before any rework** — all
  four had landed. **Both verification greps failed, not the content:** the
  line-based one on a wrapped line, and a multiline `\s+` because the continuation
  begins with a blockquote `>`. **Third instance of a line-based grep failing this
  way in this audit** — the content was at `parity-divergences.md:147-150` the whole
  time. Confirmed by printing the region rather than adjusting the pattern a third
  time (rule 3).
- **Vertical four done — dental** (`specs/member-dental/spec.md`, 5 routes,
  3 requirements, 13 scenarios). `openspec validate --strict` -> **valid**.
  Paired verification task 8.8 added.
  - **Resemblance to vision verified, not inherited — and it does not hold.** Three
    differences: benefit category **CAT006** not CAT007; **5 routes, no payment
    route at all**; no `clinics/:id` detail lookup. Dental's confirm calls
    `dental-bookings/validate` then `POST dental-bookings` and the journey ends —
    there is no copay-to-gateway continuation. **Dental is not vision minus a screen.**
  - Entry 5 recorded as **unviolatable here** (no payment step exists), so a future
    reader does not go looking for one.
  - **Marginal cost: lowest of the four.** Amortisation holds; four verticals now
    transcribed (lab, diagnostics, vision, dental) covering **23 of the 58 DEBT routes**.

## Fix session 12 — 2026-08-07

- **Step 1 done — entry 5 widened** from `/member/payments/:paymentId` to
  **"payment never precedes booking creation, anywhere."** Angular's
  `validate()` -> `create()` recorded as a **sanctioned divergence** with reasoning,
  where it had been undocumented. Justified without reference to the cost of
  reverting: the 13 orphaned payments are what payment-first produces.
  - **General rule added to the register:** *a reference behaviour whose own error
    handling anticipates the failure it causes is a defect, not a specification.*
    Applies without knowing this history, and generalises the two exemptions carried
    since session one.
  - This resolves the conflict portal-wide rather than per-screen — seven more paid
    journeys would each have re-raised it.
- **Step 2 done — §6 reframed as at least three write paths**, not an APPOINTMENT
  bug: APPOINTMENT 11 shapes, DENTAL 29 raw ObjectIds vs 2 `DEN-BOOK-…`, VACCINATION
  5 slot ids vs 2 booking ids. **A fix scoped to appointments leaves the other two.**
  Contamination stays one-directional; `serviceType` unreliable-but-not-decorative.
- **Step 3 done — incident window recorded in §5.** 2026-01-28 DENTAL ×5,
  2026-01-29 VISION ×3, 2026-01-30 APPOINTMENT ×3 — three days, three service types,
  two users. Three independent booking paths failing the same way in 72h points at
  **the payment step** as the common factor. Whether that window is a deploy, outage
  or gateway change is the single most useful thing to hand production alongside §7.
- **Step 4 — vision transcribed** (`specs/member-vision/spec.md`, 6 routes,
  4 requirements, 13 scenarios). `openspec validate --strict` -> **valid**.
  Paired verification tasks added for **both** diagnostics (8.4) and vision (8.6);
  diagnostics' pairing had been missed in session 8 and is now correct.
  - **Carve-outs checked, not assumed:** entry 10 covers vision's patient and slot
    screens; **entry 5 vision *conforms*** — its payment screen is keyed by an
    existing `bookingId` and calls `process-payment`, so the booking predates payment.
  - **Marginal cost: comparable to diagnostics, still well below lab.** One reference
    read plus the write. Amortisation holds across three verticals now.
- **Vertical four not started** — context. Appointments is unblocked by Step 1 but
  remains the largest and most payment-entangled; dental is the cheaper next pick and
  must verify its resemblance to vision rather than inherit it.

## Fix session 11 — 2026-08-07 — STOPPED IN STEP 3 (register gate)

- **Step 1 done.** §7 gains the partition warning: **`serviceType` is not a reliable
  partition, so per-type totals do not sum to the true total** — compute headline
  numbers from a single unpartitioned pass. Directionality checked with a passing
  positive control (`APT000001 -> APT#`): **contamination is one-directional**, only
  APPOINTMENT holds foreign-domain (`CART-…`, `DIAG-CART-…`) references. §6 stands;
  no reframing needed. Filed as §9, with the related note that DENTAL and VACCINATION
  each carry two schemes of their own.
- **Step 2 done — the six are closed out.** Widened 24h -> 72h -> 7d: 6 -> 3 -> 3
  (stable). The three that never resolve are `PAY-20260130-0043/0044/0046`, ₹240 each,
  all one user who has **zero appointments on any date**. Filed as §8.
  **Revised total: 13 unmatched COMPLETED payments, ₹6,520.**
  - **The cluster is the signal:** 2026-01-28 DENTAL ×5, 2026-01-29 VISION ×3,
    2026-01-30 APPOINTMENT ×3 — three consecutive days, three service types, two
    users. Reads as an incident window, not steady leakage.
- **Step 3 STOPPED — register decision not already covered.**
  **Payment-first exists in the React reference, not only in RN.**
  `web-member/app/member/appointments/confirm/page.tsx:137-157` creates the
  appointment *after* payment; its catch reads *"Payment successful but failed to
  book appointment"* and its log *"Error creating appointment after payment"*.
  - **Angular already diverges** — `booking.store.ts:108,120` and
    `appointment-confirm-page.ts:210,226` run `validate()` then `create()`,
    booking-first, no payment between. **This divergence is unrecorded.**
  - This is not covered by entry 5, which is scoped to `/member/payments/:paymentId`.
    It conflicts with the standing no-new-flows rule: for this screen the reference
    *is* payment-first, so "match the reference" and "payment-first is a defect,
    do-not-port" point opposite ways.
  - Gated rather than assumed, per the `select-slot` precedent. **The appointments
    vertical cannot be transcribed until this is ruled.**
- **Verticals three and four NOT transcribed.**

## Fix session 10 — 2026-08-07

- **Steps 1-3 done. Step 4 (verticals three and four) NOT STARTED** — context spent
  on Step 1, which overturned two of last session's claims.
- **Two retractions, both mine, both in §5/§6 of `05-inherited-api-findings.md`:**
  1. **APPOINTMENT is joinable.** I reported it "could not be checked". The link
     exists in the other direction — `payments.serviceReferenceId ->
     appointments.appointmentId` — and resolves **28 of 59**.
  2. **lab / diagnostic / AHC orders are joinable and clean** — all four completed
     payments resolve. Their appearance in the discarded 32-row result was purely
     the artifact it was called.
- **The real finding, filed as §6:** within `serviceType: 'APPOINTMENT'`,
  `serviceReferenceId` holds **ten distinct value shapes** and only one (`APT#`)
  resolves. Others are `PAY#`, `APPT_#`, `ONLINE_APPT_#`, `REF-#`, and **cart**
  references (`CART-…`, `DIAG-CART-…`) filed under an appointment service type.
  One field, one service type, ten schemas — any join is right for a subset and
  silently wrong for the rest.
- **It is NOT 31 orphans.** 31 rows fail the join; rule 4 applied; **25 of 31 have an
  appointment for the same user within 24h.** 6 do not and warrant inspection —
  deliberately **not** added to §5's total, since a wider window could account for them.
- **§5's ten orphans stand** as a floor established through one usable join.
- **Stop condition did NOT fire:** the second-collection check found the opposite of
  a schema-wide missing link — the other collections join fine.
- **§7 added: the production query as a runnable spec** — required positive control,
  the join that works (not `booking.paymentId`, which over-reports threefold), an
  explicit warning that APPOINTMENT under-reports for the §6 reason, and the local
  baseline including the burst shape (one user, two consecutive days) as a
  diagnostic signal.
- **Retirement date recorded as a stated assumption in the handoff**, with its
  consequence attached, rather than asked a sixth time.

## Fix session 9 — 2026-08-07 — STOPPED AT STEP 1

- **Step 1 found orphaned payments. Stop condition fired; Steps 2 and 3 not started.**
  **10 completed payments with no booking, ₹5,800** — VACCINATION 2/2, VISION 3/7,
  DENTAL 5/23. Filed at `05-inherited-api-findings.md` §5. Read-only query; DB unmutated.
  - Positive control passed before any non-match was trusted.
  - **The first query over-reported (32) and was discarded** — `lab_orders`,
    `diagnostic_orders`, `ahc_orders` have no `paymentId` field, so the join was
    impossible, not the payments orphaned. It confirmed the hypothesis, which under
    rule 4 is grounds to distrust it; the independent re-run gave 10.
  - **`APPOINTMENT` (59 completed payments) could not be checked at all** — the
    `appointments` collection has no payment link in either direction. The most-used
    paid journey is the one whose orphans are invisible.
  - **Caveat that must travel with this number:** local seeded DB, so these may be QA
    debris. It proves the failure mode occurs, not that production lost money. The
    production query is one command for whoever has access.

## Fix session 8 — 2026-08-07

- **Step 1 done — both rulings filed.**
  - **Entry 5 generalises; payment-first is a defect, do-not-port.** Checked whether
    the second call site was a fallback: **it is not**, and it is **far wider than
    vaccination** — the RN payment-gateway screen creates bookings payment-first for
    **eight service types** (`payments/[paymentId].tsx:428-636`: DENTAL, VISION,
    IN_CLINIC_APPOINTMENT, LAB, DIAGNOSTIC, AHC, ONLINE_CONSULTATION, VACCINATION).
    RN's paid-booking architecture contradicts entry 5 portal-wide. The do-not-port
    ruling applies to all eight.
  - **Nominatim filed as an inherited/compliance finding**, `05-inherited-api-findings.md` §4
    — not the parity register, since it is live RN production behaviour and its
    audience owns compliance. Includes the question of whether the API's three unused
    `location/*` endpoints were built as its replacement.
  - **Vaccination recorded as its own change** — `openspec/changes/member-vaccination/proposal.md`.
- **Step 2 — vertical two done.** `specs/member-diagnostics/spec.md`: 6 routes,
  4 requirements, 14 scenarios, forced-state. Register entries 4 and 7 applied as
  carve-outs. Mirror-of-lab **verified, not assumed** — the reference's validation
  gates are byte-identical between the two upload screens. `openspec validate
  --strict` → **valid**.
  - **Marginal cost: materially lower than lab**, as predicted. One comparison read
    plus the write; no gating work. The gating-amortises conclusion holds.
- **Step 2 — vertical three NOT DONE.** Context exhausted after the Step 3 correction.
- **Step 3 — correction, and it retracts a claim of mine.** I wrote in session 7 that
  vaccination's vendor-before-patient ordering was unique. **It is not.** Every
  booking flow is provider-then-patient-then-slot: appointments
  (`specialties -> doctors -> select-patient`), vision and dental
  (`clinics -> select-patient`). One consistent shape, no exception, **no third
  variant**. `12-vaccination-sizing.md` finding 3 retracted in place.

## Fix session 7 — 2026-08-07

- **Step 1 done.** Entry 10 annotated with its **dependency**: the widening holds
  only while the date signals default (`appointment-slot-page.ts:147`,
  `clinic-booking/select-slot-page.ts:107`). If either starts empty, the two-value
  gate becomes real and entry 10 stops covering the three `select-slot` routes.
  Falsifiable rather than permanent.
- **Step 2 done — verification debt is now structural.** `tasks.md` gains
  **section 8** (paired transcribe/verify tasks; 8.1 lab transcribed, 8.2 lab
  verification **open**) and **section 9 completion criteria**: *the change cannot
  close while any transcribed spec has unverified scenarios*, plus a bar that no
  scenario may be marked passing on ambient-data evidence. 7.3 marked done.
- **Step 3 done — `12-vaccination-sizing.md`.** 5 screens / 2,738 lines, 8
  endpoints, **3 of them living outside the vaccination folder** (cancel, invoice,
  history are in `bookings.tsx`). Sizing the 5 screens alone under-scopes it.
- **Step 4 NOT STARTED — stop condition fired.** The sizing turned up RN behaviour
  with no Angular equivalent, which gates further transcription:
  1. **`select-vendor.tsx:195-200` calls `nominatim.openstreetmap.org` directly**
     as a geocode fallback. No Angular equivalent; the API serves its own
     `location/*` endpoints, all unconsumed. A third-party dependency, a privacy
     consideration and an availability risk unique to this flow.
  2. **`POST /member/vaccination/bookings` has two call sites**, one of them
     payment-first (`payments/[paymentId].tsx:678`) — which **contradicts parity
     register entry 5** ("Payment completion does not create the booking"). A
     register decision is required before transcription, per the `select-slot`
     precedent: gate it, do not assume the existing reasoning carries.
- **Vaccination is not vertical ten.** No reference to transcribe from — this
  document *is* the reference now. Treat as its own change.

## Fix session 6 — 2026-08-07

- **Step 1 done. Entry 10 widened 3 routes -> 6** and the reasoning recorded. The
  three `select-slot` screens carry the identical divergence. It is a **collapsed
  step, not a dropped guard**: both Angular slot screens carry `slotId` **and**
  `appointmentDate` on the tap (`appointment-slot-page.ts:78-79`,
  `clinic-booking/select-slot-page.ts:63-64`), and the un-dated state is
  unreachable — the date signal defaults to the first available day and the slot
  list is `computed()` from it, so with no date there is nothing to tap. React's
  `!selectedDate` clause guards a state Angular cannot enter.
- **Step 3 done — first vertical transcribed.** `openspec/changes/angular-member-portal/specs/member-lab/spec.md`
  covers the **6 lab routes**: 4 requirements, 14 scenarios, every scenario written
  against **forced** state. Register entries 4 and 7 applied as carve-outs, not gaps.
  - **`openspec validate angular-member-portal --type change --strict` → "Change
    'angular-member-portal' is valid".** Open task **7.3 passes**, with the new spec
    included. Nothing in the existing four specs was touched.
  - **Real cost:** two targeted reference reads plus the write. The transcription
    itself was the cheap part; the expensive part was the *gating* work — settling
    `select-slot` and widening entry 10 — which is per-register, not per-vertical,
    and is now done once for all remaining verticals.
  - **Caveat:** these are transcribed specs, **not verified scenarios**. They record
    what the reference does. Verifying Angular against them is separate work, and the
    forced-state discipline is written in so that verification cannot repeat the
    ambient-data mistake.
  - **Projection for the remaining ~52 routes:** roughly 9 verticals of similar size.
    On this vertical's evidence the sizing note holds — this is transcription, not
    per-screen review.
- **Step 2 (5.8 unblock):** *a dependent test credential is a seeding question for
  whoever owns test data, not a portal question.* "Dependent signs in directly"
  needs Sayani's password; obtaining one means mutating the row that is the
  intersection rule's only live evidence. Scheduled, not permanently open.

## Fix session 5 — 2026-08-07

- **Step 1 done — hand-read delivered** (`09-step-count-diff.md`), after three
  automated failures. **One divergence pattern, six instances**, all
  select-then-Continue → tap-to-commit. 10 of 16 screens identical. No flow where
  Angular has *more* steps; no flow where the same count commits differently.
  - **Rule 4 fired and was right.** A first pass on proxy counts reported **seven**
    divergences including `appointments/doctors` — which on hand-read has no
    Continue button at all (`router.push` at `doctors/page.tsx:267` fires from the
    card tap). Two of seven were artifacts.
  - **New finding: parity register entry 10 is scoped too narrowly.** It covers the
    three patient pickers; the same divergence exists on the three `select-slot`
    screens and was never recorded. Widen before any batch transcription, or it
    will be "fixed" back to the reference.
- **Step 2 — 3 of 4 scenarios observed; 5.8 STAYS OPEN.** Unrecognised
  relationship, family load fails, and selection-does-not-survive-sign-out all pass
  with a passing negative control. **"Dependent signs in directly" was not run** —
  it needs a dependent credential, which isn't known, and obtaining one means
  mutating the DB. Not observable within constraints.
  - The negative control failed on the first run (menu clicked before family
    loaded). One obvious fix — settle before clicking — then all four passed.
- **Step 3 done** (`11-debt-sizing.md`): evidence supports **spec transcription,
  batchable by vertical**, and it is **perishable** — cheap only while
  `web-member/` is readable. Two carve-outs: widen entry 10 first, and retro-specs
  for presentation routes must **force state**, since ambient-data assertions are
  where the one real assertion defect lived and most of the 58 are presentation routes.

## Fix session 4 — 2026-08-07

- **Step 1 done. No task reopens.** `10-assertion-provenance.md` classifies every
  passing assertion across 3.9, 4.8, 6.11. **One wrong assertion total** — the
  exhausted-category one, already corrected in session 3.
  - The predictive axis turned out **not** to be "string vs observed" but
    **forced vs ambient state**. 3.9 and 4.8 are almost entirely forced (URLs,
    injected 500s, cleared cookies, resized viewports); 6.11 is presentation-of-data,
    which invites inferring state from a rendered string. That is the shape to watch
    in the 58 unspecified routes: **presentation scenarios on ambient data.**
  - Re-verified the two highest-risk **absence-based** assertions by printing:
    4.8 "Single member" (menu genuinely opens, "Switch profile" genuinely absent)
    and 3.9 "Signing back in" (second session renders a real loaded screen). Both sound.
- **Step 2 FAILED ITS CONTROLS — third method failure, stopped as instructed.**
  Behavioural instrument returned **React 1 / Angular 2** on the picker — exactly
  inverted from the known truth — and flagged the negative control too. Root cause:
  the *observation* side was framework-agnostic but the *action* side was not; it
  clicked page chrome, not flow options. **Second instrument in two sessions to fail
  toward its hypothesis.** Recommendation now: read the ~12 flows by hand — automation
  is 0-for-3, reading is 1-for-1.
- Filed: producibility question for the 6.11 fixture shapes → `05-inherited-api-findings.md` §3.
- DB not mutated; Sayani's 19-day overhang intact.

## Fix session 3 — 2026-08-07

- **Step 1 done.** Tap-to-commit ported to `../../../tools/parity-divergences.md` as
  **entry 10**, in that file's format. The register held **9** prior entries, not
  3 — the briefs' "sanctioned divergences" list is the *no-new-flows exemption
  list*, a narrower thing. `audit/09-divergence-4-tap-to-commit.md` is now a
  provenance copy; **the register is canonical.**
- **Step 2 done. 6.11 CLOSES** — 8/8 including both controls
  (`03-live/wallet-scenarios.mjs`). All five previously-unseeded scenarios pass:
  zero balance, unlimited category, unrecognised category, floater wallet, empty
  transaction list, reversed transaction.
- **Step 3 NOT DELIVERED** — `09-step-count-diff.md` records a method failure
  rather than a table. Both mechanical attempts failed their controls; the second
  would have reported "Angular has fewer steps" for every flow.

### Correction — session 1's "Exhausted category" verification was invalid

The wallet card reads `<available> of <total>`. Session 1 passed that scenario on
the string `₹3,000 of ₹3,000`, which means a category that is fully **available**,
not exhausted. A genuinely exhausted category renders `₹0 Fully used`.

The scenario is **now properly verified**. Found only because the positive control
in Step 2 failed twice and I printed the actual render instead of adjusting the
assertion a third time.

### Caveat on the 6.11 closure — read before citing it

Five scenarios were verified by **serving fixtures via Playwright route
interception**, with shapes built from the real DTO field names in
`core/wallet/wallet.dto.ts`. That observes **how the portal renders a given API
response** — which is exactly what each of those scenarios specifies — but it does
**not** establish that the API can produce those shapes. The seeded DB was not
mutated, so Sayani Kumari's 19-day assignment overhang is untouched and remains
live evidence for the intersection rule.

## Fix session 2 — 2026-08-07

Full record: `08-fix-session-2.md`.

- **Step 1 done (audit), fix NOT applied.** All 17 stores collapse never-fetched
  into empty (`08-empty-vs-unfetched.md`). Control passed; a looser second pattern
  was caught and rejected mid-check. **Scope is narrower than expected and this was
  verified:** no false empty state during authenticated use — stores fetch on
  sign-in, not on screen render. Only reset (signed-out) stores can lie.
  Recommended fix is **one shell guard, not 17 `loaded` signals**; not applied
  because the reference has no answer for what to render there.
- **Step 2 NOT DONE** — no steps-per-flow diff produced.
- **Step 3 done.** Tap-to-commit sanctioned as divergence 4
  (`09-divergence-4-tap-to-commit.md`, **must be ported to
  `../../../tools/parity-divergences.md`** — outside this session's writable set). Both
  pickers now mark the active member; verified live, no step added.
- **Step 4 NOT DONE** — wallet seed data, second session running.
- **Step 5 done.** Termination window bounded at **30s** (`POLL_MS`). **3.9 checked
  before closing: no scenario covers the window — it closes on its scenarios, and
  the gap is a spec gap for 7.4.**
- 5.8 still open, but on coverage (4 unobserved scenarios), not on defect.

## Fix session 1 — 2026-08-07 (first session authorised to edit source)

Full record: `08-fix-session-1.md`.

- **Census done** (`07-familystore-census.md`): 23 `FamilyStore` injectors, defect
  queue is **2, not ~30**. Both positive controls passed before results were read.
- **`terminate()` implemented** to `design.md:139` — one place, `Router` not
  `window.location.href`, store resets preserved. Verified live. **3.9 closes.**
- **New finding while settling the spike's open question:** after session
  rejection, clicking a nav control **navigates successfully and issues no request
  at all** — `authGuard` is on the parent route so it never re-runs between
  children, and the stores gate on `isAuthenticated()` so they never fetch. Every
  screen served its ordinary empty state ("No claims yet") as fact to a signed-out
  member. Fixed by the same change.
- **Step 3 stopped, premise corrected.** The patient-preselect BLOCKER was
  **mis-graded by me** — Angular cannot complete with the wrong patient because it
  has no default at all. Correct severity **GAP**. Implementing preselect means
  restoring a select→Continue step, a visible flow change, and needs a decision.
- **Step 4 (wallet seed data) not started.**
- `api/.env` restored to `JWT_EXPIRY=7d`, verified identical to backup.

**6.4 is stale as written** — the code already sources the period from
`member/profile`. The real question (assignment vs policy period, one seeded row
overhanging by 19 days) is answered with a recommendation in
`06-wallet-policy-period.md`: **intersection**. Recommended, not applied.

6.11 needs seeded rows for: an unknown category code, an unlimited category, a
floater/shared wallet, an empty transaction list, and a reversal. Data task, not
a code task.

## Session log — 2026-08-07 unblock session

- **Step 0 done.** Playwright installed as a `web-angular` devDependency (the npm
  proxy that blocked installs 17 days ago no longer does); chromium downloaded.
  `JWT_EXPIRY` set to `60s` for the spike and **restored to `7d`** — verified byte-identical
  against a backup, backup deleted, API restarted on the restored value.
  *(Correction: `api/.env` line 10 always defined `JWT_EXPIRY=7d`. My earlier claim
  that it was absent came from grepping `JWT_EXPIRES`.)*
- **Step 1 done.** BLOCKER **confirmed by observation**. `03-live/spike.mjs`.
- **Step 2 done.** `04-design-symbol-diff.md` — 60 symbols, 1 real defect
  (`terminate`). The extractor missed it on the first run (dotted spans); fixed and
  re-run. 13 of 17 stores are unspecified.
- **Step 3 done.** Patient preselect re-filed DRIFT → **BLOCKER**. Notifications
  GAP re-filed with provenance. `05-inherited-api-findings.md` written for the
  `api/` owner.
- **Step 4 done.** `06-wallet-policy-period.md`.
- **Step 5 done.** 4.8 closes; 3.9 and 5.8 fail on named scenarios; 6.11 incomplete.
  Count backfills **verified present** in both `design.md` and the session handoff,
  with no stale `~65` / `~20` / `55` figures remaining.

## Phase 0 counts

| Inventory | Count | Brief expected | Agrees? |
|---|---|---|---|
| React pages | 63 | 63 | yes |
| RN screens | 57 (+2 navigators) | ~20 | **no — 2.8×** |
| Angular routes | 60 `/member` children | 55 | **no — 16 come from 2 `flatMap` loops** |
| API endpoints | 512 unique / 168 member-reachable | unknown | recorded |

## Screens

Order is the one the brief prescribes: specified surface first, drifted surface after.

### 1 — Session
- [x] `login` — **done** (DRIFT: 3 findings, 2 notes)
- [x] `session-lifecycle` (restore, expiry, logout; no route of its own) — **done** (**1 BLOCKER**: 401 mid-session never navigates to login)

### 2 — Shell
- [x] `shell-nav` — **done** (**1 GAP**: active-appointment nudge not ported; destination parity clean)
- [x] `notifications` — **done** (**1 GAP**: page unreachable from the UI; 1 UNSCOPED, 2 DRIFT, 1 DEBT)

### 3 — Family context
- [x] `family` — **done** (**1 GAP** `/member/family/add` missing; **1 high-consequence DRIFT**: active member does not preselect the patient in booking flows)
- [x] `family-add` — **covered inside `family.md`** (MISSING; no Angular file to audit separately)

### 4 — Wallet
- [x] `wallet` — **done** (**task 6.4 is stale — already implemented**; 1 new orphan; 1 spec scenario verified live)
- [x] `transactions` — **covered inside `wallet.md`** (the ledger lives on `/member/wallet`; divergence #2)
- [ ] `orders` — **deferred, out of scope** — UNSPECIFIED route, part of the DEBT campaign
- [ ] `order-detail` — **deferred, out of scope** — UNSPECIFIED
- [ ] `payment-detail` — **deferred, out of scope** — UNSPECIFIED

### 5 — Everything else (all DEBT: no approved spec)
- [ ] `home` — todo
- [ ] `claims` — todo
- [ ] `claims-new` — todo
- [ ] `claims-detail` — todo
- [ ] `bookings` — todo
- [ ] `bookings-new` — todo *(Angular MISSING)*
- [ ] `lab-tests` — todo
- [ ] `lab-tests-upload` — todo
- [ ] `lab-tests-cart` — todo
- [ ] `lab-tests-vendor` — todo
- [ ] `lab-tests-booking-cartid` — todo *(Angular MISSING)*
- [ ] `lab-tests-orders` — todo
- [ ] `lab-tests-order-detail` — todo
- [ ] `diagnostics` — todo
- [ ] `diagnostics-upload` — todo
- [ ] `diagnostics-cart` — todo
- [ ] `diagnostics-vendor` — todo
- [ ] `diagnostics-booking-cartid` — todo *(Angular MISSING)*
- [ ] `diagnostics-orders` — todo
- [ ] `diagnostics-order-detail` — todo
- [ ] `appointments-hub` — todo
- [ ] `appointments-specialties` — todo
- [ ] `appointments-doctors` — todo
- [ ] `appointments-select-patient` — todo
- [ ] `appointments-select-slot` — todo
- [ ] `appointments-confirm` — todo
- [ ] `online-consult-hub` — todo
- [ ] `online-consult-specialties` — todo
- [ ] `online-consult-doctors` — todo
- [ ] `online-consult-confirm` — todo
- [ ] `consultations-video` — todo *(React `/member/consultations/:id`; Angular MISSING; BLOCKER candidate)*
- [ ] `vision` — todo
- [ ] `vision-clinics` — todo
- [ ] `vision-select-patient` — todo
- [ ] `vision-select-slot` — todo
- [ ] `vision-confirm` — todo
- [ ] `vision-payment` — todo
- [ ] `dental` — todo
- [ ] `dental-clinics` — todo
- [ ] `dental-select-patient` — todo
- [ ] `dental-select-slot` — todo
- [ ] `dental-confirm` — todo
- [ ] `ahc-booking` — todo
- [ ] `ahc-booking-diagnostic` — todo
- [ ] `ahc-booking-payment` — todo
- [ ] `wellness` — todo
- [ ] `benefits` — todo
- [ ] `benefit-detail` — todo
- [ ] `policy-details` — todo
- [ ] `health-records` — todo
- [ ] `profile` — todo
- [ ] `services` — todo
- [ ] `health-checkup` — todo
- [ ] `helpline` — todo
- [ ] `pharmacy` — todo
- [ ] `settings` — todo
- [ ] `root-redirect` — todo *(React `/`)*

### DEBT route list — re-derived 2026-08-07

**58 of 60** `/member` routes have no approved spec. Full list in
`07-debt-routes.md`. Prior figures ("roughly 50", "~60") were estimates.

The subtraction could not be string-derived: the four specs contain **zero** route
paths. They name three screens in prose — wallet, login, member home — so only
`/member` and `/member/wallet` are spec-covered among the 60.

**Correction:** `/member/family` is **not** spec-covered. `member-family-context`
scopes its presentation requirement to "the family-member selector" (the shell
avatar menu), not to the family screen. The mechanism is specified; the screen is
not.

No screen files written for any of the 58 — deliberate.

### 6 — RN-only screens (26)
Grouped: each file covers one RN flow, since none has a React counterpart.
- [ ] `rn-vaccination-flow` (5 RN screens; API complete; Angular placeholder) — todo
- [ ] `rn-in-clinic-consultation-flow` (6 RN screens) — todo
- [ ] `rn-online-consultation-flow` (4 RN screens; **URL parity break** vs Angular `online-consult`) — todo
- [ ] `rn-pathology-lab-flow` (3 RN screens) — todo
- [ ] `rn-radiology-cardiology-flow` (3 RN screens) — todo
- [ ] `rn-carts` — todo
- [ ] `rn-health-packages` — todo
- [ ] `rn-wellness-programs` — todo
- [ ] `rn-ahc` — todo
- [ ] `rn-notifications` — todo *(Angular route added 2026-08-07)*

## Severity taxonomy (amended 2026-08-07)

`BLOCKER` · `GAP` · `DRIFT` · `DEBT` · `NOTE` · **`UNSCOPED`** (new)

> **`UNSCOPED`** — present in `web-member-rn/` with no React counterpart.
> Structurally invisible while building against React as the reference — not
> skipped, not a defect. Blocked on a product decision. Filed separately so it
> does not dilute `GAP`.

All 26 RN-only routes filed in `00-inventories/rn-only-unscoped.md`. **Only 6 are
absent functionality** — the other 19 are RN names for flows Angular ships, and 1
(`notifications`) is now built.

## Step 0/1/2 completed 2026-08-07

- **Step 0 — interceptor sweep: BLOCKER stands.** One registration
  (`app.config.ts:18`), three interceptors, none navigates. Not downgradable to
  DRIFT. Strengthened by `design.md:139`, which specifies the missing navigation.
- **Step 1 — spike PARTIAL.** Trigger verified live (poll endpoint returns 401).
  Member-visible half **not executable**: stateless JWT, 7-day TTL, no revocation
  path, no headless browser installed. See `03-live/session-expiry-spike.md`.
- **Step 2 — done.** `UNSCOPED` added; endpoint-diff headline corrected;
  `design.md` and the session handoff backfilled with verified counts.

## Corrections to the brief, established in Phase 0/1

1. **URL parity break is RN-only, not React.** The brief states Angular `online-consult`
   vs "React/RN `online-consultation`". React uses **`/member/online-consult`** —
   verified at `web-member/app/member/online-consult/page.tsx`. Angular matches React
   exactly. Only RN uses `online-consultation`. Scope of the break is therefore
   RN deep links only, not the web reference. **Re-filed 2026-08-07 as `NOTE`,
   contingent on the packaging decision in open task 7.2** — React and Angular
   agree, and the only exposure is deep links held by the app being retired.
2. **RN is ~57 screens, not ~20.** The RN-only surface is 26 screens, which is the
   larger part of the remaining migration and is not represented in the React count.
3. **Angular is 60 routes, not 55.** Loop expansion, plus `notifications` added
   2026-08-07.
