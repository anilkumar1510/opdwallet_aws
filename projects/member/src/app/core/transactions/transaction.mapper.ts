import { ClaimStatus } from '../claims/claim.model';
import { toDate } from '../domain/codes';
import { Money, money } from '../domain/money';
import {
  PaymentDto,
  ServiceTransactionDto,
  TransactionDetailDto,
  TransactionsSummaryDto,
} from './transaction.dto';
import { ServiceTransaction, SpendBreakdown, TransactionsSummary } from './transaction.model';

/**
 * Every URL this resource uses, beside the shapes they return. Changing an
 * endpoint means editing this file only.
 */
export const TRANSACTIONS_API = {
  list: 'transactions',
  summary: 'transactions/summary',
  byId: (transactionId: string) => `transactions/${transactionId}`,
} as const;

export const PAYMENTS_API = {
  /**
   * POST. Creates a PENDING payment and returns it with a server-generated
   * `paymentId` (`payment.controller.ts:69`).
   *
   * The reference generates its own id client-side and sends it
   * (`lib/transactions.ts:49-53`, `PAY{timestamp}{random}`), but the API ignores
   * it for the id and keeps it only as a fallback `serviceReferenceId` — which is
   * why real records read `PAY-20260808-0188` and not the reference's format.
   * Angular sends no id and reads the one that comes back.
   */
  create: 'payments',
  byId: (paymentId: string) => `payments/${paymentId}`,
  /** POST, no body. Completes a gateway payment. Takes the business PAY-… id. */
  markPaid: (paymentId: string) => `payments/${paymentId}/mark-paid`,
  /**
   * POST. Marks a PENDING payment CANCELLED. It does not touch the booking the
   * payment was raised against (`payment.service.ts:200`), which is what makes
   * it safe to discard a payment the journey never intended to raise.
   */
  cancel: (paymentId: string) => `payments/${paymentId}/cancel`,
} as const;

export interface Payment {
  readonly id: string;
  readonly reference: string;
  readonly amount: Money;
  readonly typeLabel: string;
  readonly methodLabel: string;
  readonly description: string | null;
  readonly serviceReference: string | null;
  /** Which service line raised it, so a screen can offer that line's next step. */
  readonly serviceTypeCode: string;
  readonly status: ClaimStatus;
  readonly paidAt: Date | null;
}

export function toPayment(dto: PaymentDto): Payment {
  return {
    id: dto._id ?? dto.paymentId ?? '',
    reference: dto.paymentId ?? '',
    amount: money(dto.amount),
    typeLabel: label(PAYMENT_LABELS, dto.paymentType, 'Payment'),
    methodLabel: humanise(dto.paymentMethod, 'Not recorded'),
    description: dto.description?.trim() || null,
    serviceReference: dto.serviceReferenceId?.trim() || null,
    serviceTypeCode: dto.serviceType?.trim().toUpperCase() ?? '',
    status: toStatus(dto.status),
    paidAt: toDate(dto.paidAt ?? dto.createdAt),
  };
}

/** The detail route populates `paymentId`; the list route does not. */
export function toTransactionPayment(dto: TransactionDetailDto): Payment | null {
  const raw = dto.paymentId;
  return raw && typeof raw === 'object' ? toPayment(raw) : null;
}

const SERVICE_LABELS: Readonly<Record<string, string>> = {
  APPOINTMENT: 'Consultation',
  CLAIM: 'Claim',
  LAB_ORDER: 'Lab test',
  DIAGNOSTIC_ORDER: 'Diagnostics',
  DENTAL: 'Dental',
  VISION: 'Vision',
  PHARMACY: 'Pharmacy',
  AHC: 'Health checkup',
  WALLET_TOPUP: 'Wallet top-up',
};

const PAYMENT_LABELS: Readonly<Record<string, string>> = {
  COPAY: 'Copay',
  WALLET_ONLY: 'Wallet',
  SELF_PAID: 'Self paid',
  FULL_PAYMENT: 'Paid in full',
};

const STATUSES: Readonly<Record<string, ClaimStatus>> = {
  COMPLETED: { label: 'Completed', tone: 'positive', isFinal: true },
  PENDING_PAYMENT: { label: 'Payment pending', tone: 'progress', isFinal: false },
  PENDING: { label: 'Pending', tone: 'progress', isFinal: false },
  FAILED: { label: 'Failed', tone: 'negative', isFinal: true },
  REFUNDED: { label: 'Refunded', tone: 'neutral', isFinal: true },
  CANCELLED: { label: 'Cancelled', tone: 'neutral', isFinal: true },
};

function humanise(value: string | undefined, fallback: string): string {
  const raw = value?.trim();
  if (!raw) return fallback;
  const words = raw.replace(/[_-]+/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function label(map: Readonly<Record<string, string>>, code: string | undefined, fallback: string) {
  const key = code?.trim().toUpperCase().replace(/[\s-]+/g, '_');
  return (key && map[key]) || humanise(code, fallback);
}

function toStatus(value: string | undefined): ClaimStatus {
  const key = value?.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (key && STATUSES[key]) return STATUSES[key];
  return { label: humanise(value, 'Recorded'), tone: 'neutral', isFinal: false };
}

export function toServiceTransaction(dto: ServiceTransactionDto): ServiceTransaction {
  return {
    id: dto._id ?? dto.transactionId ?? '',
    reference: dto.transactionId ?? '',
    serviceTypeCode: dto.serviceType?.trim().toUpperCase().replace(/[\s-]+/g, '_') ?? '',
    serviceLabel: label(SERVICE_LABELS, dto.serviceType, 'Service'),
    serviceName: dto.serviceName?.trim() || label(SERVICE_LABELS, dto.serviceType, 'Service'),
    occurredAt: toDate(dto.serviceDate ?? dto.createdAt),
    total: money(dto.totalAmount),
    fromWallet: money(dto.walletAmount),
    selfPaid: money(dto.selfPaidAmount),
    copay: money(dto.copayAmount),
    paymentMethodLabel: label(PAYMENT_LABELS, dto.paymentMethod, 'Payment'),
    status: toStatus(dto.status),
  };
}

export function toTransactionsSummary(dto: TransactionsSummaryDto): TransactionsSummary {
  const byService: SpendBreakdown[] = Object.entries(dto.byServiceType ?? {})
    .map(([code, value]) => ({
      serviceLabel: label(SERVICE_LABELS, code, 'Service'),
      count: value?.count ?? 0,
      amount: money(value?.amount),
    }))
    .sort((a, b) => b.amount.amount - a.amount.amount);

  return {
    count: dto.totalTransactions ?? 0,
    totalSpent: money(dto.totalSpent),
    fromWallet: money(dto.totalFromWallet),
    selfPaid: money(dto.totalSelfPaid),
    byService,
  };
}
