# member-diagnostics

Retro-spec transcribed from `web-member/` on 2026-08-07. Covers the six
`/member/diagnostics/*` routes, which shipped before any spec existed.

Transcribed, not designed: the reference is the acceptance criterion. Scenarios
are written to be verified against **forced** state — a served fixture, an
injected failure — never against whatever the seeded account happens to show, per
`audit/10-assertion-provenance.md`.

**Relationship to `member-lab`.** The two journeys are deliberately the same shape.
Verified rather than assumed: the reference's validation gates are byte-identical
between `lab-tests/upload/page.tsx` and `diagnostics/upload/page.tsx`, and the
endpoint sets differ only by the `lab` / `diagnostics` path segment. Requirements
below therefore mirror `member-lab`, and the three genuine differences are stated
explicitly rather than left implicit.

Sanctioned carve-outs that apply here — check the parity register before recording
any difference as a gap:
- **Entry 4** — the booking wizard is two routes, not one.
- **Entry 7** — lab and diagnostics follow the viewed family member everywhere.

## Differences from `member-lab`, stated deliberately

1. `/member/diagnostics` has its own layout in the reference rather than the lab
   hero, and Angular matches that (`app.routes.ts:112-117`).
2. The reference exposes vendor pricing per cart for diagnostics
   (`member/diagnostics/carts/:cartId/vendors/:vendorId/pricing`, cart-scoped and
   two-param) where lab's is vendor-scoped. Angular consumes neither — pricing
   arrives with the vendor list. See `01-endpoint-diff.md` §1.
3. Everything else is the lab journey on the `diagnostics` prefix.

## ADDED Requirements

### Requirement: Diagnostic prescription submission
The portal SHALL let a member start a diagnostics journey by submitting a prescription, either by uploading a new file or by selecting one already held, and SHALL refuse an incomplete submission before any request is made.

Rule: The active family member from `member-family-context` is the patient unless the member selects another. No screen independently chooses a different family member.

#### Scenario: Uploading a new prescription
- **GIVEN** a member on the diagnostics prescription upload screen
- **WHEN** they supply a file, a patient, a prescription date and an address, and submit
- **THEN** the prescription is submitted for the chosen patient
- **AND** the member is returned to the diagnostics screen with the new prescription listed

#### Scenario: Submitting an existing prescription
- **GIVEN** a member who already holds a digital prescription
- **WHEN** they choose it instead of uploading a file
- **THEN** it is submitted without a file upload
- **AND** the resulting journey is indistinguishable from an uploaded one

#### Scenario: Incomplete submission is refused
- **GIVEN** a member who has not supplied a file, a patient name, a prescription date, or an address
- **WHEN** they attempt to submit
- **THEN** submission is refused with a message naming what is missing
- **AND** no request is sent

#### Scenario: Unsupported or oversized file
- **GIVEN** a member selecting a file that is not an image or PDF, or is larger than the accepted size
- **WHEN** they attach it
- **THEN** it is rejected with a message stating the restriction
- **AND** the rest of the form is preserved

### Requirement: Diagnostic cart and vendor selection
The portal SHALL present the vendors able to fulfil a diagnostics cart, with each vendor's price for that cart's own items.

Rule: A cart is created by the diagnostics team when it digitizes a submitted prescription, not by the member. The portal offers no way to create one, and neither does the reference — no cart-creation route exists on the member API. A submitted prescription that has no cart yet is therefore a normal waiting state, not a failure.

Rule: Diagnostics carts are fetched on the `member/diagnostics` prefix. The reference's diagnostics cart and vendor screens fetch them on the `member/lab` prefix, which cannot resolve a diagnostics cart — the two prefixes are backed by separate collections. That is a reference defect and is not ported; see parity register entry 14.

#### Scenario: A submitted prescription is awaiting digitization
- **GIVEN** a member whose prescription has been submitted but not yet digitized, and who has no diagnostics orders
- **WHEN** they open the diagnostics orders screen
- **THEN** the prescription is listed as awaiting the lab, with no cart and no ordering action
- **AND** this is presented as a normal waiting state, distinguishable from a failed load
- **AND** on the diagnostics hub the same prescription is listed with its status and is offered no ordering action

#### Scenario: Vendors listed for a cart
- **GIVEN** a cart containing diagnostic tests
- **WHEN** the member opens it
- **THEN** each available vendor is listed with its price for that cart's items and any saving against list price

#### Scenario: No vendor serves the area
- **GIVEN** a cart whose pincode no vendor covers
- **WHEN** the member opens it
- **THEN** an empty state explains that no vendor is available
- **AND** no vendor is presented as selectable

#### Scenario: Vendor list fails to load
- **GIVEN** the vendor request fails
- **WHEN** the member opens the cart
- **THEN** an error state is shown, distinct from the no-vendor empty state
- **AND** a retry is offered

### Requirement: Diagnostic slot selection and booking
The portal SHALL require a collection slot before a diagnostics order can be placed, and SHALL present the wallet split before the member commits.

Rule: Slot availability is requested for a specific date and the cart's pincode. A slot at capacity is shown but not selectable.

#### Scenario: Slots listed for a date
- **GIVEN** a member who has chosen a vendor
- **WHEN** the slot screen loads
- **THEN** slots are listed for the selected date
- **AND** a slot at or over capacity is visibly unavailable and cannot be chosen

#### Scenario: No slots on the chosen date
- **GIVEN** a date on which the vendor offers no slots
- **WHEN** the member selects that date
- **THEN** an empty state invites them to try another date
- **AND** the date remains changeable

#### Scenario: Wallet split shown before commitment
- **GIVEN** a member with a chosen slot
- **WHEN** the order is validated
- **THEN** the amount covered by the wallet and the amount payable by the member are both shown
- **AND** the confirm action is unavailable until validation has succeeded

#### Scenario: Order placed
- **GIVEN** a validated order
- **WHEN** the member confirms
- **THEN** the order is placed for the chosen patient, vendor and slot
- **AND** the member is taken to the order

### Requirement: Diagnostic order history
The portal SHALL list a member's diagnostics orders and present each order's detail, scoped to the active family member.

#### Scenario: An order is identified by its business reference
- **GIVEN** a member with a diagnostics order
- **WHEN** they open it from the orders list
- **THEN** the row links by the order's `DIAG-ORD-…` reference, not its Mongo `_id`
- **AND** the detail route resolves and renders that order
- **AND** no Mongo `_id` is displayed anywhere on the screen

#### Scenario: Orders listed
- **GIVEN** a member with diagnostics orders
- **WHEN** the orders screen loads
- **THEN** the orders are listed newest first with their status

#### Scenario: No orders yet
- **GIVEN** a member with no diagnostics orders
- **WHEN** the orders screen loads
- **THEN** an empty state is shown that is distinguishable from a failed load

#### Scenario: Orders follow the active family member
- **GIVEN** a primary member viewing their own orders
- **WHEN** they switch the active family member to a dependent
- **THEN** the list refreshes to that dependent's orders without a manual reload

### Requirement: Cancelling an uploaded prescription
The portal SHALL let a member cancel a prescription the API will accept a cancellation for, and SHALL NOT offer the action otherwise.

Rule: UPLOADED only. The API refuses every other status (`lab-prescription.service.ts:322`), so a DIGITIZED or already-cancelled prescription gets no control rather than one that fails.

Rule: A reason of 10-500 characters is required by the API (`CancelLabPrescriptionDto`). The portal does NOT ask the member for one — it sends a fixed, neutral reason that identifies itself as portal-generated. Ops reads this field, and inventing a motive the member never gave would be worse than recording plainly that none was collected.

#### Scenario: Cancelling an uploaded prescription
- **GIVEN** a prescription in UPLOADED status
- **WHEN** the member activates the cancel control
- **THEN** the cancellation is sent immediately against the prescription's business reference, with no confirmation step
- **AND** the list is re-read and the prescription no longer appears

#### Scenario: A prescription that cannot be cancelled
- **GIVEN** a prescription that is not UPLOADED
- **WHEN** the member views it
- **THEN** no cancel action is offered

#### Scenario: No confirmation step and no reason prompt
- **GIVEN** a cancellable prescription
- **WHEN** the member activates the cancel control
- **THEN** no confirmation panel and no reason field are shown
- **AND** the cancellation proceeds on that single action

> **Changed in session 54 on the member's instruction**: the two-step confirm and
> the free-text reason box were removed. The API's reason requirement is met by a
> fixed portal-generated string.

> **Session 53** — `LAB_API[kind].cancelPrescription` was declared and never
> called. The reference offers this on its bookings screen
> (`bookings/page.tsx:824-885`). See `audit/37-fix-all-apis.md`.
