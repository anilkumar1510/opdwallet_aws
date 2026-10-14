## Why

The Twenty CRM `claim-grievance` app and the habit-opd `dispute` API exist for reimbursement claims, while the member portal's Support page (`/member/helpline`) was a static demo that saved nothing. Members could not raise a grievance that reached the support team.

## What Changes

Builds on the static grievance demo (`features/misc/helpline-page.ts`, `features/support/grievance.data.ts`) and changes only what is needed to make **claims** real:

- "Claims that need your help" reads the same paginated claims listing API as the Claims page.
- Claim detail drops the Amount / payment section (claims are reimbursements).
- The raise form gets an optional supporting-documents upload (DMS) for claims.
- "Send to support" on a claim calls `POST /habit-opd/api/v1/dispute` (`action=submit`); the backend stores the grievance.
- The member can no longer reopen a closed ticket; Mark resolved stays final.
- The wireframe "Static demo" banner is removed; simulated support buttons are hidden for real claims.
- "Something else?" call and email buttons work (copy number on desktop, prefilled mailto).
- Tickets raised in a browser tab survive a refresh (`sessionStorage` stopgap).
- New `core/disputes/dispute.api.ts`: submit + document upload.

## Capabilities

### New Capabilities
- `claim-grievance-support`: member-side grievance flow for reimbursement claims on the Support page.

### Modified Capabilities
None.

## Impact

- `projects/member/src/app/features/misc/helpline-page.ts` (edited), `core/disputes/dispute.api.ts` (new).
- Calls `GET claim` (`GET_CLAIMS_BY_USER`), `POST /dms/api/v1/emrImage`, `POST /habit-opd/api/v1/dispute`.
- Not changed: services (non-claim) grievances stay static demo; ticket list, chat history, member reply and mark-resolved have no backend API yet (see `PLACEHOLDER-APIS.md` section 7).
