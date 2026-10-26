/**
 * How a bill is split between the wallet and the member: co-payment first,
 * then the limit.
 *
 *   1. Co-payment is taken on the whole bill.
 *   2. What is left after the co-payment is what the wallet can cover.
 *   3. The wallet pays the lower of that and the limit — the limit is the most
 *      the wallet ever pays.
 *   4. Cashless only: if that is still more than the wallet balance available,
 *      the wallet pays the balance.
 *   5. Anything above the limit (and above the balance) is the member's, on top
 *      of the co-payment.
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
  /** Wallet balance available; null when the balance does not cap (claims). */
  readonly balance: number | null;
  readonly walletPays: number;
  /** The part of `afterCopay` the limit leaves to the member. */
  readonly aboveLimit: number;
  /** What the limit allowed but the wallet balance could not cover. */
  readonly aboveBalance: number;
  /** Co-payment plus anything above the limit or the balance. */
  readonly memberPays: number;
}

export function splitPayment(
  bill: number,
  copay: Copay,
  limit: number | null,
  balance: number | null = null,
): PaymentSplit {
  const safeBill = Math.max(0, bill);
  const copayAmount =
    copay.mode === 'PERCENT'
      ? Math.round((safeBill * copay.value) / 100)
      : Math.min(copay.value, safeBill);
  const afterCopay = safeBill - copayAmount;
  const withinLimit = limit !== null && limit > 0 ? Math.min(afterCopay, limit) : afterCopay;
  // Last, and only when it bites: the wallet cannot pay more than it holds.
  const safeBalance = balance !== null ? Math.max(0, balance) : null;
  const walletPays = safeBalance !== null ? Math.min(withinLimit, safeBalance) : withinLimit;
  const aboveLimit = afterCopay - withinLimit;
  const aboveBalance = withinLimit - walletPays;
  return {
    bill: safeBill,
    copay,
    copayAmount,
    afterCopay,
    limit: limit !== null && limit > 0 ? limit : null,
    balance: safeBalance,
    walletPays,
    aboveLimit,
    aboveBalance,
    memberPays: copayAmount + aboveLimit + aboveBalance,
  };
}

/** Fallback wallet balance for the mock cashless screens when no policy is loaded. */
export const MOCK_WALLET_BALANCE = 5000;

/** Percentage co-payment, the usual case on the cashless screens. */
export function percentCopay(value: number): Copay {
  return { mode: 'PERCENT', value };
}
