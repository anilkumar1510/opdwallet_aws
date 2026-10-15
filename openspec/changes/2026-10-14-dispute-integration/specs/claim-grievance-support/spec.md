## ADDED Requirements

### Requirement: Claims that need help come from the claims listing API
The Support page SHALL list the member's claims from the same paginated claims listing API as the Claims page, newest first, five at a time with a Load more control.

#### Scenario: Claims are listed
- **WHEN** a member opens the Support page and the listing returns claims
- **THEN** each claim shows its category, provider, date, claim id, order type "Reimbursement" and its status
- **AND** each has an "Ask for help" action, or its ticket status when it already has a ticket

#### Scenario: No claims
- **WHEN** the listing returns no claims
- **THEN** the page shows "No claim needs your attention right now."

### Requirement: Claim detail has no payment section
The order detail screen SHALL NOT show the Amount, invoice or payment breakdown for a reimbursement claim.

#### Scenario: Claim detail
- **WHEN** a member opens a claim from the Support page
- **THEN** no Amount section or "View invoice" link is shown
- **AND** cashless orders still show their Amount section

### Requirement: Raising a grievance calls the dispute API
Submitting the raise form for a claim SHALL call `POST /habit-opd/api/v1/dispute` with `action=submit`, with the claim id and reason.

#### Scenario: Successful submit
- **WHEN** a member picks a reason and presses "Send to support"
- **THEN** the dispute API is called once with `claim_id`, `selected_reason`, `category: CLAIM`, `dispute_status: OPEN` and a signature
- **AND** the ticket screen shows the ticket id returned by the backend

#### Scenario: The member's own words
- **WHEN** the member wrote details
- **THEN** they are sent as the first reply on the new ticket and appear as the first message in the thread
- **AND** when no details were written, no message is sent

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

#### Scenario: Double click
- **WHEN** Send to support is clicked twice quickly
- **THEN** the grievance is submitted once

### Requirement: Tickets and threads come from the API
Tickets, their status and their threads SHALL be read from the dispute API (`GET_PAGE`, `GET_DISPUTE_MESSAGES`, all pages), refreshed while the page is open, and SHALL NOT be stored in the browser.

#### Scenario: Refresh
- **WHEN** a member raises a ticket and refreshes the page
- **THEN** the claim still shows its ticket status and the full thread is available

#### Scenario: Status
- **WHEN** the backend status is resolved or closed
- **THEN** the ticket shows closed with the final remark and the call-support prompt, and no reply box
- **WHEN** the backend status is "awaiting user" or "awaiting member"
- **THEN** the claim shows "Response received"
- **WHEN** it is any other status
- **THEN** the claim shows "Ticket open"

#### Scenario: Support replies while the page is open
- **WHEN** support replies in the support system
- **THEN** the reply appears in the thread within the next refresh (30 s)

#### Scenario: Long thread
- **WHEN** a thread has more than 20 messages
- **THEN** every page is read and all messages are shown, oldest first

#### Scenario: Read failure
- **WHEN** the ticket list or a thread cannot be read
- **THEN** the page still works with what it has, and a thread read failure says so

### Requirement: Member reply goes to the dispute API
A reply SHALL be sent with `action=userReply` and shown in the thread.

#### Scenario: Reply
- **WHEN** a member sends a reply
- **THEN** the text is sent in `args=messageText:<text>`, the box is cleared and the message appears in the thread

#### Scenario: Characters the backend cannot carry
- **WHEN** the text contains a comma or a colon
- **THEN** they are replaced by lookalike characters before sending

#### Scenario: Guard and failures
- **WHEN** a reply was just sent, or a send is in progress
- **THEN** Send reply is disabled (the backend refuses the same action within 3 seconds)
- **WHEN** a reply fails
- **THEN** the reason is shown and the text stays in the box

#### Scenario: Blank or long text
- **WHEN** the reply is empty or only spaces
- **THEN** it cannot be sent; and the box holds at most 2000 characters

### Requirement: No member reopen, no fake actions
A member SHALL NOT be able to reopen a closed ticket. Demo support buttons and "Mark resolved" SHALL NOT be shown on real tickets.

#### Scenario: Closed ticket
- **WHEN** a member views a closed ticket
- **THEN** no reopen action is shown, only the call-support prompt

### Requirement: Something else offers call and email
The "Something else?" section SHALL let the member call or email support and SHALL NOT open a ticket.

#### Scenario: Desktop call
- **WHEN** a member on a non-touch device presses the call button
- **THEN** the number is copied and the member is told so

#### Scenario: Email
- **WHEN** a member presses the email address
- **THEN** a prefilled message to the support address opens
