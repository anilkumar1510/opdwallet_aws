import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AppService } from '../http/api.service';
import { AppError, appError } from '../http/app-error';
import { SessionStore } from '../session/session.store';
import { UserInfoStore } from '../session/userinfo.store';
import { bookedServiceToBooking } from './booking.mapper';
import { Booking, BookingKind } from './booking.model';

/** LIST_BOOKED_SERVICES is paged; rows are read a page at a time until a short page. */
const PAGE_SIZE = 10;
/** Guard against a server that never sends a short page. */
const MAX_PAGES = 20;

/**
 * The member's bookings.
 *
 * Health check bookings come from `opd_ahc_booking` LIST_BOOKED_SERVICES
 * (serviceType_code phc). The other kinds — appointments, dental, vision, lab,
 * pharmacy — are not wired to an API yet, so their tabs stay empty. Cancel,
 * invoice and prescription actions are inert: the AHC rows expose none of
 * those controls. See REMOVED-APIS.md.
 */
@Injectable({ providedIn: 'root' })
export class BookingsStore {
  private readonly session = inject(SessionStore);
  private readonly api = inject(AppService);
  private readonly userStore = inject(UserInfoStore);

  private readonly _bookings = signal<readonly Booking[]>([]);
  /** The patient the list was loaded for, so a reload happens only when it changes. */
  private loadedFor: string | null = null;
  private loadSeq = 0;
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
    // Loads once the signed-in member's user info has arrived; sign-out clears the list.
    effect(() => {
      const user = this.userStore.userInfo()?.[0];
      if (!this.session.isAuthenticated() || !user?.user_id) {
        this.loadedFor = null;
        this.loadSeq++;
        this._bookings.set([]);
        return;
      }
      if (this.loadedFor !== user.user_id) void this.load(user);
    });
  }

  /** Reads the list again, e.g. after a new booking. */
  refresh(): Promise<void> {
    const user = this.userStore.userInfo()?.[0];
    return user?.user_id ? this.load(user) : Promise.resolve();
  }

  private async load(user: any): Promise<void> {
    const seq = ++this.loadSeq;
    this.loadedFor = user.user_id;
    this._loading.set(true);
    this._error.set(null);
    try {
      const rows: any[] = [];
      for (let page = 0; page < MAX_PAGES; page++) {
        const batch = await this.fetchPage(user.user_id, page);
        if (seq !== this.loadSeq) return;
        rows.push(...batch);
        if (batch.length < PAGE_SIZE) break;
      }
      const now = new Date();
      const key = user.api_encryption_key ?? null;
      const decrypt = (value: string): string => this.api.decryptText(value, key);
      const bookings = rows
        .map((row) => bookedServiceToBooking(row, now, decrypt))
        // Newest appointment first.
        .sort((a, b) => (b.scheduledFor?.getTime() ?? 0) - (a.scheduledFor?.getTime() ?? 0));
      this._bookings.set(bookings);
    } catch {
      if (seq !== this.loadSeq) return;
      this.loadedFor = null;
      this._bookings.set([]);
      this._error.set(appError('server', 'We could not load your bookings. Please try again.'));
    } finally {
      if (seq === this.loadSeq) this._loading.set(false);
    }
  }

  private async fetchPage(patientId: string, page: number): Promise<any[]> {
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
    return Array.isArray(parsed?.resource) ? parsed.resource : [];
  }

  setFilter(filter: BookingKind | 'ALL'): void {
    this._filter.set(filter);
  }

  retry(): void {
    void this.refresh();
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
