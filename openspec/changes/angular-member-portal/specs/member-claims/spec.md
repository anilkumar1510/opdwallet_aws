# member-claims

Retro-spec transcribed from `web-member/` on 2026-08-08. Covers `/member/claims`,
`/member/claims/new`, `/member/claims/:claimId`.

Transcribed, not designed. **Own reference read** — nothing inherited from the six
prior verticals.

Every scenario is written to be verifiable against **forced** state, and the ones
asserting a claim is created or submitted are written so they can be driven to a
**terminal state** — the record exists, the named navigation happened, and the
destination renders. That is section 9's criterion 5, and this vertical is why it
exists: a claim filed successfully once rendered "Claim not found".

## Register — applied, checked, not assumed

- **Entry 12** — the claim form is one responsive page, not the reference's
  three-step wizard. Sanctioned. Its precondition was met only after two validation
  rules were added, so the requirements below state those rules explicitly rather
  than leaving them to the layout.
- **`providerName` is a deliberate stricter divergence** — Angular requires it, the
  reference does not. Recorded in entry 12; specified below as required.
- **Entry 5** — no payment precedes anything here. Claims are reimbursement
  requests; the flow takes no payment at all. *Unviolatable*, recorded so a reader
  does not look for it.
- Entry 10 does not apply — no pickers.

## The two identifiers — a requirement, not an implementation note

A claim carries a Mongo `_id` **and** a business reference (`CLM-…`). They are not
interchangeable and the reference app distinguishes them: detail is fetched by
`_id`, while cancel, submit, timeline and TPA notes take the business reference.
Getting this wrong produced a "Claim not found" over a claim that existed. It is
specified below because it is member-visible, not internal.

## ADDED Requirements

### Requirement: Claim list
The portal SHALL list the member's claims with their status, scoped to the active family member, and SHALL let the member narrow the list.

#### Scenario: Claims listed
- **GIVEN** a member with claims
- **WHEN** the claims screen loads
- **THEN** each claim is listed with its reference, status, treatment date and amount
- **AND** amounts and dates are formatted, never raw

#### Scenario: Filtering by status
- **GIVEN** a member viewing their claims
- **WHEN** they filter to a single status
- **THEN** only claims in that status are listed
- **AND** clearing the filter restores the full list

#### Scenario: No claims yet
- **GIVEN** a member with no claims
- **WHEN** the claims screen loads
- **THEN** an empty state is shown, distinguishable from a failed load
- **AND** starting a new claim remains available

#### Scenario: Claim list fails to load
- **GIVEN** the claims request fails
- **WHEN** the screen loads
- **THEN** an error state is shown, distinct from the empty state
- **AND** a retry is offered

#### Scenario: Claims follow the active family member
- **GIVEN** a primary member viewing their own claims
- **WHEN** they switch the active family member to a dependent
- **THEN** the list refreshes to that dependent's claims without a manual reload

### Requirement: Filing a claim
The portal SHALL collect everything a claim requires before it can be submitted, and SHALL refuse an incomplete or unaffordable claim before any request is made.

Rule: The member must supply a patient, a category, a treatment date, a provider, a bill amount, at least one prescription document and at least one bill document. The bill amount must not exceed the available balance for the chosen category.

#### Scenario: Claim filed and opened
- **GIVEN** a member who has completed the claim form
- **WHEN** they submit it
- **THEN** the claim is created and moved out of draft
- **AND** the member is taken to that claim
- **AND** the claim's detail renders, showing the claim they just filed

#### Scenario: Incomplete claim is refused
- **GIVEN** a claim missing a patient, category, treatment date, provider or bill amount
- **WHEN** the member attempts to submit
- **THEN** submission is unavailable
- **AND** no request is sent

#### Scenario: Both document types are required
- **GIVEN** a claim with a prescription attached but no bill
- **WHEN** the member attempts to submit
- **THEN** submission is unavailable
- **AND** the same holds with a bill attached but no prescription

#### Scenario: Bill exceeds the available balance
- **GIVEN** a bill amount greater than the available balance for the chosen category
- **WHEN** the amount is entered
- **THEN** the member is told the amount exceeds their available balance, naming the figure
- **AND** submission is unavailable

#### Scenario: Bill above the per-claim limit
- **GIVEN** a bill amount above the category's per-claim limit but within the available balance
- **WHEN** the amount is entered
- **THEN** the member is warned
- **AND** submission remains available, because the API decides what it reimburses

#### Scenario: Claim capped on submission
- **GIVEN** a claim the API caps to the per-claim limit
- **WHEN** it is submitted
- **THEN** the member is told the original amount, the capped amount and the limit applied

#### Scenario: Oversized document
- **GIVEN** a file larger than the accepted size
- **WHEN** the member attaches it
- **THEN** it is rejected with a message stating the restriction
- **AND** the rest of the form is preserved

### Requirement: Claim detail
The portal SHALL present a claim's full state, its documents and its progress, and SHALL let the member withdraw a claim that has not reached a terminal status.

Rule: The detail is addressed by the claim's `_id`; cancellation, timeline and notes are addressed by its business reference. A claim opened from the list or immediately after filing must render, not report itself missing.

#### Scenario: Claim detail displayed
- **GIVEN** a member opening one of their claims
- **WHEN** the detail loads
- **THEN** the reference, status, amounts, treatment date and provider are shown
- **AND** the documents attached to it are listed

#### Scenario: Claim progress
- **GIVEN** a claim under assessment
- **WHEN** the detail loads
- **THEN** its progress through assessment is shown in order

#### Scenario: Withdrawing a claim
- **GIVEN** a claim the member may still withdraw
- **WHEN** they withdraw it with a reason
- **THEN** the claim moves to cancelled
- **AND** the change is reflected without a manual reload

#### Scenario: A claim that cannot be withdrawn
- **GIVEN** a claim in a terminal status
- **WHEN** the detail loads
- **THEN** withdrawal is not offered

#### Scenario: Unknown claim
- **GIVEN** a claim id that cannot be resolved
- **WHEN** the detail loads
- **THEN** a not-found state is shown
- **AND** the member can return to their claims
