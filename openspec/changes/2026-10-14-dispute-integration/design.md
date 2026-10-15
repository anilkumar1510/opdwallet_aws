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

### 5. `submit` stores the reason and the documents, not the description
Supporting documents are uploaded to DMS first and sent in the submit's `documents` array (`name`, `document_id`, `document_type`, `originalname`, `verification_status`, `filetype`, `filesize`); the backend stores them on the grievance. `description` is dropped, so the member's own words are sent as the first `userReply` right after submit. That message is retried once after the 3 s guard; if it still fails the grievance stays raised and the words go back into the reply box with a notice.

### 6. Ticket state from `dispute_status`
resolved / closed means closed; "awaiting user/member" means support has replied; anything else is with support. Closed shows `final_reason` and the call-support prompt. The member's name in messages is a user id, so own messages read "You".

### 7. No reopen, no fake actions
The reopen button and logic are removed. On real tickets the demo support buttons and "Mark resolved" are hidden.

## Risks / Trade-offs

- `benefit_category` is derived from the claim category label; the member-resolve action name is not known yet.
- Lookalike characters in replies (`‚`, `∶`) until the backend supports escaping.
- `helpline-page.ts` is shared with the static demo author; edits may conflict with their changes.
- The real-API tests create real "[TEST]" grievances and are skipped unless `SESSION_ID` is set.
