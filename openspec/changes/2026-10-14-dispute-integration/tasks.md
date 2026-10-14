## 1. API Layer

- [x] 1.1 Add `core/disputes/dispute.api.ts` with `submit` (encoded `resource`, signed, `errCode` handling) and `uploadDocument` (DMS, 5 MB cap).
- [x] 1.2 Fall back to the session member when the family list has not loaded.

## 2. Support Page

- [x] 2.1 Read "Claims that need your help" from the paginated claims listing (5 at a time, Load more).
- [x] 2.2 Hide the Amount / payment section for reimbursement claims.
- [x] 2.3 Add optional supporting-documents upload to the raise form (claims).
- [x] 2.4 Call the dispute API on Send to support; show the API error and create no ticket on failure.
- [x] 2.5 Remove member reopen; keep Mark resolved final.
- [x] 2.6 Remove the wireframe "Static demo" banner; hide simulated support buttons for real claims.
- [x] 2.7 Make "Something else?" call (copy on desktop) and email (prefilled mailto) work.
- [x] 2.8 Keep tickets raised in a tab across a refresh (`sessionStorage`).

## 3. Verification

- [x] 3.1 Unit tests for the API service (12).
- [x] 3.2 Browser tests against mocked backend responses (19): list, detail, submit body, errors, edge cases, no reopen, refresh.
- [x] 3.3 Production build with no errors.
- [ ] 3.4 End-to-end against the real habit-opd backend and database.

## 4. Pending backend APIs

- [ ] 4.1 Ticket list and chat history; replace the `sessionStorage` stopgap.
- [ ] 4.2 Member reply and mark resolved.
- [ ] 4.3 Service-line (non-claim) grievances once backend and CRM support them.
- [ ] 4.4 Confirm signing pattern, `claim_id` format, `benefit_category`, `document_ids`, ticket id field.
