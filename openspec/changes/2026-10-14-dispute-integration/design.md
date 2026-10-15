## Context

The Support page is a single component with a view switch (home / order / raise / ticket) over static seed data. The claims store already exposes the paginated listing, and the claim form already uploads to DMS and signs form-urlencoded `resource` posts. The backend exposes the `dispute` resource: `submit`, `userReply`, `GET_PAGE` (the member's disputes with `dispute_status`, `final_reason`, `last_message_sender`) and `GET_DISPUTE_MESSAGES`. The CRM (Twenty) stores the grievance; the browser never calls it.

## Goals / Non-Goals

**Goals:**
- Make the claim grievance path real and dynamic: list, submit, thread, reply, status.
- Reuse the existing claims listing, DMS upload and signing recipe.
- Keep edits inside `helpline-page.ts` and one new service; do not disturb other code.

**Non-Goals:**
- Services (non-claim) grievances.
- Member "Mark resolved" (no API) and member reopen (not allowed).
- Any direct call to Twenty from the browser.

## Decisions

### 1. One new service, thin edits to the page
`DisputeApi` (`core/disputes/dispute.api.ts`) owns encoding, signing, submit, list, messages, reply and upload. The page keeps the static demo tickets (services) in their own signal and merges the API tickets in front of them; a ticket is "live" when it came from the API.

### 2. Everything comes from the API, nothing from the browser
Tickets and threads are read from the API on load, when a ticket is opened, and every 30 s (a list refresh re-runs the thread load). No `sessionStorage` / `localStorage`. A failed list or thread read keeps what is shown and says so.

### 3. Sign like the claim submit; URL-encode the resource
Body `resource=<URL-encoded base64 JSON>&application=habit-opd&action=<action>`, signed over `resource&action=<action>` through `AppService.addXsrfToken`. Verified against the real API (plain MD5 token accepted). HTTP 200 with `errCode: -1` is a failure.

### 4. Work around the backend's `args` format
`userReply` takes the text in `args=messageText:<text>`, parsed as comma-separated `name:value` pairs: a comma or colon is rejected (quoting silently truncates, escaping does nothing). The portal swaps `,` for `‚` (U+201A) and `:` for `∶` (U+2236). The same action twice within 3 s is refused, so Send is disabled for ~3 s after a send, including after the first message that follows a submit. Replies are capped at 2000 characters client-side (8000 verified accepted).

### 5. `submit` takes the member's words as `final_reason`, and the documents
Supporting documents are uploaded to DMS first and sent in the submit's `documents` array (`name`, `document_id`, `document_type`, `originalname`, `verification_status`, `filetype`, `filesize`); the backend stores them on the grievance and the ticket lists them with a Download action (DMS `image-response-entity`). The member's own words are sent as `final_reason` (verified stored verbatim; `description` is dropped). Submit creates no thread message, so the same words are also sent as the first `userReply`. That message is retried once after the 3 s guard; if it still fails the grievance stays raised and the words go back into the reply box with a notice.

### 5b. `final_reason` is also support's resolution
Support's resolution later replaces `final_reason`. On a closed ticket it is shown as support's remark only when it differs from the member's first message, so the member never sees their own words presented as a resolution.

### 5c. Claims beyond the first 20
`ClaimsStore` loads only page 0. `ClaimPages` reads one large page (100) of the same listing (`GET_CLAIMS_BY_USER`): the real API repeats page 0 for later 20-row pages, so some claims were unreachable. Rows are mapped like the store and repeats removed; a further page is read only when a page is full and brought something new. Load more shows five at a time; a failed read shows a message and can be retried. The claim's own category code is sent as `benefit_category`; a reply refused by the backend's 3-second guard is retried once after 3.2 s; status codes with underscores are understood.

### 5d. Signing
The dispute calls use `AppService.addXsrfToken` like the claim form, so a logged-in session (encrypted token) behaves the same. The server did not check the token on dispute reads or writes in testing (reported to the backend team).

### 6. Ticket state from `dispute_status`
resolved / closed means closed; "awaiting user/member" means support has replied; anything else is with support. Closed shows `final_reason` and the call-support prompt. The member's name in messages is a user id, so own messages read "You".

### 7. No reopen, no fake actions
The reopen button and logic are removed. On real tickets the demo support buttons and "Mark resolved" are hidden.

## Risks / Trade-offs

- `benefit_category` is derived from the claim category label; the member-resolve action name is not known yet.
- Lookalike characters in replies (`‚`, `∶`) until the backend supports escaping.
- `final_reason` carries two meanings (member's words, then support's resolution); the display rule above is a heuristic until the backend has a separate field.
- `helpline-page.ts` is shared with the static demo author; edits may conflict with their changes.
- The real-API tests create real "[TEST]" grievances and are skipped unless `SESSION_ID` is set.
