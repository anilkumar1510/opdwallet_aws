## ADDED Requirements

### Requirement: Claims that need help come from the claims listing API
The Support page SHALL list the member's claims from the same paginated claims listing API as the Claims page, newest first, five at a time with a Load more control.

#### Scenario: Claims are listed
- **WHEN** a member opens the Support page and the listing returns claims
- **THEN** each claim shows its category, provider, date, claim id, order type "Reimbursement" and its status
- **AND** each has an "Ask for help" action

#### Scenario: No claims
- **WHEN** the listing returns no claims
- **THEN** the page shows "No claim needs your attention right now."

### Requirement: Claim detail has no payment section
The order detail screen SHALL NOT show the Amount, invoice or payment breakdown for a reimbursement claim.

#### Scenario: Claim detail
- **WHEN** a member opens a claim from the Support page
- **THEN** no Amount section or "View invoice" link is shown
- **AND** cashless orders still show their Amount section

### Requirement: Raising a grievance on a claim calls the dispute API
Submitting the raise form for a claim SHALL call `POST /habit-opd/api/v1/dispute` with `action=submit`, with the claim id, reason, optional description and any uploaded document ids.

#### Scenario: Successful submit
- **WHEN** a member picks a reason and presses "Send to support"
- **THEN** the dispute API is called once with `claim_id`, `selected_reason`, `category: CLAIM` and `dispute_status: OPEN`
- **AND** the ticket screen shows the returned ticket id

#### Scenario: Optional supporting documents
- **WHEN** a member attaches documents
- **THEN** each is uploaded to DMS and its `document_id` is sent in `document_ids`
- **AND** a failed or oversize (over 5 MB) document is reported and not sent
- **AND** submitting with no documents is allowed

#### Scenario: Reason rules
- **WHEN** no reason is selected, or the reason is "Other" with no description
- **THEN** Send to support is disabled

#### Scenario: API failure
- **WHEN** the dispute API fails or answers `errCode: -1`
- **THEN** the error is shown, the form stays open and no ticket is created

#### Scenario: Window and duplicates
- **WHEN** the claim is older than 3 months, or already has a ticket
- **THEN** a new grievance cannot be raised and the member is pointed to the phone or to the existing ticket

### Requirement: No member reopen
A member SHALL NOT be able to reopen a closed ticket. Mark resolved SHALL be final.

#### Scenario: Closed ticket
- **WHEN** a member views a closed ticket
- **THEN** no reopen action is shown, only the call-support prompt

### Requirement: Tickets survive a refresh
Until a ticket-list API exists, tickets raised in a browser tab SHALL persist across a page refresh in that tab and SHALL NOT persist after the tab is closed.

#### Scenario: Refresh
- **WHEN** a member raises a ticket and refreshes the page
- **THEN** the claim still shows "Ticket open" and its thread is available

### Requirement: Something else offers call and email
The "Something else?" section SHALL let the member call or email support and SHALL NOT open a ticket.

#### Scenario: Desktop call
- **WHEN** a member on a non-touch device presses the call button
- **THEN** the number is copied and the member is told so

#### Scenario: Email
- **WHEN** a member presses the email address
- **THEN** a prefilled message to the support address opens
