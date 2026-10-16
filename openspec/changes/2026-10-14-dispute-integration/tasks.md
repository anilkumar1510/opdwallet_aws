## 1. API Layer

- [x] 1.1 `core/disputes/dispute.api.ts`: `submit` (URL-encoded `resource`, signed, `errCode` handling, returns ticket name and record id).
- [x] 1.2 `list` (`GET_PAGE`, all pages, newest first) and `messages` (`GET_DISPUTE_MESSAGES`, all pages, oldest first).
- [x] 1.3 `reply` (`userReply` on `dispute_chat`, text verbatim in `message_text`, no `args`) and `resolve` (`userResolve`, ticket named by `name`).
- [x] 1.4 `uploadDocument` (DMS, 5 MB cap) and `toDisputeDocument`; documents sent in the submit's `documents` array; member names fall back to the session member.

## 2. Support Page

- [x] 2.1 Read "Claims that need your help" from the paginated claims listing (5 at a time, Load more reads one 100-row page because 20-row paging repeats page 0, repeats removed, failed read retried).
- [x] 2.2 Hide the Amount / payment section for reimbursement claims.
- [x] 2.3 Optional supporting-documents upload in the raise form (claims).
- [x] 2.4 Submit via the dispute API (the member's words in `final_reason` and `description`, no `dispute_type`); the member's own words become the first message (one retry, then back into the reply box); show API errors and create no ticket on failure.
- [x] 2.5 Tickets and status from the API; thread from the API; refresh every 30 s; nothing stored in the browser.
- [x] 2.6 Reply via `dispute_chat`: disabled while sending and for the 3 s guard, text kept on failure, 2000 character cap, a refusal on a just-closed ticket shown and the ticket refreshed.
- [x] 2.7 No member reopen; "Mark resolved" (`userResolve`) on real tickets, demo support buttons hidden; remove the wireframe banner.
- [x] 2.8 "Something else?" call (copy on desktop) and email (prefilled mailto) work.
- [x] 2.9 Real claims use the demo picker's rules (PDF, Word or image, 5 MB each, several at once, same file once) and its look; demo orders keep the demo picker (nothing uploaded).
- [x] 2.9b Show the documents attached to a ticket and download them from DMS; tap-sized targets.
- [x] 2.10 Do not present the member's own words (`final_reason`) as support's resolution.

## 3. Verification

- [x] 3.1 Unit tests for the API service (55): payloads (no `dispute_type`, `message_text`, resolve by name), documents, signing, paging, ticket de-duplication, mapping, errors, state mapping, status ids and names.
- [x] 3.2 Browser tests against a fake of the real API (74 with the phone layouts; shared fake in `fake-api.ts` models `dispute_chat`, `userResolve`, closed-ticket refusal): list, detail, claim paging, submit, first message, documents, validation, errors, double clicks, window, existing ticket, 45-message thread, support reply arriving, closed ticket, Mark resolved, reply on a just-closed ticket, list/thread failures, reply rules, no fake actions.
- [x] 3.3 Browser tests against the REAL API (4, need `SESSION_ID`): raise with a real one-page PDF (stored verbatim, downloaded back intact), thread, reply, 3 s guard, Mark resolved, reload keeps it closed, expired session. They create real "[TEST]" tickets.
- [x] 3.4 Production build with no errors; `openspec validate --strict`.
- [x] 3.5 Phone layouts (emulated iPhone 13 and Pixel 7, 12 tests): no sideways scroll with long words and long file names, tap-sized buttons. Real devices by hand.
- [x] 3.6 Checked in the deployed portal (15 Oct): raise, verbatim thread and reply, Mark resolved.

## 4. Backend and other follow-ups

- [x] 4.1 Claims reachable despite the backend's unstable paging (one 100-row page, repeats removed); `benefit_category` from the claim's category code; reply retry after the 3 s guard; friendlier missing-document message; status ids and names understood.
- [x] 4.2 Replies on `dispute_chat` with text verbatim (commas and colons work); `userResolve` wired; tickets de-duplicated; `dispute_type` no longer sent.
- [ ] 4.3 Stop sending `final_reason` once a new ticket's Description is seen filled in Twenty (`daf8d03` merged in `new_prod`).
- [ ] 4.4 Backend creates the Twenty record for portal-raised tickets (none appear in the Twenty workspace yet) and sends replies to Twenty.
- [ ] 4.5 Backend fixes: `dispute_type` optional (stable claims sort is done and checked live, 16 Oct), caller checks on `adjudicate`, `agentReply` and `agentResolve` (parked).
- [ ] 4.6 Service-line (non-claim) grievances once backend and CRM support them.
- [ ] 4.7 Notifications (in-app, WhatsApp, email), central configuration (reasons, windows), real support phone and email values.
