/**
 * How a bill is split between the wallet and the member: co-payment first,
 * then the limit.
 *
 *   1. Co-payment is taken on the whole bill.
 *   2. What is left after the co-payment is what the wallet can cover.
 *   3. The wallet pays the lower of that and the limit — the limit is the most
 *      the wallet ever pays.
 *   4. Cashless only: that is then capped at the category/pool balance
 *      available, and after that at the total wallet balance available — a
 *      pool can be untouched while the wallet as a whole runs low.
 *   5. Anything above the limit or either balance is the member's, on top of
 *      the co-payment.
 *
 * Example: bill ₹1,500, 20% co-payment, ₹500 limit → co-payment ₹300, ₹1,200
 * after co-payment, wallet pays ₹500, ₹700 above the limit, member pays ₹1,000.
 *
 * The limit is the per-transaction limit on cashless bookings and the
 * per-claim limit on claims — the same rule under two names.
 */

export interface Copay {
  readonly mode: 'PERCENT' | 'FLAT';
  readonly value: number;
}

export interface PaymentSplit {
  readonly bill: number;
  readonly copay: Copay;
  readonly copayAmount: number;
  /** Bill less the co-payment — what the wallet can cover, before the limit. */
  readonly afterCopay: number;
  /** Null means no limit. */
  readonly limit: number | null;
  /** Category/pool balance available; null when it does not cap (claims). */
  readonly poolBalance: number | null;
  /** Total wallet balance available; null when it does not cap (claims). */
  readonly totalBalance: number | null;
  readonly walletPays: number;
  /** The part of `afterCopay` the limit leaves to the member. */
  readonly aboveLimit: number;
  /** What the limit allowed but the category/pool balance could not cover. */
  readonly abovePool: number;
  /** What the pool allowed but the total wallet balance could not cover. */
  readonly aboveTotal: number;
  /** Co-payment plus anything above the limit or either balance. */
  readonly memberPays: number;
}

/** The balances a cashless payment is capped at, in order. */
export interface WalletBalances {
  readonly pool: number | null;
  readonly total: number | null;
}

export function splitPayment(
  bill: number,
  copay: Copay,
  limit: number | null,
  balances: WalletBalances | null = null,
): PaymentSplit {
  const safeBill = Math.max(0, bill);
  const copayAmount =
    copay.mode === 'PERCENT'
      ? Math.round((safeBill * copay.value) / 100)
      : Math.min(copay.value, safeBill);
  const afterCopay = safeBill - copayAmount;
  const withinLimit = limit !== null && limit > 0 ? Math.min(afterCopay, limit) : afterCopay;
  // Then the balances, and only where they bite: the category/pool first, then
  // the wallet as a whole.
  const pool = balances?.pool != null ? Math.max(0, balances.pool) : null;
  const total = balances?.total != null ? Math.max(0, balances.total) : null;
  const withinPool = pool !== null ? Math.min(withinLimit, pool) : withinLimit;
  const walletPays = total !== null ? Math.min(withinPool, total) : withinPool;
  const aboveLimit = afterCopay - withinLimit;
  const abovePool = withinLimit - withinPool;
  const aboveTotal = withinPool - walletPays;
  return {
    bill: safeBill,
    copay,
    copayAmount,
    afterCopay,
    limit: limit !== null && limit > 0 ? limit : null,
    poolBalance: pool,
    totalBalance: total,
    walletPays,
    aboveLimit,
    abovePool,
    aboveTotal,
    memberPays: copayAmount + aboveLimit + abovePool + aboveTotal,
  };
}

/** STATIC balances for the mock cashless screens: the category/pool, then the wallet. */
export const MOCK_WALLET_BALANCES: WalletBalances = { pool: 5000, total: 40000 };

/** Percentage co-payment, the usual case on the cashless screens. */
export function percentCopay(value: number): Copay {
  return { mode: 'PERCENT', value };
}
