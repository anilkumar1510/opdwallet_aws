# "Renders but cannot complete" is a class, not an instance

ONLINE was treated as isolated. **AHC is a second confirmed member**, found on the
first vertical read after it. Two of the eight verticals examined have this shape.

## The shape

A journey that is routed, rendered, navigable and visually finished, whose terminal
step **cannot commit**. Nothing marks it unbuilt — unlike `vaccination`, which
routes to `PlaceholderPage` deliberately so an unbuilt screen is distinguishable
from a typo.

No static check in this audit sees it: not the step-count diff, the endpoint diff,
the `FamilyStore` census, or the patient-input trace. All of them passed both
instances.

## Member 1 — online consult

`/member/online-consult/confirm`. Enabled confirm button, zero API calls on click,
no navigation. Cause: `patientId` never supplied on the ONLINE branch. **Partly
fixed** — the patient now resolves and validation runs — but booking still returns
400 because the reference's confirm form (NOW/LATER, contact number, slot picker)
does not exist in Angular.

## Member 2 — AHC (found this session)

`/member/ahc/booking` -> `/booking/diagnostic` -> `/booking/payment`.

**There is no write anywhere in the AHC feature.** `grep -rn "http\.(post|put|patch)"`
over `core/ahc/` returns nothing, and `AHC_API.orders` (`core/ahc/ahc.ts:20`) has no
caller. The journey can never create an order.

Observed live:

| Route | Renders | Buttons beyond shell chrome | Writes |
|---|---|---|---|
| `/member/ahc/booking` | "Select a Lab — **Step 1 of 3**" | date/search controls | none |
| `/member/ahc/booking/diagnostic` | "Select a Diagnostic Centre — **Step 2 of 3**" | date/search controls | none |
| `/member/ahc/booking/payment` | "**Review & Pay** — Step 3 of 3 — confirm your health checkup" | **none** | none |

**A screen titled "Review & Pay", presented as step 3 of 3, with no commit path.**

**CORRECTION (2026-08-08).** The original wording here — "no pay control", reading
as "still loading" — was wrong, and it inverted the comparison. The screen carried
a **literal notice**: *"Confirming an AHC order is not available yet — the reference
portal completes this through its payment screen."*

That makes AHC **better** than ONLINE, not worse. A documented stub tells the member
and the next developer exactly where they stand; ONLINE offered an enabled button
that silently did nothing, which is the failure mode that survives audits. The
distinction this class turns on is *whether the incompleteness is declared*, and AHC
declared it while ONLINE did not.

Both still belong in the class — a journey that cannot complete — but only ONLINE
was disguised.

## What the reference does, for whoever builds it

React's AHC is **payment-first** — it stores a `pendingBooking` in `sessionStorage`
(`ahc/booking/payment/page.tsx:175-198`) and hands off to
`/member/payments/:paymentId`, which creates the AHC order after payment. That is
one of the eight service types on the payment-first path, and **parity register
entry 5 rules it a do-not-port defect.**

So AHC cannot be built by copying the reference's ordering. It needs the booking
created first, then payment — which is what entry 5 requires and what Angular
already does for vision.

## Consequences

1. **Route accounting.** AHC's three routes are "built" in the same sense ONLINE's
   confirm was. Angular is **56 genuinely-completable routes**, not 59, pending a
   sweep of the remaining verticals for a third instance.

   > **SUPERSEDED — the current figure is 57, and it is provisional.** This "56"
   > was accurate when written and stopped being so in session 25, when the ONLINE
   > confirm form was built and that journey became completable. The sequence is
   > **55 → 60 → 59 → 56 → 57**, and every move came from looking closer, not from
   > counting differently: 60 corrected 55 once two `flatMap` loops were expanded,
   > 59 removed the ONLINE confirm that routed but could not commit, 56 removed
   > AHC's three, 57 restored ONLINE once built.
   >
   > Treat any route count in this audit as provisional. Reconciled in
   > `README.md` §"Numbers that moved".
2. **The class needs a sweep, not case-by-case discovery.** Both instances were
   found by accident while doing something else. The cheap detector is now known:
   **a feature whose store never issues a write, for a journey that should create
   something.** That is one grep per vertical.
3. **It strengthens the interleaving rule.** Verification is the only thing that
   catches this, and AHC would have been transcribed as a working booking journey
   this session had the reference read not gone one level deeper.

---

## Sweep result — the class is bounded at two, and the detector has a known blind spot

`18-write-sweep.mjs`, both controls passing (claims writes 3, AHC writes 0):

| Store | Writes | Must create? |
|---|---|---|
| **ahc** | **0** | **YES — cannot complete** |
| transactions | 1 | yes |
| appointments | 2 | yes |
| bookings | 2 | yes |
| claims | 3 | yes |
| clinic-booking | 3 | yes |
| lab | 3 | yes |
| domain, family, http, member, records, services, wallet | 0 | no — read-only by design |

**AHC is the only must-create feature that never writes.** No third instance of this
variety exists.

**The detector's blind spot, stated plainly:** it would **not** have caught ONLINE.
`appointments` issues two writes, so the store looks healthy; ONLINE's failure was a
*route-level* input never being supplied, inside a feature that does write. So:

- **"store never writes"** catches the AHC variety — a whole feature with no commit path.
- **Only driving the flow to a terminal state** catches the ONLINE variety — a
  feature that writes on one branch and silently cannot on another.

Two detectors, two varieties. The sweep is cheap and now clean; the terminal-state
verification is the one that has to keep running per vertical.


---

## Third variety, found 2026-08-08 (session 35): a declared endpoint with no caller, behind a labelled control

The lab hub offers two ways to start the journey:

> **Upload a prescription** → `/member/lab-tests/upload` — works.
> **Use a saved one** → `/member/health-records` — **cannot be completed there.**

`LAB_API[kind].submitExisting` (`core/lab/lab.mapper.ts:20,37`) is declared for
both LAB and DIAGNOSTICS and has **zero callers** — the same shape as
`AHC_API.orders` at the top of this file. The destination has no control that
submits a saved prescription; verified live, its only per-record button is
"Show/Hide medicines" (`records/health-records-page.ts:118`).

**The reference does have it, and elsewhere.** `web-member/app/member/lab-tests/page.tsx`
— inside `handlePrescriptionSelect`, reached from a selector modal **on the hub** —
POSTs `member/lab/prescriptions/submit-existing` (`:122`). Angular kept the
control and replaced the modal with a link to a browsing screen, so the action
was lost in the move.

**Why the existing detectors missed it.** The write sweep counts writes per
feature: `lab` issues 3, so the store looks healthy. Terminal-state verification
would catch it only if a scenario drove *that* control — and `member-lab`'s
"Submitting an existing prescription" scenario had never been verified, because
lab is a catch-up backlog vertical. So this variety needs a third detector:

- **"declared endpoint, no caller"** — cheap, static, and would have found both
  this and `AHC_API.orders`. Worth running across `core/*/`*.ts* API maps.

Member-visible consequence: a labelled control that promises an action and lands
on a screen that cannot perform it. Worse than AHC's honest stub notice, which at
least said the thing was unavailable.

---

## Fourth member, found 2026-08-09 (session 36) by the detector this class asked for

**`/member/bookings` states that an invoice is available and offers no way to get
it.** Found by `22-dead-endpoint-scan.mjs` on its first real run — not by
accident, which is the first time a member of this class has been found on
purpose.

`bookings-page.ts:143-145`, inside the booking-row template:

```html
@if (booking.hasInvoice) {
  <p class="text-xs text-success-700">Invoice available</p>
}
```

A `<p>`. Not a button, not a link. `hasInvoice` is real and correctly mapped —
`booking.mapper.ts:250` sets it from `dto.invoiceGenerated === true`, so the
statement is **true**: the invoice exists on the server. And
`CLINIC_BOOKING_API[area].invoice` (`clinic-booking.ts:34,44`) is declared for
both vision and dental with **zero callers**. The member is told a document
exists and is given nothing that fetches it.

**The reference downloads it.** `web-member/app/member/bookings/page.tsx:761-793`
— `handleViewInvoice` picks the prefix off the booking id, fetches the endpoint,
and saves the blob as `invoice-<bookingId>.pdf`, with a `catch` that tells the
member it failed. There is an `InvoiceModal` component beside it
(`components/dental/InvoiceModal.tsx:55`) doing the same for dental. Angular
ported the **gate** (`invoiceGenerated`) and the **notice**, and dropped the
action — the same move that lost `submitExisting`, where the control was kept and
the modal behind it was replaced with a link.

**How it ranks in the class.** This is the disguised variety, like ONLINE and
unlike AHC's declared stub — but it is milder than both, because nothing here is
*clickable*. A member is misinformed rather than led into a dead end. Set against
that, it is the only member of the class that ships a **true** statement: the
invoice really is available, just not from this app.

**It also touches the `21-degraded-not-declared.md` class from the other side.**
That file is about a screen that will not admit a failure; this is a screen that
announces a capability it does not have. Both are the app stating something about
the member's situation that its own behaviour does not support.

**Not fixed.** It is one `(click)` handler plus a blob download — the endpoint,
the gate and the mapper are all already there — but the two vision/dental
verticals are closed and the stop condition for this session fired on the
detector's results. Filed for the fix session that reopens them.

**Route accounting is unaffected**: `/member/bookings` completes its own journeys
(it cancels, and cancellation works). The invoice is a missing action on a
working screen, not a journey that cannot terminate. The prior figure of **57
completable routes** stands.

---

## Status update, session 39: `submitExisting` is built

The third-variety member described above — a labelled control landing on a screen
that cannot perform the action — **is fixed**. `features/lab/prescription-selector.ts`
puts the chooser on the hub, matching the reference, and both hubs use it.
Verified live on both kinds: the control exists, and it opens a chooser **in
place** rather than navigating to `/member/health-records`.

The submit itself is **built but unobserved** — `shivam@` holds no health records
and only a doctor can create one. Full account in `28-submission-group.md`. This
is the same "built, not yet observed" state AHC's commit path sat in during
sessions 27-29, and it is recorded that way rather than as verified.

**Class tally after this session:**

| Member | State |
|---|---|
| ONLINE confirm | fixed, session 25 |
| AHC commit path | built session 27, observed session 29 |
| `LAB_API.submitExisting` | **built session 39, unobserved** |
| `CLINIC_BOOKING_API.invoice` | **filed, not fixed** — closed verticals |

Three of four closed or built. The detector that found the last two paid for
itself twice.
