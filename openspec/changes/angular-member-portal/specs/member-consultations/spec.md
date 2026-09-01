# member-consultations

Retro-spec transcribed from `web-member/` on 2026-08-08. Covers all ten
consultation routes across both modes:

| Mode | Routes |
|---|---|
| `IN_CLINIC` | `/member/appointments`, `/specialties`, `/doctors`, `/select-patient`, `/select-slot`, `/confirm` |
| `ONLINE` | `/member/online-consult`, `/specialties`, `/doctors`, `/confirm` |

**One spec with a mode distinction, not two.** Online consult shares no components
with appointments in the reference, but calls the same endpoints, and Angular
already models both as one loop at `app.routes.ts:133` with `mode` in route data.
The single-spec shape matches the code rather than compromising with it. The
difference between the modes is stated as a Rule wherever it applies, not left to
a reader to infer.

**Own reference read.** No inheriting — this is the fourth vertical where
"it looks like the last one" would have been wrong.

## The mode distinction, stated once

`ONLINE` is the `IN_CLINIC` journey **minus the slot step, with the patient step
relocated into confirm**:

- `IN_CLINIC` picks patient and slot on their own screens, then confirms.
- `ONLINE` has neither screen. Confirm collects the patient (defaulting to the
  active family member), a contact number, a call preference, and a NOW/LATER
  choice — with a slot picker only under LATER.

## Register — applied and checked

- **Entry 5 — live here.** Booking is created **first**; payment, where any is due,
  follows. The reference's `appointments/confirm` creates the appointment *after*
  payment and its own catch reads *"Payment successful but failed to book
  appointment"*. Entry 5's general rule applies: a reference behaviour whose own
  error handling anticipates the failure it causes is a defect, not a
  specification. **Angular's booking-first ordering is the sanctioned divergence.**
- **Entry 10 — covers this vertical's `select-patient` and `select-slot`.** They
  commit on tap rather than select-then-Continue. Carries a falsification
  condition: it stops covering `select-slot` if `appointment-slot-page.ts:147`
  stops defaulting the date signal.
- **Entry 9 — specialties are category-scoped**, `CAT001` for in-clinic and
  `CAT005` for online, so a member is offered only specialties their cover can
  book. Conformance, recorded so it is not "corrected" back to the global list.
- The RN `online-consultation` naming break is a standing NOTE contingent on task
  7.2. React matches Angular. Not re-recorded.

## ADDED Requirements

### Requirement: Consultation hub
The portal SHALL list the member's consultations and let them start a new one, separately for each mode.

#### Scenario: Consultations listed
- **GIVEN** a member with consultations
- **WHEN** the hub for a mode loads
- **THEN** their consultations for that mode are listed, upcoming before past
- **AND** starting a new consultation is offered

#### Scenario: No consultations yet
- **GIVEN** a member with none
- **WHEN** the hub loads
- **THEN** an empty state is shown, distinguishable from a failed load
- **AND** starting a new consultation remains offered

#### Scenario: Hub fails to load
- **GIVEN** the consultations request fails
- **WHEN** the hub loads
- **THEN** an error state is shown, distinct from the empty state

### Requirement: Choosing a specialty and a doctor
The portal SHALL offer only specialties the member's cover can book, and the doctors available within a chosen specialty.

Rule: Specialties are scoped to the mode's benefit category — in-clinic and online draw different lists.

#### Scenario: Specialties listed for the mode
- **GIVEN** a member starting a consultation
- **WHEN** the specialties screen loads
- **THEN** only specialties covered for that mode are listed

#### Scenario: No specialties covered
- **GIVEN** a member whose cover includes no specialty for that mode
- **WHEN** the specialties screen loads
- **THEN** an empty state explains that none are available

#### Scenario: Doctors listed for a specialty
- **GIVEN** a chosen specialty
- **WHEN** the doctors screen loads
- **THEN** the doctors offering it are listed with their fee
- **AND** for in-clinic, the clinics each doctor consults at are shown

#### Scenario: No doctors available
- **GIVEN** a specialty with no available doctor
- **WHEN** the doctors screen loads
- **THEN** an empty state is shown, distinct from a failed load

### Requirement: Choosing a patient and a time — in-clinic
The portal SHALL require a patient and a slot before an in-clinic appointment can be confirmed, and SHALL surface which family member the portal is acting for.

Rule: Applies to `IN_CLINIC` only. `ONLINE` collects the patient on the confirm screen and has no slot step.

#### Scenario: Active family member marked
- **GIVEN** a primary member who has switched to a dependent
- **WHEN** the patient screen loads
- **THEN** that dependent is marked as currently being viewed
- **AND** every family member remains selectable

#### Scenario: Slots offered for a real day
- **GIVEN** a chosen doctor and clinic
- **WHEN** the slot screen loads
- **THEN** only days that actually have slots are offered
- **AND** choosing a day lists that day's times

#### Scenario: A slot already taken
- **GIVEN** a slot another member has booked
- **WHEN** the member attempts to confirm it
- **THEN** they are told the slot is no longer available
- **AND** they can choose another without losing their other selections

### Requirement: Confirming an online consultation
The portal SHALL collect how and when to reach the member before an online consultation can be confirmed.

Rule: Applies to `ONLINE` only. A contact number is required. NOW books today with an immediate time; LATER requires a chosen date and slot.

#### Scenario: Contact details collected
- **GIVEN** a member on the online confirm screen
- **WHEN** it loads
- **THEN** a contact number is prefilled from their own record and remains editable
- **AND** a call preference and a NOW/LATER choice are offered

#### Scenario: Contact number is required
- **GIVEN** a member who has cleared the contact number
- **WHEN** they attempt to confirm
- **THEN** they are told a contact number is needed
- **AND** no booking request is sent

#### Scenario: Consult now
- **GIVEN** a member who chooses to consult now
- **WHEN** they confirm
- **THEN** the consultation is booked for today at the immediate time

#### Scenario: Schedule later
- **GIVEN** a member who chooses to schedule later
- **WHEN** they pick a date and time and confirm
- **THEN** the consultation is booked for that date and time

#### Scenario: Schedule later without a time
- **GIVEN** a member who chooses to schedule later but picks no time
- **WHEN** they attempt to confirm
- **THEN** they are told to choose a time
- **AND** no booking request is sent

### Requirement: Confirming and booking
The portal SHALL present what the consultation costs the member before they commit, and SHALL create the booking before any payment is taken.

Rule: Payment never precedes booking creation — parity register entry 5.

Rule: `POST appointments` commits the appointment, settles the wallet, and — where a copay, an excess or a shortfall remains — creates that as a PENDING payment and returns its reference alongside the appointment. **The portal carries that reference but does not act on it: both modes end on the bookings list, and the outstanding amount is not surfaced.** Known open defect, `audit/20-copay-continuation.md`.

> **Session 34 changed the journey to continue to the payment screen and amended
> this requirement to match; session 40 reverted both.** Adding a destination is a
> flow change, and a flow change is a decision rather than a defect fix.
>
> The defect stands and is open: criterion 6 found **twelve** unsettled
> consultation copays on the test account, which is what made it visible at all.
> The clause *"only then is any outstanding amount taken to payment"* has been
> narrowed to an ordering claim — nothing precedes the booking — because the
> portal does not take the member to payment and the spec must not say it does.
> `audit/20-copay-continuation.md`.

#### Scenario: Cost shown before commitment
- **GIVEN** a member on the confirm screen with a patient resolved
- **WHEN** the booking is validated
- **THEN** the consultation fee, the amount paid from their wallet, and the amount they pay are all shown
- **AND** confirming is unavailable until validation has succeeded

#### Scenario: The full breakdown is shown, not only the total
- **GIVEN** a validated consultation whose cost is reduced by a copay
- **WHEN** the confirm screen renders the payment section
- **THEN** the consultation fee, the wallet balance, the copay with its percentage, and the insurance-eligible amount are each shown as their own line
- **AND** where a per-service transaction limit applies, the limit and the resulting out-of-pocket amount are shown, with a note explaining how the total was reached
- **AND** where no limit applies, neither the limit line nor the note appears
- **AND** the breakdown renders even when the wallet covers nothing of the cost

> Line set and order transcribed from the reference's `PaymentProcessor`
> breakdown. **The two modes place it differently in the reference, and this
> requirement covers both:**
>
> - **In-clinic** — rendered **inline on the confirm screen**
>   (`appointments/confirm/page.tsx:308-331`). Angular matches this exactly.
> - **Online** — on a **second step** of the confirm route (`:527` gating
>   `<PaymentProcessor>` at `:584`); step 1 shows only Consultation Fee / Platform
>   Fee / Total and a *Proceed to Payment* CTA (`:616`).
>
> Angular renders it on the single confirm screen for **both** modes, so the member
> sees the working while deciding. For in-clinic that is the reference's own
> structure; for online it is earlier, and **that difference alone is sanctioned as
> parity register entry 16**. Reproducing the online two-step would add a step to
> the journey, which is a flow change and is not done.
>
> *Corrected 2026-08-10: this note previously described the two-step as what
> "React" does. It is what the online path does; the in-clinic path never had one.*
>
> Two deliberate differences: the wallet line is labelled **"Paid from your
> wallet"** rather than the reference's "Insurance Pays", because the value mapped
> is `walletDebitAmount` and the money leaves the member's own wallet; and
> React's *Payment Method* badge is not reproduced, because it is derived from a
> client-side calculator rather than from the API. The last clause above is a
> deliberate divergence too — the reference gates its whole breakdown on
> `walletDebitAmount > 0` and shows nothing at all when the wallet covers none of
> the cost. The wallet label is **register entry 15**; the reference's *Platform
> Fee* row is a hardcoded ₹0 excluded from its own total and is not carried over.
> `audit/34-copay-reference-trace.md`.

#### Scenario: Appointment booked
- **GIVEN** a validated consultation in either mode
- **WHEN** the member confirms
- **THEN** the appointment is created for the chosen patient, doctor and time
- **AND** the wallet's share is debited
- **AND** the new appointment appears in their bookings

#### Scenario: Booking is created before any payment
- **GIVEN** a consultation with an amount payable
- **WHEN** the member confirms
- **THEN** the appointment record is created first
- **AND** no payment is created or taken before it

#### Scenario: The member is taken to settle what they owe
- **GIVEN** a consultation whose wallet cover does not meet the whole fee
- **WHEN** the appointment is created
- **THEN** the API creates a PENDING payment for the remainder and returns its reference
- **AND** the member is taken to that payment
- **AND** it names the amount owed, which is the amount the confirm screen quoted
- **AND** settling it leaves no unexplained pending payment behind

> **Ruled and implemented, session 50** — built in 34, reverted in 40 for want of
> a ruling, reinstated once it existed. Destination is React's
> `/member/bookings?tab=doctors` after payment; RN's consultation hub was
> considered and not adopted (parity register entry 17). **Booking-first is
> unchanged** — the appointment exists before the payment screen is reached, which
> is what entry 5 requires and what neither reference does.
>
> **What this does not do:** the payment screen's Cancel sits beside Pay and shares
> its redirect, so the member is *told*, not necessarily collected from. And they
> are told **once** — `GET appointments/user/:id` returns no payment fields, so a
> member who cancels returns to a list showing nothing outstanding. Inherited
> finding 13 stands; this addresses disclosure at the moment of booking, not
> afterwards.

#### Scenario: Nothing is owed
- **GIVEN** a consultation the wallet covers in full
- **WHEN** the appointment is created
- **THEN** no payment is created
- **AND** the member is taken to their bookings

#### Scenario: The portal cannot tell who the appointment is for
- **GIVEN** a confirm screen reached without a resolvable patient
- **WHEN** the member attempts to confirm
- **THEN** they are told the portal could not determine the patient
- **AND** no booking request is sent

#### Scenario: Booking fails
- **GIVEN** a validated consultation
- **WHEN** creation fails
- **THEN** the reason is surfaced
- **AND** the member's selections are preserved so they can retry

### Requirement: No active appointment nudge
The portal SHALL NOT show a persistent banner for an appointment in progress.

Rule: This is a **declined port**, recorded so it is not re-added as a missing feature. The reference mounts one in its member layout inside a `lg:hidden` wrapper (`ActiveAppointmentNudge.tsx`, `layout.tsx:69-73`), fed by `GET appointments/user/:userId/ongoing`, and that endpoint therefore appears React-only on every route in `35-api-integration-parity.md`.

Rule: It was built in session 53 and **removed in session 54 at the member's request** — as a fixed banner above the bottom navigation it covered the Health Benefits cards on the home screen. The endpoint declaration was deleted with it, so the dead-endpoint scan stays at zero rather than carrying a permanently uncalled key.

#### Scenario: An appointment in progress
- **GIVEN** a member with an ongoing appointment
- **WHEN** any member screen is shown
- **THEN** no persistent appointment banner is rendered
- **AND** the appointment remains reachable from the bookings list

> The behaviour, both destinations and the bare-array response shape are recorded
> in `audit/37-fix-all-apis.md` should it ever be wanted back.

