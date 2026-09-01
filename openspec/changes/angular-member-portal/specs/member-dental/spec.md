# member-dental

Retro-spec transcribed from `web-member/` on 2026-08-07. Covers the five
`/member/dental/*` routes, which shipped before any spec existed.

Transcribed, not designed. Scenarios are written to be verified against **forced**
state — a served fixture, an injected failure — never against whatever the seeded
account happens to show, per `audit/10-assertion-provenance.md`.

## Resemblance to vision — verified, not inherited

Dental and vision share Angular's `clinic-booking` components and the same
clinics → patient → slot → confirm sequence. The lab/diagnostics pair looked
identical too and had three genuine differences, so this was checked rather than
assumed. **Dental is not "vision minus the payment screen".** Three verified
differences:

| | Vision | Dental |
|---|---|---|
| Benefit category | `member/benefits/CAT007/services` | **`member/benefits/CAT006/services`** |
| Routes | 6 — includes `payment/:bookingId` | **5 — no payment route at all** |
| Clinic detail lookup | also calls `clinics/:id` on confirm | **only `dental-bookings/clinics`** |

**Corrected 2026-08-08, session 33.** The route-count row is right; the reading
below it was wrong, and verification is what found it.

Session 12 recorded "dental's confirm calls `dental-bookings/validate` then
`POST dental-bookings` and the journey ends there. There is no copay-to-gateway
continuation." That read `confirm/page.tsx:141` as the journey's create step. It
is not — it sits inside `handlePaymentSuccess`, the **payment callback**.

What the reference actually does: the confirm screen renders an inline
`PaymentProcessor` (`confirm/page.tsx:281`), and the branch taken depends on the
copay.

| Reference path | What happens |
|---|---|
| No copay (`WALLET_ONLY`) | `onPaymentSuccess` fires immediately → `POST dental-bookings` with `paymentAlreadyProcessed: true`, in-page "Booking Confirmed!" |
| Copay or out of pocket | pending payment created → booking stashed in `sessionStorage` → redirect to `/member/payments/:paymentId?redirect=/member/bookings?tab=dental`; the booking is created **after** payment (`PaymentProcessor.tsx:227,284`) |

So dental **has a payment step**. It has no `/member/dental/payment` *route* —
the step is the shared gateway — and on the copay path the reference is
payment-first, the same `sessionStorage` `pendingBooking` mechanism session 22
documented for AHC.

## Carve-outs applied — checked against the register

- **Entry 10** — `/member/dental/select-patient` and `/member/dental/select-slot`
  commit on tap rather than select-then-Continue. Both are among the six routes the
  entry covers. Its falsification condition applies: it stops covering the slot
  screen if `clinic-booking/select-slot-page.ts:107` ever stops defaulting the date.
- **Entry 5 (widened)** — payment never precedes booking creation.
  **Corrected 2026-08-08:** this was recorded as *unviolatable* — "there is no
  payment step in the journey" — on the misreading above. Dental's copay path in
  the reference **is** payment-first, so entry 5 applies here exactly as it does
  to appointments: Angular creates the booking at confirm and does not take
  payment first. **Satisfied by a sanctioned divergence, not unviolatable.**
  Verified live: no `payments` or `process-payment` call anywhere in Angular's
  dental journey.
- **The copay continuation — RULED AND CLOSED, session 50.** Angular's dental
  journey used to end at the bookings list, leaving the copay the API creates on
  `POST dental-bookings` PENDING with nothing pointing at it: a committed
  booking, ₹400 gone from the wallet, ₹600 outstanding, and a row reading
  "₹1,000 · ₹400 from wallet".
  - Session 34 changed the journey to continue to `/member/payments/:paymentId`
    and this spec was amended to describe that. **Session 40 reverted both**,
    because adding a destination is a **flow change**, and a flow change is a
    decision, not a defect fix — it had been folded in as the latter.
  - **Session 50 ruled it in and reinstated it.** The bullets below are kept as
    the history of a decision, not as a description of current behaviour.
  - **The defect is real and unresolved.** It is filed in
    `audit/20-copay-continuation.md`, open for dental, consultations and claims.
    The scenarios below describe what the portal does, which is not what it
    should do; they are not an endorsement.

## ADDED Requirements

### Requirement: Dental services and clinic selection
The portal SHALL present the dental services covered by the member's policy, and the clinics able to deliver a chosen service.

#### Scenario: Covered services listed
- **GIVEN** a member whose policy includes dental cover
- **WHEN** the dental screen loads
- **THEN** only the services the policy covers are listed

#### Scenario: No dental cover
- **GIVEN** a member whose policy includes no dental cover
- **WHEN** the dental screen loads
- **THEN** an empty state explains that no dental services are available
- **AND** no clinic journey can be started

#### Scenario: Clinics listed for a service
- **GIVEN** a member who has chosen a dental service
- **WHEN** the clinics screen loads
- **THEN** the clinics offering that service are listed

#### Scenario: No clinic offers the service
- **GIVEN** a service no clinic currently offers
- **WHEN** the clinics screen loads
- **THEN** an empty state is shown, distinguishable from a failed load

#### Scenario: Clinic list fails to load
- **GIVEN** the clinics request fails
- **WHEN** the screen loads
- **THEN** an error state is shown, distinct from the empty state
- **AND** a retry is offered

### Requirement: Dental patient and slot selection
The portal SHALL require a patient and a slot before a dental booking can be confirmed, and SHALL surface which family member the portal is currently acting for.

Rule: The active family member from `member-family-context` is marked in the patient list. It is a marker, not a default — the member commits by choosing a named person.

#### Scenario: Active family member marked
- **GIVEN** a primary member who has switched to a dependent
- **WHEN** the patient screen loads
- **THEN** that dependent is marked as the one currently being viewed
- **AND** every family member remains selectable

#### Scenario: Slots listed for a date
- **GIVEN** a member who has chosen a clinic
- **WHEN** the slot screen loads
- **THEN** slots are listed for the selected date
- **AND** a slot that is unavailable cannot be chosen

#### Scenario: No slots on the chosen date
- **GIVEN** a date on which the clinic offers no slots
- **WHEN** the member selects that date
- **THEN** an empty state invites them to try another date
- **AND** the date remains changeable

### Requirement: Dental booking confirmation
The portal SHALL present the wallet split before a dental booking is committed, and SHALL create the booking only after the member confirms.

Rule: Dental has no payment *route* of its own. `POST dental-bookings` commits the booking, settles the wallet, and — where a copay, an excess or a shortfall remains — creates that as a PENDING payment and returns its reference. **Where a payment reference comes back the member is taken to it; otherwise the journey ends on the bookings list.** Either way the row names any amount still to pay. Ruled in session 50 — parity register entry 17, `audit/20-copay-continuation.md`.

Rule: The booking is created first and no payment precedes it — parity register entry 5. The reference is payment-first on its copay path, creating the booking only after payment clears (`PaymentProcessor.tsx:227,284`), and entry 5 rules that ordering do-not-port. Entry 5 governs *ordering* only; where the journey ends is not settled by it and is the open question in `audit/20-copay-continuation.md`.

Rule: A cover check that answers `valid: false` blocks confirmation. A cover check that never arrived does not — the API re-validates on create, so a failed check costs the member a round trip rather than a dead end (`clinic-booking/confirm-booking-page.ts:226-232`). **The reference is stricter**: `PaymentProcessor` renders no commit control at all when its own validation fails (`PaymentProcessor.tsx:307`). Recorded as a deliberate, narrower divergence, not an omission.

#### Scenario: Wallet split shown before commitment
- **GIVEN** a member with a chosen clinic, patient and slot
- **WHEN** the booking is validated
- **THEN** the amount covered by the wallet and any amount payable by the member are both shown
- **AND** the confirm action is unavailable while the check is in flight

#### Scenario: Booking created on confirmation
- **GIVEN** a validated dental booking
- **WHEN** the member confirms
- **THEN** the booking is created for the chosen patient, clinic and slot
- **AND** the wallet's share is debited
- **AND** the booking appears in their dental bookings under its `DEN-BOOK-…` reference

#### Scenario: The member is taken to settle what they owe
- **GIVEN** a dental booking whose wallet cover does not meet the whole price
- **WHEN** the booking is created
- **THEN** the API creates a PENDING payment for the remainder and returns its reference
- **AND** the member is taken to that payment rather than to the bookings list
- **AND** settling it leaves no unexplained pending payment behind

> **Ruled and implemented, session 50.** Booking-first is unchanged; only the
> destination comes from the reference. Parity register entry 17.
>
> Not yet re-verified live: CAT006's allowance is spent, so the dental create leg
> cannot run until it is refreshed (`audit/31-run-budget.md`). The assertions are
> re-aimed and will execute when it is.

#### Scenario: An outstanding copay is named on the bookings row
- **GIVEN** a dental booking with an unsettled copay
- **WHEN** the member views their dental bookings
- **THEN** that row names the amount still to pay, distinguishing it from a booking that owes nothing

> **Disclosure fixed in session 41**, on the screen the journey already ends on —
> no new destination, so not a flow change. The row previously read
> "₹1,000 · ₹400 from wallet" whether or not the copay had been settled.
>
> **This scenario is about the list, not the journey.** It was previously written
> as GIVEN-a-booking-is-created / THEN-the-member-is-taken-to-their-bookings,
> which after session 50 contradicted the scenario immediately above it — the
> same precondition sending the member to two different places. The disclosure
> holds whenever the row is seen, whatever brought the member there, so the
> precondition is now the viewing and not the creating.

#### Scenario: The invoice for a completed booking can be downloaded
- **GIVEN** a dental booking the API reports as COMPLETED with its invoice generated
- **WHEN** the member views their dental bookings
- **THEN** the row offers a control that downloads that invoice
- **AND** a booking the API would refuse the invoice for offers no such control
- **AND** a failed download is reported to the member rather than passing silently

> **Wired in session 52 — an API integration fix, not a flow change.** No new
> screen and no new destination: a control on a row that already claimed
> "Invoice available" while `CLINIC_BOOKING_API[area].invoice` had no caller in
> the portal at all.
>
> **The gate is COMPLETED *and* `invoiceGenerated`, not the flag alone.** The API
> refuses anything else (`dental-bookings.service.ts:1256`) and the database holds
> a CONFIRMED booking with `invoiceGenerated: true` — VIS-BOOK-1769701879987-3994 —
> so the flag alone would put a permanently-failing button on that row.
>
> **The happy path is unverifiable on this machine and that is a data condition,
> not a defect.** Every stored `invoicePath` is a macOS path from the original
> developer's machine and `api/uploads/invoices/` is empty, so `res.sendFile` has
> nothing to send. The disclosure of that failure is verified;
> the arrival of a PDF is not. See `audit/36-invoice-download.md`.

#### Scenario: Nothing is owed
- **GIVEN** a dental booking the wallet covers in full
- **WHEN** the booking is created
- **THEN** no payment is created
- **AND** the member is taken to their dental bookings

#### Scenario: The booking is identified by its business reference
- **GIVEN** a dental booking that has just been created
- **WHEN** the member sees it in their bookings
- **THEN** it is identified by its `DEN-BOOK-…` reference
- **AND** no Mongo `_id` is displayed anywhere on the screen

#### Scenario: Validation fails
- **GIVEN** a member whose cover does not permit the chosen service
- **WHEN** validation runs
- **THEN** the reason is surfaced
- **AND** no booking is created

#### Scenario: Booking creation fails
- **GIVEN** a validated dental booking
- **WHEN** creation fails
- **THEN** the failure is surfaced
- **AND** the member's selections are preserved so they can retry
