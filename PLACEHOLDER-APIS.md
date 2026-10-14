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
**reimbursement claims only**. Services (consultation, pharmacy, lab, …) stay on
the static demo data until the backend and Twenty support them.

- **Real — claims list:** "Claims that need your help" reads the same paginated
  listing as the Claims page (`claim` / `GET_CLAIMS_BY_USER`, 20 per page, shown
  5 at a time with Load more) via `ClaimsStore.getClimListData()`.
- **Real — submit:** `POST /habit-opd/api/v1/dispute`, `action=submit`.
  Form-urlencoded `resource` (base64 JSON), `application=habit-opd`, `action=submit`;
  signed over `resource&action=submit` like `new-claim-page.ts`. Success is
  `errCode !== -1`. Code: `core/disputes/dispute.api.ts` (`DisputeApi.submit`).
  Payload: `claim_id, member_name, patient_name, relation_to_member, category
  (CLAIM), dispute_type (GENERAL), benefit_category, selected_reason,
  dispute_status (OPEN)` plus optional `description` and `document_ids`.
- **Real — supporting documents (optional):** each file is uploaded to DMS
  (`POST /dms/api/v1/emrImage`, same call as the claim form) and its
  `document_id` goes in `document_ids`. Max 5 MB; PDF/JPG/PNG (no HEIC
  conversion).
- **Host:** the dev proxy (`proxy.conf.json`) and `environment.apiBaseUrl`
  (`https://api.habithealth.com`) already route `/habit-opd/api` and `/dms/api`;
  nothing is hard-coded to `localhost:8090`.
- **No reopen:** a closed ticket cannot be reopened by the member (UI removed);
  closed tickets only show the call-support prompt. Mark resolved is final.
- **Claim detail:** no Amount / payment section for reimbursement claims.

**Still placeholder (in memory, lost on reload):** reading tickets and chat
history back, member reply, mark resolved, and the executive's replies. Their
APIs have not been shared. Until then, tickets raised in a browser tab are kept
in `sessionStorage` (`opd.support.tickets.v1`) so they survive a refresh; they
are cleared when the tab closes and are not shared across devices. Replace with
the ticket-list API.

**To confirm with backend:** signing pattern (`enc&action=submit` assumed);
`claim_id` format (`OPD-2026-xxxxx`); `benefit_category` values (derived from the
claim category label, e.g. `DIAGNOSTICS`); `document_ids` / `description` keys
(assumed from the Twenty `documentIds` field); the ticket id field in the submit
response (`ticket_id` / `dispute_id` / `name` are tried, else a local id).
