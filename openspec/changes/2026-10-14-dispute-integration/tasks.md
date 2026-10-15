## 1. API Layer

- [x] 1.1 `core/disputes/dispute.api.ts`: `submit` (URL-encoded `resource`, signed, `errCode` handling, returns ticket name and record id).
- [x] 1.2 `list` (`GET_PAGE`, all pages, newest first) and `messages` (`GET_DISPUTE_MESSAGES`, all pages, oldest first).
- [x] 1.3 `reply` (`userReply`, text in `args`, comma and colon swapped for lookalikes).
- [x] 1.4 `uploadDocument` (DMS, 5 MB cap) and `toDisputeDocument`; documents sent in the submit's `documents` array; member names fall back to the session member.

## 2. Support Page

- [x] 2.1 Read "Claims that need your help" from the paginated claims listing (5 at a time, Load more reads one 100-row page because 20-row paging repeats page 0, repeats removed, failed read retried).
- [x] 2.2 Hide the Amount / payment section for reimbursement claims.
- [x] 2.3 Optional supporting-documents upload in the raise form (claims).
- [x] 2.4 Submit via the dispute API (the member's words in `final_reason`); the member's own words become the first message (one retry, then back into the reply box); show API errors and create no ticket on failure.
- [x] 2.5 Tickets and status from the API; thread from the API; refresh every 30 s; nothing stored in the browser.
- [x] 2.6 Reply via `userReply`: disabled while sending and for the 3 s guard, text kept on failure, 2000 character cap.
- [x] 2.7 No member reopen; hide "Mark resolved" and demo support buttons on real tickets; remove the wireframe banner.
- [x] 2.8 "Something else?" call (copy on desktop) and email (prefilled mailto) work.
- [x] 2.9 Real claims use the demo picker's rules (PDF, Word or image, 5 MB each, several at once, same file once) and its look; demo orders keep the demo picker (nothing uploaded).
- [x] 2.9b Show the documents attached to a ticket and download them from DMS; tap-sized targets.
- [x] 2.10 Do not present the member's own words (`final_reason`) as support's resolution.

## 3. Verification

- [x] 3.1 Unit tests for the API service (46): payloads, documents, signing, paging, mapping, errors, state mapping, comma/colon swap.
- [x] 3.2 Browser tests against a fake of the real API (53 desktop + 12 phone; shared fake in `fake-api.ts`), including claim paging, documents and `final_reason`: list, detail, submit, first message, documents, validation, errors, double clicks, window, existing ticket, 45-message thread, support reply arriving, closed ticket, list/thread failures, reply rules, no fake actions.
- [x] 3.3 Browser tests against the REAL API (3, need `SESSION_ID`): raise with a real document (checked stored, `final_reason` verbatim, downloaded back intact), thread, reply, 3 s guard, refresh, expired session.
- [x] 3.5 Phone layouts (emulated iPhone 13 and Pixel 7, 12 tests): no sideways scroll with long words and long file names, tap-sized buttons. Real devices by hand.
- [x] 3.4 Production build with no errors; `openspec validate --strict`.

## 4. Pending backend

- [x] 4.0 Replies moved to `dispute_chat` (backend change, 15 Oct): text sent in the resource and in `args`; refusal on a closed ticket shown and the ticket refreshed; verified live.
- [x] 4.1 Member "Mark resolved" (`userResolve`, ticket named by `name` only) wired and verified live; backend still to add owner and status checks.
- [ ] 4.2 Escaping or a body field for reply text (commas, colons); `description` is deployed and sent next to `final_reason`; the backend passes only `final_reason` to the support system, so it stays.
- [ ] 4.3 Service-line (non-claim) grievances once backend and CRM support them.
- [ ] 4.4 Confirm `benefit_category` values.
- [ ] 4.5 Notifications (in-app, WhatsApp, email), central configuration (reasons, windows, support phone and email), real support phone and email values.

- [x] 4.1 Claims paging fixed for the real API bug (all claims reachable); `benefit_category` from claim category code; auto-retry of a reply refused by the 3-second guard; friendlier missing-document message; status codes with underscores.
