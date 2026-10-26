# Proposal

## Why

The member application needs to provide users with a transparent and unified record of their wallet transactions. The backend exposes `wallet_passbook` (`GET /wallet/api/v1/wallet_passbook?queryId=GET_WALLET_PASSBOOK&args=user_code:{uhId}`), which acts as the financial ledger (recording transaction amounts, credit/debit directions, previous and updated balances, and creation timestamps). 

However, raw passbook items do not natively carry clinical transaction metadata such as whether an event was a cashless booking or a reimbursement claim, its specific Claim ID (`CLM-...`) or Order ID (`SR-...`), or which of the 9 OPD benefit categories it belongs to. Furthermore, in test/dev environments and rapid retry conditions, identical records can be returned, and sub-second auto-reversals (rapid DEBIT followed immediately within milliseconds by a RECHARGE of identical amount) introduce noise that pollutes the member's transaction ledger.

This change enriches the live wallet passbook by correlating it with `opd_consumption_cycle` records, resolving all 6 essential transaction attributes (Type, ID, 9 OPD Categories, Date & Time, Amount, and Running Balance), while filtering out duplicate records and instant reversal noise.

## What Changes

- **Live Passbook & Wallet API Querying**: Integrates `GET /wallet/api/v1/wallet_passbook?queryId=GET_WALLET_PASSBOOK&args=user_code:{uhId}` and `GET /wallet/api/v1/wallet?queryId=GET_PAGE&filter=user_code:{uhId},status_id:active` into `PolicyStore` and `WalletStore`, dynamically selecting between Floater (primary member UHID) and Individual (active dependent UHID) policy allocations.
- **Dynamic UHID Resolution via `GET_MY_CONFIG`**: When `GET_FAMILY_LIST` (`user_relationship_mapping`) omits the `uhId` for the signed-in primary member (`isSelf`), the system dynamically resolves the canonical `uhid` from the session configuration (`GET_MY_CONFIG` in `UserInfoStore`) without relying on hardcoded identifiers.
- **DTOs and Data Mapping**: Defines `WalletPassbookDto` and `WalletPassbookItemDto` matching the live API payload.
- **Multi-Source Enrichment via Consumption Cycles**: Correlates passbook ledger items with `opd_consumption_cycle` (via `wallet_txn_id`, `wallet_block_id`, or timestamp/amount correlation) to resolve:
  1. **Transaction Type**: Distinguishes between `Claim` (Reimbursement), `Cashless`, and `Recharge` / `Wallet Credit`.
  2. **Reference ID**: Extracts real Claim ID (`CLM-...` / `OPD-...`) or Order ID (`SR-...`), with fallback to transaction identifier.
  3. **Category Resolution**: Maps category codes to the 9 standard OPD benefit categories (`Online Consultation`, `In-clinic Consultation`, `Pharmacy`, `Pathology`, `Radiology`, `Dental`, `Vision`, `Vaccination`, `Health Packages`).
  4. **Date & Time Formatting**: Formats Unix epoch milliseconds into readable localized date and time strings.
  5. **Amount & Balance**: Displays directional currency amounts (`+₹` / `−₹`) alongside the resulting running balance (`Bal: ₹...`).
- **De-duplication & Reversal Noise Filtering**:
  - Drops duplicate entries sharing the same transaction `id`.
  - Suppresses sub-second paired debit-recharge test noise (e.g. DEBIT followed within seconds by identical RECHARGE restoring previous balance).
- **UI Integration**:
  - Updates `WalletPage` "Recent activity" section to render enriched passbook items.
  - Updates `WalletLedger` (`/member/transactions` and `/member/wallet`) to display the unified enriched passbook with transaction type badges, reference IDs, and category labels.

## Capabilities

### New Capabilities
- `wallet-passbook-integration`: Enriches live wallet passbook data with clinical route (claim vs cashless), reference ID, 9 OPD categories, formatted timestamp, amount, and de-duplication/reversal noise filtering across member wallet screens.

### Modified Capabilities
- None

## Impact

- `projects/member/src/app/core/wallet/wallet-passbook.dto.ts` (new DTOs)
- `projects/member/src/app/core/wallet/wallet-passbook.mapper.ts` (new correlation mapper and filtering logic)
- `projects/member/src/app/core/member/policy.store.ts` (signal storage for enriched passbook)
- `projects/member/src/app/core/wallet/wallet.store.ts` (consumption cycle correlation in wallet store)
- `projects/member/src/app/features/wallet/wallet-page.ts` (recent activity view integration)
- `projects/member/src/app/features/wallet/wallet-ledger.ts` (enhanced ledger rendering)
