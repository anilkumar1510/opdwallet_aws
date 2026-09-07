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

## 5. File size

Max upload size is now **5 MB** across claim submission and document resubmission
(`new-claim-page.ts` `MAX_BYTES`, `claim.mapper.ts` `RESUBMIT_MAX_BYTES`). The
server-side multer limit should match.
