/**
 * Service-level transactions: what a member spent, split across wallet, copay
 * and own pocket. Distinct from wallet/transactions, which is the wallet
 * ledger (credits, debits, reversals).
 *
 * Source: api/src/modules/transactions/transaction-summary.controller.ts
 * GET /transactions and GET /transactions/summary
 */
export interface ServiceTransactionDto {
  _id?: string;
  transactionId?: string;
  serviceType?: string;
  serviceReferenceId?: string;
  serviceName?: string;
  serviceDate?: string;
  totalAmount?: number;
  walletAmount?: number;
  selfPaidAmount?: number;
  copayAmount?: number;
  paymentMethod?: string;
  status?: string;
  createdAt?: string;
}

export interface ServiceTransactionsResponseDto {
  transactions?: ServiceTransactionDto[];
  total?: number;
}

/** `paymentId` arrives populated on the detail route, not as a bare id. */
export interface PaymentDto {
  _id?: string;
  paymentId?: string;
  amount?: number;
  paymentType?: string;
  status?: string;
  serviceType?: string;
  serviceReferenceId?: string;
  description?: string;
  paymentMethod?: string;
  paidAt?: string;
  createdAt?: string;
}

export interface TransactionDetailDto extends ServiceTransactionDto {
  serviceReferenceId?: string;
  paymentId?: PaymentDto | string;
}

export interface TransactionsSummaryDto {
  totalTransactions?: number;
  totalSpent?: number;
  totalFromWallet?: number;
  totalSelfPaid?: number;
  totalCopay?: number;
  byServiceType?: Record<string, { count?: number; amount?: number }>;
}
