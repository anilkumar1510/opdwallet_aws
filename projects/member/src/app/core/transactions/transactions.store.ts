import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { FamilyStore } from '../family/family.store';
import { AppError, appError, isAppError } from '../http/app-error';
import { SessionStore } from '../session/session.store';
import {
  PaymentDto,
  ServiceTransactionsResponseDto,
  TransactionDetailDto,
  TransactionsSummaryDto,
} from './transaction.dto';
import {
  PAYMENTS_API,
  Payment,
  TRANSACTIONS_API,
  toPayment,
  toServiceTransaction,
  toTransactionPayment,
  toTransactionsSummary,
} from './transaction.mapper';
import { ServiceTransaction, TransactionsSummary } from './transaction.model';

const PAGE_SIZE = 20;

/** Service-level spend history for whichever family member is active. */
@Injectable({ providedIn: 'root' })
export class TransactionsStore {
  private readonly http = inject(HttpClient);
  private readonly family = inject(FamilyStore);
  private readonly session = inject(SessionStore);

  private readonly _transactions = signal<readonly ServiceTransaction[]>([]);
  private readonly _summary = signal<TransactionsSummary | null>(null);
  private readonly _loading = signal(false);
  private readonly _paying = signal(false);
  private readonly _payError = signal<string | null>(null);
  private readonly _loadingMore = signal(false);
  private readonly _error = signal<AppError | null>(null);
  private readonly _hasMore = signal(false);

  private loadedFor: string | null = null;

  readonly transactions = this._transactions.asReadonly();
  readonly summary = this._summary.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly paying = this._paying.asReadonly();
  readonly payError = this._payError.asReadonly();
  readonly loadingMore = this._loadingMore.asReadonly();
  readonly error = this._error.asReadonly();
  readonly hasMore = this._hasMore.asReadonly();

  constructor() {
    effect(() => {
      const activeId = this.family.activeMember()?.id ?? null;
      if (!this.session.isAuthenticated()) {
        this.reset();
        return;
      }
      if (!activeId || activeId === this.loadedFor) return;
      this.loadedFor = activeId;
      void this.load(activeId);
    });
  }

  retry(): void {
    const activeId = this.family.activeMember()?.id;
    if (activeId) void this.load(activeId);
  }

  /** One transaction plus its populated payment, for the detail screen. */
  async transactionById(
    transactionId: string,
  ): Promise<{ transaction: ServiceTransaction; payment: Payment | null } | null> {
    try {
      const dto = await firstValueFrom(
        this.http.get<TransactionDetailDto>(TRANSACTIONS_API.byId(transactionId)),
      );
      if (!dto) return null;
      return { transaction: toServiceTransaction(dto), payment: toTransactionPayment(dto) };
    } catch {
      return null;
    }
  }

  async paymentById(paymentId: string): Promise<Payment | null> {
    try {
      const dto = await firstValueFrom(this.http.get<PaymentDto>(PAYMENTS_API.byId(paymentId)));
      return dto ? toPayment(dto) : null;
    } catch {
      return null;
    }
  }

  /**
   * Completes a gateway payment for a copay or excess.
   *
   * Only the mark-paid step: web-member's payment screen also *creates* the
   * underlying booking here, because those journeys defer creation until after
   * payment. Every journey in this app creates its booking at the confirm step,
   * so by the time a payment exists the booking already does. Registered in
   * tools/parity-divergences.md.
   */
  async markPaid(paymentId: string): Promise<boolean> {
    if (!paymentId) return false;
    this._paying.set(true);
    this._payError.set(null);
    try {
      await firstValueFrom(this.http.post(PAYMENTS_API.markPaid(paymentId), {}));
      return true;
    } catch (error: unknown) {
      this._payError.set(
        isAppError(error) ? error.message : 'We could not complete that payment.',
      );
      return false;
    } finally {
      this._paying.set(false);
    }
  }

  private async load(userId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    const params = new HttpParams().set('userId', userId);

    try {
      const [page, summary] = await Promise.all([
        firstValueFrom(
          this.http.get<ServiceTransactionsResponseDto>(TRANSACTIONS_API.list, {
            params: params.set('limit', PAGE_SIZE).set('skip', 0),
          }),
        ),
        // A failing summary must not cost the member their history.
        firstValueFrom(
          this.http.get<TransactionsSummaryDto>(TRANSACTIONS_API.summary, { params }),
        ).catch(() => null),
      ]);
      if (this.loadedFor !== userId) return;

      const rows = (page.transactions ?? []).map(toServiceTransaction);
      this._transactions.set(rows);
      this._summary.set(summary ? toTransactionsSummary(summary) : null);
      this._hasMore.set(rows.length >= PAGE_SIZE);
    } catch (error: unknown) {
      if (this.loadedFor !== userId) return;
      this._transactions.set([]);
      this._summary.set(null);
      this._error.set(isAppError(error) ? error : appError('server'));
    } finally {
      if (this.loadedFor === userId) this._loading.set(false);
    }
  }

  /** This endpoint takes a real `skip`, so pages append rather than replace. */
  async loadMore(): Promise<void> {
    const userId = this.family.activeMember()?.id;
    if (!userId || this._loading() || this._loadingMore() || !this._hasMore()) return;

    const skip = this._transactions().length;
    this._loadingMore.set(true);
    try {
      const page = await firstValueFrom(
        this.http.get<ServiceTransactionsResponseDto>(TRANSACTIONS_API.list, {
          params: new HttpParams()
            .set('userId', userId)
            .set('limit', PAGE_SIZE)
            .set('skip', skip),
        }),
      );
      if (this.loadedFor !== userId) return;

      const rows = (page.transactions ?? []).map(toServiceTransaction);
      // Guard against an overlapping page repeating rows already on screen.
      const seen = new Set(this._transactions().map((t) => t.id));
      this._transactions.set([...this._transactions(), ...rows.filter((r) => !seen.has(r.id))]);
      this._hasMore.set(rows.length >= PAGE_SIZE);
    } catch {
      // Keep what is already shown; the member can try again.
    } finally {
      this._loadingMore.set(false);
    }
  }

  private reset(): void {
    this.loadedFor = null;
    this._transactions.set([]);
    this._summary.set(null);
    this._error.set(null);
    this._hasMore.set(false);
  }
}
