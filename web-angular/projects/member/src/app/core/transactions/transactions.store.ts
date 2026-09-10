import { Injectable, computed, signal } from '@angular/core';

import { money } from '../domain/money';
import { toStatus } from '../claims/claim.mapper';
import { AppError } from '../http/app-error';
import { Payment } from './transaction.mapper';
import { ServiceTransaction, TransactionsSummary } from './transaction.model';

/**
 * Wallet transactions — DUMMY / STATIC, zero backend.
 *
 * Replaces the transactions / payments endpoints. Held in memory. Public surface
 * unchanged. See REMOVED-APIS.md.
 */

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function txn(o: {
  ref: string; code: string; label: string; name: string; days: number;
  total: number; wallet: number; self: number; copay: number; method: string; status: string;
}): ServiceTransaction {
  return {
    id: o.ref, reference: o.ref,
    serviceTypeCode: o.code, serviceLabel: o.label, serviceName: o.name,
    occurredAt: daysAgo(o.days),
    total: money(o.total), fromWallet: money(o.wallet), selfPaid: money(o.self), copay: money(o.copay),
    paymentMethodLabel: o.method, status: toStatus(o.status),
  };
}

const SEED: ServiceTransaction[] = [
  txn({ ref: 'TXN-2026-0031', code: 'CONSULT', label: 'Consultation', name: 'Online consultation · Dr. A. Sharma', days: 1, total: 500, wallet: 240, self: 260, copay: 60, method: 'Wallet + Razorpay', status: 'PAID' }),
  txn({ ref: 'TXN-2026-0028', code: 'PHARMACY', label: 'Pharmacy', name: 'Medicines · Apollo Pharmacy', days: 4, total: 310, wallet: 248, self: 62, copay: 62, method: 'Wallet + Razorpay', status: 'PAID' }),
  txn({ ref: 'TXN-2026-0021', code: 'LAB', label: 'Pathology', name: 'Diabetes Panel · Metropolis', days: 9, total: 550, wallet: 400, self: 150, copay: 80, method: 'Wallet + Razorpay', status: 'PAID' }),
  txn({ ref: 'TXN-2026-0015', code: 'DENTAL', label: 'Dental', name: 'Consultation · SmileCare', days: 15, total: 600, wallet: 320, self: 280, copay: 80, method: 'Wallet + Razorpay', status: 'PAID' }),
];

@Injectable({ providedIn: 'root' })
export class TransactionsStore {
  private readonly _transactions = signal<readonly ServiceTransaction[]>([...SEED]);

  readonly transactions = this._transactions.asReadonly();
  readonly loading = signal(false).asReadonly();
  readonly paying = signal(false).asReadonly();
  readonly payError = signal<string | null>(null).asReadonly();
  readonly loadingMore = signal(false).asReadonly();
  readonly error = signal<AppError | null>(null).asReadonly();
  readonly hasMore = signal(false).asReadonly();

  readonly summary = computed<TransactionsSummary>(() => {
    const all = this._transactions();
    const byService = new Map<string, { count: number; amount: number }>();
    for (const t of all) {
      const e = byService.get(t.serviceLabel) ?? { count: 0, amount: 0 };
      e.count += 1; e.amount += t.total.amount;
      byService.set(t.serviceLabel, e);
    }
    return {
      count: all.length,
      totalSpent: money(all.reduce((s, t) => s + t.total.amount, 0)),
      fromWallet: money(all.reduce((s, t) => s + t.fromWallet.amount, 0)),
      selfPaid: money(all.reduce((s, t) => s + t.selfPaid.amount, 0)),
      byService: [...byService].map(([serviceLabel, v]) => ({ serviceLabel, count: v.count, amount: money(v.amount) })),
    };
  });

  retry(): void {
    /* static — nothing to refetch */
  }

  async transactionById(id: string): Promise<{ transaction: ServiceTransaction; payment: Payment | null } | null> {
    const t = this._transactions().find((x) => x.id === id || x.reference === id);
    return t ? { transaction: t, payment: null } : null;
  }

  async paymentById(_paymentId: string): Promise<Payment | null> {
    return null;
  }

  async markPaid(_paymentId: string): Promise<boolean> {
    return true;
  }

  async loadMore(): Promise<void> {
    /* static — the full list is already loaded */
  }
}
