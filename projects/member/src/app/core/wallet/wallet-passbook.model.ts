import { BenefitCategory } from '../domain/codes';

export type PassbookTransactionType = 'Claim' | 'Cashless' | 'Recharge' | 'Debit';

export interface EnrichedWalletPassbookItem {
  readonly id: string;
  readonly referenceId: string;
  readonly txnType: string;
  readonly creditDebit: 'D' | 'C' | string;
  readonly isCredit: boolean;
  readonly isDebit: boolean;
  readonly transactionType: PassbookTransactionType;
  readonly category: BenefitCategory;
  readonly categoryLabel: string;
  readonly occurredAt: Date;
  readonly formattedDateTime: string;
  readonly formattedDate: string;
  readonly formattedTime: string;
  readonly amount: number;
  readonly previousBalance: number;
  readonly updatedBalance: number;
  readonly isReversed?: boolean;
}
