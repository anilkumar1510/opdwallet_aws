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

### 1. Allocation-Aware UHID Resolution
- For **FLOATER** policies: The wallet is pooled at the primary member level. The API is called with `args=user_code:{primaryMemberUhid}`.
- For **INDIVIDUAL** policies: Each member has an isolated wallet allocation. The API is called with `args=user_code:{activeDependentUhid}`.

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
