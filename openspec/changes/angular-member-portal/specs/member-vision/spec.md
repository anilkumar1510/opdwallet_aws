# member-vision

Retro-spec transcribed from `web-member/` on 2026-08-07. Covers the six
`/member/vision/*` routes, which shipped before any spec existed.

Transcribed, not designed. Scenarios are written to be verified against **forced**
state — a served fixture, an injected failure — never against whatever the seeded
account happens to show, per `audit/10-assertion-provenance.md`.

## Carve-outs applied — checked against the register, not assumed

- **Entry 10** — `/member/vision/select-patient` and `/member/vision/select-slot`
  commit on tap rather than select-then-Continue. Sanctioned for six routes,
  including both of these. Carries a falsification condition: it stops applying if
  `clinic-booking/select-slot-page.ts:107` ever stops defaulting the date signal.
- **Entry 5 (widened 2026-08-07)** — payment never precedes booking creation.
  **Vision conforms rather than diverging:** the payment screen is keyed by an
  existing `bookingId` and calls `vision-bookings/:id/process-payment`
  (`payment/[bookingId]/page.tsx:107`), so the booking exists before any payment is
  attempted. Recorded because vision is the one journey with a payment route, and a
  future reader will otherwise check.

## Relationship to dental — stated, not inherited

Vision and dental share Angular's `clinic-booking` components and follow the same
clinics → patient → slot → confirm sequence. **Vision is not dental plus a payment
screen**: it draws its services from `member/benefits/CAT007/services`, and it has a
sixth route (`payment/:bookingId`) with no dental counterpart. Dental's own
transcription must verify its resemblance rather than inherit this document — the
diagnostics/lab pair looked identical and had three genuine differences.

## ADDED Requirements

### Requirement: Vision services and clinic selection
The portal SHALL present the vision services covered by the member's policy, and the clinics able to deliver a chosen service.

#### Scenario: Covered services listed
- **GIVEN** a member whose policy includes vision cover
- **WHEN** the vision screen loads
- **THEN** only the services the policy covers are listed

#### Scenario: No vision cover
- **GIVEN** a member whose policy includes no vision cover
- **WHEN** the vision screen loads
- **THEN** an empty state explains that no vision services are available
- **AND** no clinic journey can be started

#### Scenario: Clinics listed for a service
- **GIVEN** a member who has chosen a vision service
- **WHEN** the clinics screen loads
- **THEN** the clinics offering that service are listed

#### Scenario: Clinic list fails to load
- **GIVEN** the clinics request fails
- **WHEN** the screen loads
- **THEN** an error state is shown, distinct from the no-clinics empty state
- **AND** a retry is offered

### Requirement: Vision patient and slot selection
The portal SHALL require a patient and a slot before a vision booking can be confirmed, and SHALL surface which family member the portal is currently acting for.

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

### Requirement: Vision booking confirmation
The portal SHALL present the wallet split before a vision booking is committed, and SHALL create the booking before any payment is attempted.

Rule: Payment never precedes booking creation — parity register entry 5.

#### Scenario: Wallet split shown before commitment
- **GIVEN** a member with a chosen clinic, patient and slot
- **WHEN** the booking is validated
- **THEN** the amount covered by the wallet and the amount payable by the member are both shown
- **AND** the confirm action is unavailable until validation has succeeded

#### Scenario: Booking created before payment
- **GIVEN** a validated vision booking
- **WHEN** the member confirms
- **THEN** the booking is created first
- **AND** only then is any outstanding amount taken to payment

#### Scenario: Fully covered booking needs no payment
- **GIVEN** a booking the wallet covers in full
- **WHEN** the member confirms
- **THEN** the booking completes without a payment step

### Requirement: Vision payment completion
The portal SHALL complete payment against an existing vision booking, and SHALL leave the booking intact if payment does not complete.

#### Scenario: Outstanding amount paid
- **GIVEN** a vision booking with a copay or excess outstanding
- **WHEN** the member completes payment
- **THEN** the payment is recorded against that booking
- **AND** the member is returned to their bookings

#### Scenario: Payment fails
- **GIVEN** a vision booking with an amount outstanding
- **WHEN** payment fails
- **THEN** the failure is surfaced
- **AND** the booking still exists and remains payable

#### Scenario: Payment screen opened for an unknown booking
- **GIVEN** a payment route carrying a booking id that cannot be resolved
- **WHEN** the screen loads
- **THEN** the member is returned to their bookings rather than shown an empty payment form

### Requirement: Vision invoice download
The portal SHALL offer a download for a vision booking's invoice where the API will serve one, and SHALL NOT offer it otherwise.

Rule: The API serves the invoice only for a COMPLETED booking with `invoiceGenerated` set (`vision-bookings.service.ts`, matching dental's `:1256`). The portal applies both conditions, because the database holds a CONFIRMED booking with `invoiceGenerated: true` — VIS-BOOK-1769701879987-3994 — and gating on the flag alone would render a control that can only fail.

#### Scenario: Invoice available for a completed vision booking
- **GIVEN** a vision booking the API reports as COMPLETED with its invoice generated
- **WHEN** the member views their vision bookings
- **THEN** the row offers a control that downloads that invoice

#### Scenario: Invoice not offered where the API would refuse it
- **GIVEN** a vision booking with `invoiceGenerated` set but a status other than COMPLETED
- **WHEN** the member views their vision bookings
- **THEN** no download control is offered

#### Scenario: A failed download is disclosed
- **GIVEN** an invoice the API cannot serve
- **WHEN** the member asks for it
- **THEN** the failure is reported to the member
- **AND** the control returns to its resting state rather than staying pending

> **Session 52, an API integration fix rather than a flow change** — no new screen
> and no new destination. `CLINIC_BOOKING_API.VISION.invoice` had been declared
> with no caller while the row rendered the bare label "Invoice available".
>
> Vision had no bookings-list requirement of its own before this; the behaviour is
> shared with dental and was specified only there, which a reader of this spec
> would not have found. See `audit/36-invoice-download.md`.
