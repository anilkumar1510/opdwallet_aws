import { BenefitCategory } from '../domain/codes';
import { Money } from '../domain/money';

export interface WalletTotals {
  readonly allocated: Money;
  readonly available: Money;
  readonly consumed: Money;
  /** 0-100, for the consumption bar. Always 0 when nothing was allocated. */
  readonly consumedPercent: number;
}

export interface WalletCategoryBalance {
  readonly category: BenefitCategory;
  /** The API's own code (CAT006 …), kept for routing to the detail screen. */
  readonly code: string;
  readonly label: string;
  readonly allocated: Money;
  readonly available: Money;
  readonly consumed: Money;
  readonly isUnlimited: boolean;
  readonly isExhausted: boolean;
  /**
   * The cap this benefit renews against each policy year, from plan config.
   * Distinct from `allocated`, which is what this member's wallet was given —
   * they are usually equal and are not the same thing.
   *
   * Null when the plan carries no configured limit for the category, which is
   * why the screens test for null instead of rendering a confident zero.
   */
  readonly annualLimit: Money | null;
  /** The most that can be spent in one transaction, when the plan caps it. */
  readonly perClaimLimit: Money | null;
}

export interface FamilyConsumption {
  readonly memberId: string;
  readonly consumed: Money;
}

export interface Wallet {
  readonly totals: WalletTotals;
  readonly categories: readonly WalletCategoryBalance[];
  /** A shared (floater) wallet draws from one pool for the whole family. */
  readonly isShared: boolean;
  readonly familyConsumption: readonly FamilyConsumption[];
  /** False when the member has no wallet for the current policy period. */
  readonly exists: boolean;
}

export const TransactionDirection = {
  Credit: 'CREDIT',
  Debit: 'DEBIT',
} as const;

export type TransactionDirection =
  (typeof TransactionDirection)[keyof typeof TransactionDirection];

/** Credits, debits and their difference across the member's whole history. */
export interface WalletActivityTotals {
  readonly credits: Money;
  readonly debits: Money;
  readonly net: Money;
  /** How many transactions the figures were computed from. */
  readonly counted: number;
}

export interface WalletTransaction {
  readonly id: string;
  readonly reference: string;
  readonly direction: TransactionDirection;
  readonly amount: Money;
  readonly category: BenefitCategory;
  readonly categoryLabel: string | null;
  /** What the member recognises this by: a service, provider, or note. */
  readonly description: string;
  readonly occurredAt: Date | null;
  readonly isReversed: boolean;
  /**
   * The wallet balance immediately after this transaction, or null when the
   * payload omits it. Without it a member cannot reconcile the list against
   * the total — and three identical ₹300 debits on one day are indistinguishable.
   */
  readonly balanceAfter: Money | null;
}
