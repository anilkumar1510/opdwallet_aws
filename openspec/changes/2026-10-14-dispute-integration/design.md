## Context

The Support page is a single component with a view switch (home / order / raise / ticket) over static seed data. The claims store already exposes the paginated listing, and the claim form already uploads to DMS and signs form-urlencoded `resource` posts. The backend exposes the `dispute` resource (`submit`, `userResolve`, `GET_PAGE` with `dispute_status`, `final_reason`, `description`, `last_message_sender`, and `GET_DISPUTE_MESSAGES`) and the `dispute_chat` resource (`userReply`, `agentReply`). The CRM (Twenty) stores the grievance; the browser never calls it.

## Goals / Non-Goals

**Goals:**
- Make the claim grievance path real and dynamic: list, submit, thread, reply, status.
- Reuse the existing claims listing, DMS upload and signing recipe.
- Keep edits inside `helpline-page.ts` and one new service; do not disturb other code.

**Non-Goals:**
- Services (non-claim) grievances.
- Member reopen (not allowed by design).
- Any direct call to Twenty from the browser.

## Decisions

### 1. One new service, thin edits to the page
`DisputeApi` (`core/disputes/dispute.api.ts`) owns encoding, signing, submit, list, messages, reply, resolve, upload and download. The page keeps the static demo tickets (services) in their own signal and merges the API tickets in front of them; a ticket is "live" when it came from the API.

### 2. Everything comes from the API, nothing from the browser
Tickets and threads are read from the API on load, when a ticket is opened, and every 30 s (a list refresh re-runs the thread load). No `sessionStorage` / `localStorage`. A failed list or thread read keeps what is shown and says so.

### 3. Sign like the claim submit; URL-encode the resource
Body `resource=<URL-encoded base64 JSON>&application=habit-opd&action=<action>`, signed over `resource&action=<action>` through `AppService.addXsrfToken`. Verified against the real API (plain MD5 token accepted). HTTP 200 with `errCode: -1` is a failure.

### 4. Replies go to `dispute_chat`, text verbatim
`reply` posts `action=userReply` to the `dispute_chat` resource with the resource `{resourceType:"DisputeChat",dispute_id:<ticket uuid>,message_text:<text>}` and no `args` (the backend reads `message_text` and stores it verbatim, commas and colons included). The old `dispute` + `userReply` now answers "Invalid Query". The backend refuses the same action twice within 3 s, so Send is disabled for ~3 s after a send, including after the first message that follows a submit, and a refusal is retried once after 3.2 s. Replies are capped at 2000 characters client-side. A reply on a resolved or closed ticket is refused by the backend ("Cannot reply on a resolved or closed dispute"); the portal shows that message and refreshes the ticket and thread so it reads closed. Replies written before the backend read `message_text` carry lookalike characters (`‚` for `,`, `∶` for `:`); `toArgSafe` is kept only to recognise those old messages.

### 5. `submit` takes the member's words as `description`, and the documents
Supporting documents are uploaded to DMS first and sent in the submit's `documents` array (`name`, `document_id`, `document_type`, `originalname`, `verification_status`, `filetype`, `filesize`); the backend stores them on the grievance and the ticket lists them with a Download action (DMS `image-response-entity`). The member's own words are sent as BOTH `final_reason` and `description`: the backend passes only `final_reason` to the support system (Twenty) until its mapper sends `description` (merged in `new_prod` as `daf8d03`, not yet confirmed in Twenty), so both stay until a new ticket's Description is seen filled in Twenty; then `final_reason` is dropped (task 4.2b). No `dispute_type` is sent (not needed on `submit`). Submit creates no thread message, so the same words are also sent as the first `userReply`. That message is retried once after the 3 s guard; if it still fails the grievance stays raised and the words go back into the reply box with a notice.

### 5b. `final_reason` is support's resolution only
Support's resolution later replaces `final_reason`. On a closed ticket it is shown as support's remark only when it differs from the member's first message, so the member never sees their own words presented as a resolution.

### 5c. Claims beyond the first 20
`ClaimsStore` loads only page 0. `ClaimPages` reads one large page (100) of the same listing (`GET_CLAIMS_BY_USER`): the real API's later 20-row pages overlap (its sort key, `g_modify_time`, moves between requests), so some claims were unreachable. Rows are mapped like the store and repeats removed (tickets are de-duplicated by id too); a further page is read only when a page is full and brought something new. Load more shows five at a time; a failed read shows a message and can be retried. The claim's own category code is sent as `benefit_category`; a reply refused by the backend's 3-second guard is retried once after 3.2 s; status codes with underscores are understood.

### 5d. Signing
The dispute calls use `AppService.addXsrfToken` like the claim form, so a logged-in session (encrypted token) behaves the same. The server did not check the token on dispute reads or writes in testing (reported to the backend team).

### 6. Ticket state from `dispute_status`
resolved / closed means closed; "awaiting user/member" means support has replied; anything else is with support. Closed shows `final_reason` and the call-support prompt. The member's own messages (`sender_type` MEMBER) always read "You"; support messages show the executive's name.

### 7. No reopen, no fake actions
The reopen button and logic are removed. On real tickets the demo support buttons are hidden. "Mark resolved" sends `action=userResolve` (same signed form post as a reply, no `args`); the ticket is then read back from the API, and is shown as closed by the member when the last sender is `MEMBER`. A refusal shows the backend message and leaves the ticket open.

## Risks / Trade-offs

- Support only sees a portal ticket if the backend creates the Twenty record; at the time of writing none of the portal-raised tickets appear in the Twenty workspace (backend step `DISPUTE_CREATE`, see `PLACEHOLDER-APIS.md` section 7).
- Tickets raised before 21 Oct 2026 carry the member's words in `final_reason`; the display rule above (hide it when it equals the member's first message) stays for them. New tickets leave `final_reason` blank until support closes the ticket.
- The claims listing is read as one 100-row page. The backend's sort is now stable (checked live on 16 Oct: 62 claims, no repeats at 20 a page), so more than 100 claims would also page correctly.
- `benefit_category` is the claim's own category code; the backend takes any string.
- `helpline-page.ts` is shared with the static demo author; edits may conflict with their changes.
- The real-API tests create real "[TEST]" grievances on the production backend and are skipped unless `SESSION_ID` is set.
