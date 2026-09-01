import { ClaimStatus } from '../claims/claim.model';
import { Money } from '../domain/money';

export interface ServiceTransaction {
  readonly id: string;
  readonly reference: string;
  /** Normalised API service type, kept so a category screen can filter. */
  readonly serviceTypeCode: string;
  readonly serviceLabel: string;
  readonly serviceName: string;
  readonly occurredAt: Date | null;
  readonly total: Money;
  readonly fromWallet: Money;
  readonly selfPaid: Money;
  readonly copay: Money;
  readonly paymentMethodLabel: string;
  readonly status: ClaimStatus;
}

export interface SpendBreakdown {
  readonly serviceLabel: string;
  readonly count: number;
  readonly amount: Money;
}

export interface TransactionsSummary {
  readonly count: number;
  readonly totalSpent: Money;
  readonly fromWallet: Money;
  readonly selfPaid: Money;
  readonly byService: readonly SpendBreakdown[];
}
