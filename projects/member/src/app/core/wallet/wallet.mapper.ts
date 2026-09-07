import { BenefitCategory, benefitCategoryLabel, toBenefitCategory, toDate } from '../domain/codes';
import { money } from '../domain/money';
import {
  MemberConsumptionDto,
  WalletBalanceDto,
  WalletCategoryDto,
  WalletTotalsDto,
  WalletTransactionDto,
  BenefitConfigDto,
} from './wallet.dto';
import { FamilyConsumption, TransactionDirection, Wallet, WalletActivityTotals, WalletCategoryBalance, WalletTotals, WalletTransaction } from './wallet.model';

/**
 * Every URL this resource uses, beside the shapes they return. Changing an
 * endpoint means editing this file only.
 */
export const WALLET_API = {
  balance: 'wallet/balance',
  transactions: 'wallet/transactions',
} as const;

function toTotals(dto: WalletTotalsDto | undefined): WalletTotals {
  const allocated = money(dto?.allocated);
  const consumed = money(dto?.consumed);
  return {
    allocated,
    available: money(dto?.current),
    consumed,
    // Guard the divide: an unallocated wallet is 0% consumed, not NaN.
    consumedPercent:
      allocated.amount > 0
        ? Math.min(100, Math.round((consumed.amount / allocated.amount) * 100))
        : 0,
  };
}

function toCategory(
  dto: WalletCategoryDto,
  config: BenefitConfigDto | undefined,
): WalletCategoryBalance {
  const category = toBenefitCategory(dto.categoryCode);
  const available = money(dto.available);
  const isUnlimited = dto.isUnlimited === true;

  return {
    category,
    code: dto.categoryCode?.trim().toUpperCase() ?? '',
    // The API's own name always wins, so a stale code table cannot rename a
    // member's benefit.
    label: benefitCategoryLabel(category, dto.name),
    allocated: money(dto.total),
    available,
    consumed: money(dto.consumed),
    isUnlimited,
    // Unlimited is never exhausted, however the numbers read.
    isExhausted: !isUnlimited && available.amount <= 0,
    // Only when the plan actually states one: a missing limit is unknown, not
    // zero, and rendering zero would tell the member they have no cover.
    annualLimit: typeof config?.annualLimit === 'number' ? money(config.annualLimit) : null,
    perClaimLimit:
      typeof config?.perClaimLimit === 'number' ? money(config.perClaimLimit) : null,
  };
}

function toFamilyConsumption(dto: MemberConsumptionDto): FamilyConsumption {
  return { memberId: dto.userId ?? '', consumed: money(dto.consumed) };
}

export function toWallet(dto: WalletBalanceDto | null | undefined): Wallet {
  // Limits live in a separate `config.benefits` block keyed by category code,
  // not on the balance entries, so they are joined on here rather than in
  // every screen that wants to show what a benefit is worth.
  const benefits = dto?.config?.benefits ?? {};
  const categories = (dto?.categories ?? []).map((category) =>
    toCategory(category, benefits[category.categoryCode?.trim().toUpperCase() ?? '']),
  );
  const totals = toTotals(dto?.totalBalance);
  const isShared = dto?.isFloater === true;

  return {
    totals,
    categories,
    isShared,
    familyConsumption: isShared ? (dto?.memberConsumption ?? []).map(toFamilyConsumption) : [],
    // The API answers a member with no wallet with zeroed totals and no
    // categories rather than a 404, so absence is inferred here.
    exists: Boolean(dto) && (categories.length > 0 || totals.allocated.amount > 0),
  };
}

/** Credits add to the balance; everything else draws from it. */
const CREDIT_TYPES: ReadonlySet<string> = new Set(['CREDIT', 'REFUND', 'INITIALIZATION']);

function describe(dto: WalletTransactionDto, categoryLabel: string | null): string {
  const candidate =
    dto.serviceProvider?.trim() || dto.serviceType?.trim() || dto.notes?.trim() || categoryLabel;
  return candidate || 'Wallet activity';
}

export function toTransaction(dto: WalletTransactionDto): WalletTransaction {
  const rawType = dto.type?.trim().toUpperCase() ?? '';
  const category = toBenefitCategory(dto.categoryCode);
  const categoryLabel = dto.categoryCode ? benefitCategoryLabel(category, null) : null;

  return {
    id: dto._id ?? dto.transactionId ?? '',
    reference: dto.transactionId ?? '',
    direction: CREDIT_TYPES.has(rawType)
      ? TransactionDirection.Credit
      : TransactionDirection.Debit,
    amount: money(dto.amount),
    category,
    categoryLabel: category === BenefitCategory.Unknown ? null : categoryLabel,
    description: describe(dto, categoryLabel),
    occurredAt: toDate(dto.processedAt ?? dto.createdAt),
    isReversed: dto.isReversed === true,
    balanceAfter:
      typeof dto.newBalance?.total === 'number' ? money(dto.newBalance.total) : null,
  };
}

/**
 * Credits, debits and the difference between them.
 *
 * Reversed transactions are counted, deliberately: the wallet moved when they
 * were made and moved back when they were reversed, and both movements appear
 * as their own rows. Skipping the original would make the figures disagree with
 * the list the member is reading them beside.
 */
export function summarise(rows: readonly WalletTransactionDto[]): WalletActivityTotals {
  let credits = 0;
  let debits = 0;
  for (const dto of rows) {
    const value = dto.amount ?? 0;
    if (CREDIT_TYPES.has(dto.type?.trim().toUpperCase() ?? '')) credits += value;
    else debits += value;
  }
  return {
    credits: money(credits),
    debits: money(debits),
    net: money(credits - debits),
    counted: rows.length,
  };
}
