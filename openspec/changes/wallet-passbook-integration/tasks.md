# Tasks

## 1. DTO & Domain Model Definition
- [x] 1.1 Create `projects/member/src/app/core/wallet/wallet-passbook.dto.ts` defining `WalletPassbookDto` and `WalletPassbookItemDto` matching live API.
- [x] 1.2 Define `EnrichedWalletPassbookItem` in domain model capturing all 6 user requirements (transaction type, reference ID, category, date/time, amount, balance).
- [x] 1.3 Add `txnType`, `creditDebit`, `isCredit`, `isDebit` to `EnrichedWalletPassbookItem`.

## 2. Mapper & Correlation Logic
- [x] 2.1 Implement deduplication by unique record `id`.
- [x] 2.2 Implement sub-second reversal pair detection and banking-standard flagging (`isReversed: true`).
- [x] 2.3 Implement multi-tier correlation linking passbook items with `opd_consumption_cycle` (via `wallet_txn_id`, `wallet_block_id`, or timestamp/amount).
- [x] 2.4 Map categories to the 9 canonical OPD benefit categories (`toBenefitCategory`).
- [x] 2.5 Format dates and currency amounts in INR.
- [x] 2.6 Map transaction ID directly to `item.id` from `wallet_passbook` API.

## 3. Store Integration
- [x] 3.1 Update `PolicyStore` to expose `enrichedPassbook = computed(...)` correlating `passbook()` and `consumptionCycles()`.
- [x] 3.2 Update `WalletStore` to integrate passbook items into the unified wallet transactions signal.
- [x] 3.3 Implement `GET_MY_CONFIG` UHID fallback in `UserInfoStore`, `FamilyStore`, and `PolicyStore` when `GET_FAMILY_LIST` omits `uhId` for the primary member.
- [x] 3.4 Reconcile wallet total in `PolicyStore` to preserve policy base limit and `opd_consumption_cycle` when `OpdWalletAccountDto` is loaded.

## 4. UI Presentation
- [x] 4.1 Update `WalletPage` Recent Activity section with enriched badges (Claim / Cashless, Reference ID, 9 OPD categories, date/time, amount, balance).
- [x] 4.2 Update `WalletLedger` (`/member/transactions` and `/member/wallet`) to display the enriched passbook view.
- [x] 4.3 Apply color formatting: Red (`text-red-600`) for Debit ('D') and Green (`text-emerald-600`) for Credit ('C'), displaying native `id` with `ID: ...`.
- [x] 4.4 Add pagination with "Load more" button across `WalletPage` (5 items/batch) and `WalletLedger` (15 items/batch).

## 5. Verification & Validation
- [x] 5.1 Run `npx openspec validate wallet-passbook-integration`.
- [x] 5.2 Run `npx tsc --noEmit -p projects/member/tsconfig.app.json`.
- [x] 5.3 Verify test cases with live API payload sample.
