import { Money, money } from './money';

/**
 * The dry run every booking journey performs before letting the member
 * confirm. It answers what the wallet covers, what the member owes, and
 * whether the booking is allowed at all.
 *
 * Five endpoints return this same shape, which is why it lives here rather
 * than in any one resource's mapper:
 *   POST member/lab/orders/validate
 *   POST member/diagnostics/orders/validate
 *   POST vision-bookings/validate
 *   POST dental-bookings/validate
 *   POST appointments/validate-booking  (spells the flag `isAllowed`)
 *
 * None of them use the `{ success, data }` envelope their sibling routes do —
 * the result is at the top level. `breakdown` is null when `valid` is false.
 */
export interface OrderValidationDto {
  valid?: boolean;
  /** appointments/validate-booking spells the same flag this way. */
  isAllowed?: boolean;
  error?: string;
  warnings?: string[];
  breakdown?: {
    billAmount?: number;
    copayAmount?: number;
    /** Whole percent, e.g. 20 for 20%. Returned by appointments/validate-booking. */
    copayPercentage?: number;
    needsPayment?: boolean;
    insuranceEligibleAmount?: number;
    serviceTransactionLimit?: number;
    insurancePayment?: number;
    excessAmount?: number;
    totalMemberPayment?: number;
    walletBalance?: number;
    walletDebitAmount?: number;
    insufficientBalance?: boolean;
  };
}

export interface ValidateOrderInput {
  readonly patientId: string;
  readonly vendorId: string;
  readonly cartId: string;
  readonly slotId: string;
  readonly totalAmount: number;
}

export interface OrderValidation {
  readonly isValid: boolean;
  /** Why the order cannot proceed, when the API says. */
  readonly reason: string | null;
  readonly warnings: readonly string[];
  readonly billAmount: Money;
  /** Paid from the wallet. */
  readonly fromWallet: Money;
  /** The member's share: copay plus anything above the service limit. */
  readonly youPay: Money;
  readonly copay: Money;
  /** The copay rate as a whole percent, for labelling. 0 when none applies. */
  readonly copayPercentage: number;
  /** What the policy would cover before any per-service transaction limit. */
  readonly insuranceEligible: Money;
  /** Amount above the per-service transaction limit, which the member absorbs. */
  readonly excess: Money;
  readonly serviceLimit: Money;
  readonly walletBalance: Money;
  readonly insufficientBalance: boolean;
}

export function toOrderValidation(dto: OrderValidationDto): OrderValidation {
  const breakdown = dto.breakdown ?? {};
  return {
    // Two spellings across five endpoints; either one being true is a pass.
    isValid: dto.valid === true || dto.isAllowed === true,
    reason: dto.error?.trim() || null,
    warnings: (dto.warnings ?? []).filter((warning) => warning.trim().length > 0),
    billAmount: money(breakdown.billAmount),
    fromWallet: money(breakdown.walletDebitAmount ?? breakdown.insurancePayment),
    youPay: money(breakdown.totalMemberPayment),
    copay: money(breakdown.copayAmount),
    copayPercentage: breakdown.copayPercentage ?? 0,
    insuranceEligible: money(breakdown.insuranceEligibleAmount),
    excess: money(breakdown.excessAmount),
    serviceLimit: money(breakdown.serviceTransactionLimit),
    walletBalance: money(breakdown.walletBalance),
    insufficientBalance: breakdown.insufficientBalance === true,
  };
}
