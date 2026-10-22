import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AppService } from '../http/api.service';
import { AppError, appError } from '../http/app-error';
import { SessionStore } from '../session/session.store';
import { UserInfoStore } from '../session/userinfo.store';
import { bookedServiceToBooking } from './booking.mapper';
import { Booking, BookingKind } from './booking.model';

/** LIST_BOOKED_SERVICES is paged; one page is read per request, more on "Load more". */
const PAGE_SIZE = 10;

/**
 * The member's bookings.
 *
 * Health check bookings come from `opd_ahc_booking` LIST_BOOKED_SERVICES
 * (serviceType_code phc). The other kinds — appointments, dental, vision, lab,
 * pharmacy — are not wired to an API yet, so their tabs stay empty. Cancel,
 * invoice and prescription actions are inert: the AHC rows expose none of
 * those controls. See REMOVED-APIS.md.
 *
 * Nothing loads on its own: other screens inject this store for its rows, and
 * none of them needs LIST_BOOKED_SERVICES. Only the Bookings screen calls
 * `load()`, once per visit, with concurrent calls sharing one request.
 */
@Injectable({ providedIn: 'root' })
export class BookingsStore {
  private readonly session = inject(SessionStore);
  private readonly api = inject(AppService);
  private readonly userStore = inject(UserInfoStore);

  private readonly _bookings = signal<readonly Booking[]>([]);
  private loadSeq = 0;
  /** The first-page request under way, shared by concurrent `load()` calls. */
  private inFlight: Promise<void> | null = null;
  /** Zero-based page last read. */
  private page = 0;
  private readonly _hasMore = signal(false);
  private readonly _loadingMore = signal(false);
  private readonly _loading = signal(false);
  private readonly _error = signal<AppError | null>(null);
  private readonly _partial = signal<readonly string[]>([]);
  private readonly _filter = signal<BookingKind | 'ALL'>('ALL');
  private readonly _cancelling = signal(false);
  private readonly _cancelError = signal<string | null>(null);
  private readonly _cancellingPrescription = signal<string | null>(null);
  private readonly _prescriptionError = signal<string | null>(null);
  private readonly _downloading = signal<string | null>(null);
  private readonly _invoiceError = signal<string | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly partial = this._partial.asReadonly();
  readonly filter = this._filter.asReadonly();
  readonly cancelling = this._cancelling.asReadonly();
  readonly cancelError = this._cancelError.asReadonly();
  readonly cancellingPrescription = this._cancellingPrescription.asReadonly();
  readonly prescriptionError = this._prescriptionError.asReadonly();
  readonly downloading = this._downloading.asReadonly();
  readonly invoiceError = this._invoiceError.asReadonly();
  readonly all = this._bookings.asReadonly();
  /** Whether the server has bookings beyond those read so far. */
  readonly hasMore = this._hasMore.asReadonly();
  readonly loadingMore = this._loadingMore.asReadonly();

  readonly bookings = computed(() => {
    const filter = this._filter();
    const all = this._bookings();
    return filter === 'ALL' ? all : all.filter((b) => b.kind === filter);
  });
  readonly upcoming = computed(() => this.bookings().filter((b) => b.isUpcoming));
  readonly past = computed(() => this.bookings().filter((b) => !b.isUpcoming));

  readonly counts = computed<Record<BookingKind | 'ALL', number>>(() => {
    const all = this._bookings();
    const tally = { ALL: all.length } as Record<BookingKind | 'ALL', number>;
    for (const kind of Object.values(BookingKind)) {
      tally[kind] = all.filter((b) => b.kind === kind).length;
    }
    return tally;
  });

  constructor() {
    // Sign-out, or another member signing in, drops what was read. Loading is
    // left to the Bookings screen.
    const signedIn = () => (this.session.isAuthenticated() ? (this.userStore.userInfo()?.[0]?.user_id ?? null) : null);
    // Starts from whoever is signed in now, so the effect's first run does not
    // cancel a load() the screen has already started.
    let user = untracked(signedIn);
    effect(() => {
      const current = signedIn();
      if (current === user) return;
      user = current;
      this.loadSeq++;
      this.inFlight = null;
      this.page = 0;
      this._bookings.set([]);
      this._hasMore.set(false);
      this._error.set(null);
    });
  }

  /** Reads the first page. Called by the Bookings screen; concurrent calls share one request. */
  load(): Promise<void> {
    this.inFlight ??= this.loadFirstPage().finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  /** Reads the list again, e.g. after a new booking. */
  refresh(): Promise<void> {
    return this.load();
  }

  /** Appends the next page. */
  async loadMore(): Promise<void> {
    const user = this.userStore.userInfo()?.[0];
    if (!user?.user_id || this._loadingMore() || this._loading() || !this._hasMore()) return;
    const seq = this.loadSeq;
    const next = this.page + 1;
    this._loadingMore.set(true);
    try {
      const { rows, total } = await this.fetchPage(user.user_id, next);
      if (seq !== this.loadSeq) return;
      // A server that ignores page_no sends the same rows again: keep each booking once.
      const seen = new Set(this._bookings().map((b) => b.id));
      const added = this.toBookings(rows, user).filter((b) => !seen.has(b.id));
      this.page = next;
      this._bookings.set(this.sorted([...this._bookings(), ...added]));
      this._hasMore.set(added.length > 0 && this.moreAfter(rows.length, total));
    } catch {
      if (seq === this.loadSeq) this._error.set(appError('server', 'We could not load more bookings. Please try again.'));
    } finally {
      if (seq === this.loadSeq) this._loadingMore.set(false);
    }
  }

  private async loadFirstPage(): Promise<void> {
    const user = this.userStore.userInfo()?.[0];
    if (!user?.user_id) return;
    const seq = ++this.loadSeq;
    this._loading.set(true);
    this._error.set(null);
    try {
      const { rows, total } = await this.fetchPage(user.user_id, 0);
      if (seq !== this.loadSeq) return;
      this.page = 0;
      this._bookings.set(this.sorted(this.toBookings(rows, user)));
      this._hasMore.set(this.moreAfter(rows.length, total));
    } catch {
      if (seq !== this.loadSeq) return;
      this._bookings.set([]);
      this._hasMore.set(false);
      this._error.set(appError('server', 'We could not load your bookings. Please try again.'));
    } finally {
      if (seq === this.loadSeq) this._loading.set(false);
    }
  }

  /** `count` is used as the total when the server sends one larger than what is read; else a full page hints at more. */
  private moreAfter(pageLength: number, total: number | null): boolean {
    const read = (this.page + 1) * PAGE_SIZE;
    return total !== null && total > pageLength ? total > read : pageLength === PAGE_SIZE;
  }

  private toBookings(rows: any[], user: any): Booking[] {
    const now = new Date();
    const key = user.api_encryption_key ?? null;
    const decrypt = (value: string): string => this.api.decryptText(value, key);
    return rows.map((row) => bookedServiceToBooking(row, now, decrypt));
  }

  /** Newest appointment first. */
  private sorted(bookings: Booking[]): Booking[] {
    return bookings.sort((a, b) => (b.scheduledFor?.getTime() ?? 0) - (a.scheduledFor?.getTime() ?? 0));
  }

  private async fetchPage(patientId: string, page: number): Promise<{ rows: any[]; total: number | null }> {
    const applicationName = 'habit-opd';
    const resourceName = 'opd_ahc_booking';
    const queryId = 'LIST_BOOKED_SERVICES';
    // Booked up to the end of today; FROM 0 means since the beginning.
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const filter =
      'serviceType_code:phc,is_visible:true,patient_id:' + patientId +
      ',FROMTOKEY:g_creation_time,FROM:0,TO:' + endOfToday.getTime();
    const query =
      'queryId=' + queryId +
      '&args=mode_of_appointment:opd_network' +
      '&search_columns=serviceItemName' +
      '&search=' +
      '&page_no=' + page +
      '&page_size=' + PAGE_SIZE +
      '&filter=' + filter +
      '&application=' + applicationName;
    const response = await firstValueFrom(this.api.getcall(resourceName, applicationName, query));
    const parsed = typeof response === 'string' ? JSON.parse(response) : response;
    const count = Number(parsed?.count);
    return {
      rows: Array.isArray(parsed?.resource) ? parsed.resource : [],
      total: Number.isFinite(count) ? count : null,
    };
  }

  setFilter(filter: BookingKind | 'ALL'): void {
    this._filter.set(filter);
  }

  retry(): void {
    void this.load();
  }

  // Inert in dummy mode — no backend. The static rows carry `isCancellable:false`
  // and no invoice / prescription paths, so these are never reached from the UI;
  // they remain only to keep the store's public shape.
  async cancel(_booking: Booking, _reason = 'Cancelled by member'): Promise<boolean> {
    return false;
  }

  async downloadInvoice(_booking: Booking): Promise<boolean> {
    return false;
  }

  async cancelPrescription(_booking: Booking, _reason: string): Promise<boolean> {
    return false;
  }
}
