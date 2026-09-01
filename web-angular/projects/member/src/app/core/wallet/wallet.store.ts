import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { FamilyStore } from '../family/family.store';
import { AppError, appError, isAppError } from '../http/app-error';
import { SessionStore } from '../session/session.store';
import { WalletBalanceDto, WalletTransactionsResponseDto } from './wallet.dto';
import { WALLET_API, summarise, toTransaction, toWallet } from './wallet.mapper';
import { Wallet, WalletActivityTotals, WalletTransaction } from './wallet.model';

const PAGE_SIZE = 15;
/**
 * How many rows the CREDITS/DEBITS/NET figures are computed from.
 *
 * They must NOT be computed from the paged list: with a 15-row page the totals
 * would be wrong on arrival and would CHANGE every time the member pressed
 * "Show more" — a summary that moves while the data underneath it does not is
 * worse than no summary. `GET /wallet/transactions` exposes no aggregate and its
 * `total` field is only the returned count, so the figures come from one wide
 * read instead. The reference does the same thing at limit=100
 * (`transactions/page.tsx:129`); this account already has 70.
 *
 * ponytail: a member past 500 transactions would see a truncated total. The
 * upgrade path is an aggregate endpoint, not a bigger number.
 */
const TOTALS_WINDOW = 500;

/**
 * The wallet of whichever family member is currently active.
 *
 * The dependency on FamilyStore.activeMember() is an effect, not a
 * subscription: switching family member reloads the wallet with no wiring at
 * the call site, which is what makes an open wallet screen follow the switch.
 */
@Injectable({ providedIn: 'root' })
export class WalletStore {
  private readonly http = inject(HttpClient);
  private readonly family = inject(FamilyStore);
  private readonly session = inject(SessionStore);

  private readonly _wallet = signal<Wallet | null>(null);
  private readonly _transactions = signal<readonly WalletTransaction[]>([]);
  private readonly _loading = signal(false);
  private readonly _loadingMore = signal(false);
  private readonly _error = signal<AppError | null>(null);
  private readonly _limit = signal(PAGE_SIZE);
  private readonly _hasMore = signal(false);
  private readonly _activityTotals = signal<WalletActivityTotals | null>(null);

  /** Whose wallet is currently loaded, so a repeat switch is not refetched. */
  private loadedFor: string | null = null;

  readonly wallet = this._wallet.asReadonly();
  readonly transactions = this._transactions.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly loadingMore = this._loadingMore.asReadonly();
  readonly error = this._error.asReadonly();
  readonly hasMore = this._hasMore.asReadonly();
  readonly activityTotals = this._activityTotals.asReadonly();

  readonly memberName = computed(() => this.family.activeMember()?.fullName ?? '');
  readonly isEmpty = computed(() => this._wallet()?.exists === false);

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

  /** Retries whatever the current active member is. */
  retry(): void {
    const activeId = this.family.activeMember()?.id;
    if (activeId) void this.load(activeId);
  }

  private async load(userId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    this._limit.set(PAGE_SIZE);
    try {
      const [balance, history, everything] = await Promise.all([
        firstValueFrom(this.http.get<WalletBalanceDto>(WALLET_API.balance, { params: this.forUser(userId) })),
        this.fetchTransactions(userId, PAGE_SIZE),
        // Best-effort: the ledger and its balance are the screen; the summary is
        // an extra. A failure here leaves the figures hidden, not the page broken.
        this.fetchTransactions(userId, TOTALS_WINDOW).catch(() => null),
      ]);
      // Guard against a slower earlier request landing after a newer switch.
      if (this.loadedFor !== userId) return;

      this._wallet.set(toWallet(balance));
      this.acceptTransactions(history, PAGE_SIZE);
      this._activityTotals.set(everything ? summarise(everything.transactions ?? []) : null);
    } catch (error: unknown) {
      if (this.loadedFor !== userId) return;
      this._wallet.set(null);
      this._transactions.set([]);
      this._error.set(isAppError(error) ? error : appError('server'));
    } finally {
      if (this.loadedFor === userId) this._loading.set(false);
    }
  }

  /**
   * The API takes a limit but no offset, so "load more" refetches a longer
   * window and replaces the list. Appending the response instead would repeat
   * every row already displayed.
   *
   * ponytail: O(n) refetch per page - page 5 re-downloads pages 1-4. Fine at
   * 15-row pages over a few hundred rows. Upgrade path: add `skip` to
   * GET /wallet/transactions, as GET /transactions already has.
   */
  async loadMore(): Promise<void> {
    const userId = this.family.activeMember()?.id;
    if (!userId || this._loadingMore() || this._loading() || !this._hasMore()) return;

    const nextLimit = this._limit() + PAGE_SIZE;
    this._loadingMore.set(true);
    try {
      const history = await this.fetchTransactions(userId, nextLimit);
      if (this.loadedFor !== userId) return;
      this._limit.set(nextLimit);
      this.acceptTransactions(history, nextLimit);
    } catch {
      // Keep what is already on screen; the member can try again.
    } finally {
      this._loadingMore.set(false);
    }
  }

  private fetchTransactions(userId: string, limit: number): Promise<WalletTransactionsResponseDto> {
    return firstValueFrom(
      this.http.get<WalletTransactionsResponseDto>(WALLET_API.transactions, {
        params: this.forUser(userId).set('limit', limit),
      }),
    );
  }

  private acceptTransactions(response: WalletTransactionsResponseDto, limit: number): void {
    const rows = (response.transactions ?? []).map(toTransaction);
    this._transactions.set(rows);
    // A full page back means there is probably another one.
    this._hasMore.set(rows.length >= limit);
  }

  private forUser(userId: string): HttpParams {
    return new HttpParams().set('userId', userId);
  }

  private reset(): void {
    this.loadedFor = null;
    this._wallet.set(null);
    this._transactions.set([]);
    this._error.set(null);
    this._hasMore.set(false);
    this._activityTotals.set(null);
    this._limit.set(PAGE_SIZE);
  }
}
