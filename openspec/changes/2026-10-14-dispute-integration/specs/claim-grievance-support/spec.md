## ADDED Requirements

### Requirement: Claims that need help come from the claims listing API
The Support page SHALL list the member's claims from the same paginated claims listing API as the Claims page, newest first, five at a time with a Load more control, reading the rest of the listing in one large page (the listing's later 20-row pages overlap) and a further page only if that page is full.

#### Scenario: More than 20 claims
- **WHEN** a member has more claims than one page holds
- **THEN** Load more reaches the older claims, each claim is shown once even if two pages repeat it, and the button goes away after the last page
- **AND** a read that fails shows a message and Load more tries it again

#### Scenario: Claims are listed
- **WHEN** a member opens the Support page and the listing returns claims
- **THEN** each claim shows its category, provider, date, claim id, order type "Reimbursement" and its status
- **AND** each has an "Ask for help" action, or its ticket status when it already has a ticket

#### Scenario: Draft claims
- **WHEN** a claim is still a draft (not submitted)
- **THEN** it is not listed and no grievance can be raised on it
- **AND** when every claim is a draft, the page shows "No claim needs your attention right now."

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
Submitting the raise form for a claim SHALL call `POST /habit-opd/api/v1/opd_dispute` with `action=submit`, with the claim id and reason.

#### Scenario: Successful submit
- **WHEN** a member picks a reason and presses "Send to support"
- **THEN** the dispute API is called once with `claim_id`, `selected_reason`, `category: CLAIM`, `benefit_category`, `dispute_status: OPEN` and a signature, and no `dispute_type`
- **AND** the ticket screen shows the ticket id returned by the backend

#### Scenario: The member's own words
- **WHEN** the member wrote details
- **THEN** they are sent as `description` in the submit (`final_reason` is not sent), and also as the first reply on the new ticket and appear as the first message in the thread, commas and colons as typed
- **AND** when no details were written, no message is sent
- **AND** if that first message is refused it is retried once, and if it still fails the ticket stays raised and the words are put back in the reply box with a notice

#### Scenario: Optional supporting documents
- **WHEN** a member attaches documents
- **THEN** each is uploaded to DMS and sent in the submit's `documents` array (`name`, `document_id`, `document_type`, `originalname`, `verification_status`, `filetype`, `filesize`)
- **AND** the backend stores them on the grievance
- **AND** only PDF, Word or image files up to 5 MB are taken (several at once, the same file once); others are named in a message and skipped, and a failed upload is reported and not sent
- **AND** demo (non-claim) orders keep their own picker, which uploads nothing
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

#### Scenario: Repeated rows
- **WHEN** a page of tickets repeats a ticket
- **THEN** it is shown once

#### Scenario: Status
- **WHEN** the backend status is resolved or closed
- **THEN** the ticket shows closed with the final remark and the call-support prompt, and no reply box
- **WHEN** the backend status is "awaiting user" or "awaiting member"
- **THEN** the claim shows "Response received"
- **WHEN** it is any other status
- **THEN** the claim shows "Ticket open"

#### Scenario: Documents on a ticket
- **WHEN** a ticket has documents attached
- **THEN** they are listed, and Download fetches the file from DMS and saves it under its name
- **AND** a document that cannot be fetched shows an error and can be tried again

#### Scenario: The member's own words are not support's resolution
- **WHEN** a ticket is closed and `final_reason` still equals the member's first message
- **THEN** it is not shown as support's resolution

#### Scenario: Support replies while the page is open
- **WHEN** support replies in the support system
- **THEN** the reply appears in the thread within the next refresh (30 s)

#### Scenario: Long thread
- **WHEN** a thread has more than 20 messages
- **THEN** every page is read and all messages are shown, oldest first

#### Scenario: Read failure
- **WHEN** the ticket list or a thread cannot be read
- **THEN** the page still works with what it has, and a thread read failure says so

### Requirement: Member reply goes to the chat API
A reply SHALL be sent with `action=userReply` to the `dispute_chat` resource and shown in the thread.

#### Scenario: Reply
- **WHEN** a member sends a reply
- **THEN** the text is sent verbatim as `message_text` with the ticket's `dispute_id` (no `args`), the box is cleared and the message appears in the thread exactly as typed, including commas and colons

#### Scenario: Guard and failures
- **WHEN** a reply was just sent, or a send is in progress
- **THEN** Send reply is disabled (the backend refuses the same action within 3 seconds)
- **WHEN** a reply fails
- **THEN** the reason is shown and the text stays in the box

#### Scenario: Ticket closed meanwhile
- **WHEN** support closed the ticket while the member was typing and the backend refuses the reply
- **THEN** the backend's message is shown, nothing is added to the thread, and the ticket and thread refresh so the ticket reads closed with no reply box

#### Scenario: Blank or long text
- **WHEN** the reply is empty or only spaces
- **THEN** it cannot be sent; and the box holds at most 2000 characters

### Requirement: No member reopen, no fake actions
A member SHALL NOT be able to reopen a closed ticket. Demo support buttons SHALL NOT be shown on real tickets. A member MAY close a real ticket with "Mark resolved".

#### Scenario: Closed ticket
- **WHEN** a member views a closed ticket
- **THEN** no reopen action is shown, only the call-support prompt

### Requirement: Member can mark a ticket resolved
A member SHALL be able to close an open real ticket with "Mark resolved", sent as `action=userResolve`; the ticket then reads as closed by the member, with no reopen.

#### Scenario: Mark resolved
- **WHEN** a member presses "Mark resolved" on an open real ticket
- **THEN** `userResolve` is sent once (no text), the ticket shows closed ("You marked this resolved"), and it stays closed after a refresh

#### Scenario: Refused
- **WHEN** the backend refuses the close
- **THEN** its message is shown, the ticket stays open and the member can try again

#### Scenario: Closed by support
- **WHEN** a ticket was closed by support (last sender is not the member)
- **THEN** it is shown as closed by support and offers no Mark resolved

### Requirement: Something else offers call and email
The "Something else?" section SHALL let the member call or email support and SHALL NOT open a ticket.

#### Scenario: Desktop call
- **WHEN** a member on a non-touch device presses the call button
- **THEN** the number is copied and the member is told so

#### Scenario: Email
- **WHEN** a member presses the email address
- **THEN** a prefilled message to the support address opens
