# Design

## Context

The Habit Health Wallet Passbook API (`/wallet/api/v1/wallet_passbook`) provides the ledger of all wallet adjustments. The response returned for a member's UHID (`user_code`) contains 28 entries with fields:
`id`, `g_creation_time`, `txn_type` (`DEBIT` / `RECHARGE`), `txn_amount`, `credit_debit` (`D` / `C`), `user_code`, `previous_bal`, `updated_bal`, and related metadata.

While this captures the balance changes, the member needs to know:
1. Was this a Claim (Reimbursement) or a Cashless booking?
2. What was the Claim ID or Order ID?
3. Which of the 9 OPD benefit categories did it consume?
4. What was the date and time?
5. How much was deducted/credited and what was the balance?
6. Can noise entries (e.g. rapid testing reversals within 100ms) and duplicates be cleanly filtered out?

## Architecture & Data Flow

```
+------------------------------------+      +----------------------------------------+
|        wallet_passbook API         |      |        opd_consumption_cycle API       |
|  (id, txn_amount, g_creation_time, |      |  (wallet_txn_id, reference_id, route,  |
|   credit_debit, previous_bal, …)   |      |   category_code, occurred_at, …)       |
+-----------------+------------------+      +-------------------+--------------------+
                  |                                             |
                  +---------------------+-----------------------+
                                        |
                                        v
                       +----------------------------------+
                       |      Passbook Correlation        |
                       |         & Deduplication          |
                       |             Mapper               |
                       +----------------+-----------------+
                                        |
                                        v
                       +----------------------------------+
                       |    EnrichedWalletPassbookItem    |
                       | - id, referenceId (CLM / SR)     |
                       | - transactionType (CLAIM/CASHLESS|
                       | - category (1 of 9 OPD names)    |
                       | - occurredAt (Date + Formatted)  |
                       | - amount (+/- Money), balAfter   |
                       | - isReversed / isFilteredNoise   |
                       +----------------+-----------------+
                                        |
                        +---------------+---------------+
                        |                               |
                        v                               v
             +--------------------+          +--------------------+
             |     WalletPage     |          |    WalletLedger    |
             |  (Recent Activity) |          | (/member/transact.)|
             +--------------------+          +--------------------+
```

## Key Mechanisms

### 1. Allocation-Aware UHID Resolution & GET_MY_CONFIG Fallback
- For **FLOATER** policies: The wallet is pooled at the primary member level. The API is called with `args=user_code:{primaryMemberUhid}`.
- For **INDIVIDUAL** policies: Each member has an isolated wallet allocation. The API is called with `args=user_code:{activeDependentUhid}`.
- **GET_MY_CONFIG Fallback Mechanism**:
  - The live backend API `GET_FAMILY_LIST` (`user_relationship_mapping`) omits the `uhId` field on the signed-in primary member's resource (setting it to `null`).
  - Instead of hardcoding fallback strings, the system inspects `GET_MY_CONFIG` (`application_master?queryId=GET_MY_CONFIG`) via `UserInfoStore.getUhid()`.
  - `UserInfoStore.extractUhidFromUserInfo()` inspects `user_roles[0].uhid` and root attributes from the active session.
  - In `family-mapper.ts`, `toFamilyMember(resource, userId, configUhId)` maps `isSelf` members to `configUhId` when `resource.uhId` is empty or null.
  - In `PolicyStore`, both `resolveAndLoadWallet()` (`wallet?queryId=GET_PAGE...`) and `fetchWalletPassbook()` (`wallet_passbook?queryId=GET_WALLET_PASSBOOK...`) use `UserInfoStore.getUhid()` as the verified fallback target UHID.

### 2. Multi-Tier Correlation
To link a passbook entry to clinical consumption metadata:
1. **Tier 1 (Direct ID Link)**: Match `passbook.id === cycle.wallet_txn_id` or `passbook.id === cycle.wallet_block_id`.
2. **Tier 2 (Temporal & Financial Proximity)**: If no direct ID match, match entries where `Math.abs(cycle.occurred_at - passbook.g_creation_time) <= 5000` (within 5 seconds) and `Number(cycle.delta_amount ?? cycle.covered_amount) === Number(passbook.txn_amount)`.

### 3. Attribute Derivation
- **Transaction Type**:
  - If `cycle.route?.toUpperCase()` in `['CLAIM', 'CLAIMS']`: `'Claim'`
  - If `cycle.route?.toUpperCase()` in `['CASHLESS']`: `'Cashless'`
  - If `passbook.txn_type === 'RECHARGE'` or `passbook.credit_debit === 'C'`: `'Recharge'`
  - Fallback for unmatched debit: `'Cashless'` (or `'Debit'`).
- **Reference ID**:
  - If matched with cycle, use `cycle.reference_id` (e.g. `CLM-2026-00588`, `OPD-2026-00467`, `SR-10294`).
  - Fallback: `TXN-${passbook.id.slice(0, 8).toUpperCase()}`.
- **Category**:
  - Map `cycle.category_code` through `toBenefitCategory()` to one of the 9 canonical categories:
    `InClinicConsultation`, `OnlineConsultation`, `Pharmacy`, `Pathology`, `Radiology`, `Dental`, `Vision`, `HealthPackages`, `Vaccination`.
  - Fallback for Recharges: `'Wallet Top-up'`.
  - Fallback for general debits: `'General OPD'`.

### 4. De-duplication and Noise Filtering Algorithm
1. **Deduplication by ID**: Filter records through a `Set<string>` of seen IDs.
2. **Noise Reversal Pair Detection**:
   - Dev testing frequently records an instant `DEBIT` of ₹X followed within seconds (e.g. < 2 seconds) by a `RECHARGE` of ₹X restoring the original balance.
   - The filtering algorithm identifies pairs `(i, j)` where:
     - `i.txn_type === 'DEBIT'` and `j.txn_type === 'RECHARGE'`
     - `i.txn_amount === j.txn_amount`
     - `|j.g_creation_time - i.g_creation_time| < 2000` (within 2 seconds)
     - `j.updated_bal === i.previous_bal`
   - Both transactions in this pair are marked as noise reversals and filtered from the standard member view, eliminating noise clutter.

### 5. Multi-Source Wallet Total Reconciliation (Wallet API + OPD Consumption Cycles)
To prevent the wallet consumption UI from disappearing when `OpdWalletAccountDto` is loaded:
- **Allocation Preservation**: `account.total_topup_amt` in the wallet microservice only reflects manual out-of-pocket top-ups and may be `0` or null. `walletTotal.allocated` therefore computes `baseLimit + topup`, ensuring corporate policy entitlement (e.g. ₹26,000 or ₹14,000) is never zeroed out.
- **Consumption Cycle Preservation**: `walletTotal.consumed` prioritizes the real clinical consumption tracked by `opd_consumption_cycle` (`versionTotal.consumed`). If consumption cycle records exist, they are preserved rather than being overwritten by `account.total_topup_amt - account.avl_bal`.
- **Live Balance Synchronization**: `walletTotal.available` utilizes live `account.avl_bal` from the wallet account when present, synchronizing the live balance with the consumption UI.

### 6. Server-Side Pagination & Page Navigation (`GET_WALLET_PASSBOOK`)
To ensure optimal network performance and smooth user navigation:
- **Initial Query**: `PolicyStore.fetchWalletPassbook()` issues `GET /wallet/api/v1/wallet_passbook?queryId=GET_WALLET_PASSBOOK&args=user_code:{targetUhId}&page_no=0&page_size=10`, fetching 10 records.
- **Page-by-Page Navigation (`goToPassbookPage`)**:
  - Direct navigation to `pageNo` requesting 10 records with `append = false`.
  - Replaces current page records with the newly fetched page records.
  - Updates `_passbookPage` signal and re-evaluates `_passbookHasMore`.
  - Computes `_passbookTotalCount` from backend response `count` to power accurate `"Page X of Y"` page count indicators.

### 7. Common Pagination Component (`opd-wallet-pagination`)
Standardized pagination component matching the design pattern:
- **Location**: `projects/member/src/app/shared/ui/wallet-pagination.ts`.
- **Selector**: `opd-wallet-pagination`.
- **Template Structure**:
  ```html
  <nav [attr.aria-label]="ariaLabel()" class="mt-3 flex items-center justify-between gap-3">
    <button type="button" class="min-h-touch rounded-xl border border-surface-border bg-white px-4 text-sm font-medium text-brand-700 disabled:opacity-40" [disabled]="!hasPrev() || loading()" (click)="onPrev()">
      ← Previous
    </button>
    <p class="text-sm text-ink-500">Page {{ page() + 1 }} of {{ totalPages() }}</p>
    <button type="button" class="min-h-touch rounded-xl border border-surface-border bg-white px-4 text-sm font-medium text-brand-700 disabled:opacity-40" [disabled]="!hasNext() || loading()" (click)="onNext()">
      Next →
    </button>
  </nav>
  ```
- **Inputs**:
  - `page: number` (0-indexed current page)
  - `pageSize: number` (records per page, default 10)
  - `total: number | null` (total records count)
  - `hasMore: boolean` (fallback if total is null)
  - `loading: boolean` (disables buttons during in-flight network requests)
  - `ariaLabel: string` (accessible nav label)
- **Outputs**:
  - `prev: void`
  - `next: void`
  - `pageChange: number` (emits target page index)
- **Adoption**:
  - Adopted in `WalletPage` (`wallet-page.ts`) for Recent Activity transactions.
