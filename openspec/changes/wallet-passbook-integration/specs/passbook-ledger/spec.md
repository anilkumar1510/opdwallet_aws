# Spec Delta

## Purpose

Enables live querying and multi-source enrichment of wallet passbook entries with claim vs cashless classifications, reference IDs (Claim ID / Order ID), 9 OPD benefit categories, formatted timestamps and currency amounts, as well as automatic deduplication and reversal noise suppression.

## ADDED Requirements

### Requirement: Live Wallet Passbook Querying with Policy Allocation Targeting
The system SHALL retrieve wallet passbook records from `/wallet/api/v1/wallet_passbook` passing `queryId=GET_WALLET_PASSBOOK&args=user_code:{targetUhId}`, where `targetUhId` is resolved based on the policy allocation type:
- If `FLOATER`: target the primary member's UHID.
- If `INDIVIDUAL`: target the selected dependent member's UHID.

#### Scenario: Floater policy member viewing passbook
- **WHEN** the member belongs to a policy with `allocation_type === 'FLOATER'`
- **THEN** the passbook request targets the primary member's UHID `args=user_code:{primaryUhId}`

#### Scenario: Individual policy dependent viewing passbook
- **WHEN** the member belongs to a policy with `allocation_type === 'INDIVIDUAL'` and a dependent is selected
- **THEN** the passbook request targets the dependent's UHID `args=user_code:{dependentUhId}`

---

### Requirement: UHID Resolution via GET_MY_CONFIG Session Fallback
When `GET_FAMILY_LIST` (`user_relationship_mapping`) omits the `uhId` property for the signed-in member (Self / `isSelf`), the system SHALL resolve the member's UHID dynamically from the session configuration retrieved from `GET_MY_CONFIG` (`application_master`) via `UserInfoStore.getUhid()`, preventing unhandled null UHID states across wallet account and passbook API queries.

#### Scenario: Primary member has null uhId in family list
- **WHEN** `GET_FAMILY_LIST` returns a primary member record where `uhId` is null or empty
- **THEN** `family-mapper` resolves the member's `uhid` using `UserInfoStore.getUhid()` from `GET_MY_CONFIG`
- **AND** `PolicyStore.resolveAndLoadWallet()` triggers `GET /wallet/api/v1/wallet?queryId=GET_PAGE&filter=user_code:{configUhId},status_id:active`
- **AND** `PolicyStore.fetchWalletPassbook()` queries `GET /wallet/api/v1/wallet_passbook?queryId=GET_WALLET_PASSBOOK&args=user_code:{configUhId}`

#### Scenario: Dependent member has explicit uhId in family list
- **WHEN** `GET_FAMILY_LIST` returns a dependent member record with an explicit non-null `uhId`
- **THEN** the dependent's explicit `uhId` is preserved and used for individual allocation queries

---

### Requirement: Wallet Total & Consumption Preservation
The system SHALL reconcile live wallet account details with policy version limits and consumption cycles:
1. `allocated` SHALL equal `basePolicyLimit + topup`, ensuring corporate entitlement is preserved even if `account.total_topup_amt` is zero or omitted.
2. `consumed` SHALL prioritize clinical consumption recorded in `opd_consumption_cycle` (`versionTotal.consumed`), falling back to `allocated - available` only if no consumption cycle records exist.
3. `available` SHALL reflect live `account.avl_bal` from the wallet account when available.

#### Scenario: Wallet account loaded with zero total_topup_amt
- **WHEN** a live wallet account record is loaded with `total_topup_amt: 0` and `avl_bal: 5000`
- **AND** the active policy version specifies an annual limit of `₹26,000`
- **THEN** `walletTotal.allocated` evaluates to `₹26,000` (not `₹0`)
- **AND** `hasPolicy()` remains `true`
- **AND** `walletTotal.consumed` retains the consolidated consumed sum from `opd_consumption_cycle`
- **AND** the consumption UI (Used, Allocated, Left, progress bar) remains visible

---

### Requirement: Transaction Type Classification
Each passbook entry SHALL be classified as either a `Claim` (Reimbursement), `Cashless` booking, or `Recharge` / `Wallet Credit`.

#### Scenario: Passbook item correlated with reimbursement claim
- **WHEN** a passbook entry is linked to an `opd_consumption_cycle` with `route` in `['CLAIM', 'CLAIMS']` or a reference ID starting with `CLM`
- **THEN** the transaction type is resolved as `'Claim'`

#### Scenario: Passbook item correlated with cashless booking
- **WHEN** a passbook entry is linked to an `opd_consumption_cycle` with `route === 'CASHLESS'` or a reference ID starting with `SR` or `ORD`
- **THEN** the transaction type is resolved as `'Cashless'`

#### Scenario: Passbook item with credit or recharge
- **WHEN** a passbook entry has `txn_type === 'RECHARGE'` or `credit_debit === 'C'`
- **THEN** the transaction type is resolved as `'Recharge'`

---

### Requirement: Transaction ID Display from Wallet History API
The system SHALL display the exact transaction `id` received from the `wallet_passbook` (wallet history) API for each transaction (rather than external reference IDs), enabling direct auditability against the wallet ledger.

#### Scenario: Displaying transaction ID
- **WHEN** a passbook entry is rendered
- **THEN** its native `id` (e.g. `a0e0d460-cbee-11f1-b1eb-aab44f800ff9-88`) from the wallet history API is displayed

---

### Requirement: 9 OPD Benefit Category Mapping
The system SHALL resolve the transaction's benefit category into one of the 9 standard OPD benefit categories:
1. Online Consultation
2. In-Clinic Consultation
3. Pharmacy
4. Pathology (Labs)
5. Radiology & Diagnostics
6. Dental Services
7. Vision Care
8. Vaccination
9. Health Packages

#### Scenario: Category code present in cycle
- **WHEN** a correlated cycle specifies `category_code` (e.g. `IN_CLINIC`, `ONLINE_CONSULT`, `PHARMACY`, etc.)
- **THEN** the system maps the code through `toBenefitCategory` and displays the canonical benefit name

#### Scenario: Recharge or general adjustment
- **WHEN** the transaction is a wallet recharge without a specific clinical benefit category
- **THEN** the category label displays `'Wallet Top-up'`

---

### Requirement: Transaction Timestamp and Financial Presentation
The system SHALL format `g_creation_time` into a readable date and time string and present the transaction amount with directional indicators and explicit color coding based on `credit_debit`:
- For Debit (`credit_debit === 'D'` / `txn_type === 'DEBIT'`): formatted in **Red** (`text-red-600`) with a minus sign (`−₹...`).
- For Credit (`credit_debit === 'C'` / `txn_type === 'RECHARGE'`): formatted in **Green** (`text-emerald-600`) with a plus sign (`+₹...`).
- Post-transaction wallet balance (`updated_bal`) SHALL be displayed alongside (`Bal: ₹...`).

#### Scenario: Rendering debit transaction in red
- **WHEN** rendering a debit entry with amount 3000 and updated balance 11000
- **THEN** it displays in red `- ₹3,000` with running balance `Bal: ₹11,000` and formatted timestamp

#### Scenario: Rendering recharge transaction in green
- **WHEN** rendering a recharge entry with amount 1000 and updated balance 15000
- **THEN** it displays in green `+ ₹1,000` with running balance `Bal: ₹15,000` and formatted timestamp

---

### Requirement: Banking Standard Ledger Retention and Reversal Flagging
The system SHALL follow banking standard ledger auditability by retaining all transaction records in the passbook view, flagging sub-second auto-reversals with `isReversed: true`, visual strikethrough styling, and a `Reversed` badge rather than silently dropping them from the member view. Duplicate records sharing the same unique `id` SHALL be deduplicated.

#### Scenario: Duplicate ID in API response
- **WHEN** multiple entries share the exact same `id`
- **THEN** only the first occurrence is retained

#### Scenario: Sub-second auto-reversal identification
- **WHEN** a DEBIT of amount $X$ is immediately followed within 2 seconds by a RECHARGE of amount $X$ that restores the exact prior balance
- **THEN** both records are retained in the ledger, classified with `isReversed: true`, and displayed with a `Reversed` badge and strikethrough amount styling

---

### Requirement: Transaction Pagination with Load More
The system SHALL paginate passbook transactions using an incremental "Load more" action.
- In `WalletPage` Recent Activity, the view SHALL initially render 5 transactions; clicking "Load more" SHALL append the next 5 transactions until all entries are displayed.
- In `WalletLedger` (`/member/transactions`), the view SHALL initially render 15 transactions; clicking "Show more" / "Load more" SHALL append the next 15 transactions.

#### Scenario: User clicks Load More in Recent Activity
- **WHEN** there are more transactions than currently visible in Recent Activity
- **THEN** a "Load more transactions (showing X of Y)" button is rendered, and activating it increases the visible count by 5
