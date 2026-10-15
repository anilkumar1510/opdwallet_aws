# Placeholder APIs — claims documents + bank details

UI-only work landed for the claim-documents-by-category matrix and the payout
bank account. No backend integration was done. Everything below is captured in
the UI and held locally (in-memory + `localStorage`) so the flow is testable end
to end. Each entry is the endpoint that must exist to make it real, with the
parameters the UI already collects.

## 1. Bank details (payout account)

Captured once on the first claim, reused after. Held by
`core/member/bank-details.store.ts` in `localStorage` key `opd.bankDetails.placeholder`.

- **GET `member/profile/bank-details`** → `{ accountHolderName, accountNumber, ifsc, bankName } | null`
  - Replaces `readStored()` on load.
- **PUT `member/profile/bank-details`**
  - Body: `{ accountHolderName: string, accountNumber: string, ifsc: string, bankName: string }`
  - Replaces `save()` writing to `localStorage`.
  - Server should validate IFSC + account number and store against the member (primary).
- **POST `member/profile/bank-details/cheque`** (multipart) — **cancelled cheque**
  - Body: `cheque` file (PDF or image, ≤ 5 MB).
  - Today only the file NAME is kept (`BankDetails.cancelledChequeName`); the bytes
    are captured and logged as a placeholder, never uploaded. The upload is
    **mandatory on first capture** and enforced in the UI.

Wired in: `new-claim-page.ts` (first-claim capture + gate, incl. required cheque)
and `profile-page.ts` (view / edit, incl. cheque replace).

## 2. Create-claim — new parameters

`POST member/claims` (`toClaimFormData` in `core/claims/claim.mapper.ts`) is
unchanged. These are collected by the form but **not yet sent**:

- **`purchaseLocation: string`** — the second location. Two-location categories
  (matrix): Pharmacy (clinic + pharmacy), Pathology and Radiology/Cardiology
  (doctor + diagnostic centre), Vision (clinic + optician). Today only
  `providerName` (first location) is transmitted; `purchaseLocation` is captured
  and logged as a placeholder.
- **Per-document `documentType`** — each uploaded file should carry its slot type
  (`INVOICE | PRESCRIPTION | REPORT | OTHER`). Currently every file is appended
  under the generic `documents` field with no type. The `resubmit-documents`
  endpoint already takes typed documents; the create endpoint should too.
- **`dentalSubType: 'consultation' | 'procedure'`** — drives whether a lab report
  is required for Dental. Chosen in the UI; not sent. Ideally the category master
  splits Dental into two categories instead, making this unnecessary.

## 3. Claim categories — full set per plan

`GET member/claims/available-categories` returns only the categories a plan has
configured. For testing, `withPlaceholderCategories()` (in `claim.mapper.ts`)
fills in every canonical category the plan is missing, flagged `isPlaceholder`
and shown as "(test — not on plan)". The balance gate is skipped for these.

- **Remove or gate behind a test flag** once real plans carry the full set, or
  once a dedicated "claimable categories" endpoint exists. A real submission of a
  placeholder category would be rejected server-side.

## 4. Claim cost estimate (Review step money rules)

The 3-step form's Review step shows a full payment breakdown, computed live:
bill → per-claim cap → per-transaction cap → co-payment → reimbursable → wallet
debit (bounded by balance) → out-of-pocket.

**Now REAL (Option A wired):** `available-categories` was extended
(`memberclaims.service.ts`) to also return `copay { mode, value }` (wallet-level,
e.g. 20%) and `serviceTransactionLimits` per category. The form uses the real
co-payment and, for the per-transaction cap, the **smallest** per-service limit
(the claim names no service, so the most restrictive applies).

**Still PLACEHOLDER as a fallback** (`core/claims/claim-rules.ts`): only used
when the API omits copay / transaction limits for a category (e.g. a category
with no `serviceTransactionLimits`, or the test/placeholder categories). Those
rows are labelled "· placeholder" on screen.

**Note for the Habit backend:** whatever serves `member/claims/available-categories`
there must include `copay` and `serviceTransactionLimits` too, or the breakdown
silently falls back to placeholder values.

- **POST `member/claims/estimate`** (or a claims cover-check) →
  `{ eligibleAmount, perClaimLimit, perTransactionLimit, copayPercent, copayAmount, walletDeduction, outOfPocket, deductible }`
  - Would let the Review step show the real co-payment, per-transaction cap and
    deductible before the member submits, instead of estimates. The submit
    response already returns capping (`wasCapped`, `cappedAmount`,
    `perClaimLimitApplied`); this is the same computation, moved before submit.

## 5. Claim payment / credit details

The full claim status lifecycle is now mapped (`claim.mapper.ts` STATUSES —
draft → submitted → unassigned → assigned → under review → documents
required/received → approved / partially approved → payment
pending/processing/completed → closed / rejected / cancelled). For payout-stage
statuses the claim detail page shows a **Payment** section.

- The claim payload carries **no payment fields** yet. The section shows the
  approved amount and the payout account, but **payment reference** and
  **credited-on** date read "Awaiting payout details" (placeholder).
- The claim record already defines these server-side (patient-flows claim record
  table): `paymentStatus, paymentId, transactionId, paymentDate,
  paymentReferenceNumber, paymentMode`. Return them on `member/claims/:id` and
  drop them into the Payment section to make it real.

## 6. File size

Max upload size is now **5 MB** across claim submission and document resubmission
(`new-claim-page.ts` `MAX_BYTES`, `claim.mapper.ts` `RESUBMIT_MAX_BYTES`). The
server-side multer limit should match.

## 7. Grievance / dispute (Support, `/member/helpline`)

The Support page (static demo by Nitendra, `features/misc/helpline-page.ts` +
`features/support/grievance.data.ts`) is wired to the real backend for
**reimbursement claims**. Services (consultation, pharmacy, lab, …) stay on the
static demo data until the backend and Twenty support them. All calls go through
`core/disputes/dispute.api.ts` (and `claim-pages.ts`); host is the dev proxy /
`apiBaseUrl` (`https://api.habithealth.com`), nothing is hard-coded to `localhost:8090`.

| What | Call |
|---|---|
| Claims that need help | `GET habit-opd/api/v1/claim?queryId=GET_CLAIMS_BY_USER&page_no=N&page_size=20` (page 0 via `ClaimsStore`, later pages via `ClaimPages`; 5 shown at a time; repeats removed) |
| Raise a grievance | `POST habit-opd/api/v1/dispute` `action=submit`. Response `resource[0]` has `id` (uuid), `name` / `ticket_id` (DIS-2026-xxxxx) |
| My tickets + status | `GET habit-opd/api/v1/dispute?queryId=GET_PAGE&page_no&page_size=20` (all pages) |
| Thread | `GET habit-opd/api/v1/dispute?queryId=GET_DISPUTE_MESSAGES&args=dispute_id:<uuid>&page_no&page_size=20` (all pages) |
| Member reply | `POST habit-opd/api/v1/dispute` `action=userReply`, `resource` = base64 `{resourceType:"Dispute",name,id}`, `args=messageText:<text>` |
| Member closes the ticket | `POST habit-opd/api/v1/dispute` `action=userResolve`, `resource` as for a reply, no `args`. The backend sets the status to RESOLVED and the last sender to MEMBER |
| Supporting document (optional) | upload `POST /dms/api/v1/emrImage` (same as the claim form; PDF, Word or image, 5 MB each, several at once), then send in the submit's `documents` array. Demo orders keep the demo picker (nothing uploaded) |
| Open an attached document | `GET /dms/api/v1/emrImage/image-response-entity?args=id:<document_id>&application=dms` (downloaded as a file) |

Requests are form-urlencoded; `resource` is URL-encoded base64, signed over
`resource&action=<action>` through `AppService.addXsrfToken`. `errCode: -1` is a
failure even on HTTP 200.

**Submit payload:** `claim_id, member_name, patient_name, relation_to_member,
category (CLAIM), dispute_type (GENERAL), benefit_category, selected_reason,
dispute_status (OPEN)`, plus optional `final_reason` (the member's own words;
this is the backend's field for them) and `documents` (`name, document_id,
document_type, originalname, verification_status, filetype, filesize`).
The same words are also sent as the first `userReply` so the thread shows them
(retried once after the 3 s guard; if it still fails the text goes back in the
reply box).

**Ticket state** comes from `dispute_status` (display text): contains
resolved/closed means closed; "awaiting user/member" means support has replied;
anything else is with support. On a closed ticket `final_reason` is shown as
support's resolution only once it differs from the member's first message (submit
puts the member's words there; support's resolution later replaces them). Tickets
and the open thread refresh every 30 s while the page is open. Nothing is stored
in the browser.

**Not available yet (no API):** notifications (in-app, WhatsApp, email), service-line
(non-claim) grievances and their orders, central configuration (reason lists,
raise window, support phone and email: placeholders `1800-000-0000` /
`support@opdwallet.com`). **No reopen:** the member cannot reopen a closed ticket.

### For the backend team (checked against `new_prod` source and the live API, 15 Oct 2026)
Already done by the backend (read from the `new_prod` source; not yet exercised live, see the last item):
- **Member "Mark resolved"** is `userResolve`; the portal now uses it.
- **One open ticket per claim** and the **3-month window** (90 days from the claim's `treatment_date`) are enforced in `submit`.
- **`description`** is a new field on the dispute.
- Status ids and names are confirmed (`OPEN`, `AWAITING_EXECUTIVE_RESPONSE`, `AWAITING_USER_RESPONSE`, `RESOLVED`, `CLOSED`).

Still needs a backend change:
1. **`GET_CLAIMS_BY_USER` paging is still broken on the live API (critical).** At `page_size=20`, four pages returned 49 rows but only 32 distinct claims; `page_size=100` page 0 returns all 49. The portal reads one page of 100 and removes repeats; please fix the sort/offset so paging is deterministic.
2. **`userReply` cannot carry a comma or a colon.** `args` is parsed as comma-separated `name:value` pairs; quoting and escaping do nothing. The portal swaps `,` for `‚` (U+201A) and `:` for `∶` (U+2236). Please support escaping or a body field for the text.
3. **Status text written by the code differs from the declared values.** The decorator writes "Awaiting executive response" and "Awaiting user response", while the enum ids are `AWAITING_EXECUTIVE_RESPONSE` / `AWAITING_USER_RESPONSE` (names "Awaiting Executive Response" / "Awaiting User Response"). The portal understands every form. `adjudicate` accepts only the two mixed-case strings, `RESOLVED` and `CLOSED`, not `OPEN`.
4. **`userReply` on a RESOLVED or CLOSED ticket sets it back to "Awaiting executive response"**, i.e. it reopens it. `userResolve` and `agentResolve` check neither the owner nor the current status (`userReply` checks the owner). The portal offers neither reply nor resolve on a closed ticket; please enforce it on the server (members cannot reopen).
5. **`description` is not yet used by the portal.** Confirm it is deployed and stores the member's words; then the portal can send them there and stop putting them in `final_reason` (which support later overwrites with the resolution).
6. **Non-claim grievances.** `category` accepts only `CLAIM` and `dispute_type` only `GENERAL`; services need new values and a CRM counterpart. `benefit_category` is free text: the portal sends the claim's own category code (AHC, DENTAL, IN_CLINIC, LABS, ONLINE_CONSULTATION, PHARMACY).
7. **Member `sender_name` is a user id** (the portal shows "You").
8. **`X-XSRF-TOKEN` is not checked** on dispute reads or writes. Please confirm this is intended.
9. **DMS `image-response-entity` answers HTTP 500** for an unknown document id (404 would be right). The portal shows "This document is no longer available".
10. **Still to build:** notifications (the code has `TODO: Send notification`), a central configuration API (reasons, raise window, support phone and email), and `agentReply` has no role check yet (`TODO`).
11. **Test data to clean up** on the test account (no delete API for members): DIS-2026-00393 and 00395 to 00407 and the "[TEST]" messages.
12. **Live check outstanding:** the duplicate, 3-month and `userResolve` paths were read from source, not exercised against the live API (no more test tickets were created on the shared account). Please confirm they are deployed, or allow one more test ticket.

Handled in the portal (no backend change needed): a refusal from the server (duplicate, window, resolve) is shown as the backend's message; the 3-second same-action refusal (Send is disabled ~3 s and a refused reply is retried once automatically); status words with underscores or capitals are understood; the member's description is sent as `final_reason` and as the first message.
