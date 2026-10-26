import { BenefitCategory, benefitCategoryLabel, toBenefitCategory } from '../domain/codes';
import { OpdConsumptionCycleDto } from '../member/policy.dto';
import { WalletPassbookItemDto } from './wallet-passbook.dto';
import { EnrichedWalletPassbookItem, PassbookTransactionType } from './wallet-passbook.model';

const DATE_FORMATTER = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const TIME_FORMATTER = new Intl.DateTimeFormat('en-IN', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

/**
 * Identifies sub-second reversal pairs (DEBIT followed within 2 seconds
 * by a matching RECHARGE restoring the exact prior balance).
 * Returns the Set of transaction IDs that are part of an auto-reversal.
 */
export function identifyReversalIds(
  items: readonly WalletPassbookItemDto[],
): Set<string> {
  const reversedIds = new Set<string>();
  if (!items?.length) return reversedIds;

  for (let i = 0; i < items.length; i++) {
    const curr = items[i];
    const isDebit =
      curr.txn_type?.toUpperCase() === 'DEBIT' || curr.credit_debit?.toUpperCase() === 'D';
    if (!isDebit) continue;

    const amt = curr.txn_amount ?? 0;
    const t1 = curr.g_creation_time ?? 0;

    // Look ahead in subsequent contiguous transactions
    for (let j = i + 1; j < Math.min(i + 4, items.length); j++) {
      const nxt = items[j];
      const isRecharge =
        nxt.txn_type?.toUpperCase() === 'RECHARGE' || nxt.credit_debit?.toUpperCase() === 'C';
      if (!isRecharge) continue;

      const nxtAmt = nxt.txn_amount ?? 0;
      const t2 = nxt.g_creation_time ?? 0;

      // Check if same amount within 2000 milliseconds and balances mirror
      const isImmediatePair = Math.abs(t2 - t1) <= 2000 && Math.abs(nxtAmt - amt) < 0.01;
      const isBalanceRestored =
        curr.previous_bal != null &&
        nxt.updated_bal != null &&
        Math.abs(curr.previous_bal - nxt.updated_bal) < 0.01;

      if (isImmediatePair || isBalanceRestored) {
        if (curr.id) reversedIds.add(curr.id);
        if (nxt.id) reversedIds.add(nxt.id);
        break;
      }
    }
  }

  return reversedIds;
}

/**
 * Enriches raw wallet passbook items by correlating with clinical/order consumption cycles.
 * Retains all transactions to ensure complete banking auditability, flagging reversals
 * with `isReversed: true`.
 *
 * Resolves:
 * 1. Transaction Type (Claim vs Cashless vs Recharge)
 * 2. Native ID directly from wallet_passbook API
 * 3. Category (one of the 9 canonical OPD benefit categories or Reversal Refund)
 * 4. Date and Time (formatted)
 * 5. Directional Amount (+/- with red/green styling) and Running Balance
 * 6. Audit status (isReversed)
 */
export function mapPassbookToEnriched(
  items: readonly WalletPassbookItemDto[] | null | undefined,
  cycles: readonly OpdConsumptionCycleDto[] | null | undefined,
): EnrichedWalletPassbookItem[] {
  if (!items?.length) return [];

  // Deduplicate identical IDs if duplicate records arrive
  const seenIds = new Set<string>();
  const deduped: WalletPassbookItemDto[] = [];
  for (const item of items) {
    if (!item.id || seenIds.has(item.id)) continue;
    seenIds.add(item.id);
    deduped.push(item);
  }

  // Identify reversal pairs per banking standard (marked with isReversed: true)
  const reversedIds = identifyReversalIds(deduped);
  const cycleList = cycles ?? [];

  return deduped.map((item) => {
    const isReversed = reversedIds.has(item.id);

    // 1. Attempt correlation with consumption cycles
    let matchedCycle: OpdConsumptionCycleDto | undefined;

    // Direct ID match
    matchedCycle = cycleList.find(
      (c) => c.wallet_txn_id === item.id || c.wallet_block_id === item.id,
    );

    // Proximity match if no direct ID match (within 5 seconds and matching amount)
    if (!matchedCycle && item.g_creation_time) {
      const itemTime = item.g_creation_time;
      const itemAmt = item.txn_amount ?? 0;
      matchedCycle = cycleList.find((c) => {
        const cTime = c.occurred_at ?? c.g_creation_time ?? 0;
        const cAmt = Number(c.delta_amount ?? c.covered_amount ?? 0);
        return Math.abs(cTime - itemTime) <= 5000 && Math.abs(cAmt - itemAmt) < 0.01;
      });
    }

    // 2. Resolve Transaction Type
    let transactionType: PassbookTransactionType = 'Cashless';
    const rawTxnType = item.txn_type?.toUpperCase() ?? '';
    const rawCreditDebit = item.credit_debit?.toUpperCase() ?? '';
    const route = matchedCycle?.route?.toUpperCase() ?? '';

    if (route === 'CLAIM' || route === 'CLAIMS' || matchedCycle?.reference_id?.startsWith('CLM') || matchedCycle?.reference_id?.startsWith('OPD')) {
      transactionType = 'Claim';
    } else if (route === 'CASHLESS' || matchedCycle?.reference_id?.startsWith('SR') || matchedCycle?.reference_id?.startsWith('ORD')) {
      transactionType = 'Cashless';
    } else if (rawTxnType === 'RECHARGE' || rawCreditDebit === 'C') {
      transactionType = 'Recharge';
    } else {
      transactionType = 'Cashless';
    }

    // 3. Resolve Reference ID: user specifies showing the exact ID from the wallet history API
    const referenceId = item.id;

    // 4. Resolve 9 OPD Benefit Category
    let category: BenefitCategory = BenefitCategory.Unknown;
    let categoryLabel = '';

    if (matchedCycle?.category_code) {
      category = toBenefitCategory(matchedCycle.category_code);
      categoryLabel = benefitCategoryLabel(category, null);
    } else if (isReversed && (rawTxnType === 'RECHARGE' || rawCreditDebit === 'C')) {
      category = BenefitCategory.Unknown;
      categoryLabel = 'Reversal Refund';
    } else if (transactionType === 'Recharge') {
      category = BenefitCategory.Unknown;
      categoryLabel = 'Wallet Top-up';
    } else {
      category = BenefitCategory.Unknown;
      categoryLabel = 'OPD Benefit';
    }

    // 5. Date & Time
    const occurredAt = new Date(item.g_creation_time ?? Date.now());
    const formattedDate = DATE_FORMATTER.format(occurredAt);
    const formattedTime = TIME_FORMATTER.format(occurredAt);
    const formattedDateTime = `${formattedDate}, ${formattedTime}`;

    // 6. Financials
    const isCredit = rawCreditDebit === 'C' || rawTxnType === 'RECHARGE';
    const isDebit = rawCreditDebit === 'D' || rawTxnType === 'DEBIT';
    const amount = Number(item.txn_amount ?? 0);
    const previousBalance = Number(item.previous_bal ?? 0);
    const updatedBalance = Number(item.updated_bal ?? 0);

    return {
      id: item.id,
      referenceId,
      txnType: rawTxnType,
      creditDebit: rawCreditDebit,
      isCredit,
      isDebit,
      isReversed,
      transactionType,
      category,
      categoryLabel,
      occurredAt,
      formattedDateTime,
      formattedDate,
      formattedTime,
      amount,
      previousBalance,
      updatedBalance,
    };
  });
}
