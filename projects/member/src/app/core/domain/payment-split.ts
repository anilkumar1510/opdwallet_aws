/**
 * How a bill is split between the wallet and the member: co-payment first,
 * then the limit.
 *
 *   1. Co-payment is taken on the whole bill.
 *   2. What is left after the co-payment is what the wallet can cover.
 *   3. The wallet pays the lower of that and the limit — the limit is the most
 *      the wallet ever pays.
 *   4. Anything above the limit is the member's, on top of the co-payment.
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
  readonly walletPays: number;
  /** The part of `afterCopay` the limit leaves to the member. */
  readonly aboveLimit: number;
  /** Co-payment plus anything above the limit. */
  readonly memberPays: number;
}

export function splitPayment(bill: number, copay: Copay, limit: number | null): PaymentSplit {
  const safeBill = Math.max(0, bill);
  const copayAmount =
    copay.mode === 'PERCENT'
      ? Math.round((safeBill * copay.value) / 100)
      : Math.min(copay.value, safeBill);
  const afterCopay = safeBill - copayAmount;
  const walletPays = limit !== null && limit > 0 ? Math.min(afterCopay, limit) : afterCopay;
  const aboveLimit = afterCopay - walletPays;
  return {
    bill: safeBill,
    copay,
    copayAmount,
    afterCopay,
    limit: limit !== null && limit > 0 ? limit : null,
    walletPays,
    aboveLimit,
    memberPays: copayAmount + aboveLimit,
  };
}

/** Percentage co-payment, the usual case on the cashless screens. */
export function percentCopay(value: number): Copay {
  return { mode: 'PERCENT', value };
}
