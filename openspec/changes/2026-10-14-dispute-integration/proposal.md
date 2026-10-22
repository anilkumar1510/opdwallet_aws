## Why

The Twenty CRM `claim-grievance` app and the habit-opd `dispute` API exist for reimbursement claims, while the member portal's Support page (`/member/helpline`) was a static demo that saved nothing. Members could not raise a grievance that reached the support team, and could not see or answer what support said.

## What Changes

Builds on the static grievance demo (`features/misc/helpline-page.ts`, `features/support/grievance.data.ts`) and changes only what is needed to make **claims** real and dynamic:

- "Claims that need your help" reads the same paginated claims listing API as the Claims page, every page (older claims through Load more, repeats removed).
- Claim detail drops the Amount / payment section (claims are reimbursements).
- The raise form gets an optional supporting-documents upload (DMS) for claims; the documents show on the ticket and download from DMS.
- "Send to support" calls `POST /habit-opd/api/v1/opd_dispute` (`action=submit`); the backend stores the grievance, the member's words in `description` (not `final_reason`, which is support's resolution), and the documents in `documents`. No `dispute_type` is sent.
- Tickets and their status come from the API (`GET_PAGE`); threads from `GET_DISPUTE_MESSAGES` (all pages); both refresh every 30 s while the page is open.
- The member's reply goes to `POST /habit-opd/api/v1/opd_dispute_chat` (`action=userReply`, text verbatim in `message_text`); the member's own words after submit are sent as the first message. A reply on a ticket support has just closed is refused by the backend and the ticket refreshes to closed.
- The member can no longer reopen a closed ticket; a member can close a real ticket with "Mark resolved" (`userResolve`).
- The wireframe "Static demo" banner is removed; simulated support buttons are hidden for real claims.
- "Something else?" call and email buttons work (copy number on desktop, prefilled mailto).
- New `core/disputes/dispute.api.ts` (submit, list, messages, reply, upload, download) and `claim-pages.ts` (later pages of the claims listing).

## Capabilities

### New Capabilities
- `claim-grievance-support`: member-side grievance flow for reimbursement claims on the Support page, backed by the dispute API.

### Modified Capabilities
None.

## Impact

- `projects/member/src/app/features/misc/helpline-page.ts` (edited), `core/disputes/dispute.api.ts` (new).
- Calls: `GET claim` (`GET_CLAIMS_BY_USER`), `GET/POST dispute` (`GET_PAGE`, `GET_DISPUTE_MESSAGES`, `submit`, `userResolve`), `POST dispute_chat` (`userReply`), `POST /dms/api/v1/emrImage`, `GET /dms/api/v1/emrImage/image-response-entity`.
- Not changed: services (non-claim) grievances stay static demo; member Mark resolved is wired to the backend `userResolve` action (see `PLACEHOLDER-APIS.md` section 7).
