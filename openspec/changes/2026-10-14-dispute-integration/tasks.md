## 1. API Layer

- [x] 1.1 `core/disputes/dispute.api.ts`: `submit` (URL-encoded `resource`, signed, `errCode` handling, returns ticket name and record id).
- [x] 1.2 `list` (`GET_PAGE`, all pages, newest first) and `messages` (`GET_DISPUTE_MESSAGES`, all pages, oldest first).
- [x] 1.3 `reply` (`userReply`, text in `args`, comma and colon swapped for lookalikes).
- [x] 1.4 `uploadDocument` (DMS, 5 MB cap) and `toDisputeDocument`; documents sent in the submit's `documents` array; member names fall back to the session member.

## 2. Support Page

- [x] 2.1 Read "Claims that need your help" from the paginated claims listing (5 at a time, Load more).
- [x] 2.2 Hide the Amount / payment section for reimbursement claims.
- [x] 2.3 Optional supporting-documents upload in the raise form (claims).
- [x] 2.4 Submit via the dispute API; the member's own words become the first message (one retry, then back into the reply box); show API errors and create no ticket on failure.
- [x] 2.5 Tickets and status from the API; thread from the API; refresh every 30 s; nothing stored in the browser.
- [x] 2.6 Reply via `userReply`: disabled while sending and for the 3 s guard, text kept on failure, 2000 character cap.
- [x] 2.7 No member reopen; hide "Mark resolved" and demo support buttons on real tickets; remove the wireframe banner.
- [x] 2.8 "Something else?" call (copy on desktop) and email (prefilled mailto) work.

## 3. Verification

- [x] 3.1 Unit tests for the API service (36): payloads, documents, signing, paging, mapping, errors, state mapping, comma/colon swap.
- [x] 3.2 Browser tests against a fake of the real API (37): list, detail, submit, first message, documents, validation, errors, double clicks, window, existing ticket, 45-message thread, support reply arriving, closed ticket, list/thread failures, reply rules, no fake actions.
- [x] 3.3 Browser tests against the REAL API (3, need `SESSION_ID`): raise with a real document (checked stored on the grievance), thread, reply, 3 s guard, refresh, expired session.
- [x] 3.4 Production build with no errors; `openspec validate --strict`.

## 4. Pending backend

- [ ] 4.1 Member "Mark resolved" action (API to be provided).
- [ ] 4.2 Escaping or a body field for reply text (commas, colons); keep `description` on submit.
- [ ] 4.3 Service-line (non-claim) grievances once backend and CRM support them.
- [ ] 4.4 Confirm `benefit_category` values.
