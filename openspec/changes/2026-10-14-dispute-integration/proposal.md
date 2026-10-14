# Dispute / grievance integration (member portal)

## Why
The Twenty CRM `claim-grievance` app and the habit-opd `dispute` API exist for
reimbursement claims. The Support page (`/member/helpline`) is a static demo.

## What
Builds on the static demo (`features/misc/helpline-page.ts`), changing only:
- "Claims that need your help" reads the paginated claims listing API.
- Claim detail drops the Amount / payment section (claims are reimbursements).
- Raise form gets optional supporting-document upload (DMS) for claims.
- "Send to support" on a claim calls `POST /habit-opd/api/v1/dispute`
  (`action=submit`); the grievance is stored by the backend.
- The member can no longer reopen a closed ticket.
- Demo-only banners and simulated support buttons are hidden for real claims.
- `core/disputes/dispute.api.ts`: submit + document upload.

## Out of scope / pending backend
Services (non-claim) grievances, ticket list / chat history / reply / mark
resolved APIs, ticket persistence across reloads. See `PLACEHOLDER-APIS.md` s.7.

## Tasks
- [x] Claims listing in the fast-path section
- [x] Remove payment section for claims
- [x] Optional supporting documents
- [x] Submit via dispute API; no reopen
- [x] Unit tests (11) and mocked-backend browser tests (6)
- [ ] Ticket list / thread / reply / mark-resolved via the chat API
- [ ] Service-line grievances once backend + CRM support them
