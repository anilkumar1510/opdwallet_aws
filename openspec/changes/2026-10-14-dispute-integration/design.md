## Context

The Support page is a single component with a view switch (home / order / raise / ticket) over static seed data. The claims store already exposes the paginated listing, and the claim form already uploads to DMS and signs form-urlencoded `resource` posts. The backend exposes `POST /habit-opd/api/v1/dispute`; the CRM (Twenty) stores the grievance. There is no API yet to read tickets or chat back.

## Goals / Non-Goals

**Goals:**
- Make the claim grievance path real: list, optional documents, submit.
- Reuse the existing claims listing, DMS upload and signing recipe.
- Keep edits inside `helpline-page.ts` and one new service; do not disturb other code.

**Non-Goals:**
- Services (non-claim) grievances, ticket list / chat history / reply / mark-resolved APIs.
- Any direct call to Twenty from the browser (the API key must never reach the frontend).
- Member reopen.

## Decisions

### 1. One new service, thin edits to the page
`DisputeApi` (`core/disputes/dispute.api.ts`) owns encoding, signing, submit and upload. The page treats a claim as "live" when it came from the listing API; seeded demo orders keep their in-memory behaviour.

### 2. Sign like the claim submit
Body `resource=<base64 JSON>&application=habit-opd&action=submit`, signed over `resource&action=submit` through `AppService.addXsrfToken`. HTTP 200 with `errCode: -1` is a failure. To be confirmed with the backend.

### 3. Member names fall back to the session member
If the family list has not loaded, `member_name` / `patient_name` come from `SessionStore.member()` so a grievance is never sent anonymously.

### 4. Tickets survive a refresh via `sessionStorage`
No ticket-list API exists, so tickets raised in a tab are kept in `sessionStorage` (cleared when the tab closes, not on a shared computer's disk). Replace with the list API.

### 5. No reopen
The reopen button and logic are removed. A closed ticket only shows the call-support prompt.

## Risks / Trade-offs

- Signing, `benefit_category` (derived from the claim category label), `document_ids` / `description` keys and the ticket id field are assumptions until confirmed with the backend.
- `helpline-page.ts` is shared with the static demo author; edits may conflict with their changes.
- The `sessionStorage` stopgap is per tab and per device.
