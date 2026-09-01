# Steps-per-flow diff — hand-read

**Delivered.** Three automated attempts failed their controls (documented at the
end). This is a hand-read of the components, with `file:line` citations on both
sides.

**Result: one divergence pattern, six instances. Not several unrelated ones.**

## Sanity check

The patient picker must come out React 2 / Angular 1. **It does** —
`web-member/app/member/appointments/select-patient/page.tsx:238-239`
(`onClick={handleContinue}` / `disabled={!selectedPatient}`) against
`features/appointments/appointment-patient-page.ts:39-47` (`routerLink` on each
card). The reading method identifies step boundaries correctly.

## Rule 4 fired, and it was right

My first pass used proxy counts — occurrences of `useState(null)`, `setSelected`,
`handleContinue|handleConfirm|handleBook` — and reported **seven** divergent
screens including `appointments/doctors`. That confirmed the hypothesis "step
divergences are pervasive", which rule 4 says to distrust.

Re-read by hand, `appointments/doctors` has **no** Continue button and **no**
selection gate: `router.push` at `page.tsx:267` fires straight from the card tap.
The proxy had matched a handler named like a commit handler that is in fact the
tap handler. Same for `online-consult/doctors` — `onClick={() => handleSelectDoctor(doctor)}`
at `:259` pushing at `:123`.

**Two of the seven were artifacts.** The corrected count is six, and they are all
one pattern.

## The table

Commit mechanism per screen. "tap" = the option itself navigates; "select+Continue"
= tapping sets state, a separate gated button commits.

| Flow / screen | React | Angular | Same? |
|---|---|---|---|
| `appointments/specialties` | tap — `specialties/page.tsx` `router.push` ×1, no gate | tap — `specialties-page.ts` `routerLink` | ✅ |
| `appointments/doctors` | tap — `doctors/page.tsx:267` | tap — `doctors-page.ts` `routerLink` | ✅ |
| **`appointments/select-patient`** | **select+Continue** — `:238-239` | **tap** — `appointment-patient-page.ts:39-47` | ❌ |
| **`appointments/select-slot`** | **select+Continue** — `:284-285` (`!selectedDate \|\| !selectedSlot`) | **tap** — `appointment-slot-page.ts:71-78` | ❌ |
| `appointments/confirm` | single commit button | single commit button — `appointment-confirm-page.ts:132` | ✅ |
| `online-consult/specialties` | tap | tap | ✅ |
| `online-consult/doctors` | tap — `:259` → `:123` | tap | ✅ |
| `online-consult/confirm` | single commit button | single commit button | ✅ |
| `vision/clinics` | tap | tap — `clinics-page.ts` | ✅ |
| **`vision/select-patient`** | **select+Continue** — `:207-208` | **tap** — `select-patient-page.ts:41-47` | ❌ |
| **`vision/select-slot`** | **select+Continue** — `:309-310` | **tap** — `select-slot-page.ts:58-63` | ❌ |
| `vision/confirm` | single commit button | single commit button — `confirm-booking-page.ts` | ✅ |
| `dental/clinics` | tap | tap | ✅ |
| **`dental/select-patient`** | **select+Continue** — `:192-193` | **tap** — shared `select-patient-page.ts` | ❌ |
| **`dental/select-slot`** | **select+Continue** — `:315-316` | **tap** — shared `select-slot-page.ts` | ❌ |
| `dental/confirm` | single commit button | single commit button | ✅ |

**10 screens identical, 6 divergent.** Every divergence is the same one:
select-then-Continue collapsed to tap-to-commit. There is no second pattern, no
flow where Angular has *more* steps, and no flow where the same count commits
differently.

## The finding: parity register entry 10 is scoped too narrowly

Entry 10 sanctions tap-to-commit for the **patient pickers** — three routes. The
hand-read shows the identical divergence on the **three `select-slot` screens**,
which the entry does not mention and which no prior session recorded.

| Covered by entry 10 | Not covered, same divergence |
|---|---|
| `appointments/select-patient` | `appointments/select-slot` |
| `vision/select-patient` | `vision/select-slot` |
| `dental/select-patient` | `dental/select-slot` |

**Not fixed, per Report-only.** But the register should be widened rather than a
fourth entry opened, because it is one decision, not two. Worth noting the safety
argument in entry 10 transfers cleanly: with no default selection there is nothing
to commit unread, and a slot tapped is a slot chosen.

One asymmetry does *not* transfer and should be checked before widening:
`appointments/select-slot`'s React gate is `!selectedDate || !selectedSlot` — it
guards **two** values. Whether Angular's tap-to-commit carries a date as well as a
slot is a question the step-count table cannot answer, and it is the one place
where collapsing the step could drop information rather than just a tap.

## Why the automated attempts failed — kept for the record

| # | Method | Failure |
|---|---|---|
| 1 | regex anchored after `>` | grep is line-based; JSX puts labels on the next line. Reported 0 React commit buttons everywhere. |
| 2 | label-at-line-start regex | Passed on React, blind to Angular's interpolated labels. Asymmetric. |
| 3 | Playwright click-and-watch-URL | Observation agnostic, **action not** — clicked page chrome. Returned React 1 / Angular 2 on the picker, exactly inverted. |
| 4 | **hand-read** | **worked** — and its own first pass, using proxy counts, produced two false positives that rule 4 caught. |

Even the hand-read needed the discipline: the difference between 7 and 6 was a
proxy count that looked like a finding.

---

# Revision 2026-08-10 (session 53) — one row was wrong, and the coverage was narrower than it read

## CORRECTION — `online-consult/confirm` is NOT ✅. It is a seventh divergence.

The table records *"single commit button | single commit button | ✅"*. **React needs
two clicks there, not one.**

| | Clicks to commit | Where |
|---|---|---|
| React | **2** | *Proceed to Payment* → `setShowPaymentStep(true)` (`online-consult/confirm/page.tsx:425`), then *Pay ₹X & Confirm* — `PaymentProcessor`'s own button, `handlePayment` |
| Angular | **1** | *Confirm appointment* |

**And this is a different pattern from the other six.** Those are
select-then-Continue collapsed to tap-to-commit — a *selection* gate. This is an
extra **confirmation** gate: a second screen that re-presents the cost and asks
again. The file's closing claim — *"There is no second pattern"* — no longer holds.
There are two.

**In-clinic is genuinely ✅ and stays.** `appointments/confirm/page.tsx:308-331`
renders `PaymentProcessor` inline, so its commit is one click, matching Angular.
**The reference is inconsistent between its own two consult modes**; the original
read checked one and recorded the result for both.

**Why the error survived:** both confirm pages import and render the same
`PaymentProcessor`. That was taken as showing they behave the same. It shows only
that the component is shared — *where* a page renders it is a property of the page.
Same root cause as the register entry 16 correction; see
`34-copay-reference-trace.md`.

**Button labels differ too**, which the original table did not record:

| | Nothing owed | Something owed |
|---|---|---|
| React | *Confirm Booking (Fully Covered)* | *Pay ₹500 & Confirm* |
| Angular | *Confirm appointment* | *Confirm appointment* |

React's label states the consequence and the amount; Angular's is constant. Not
filed as a defect — Angular's breakdown names the figure directly above the button —
but it is a real UI difference and was previously unrecorded.

## Journeys the original diff never covered — now read

The file reads as a complete step-count comparison. It covered **four booking
journeys, 16 screens**. These were outside it:

| Flow / screen | React | Angular | Same? |
|---|---|---|---|
| `lab-tests/cart/:id` → vendor | tap — `onClick={() => handleSelectVendor(vendor)}` (`cart/[id]/page.tsx:271`) | tap — `routerLink` (`cart-page.ts:128`) | ✅ |
| `lab-tests/cart/:id/vendor/:vendorId` | **slot + gated commit** — `disabled={submitting \|\| !selectedSlot}` (`:467`) | **slot + gated commit** — `Confirm booking`, gated by `canPlace()` | ✅ |
| `diagnostics/cart/:id` and its vendor page | same components as lab | same shared components | ✅ |
| **`claims/new`** | **3-step wizard** — `currentStep` 1→3, `validateStep` gating each advance, swipe navigation (`:275-308`), then Submit | **one responsive page**, single *Submit claim* | ❌ — **already sanctioned, entry 12** |

**The lab vendor page is worth noting**: it is the one multi-step screen where
Angular **kept** select-then-Continue. That is not an inconsistency with entry 10 —
there the slot *is* the commit, so tapping it commits; here the slot is one input to
an order that also carries a collection type and address, so a separate commit is
correct. Entry 10 is about pickers whose selection is the whole decision.

## Coverage, stated plainly

**Compared: 21 screens across 6 journeys.** Booking (appointments, online-consult,
vision, dental), lab/diagnostics ordering, and claims.

**NOT compared, and not to be read as matching:**

- **AHC** — 3 routes, never step-counted on either side.
- **Every single-screen route** — wallet, transactions, orders, payments, profile,
  settings, services, benefits, policy details, health records, family,
  notifications, home, the misc screens. These have no step sequence to count. A UI
  comparison of them is a different exercise and has not been done.
- **Vaccination** — RN-only, no React reference, now ruled in as its own change.

That is roughly **21 of ~60 routes**. The endpoint half of the question is
`01-endpoint-diff.md` and `tools/parity-endpoints.mjs`, which do cover the full
surface.
