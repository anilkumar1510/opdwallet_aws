/**
 * Transport shapes for GET /wallet/balance and GET /wallet/transactions.
 * Source: api/src/modules/wallet/wallet.controller.ts and the
 * formatWalletForFrontend projection in wallet.service.ts.
 */

export interface WalletTotalsDto {
  allocated?: number;
  current?: number;
  consumed?: number;
}

export interface WalletCategoryDto {
  categoryCode?: string;
  name?: string;
  available?: number;
  total?: number;
  consumed?: number;
  isUnlimited?: boolean;
}

export interface MemberConsumptionDto {
  userId?: string;
  consumed?: number;
}

export interface WalletBalanceDto {
  totalBalance?: WalletTotalsDto;
  categories?: WalletCategoryDto[];
  /** A floater wallet is shared across the family. */
  isFloater?: boolean;
  memberConsumption?: MemberConsumptionDto[];
  viewingUserId?: string;
  config?: unknown;
}

export interface WalletTransactionDto {
  _id?: string;
  transactionId?: string;
  type?: string;
  amount?: number;
  categoryCode?: string;
  serviceType?: string;
  serviceProvider?: string;
  notes?: string;
  processedAt?: string;
  createdAt?: string;
  isReversed?: boolean;
  /** Wallet balance immediately AFTER this transaction — the running balance. */
  newBalance?: { total?: number; category?: number };
  previousBalance?: { total?: number; category?: number };
}

export interface WalletTransactionsResponseDto {
  transactions?: WalletTransactionDto[];
  total?: number;
  limit?: number;
}
