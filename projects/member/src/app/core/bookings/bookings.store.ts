import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { AppError } from '../http/app-error';
import { SessionStore } from '../session/session.store';
import { Booking, BookingKind } from './booking.model';
import { STATIC_BOOKINGS } from './static-bookings.data';

/**
 * The member's bookings.
 *
 * DUMMY / STATIC — no backend. This used to aggregate live data from the
 * appointments, service-booking, lab, AHC and pharmacy endpoints and to cancel /
 * download-invoice / cancel-prescription against them. All of that is removed;
 * the list is served from `static-bookings.data.ts` and the actions are inert
 * (the static rows expose no cancel / invoice / prescription controls). The
 * public shape is unchanged so the page did not need reworking. See
 * REMOVED-APIS.md.
 */
@Injectable({ providedIn: 'root' })
export class BookingsStore {
  private readonly session = inject(SessionStore);

  private readonly _bookings = signal<readonly Booking[]>(STATIC_BOOKINGS);
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
    // Sign-out clears the list; sign-in restores the static set.
    effect(() => {
      this._bookings.set(this.session.isAuthenticated() ? STATIC_BOOKINGS : []);
    });
  }

  setFilter(filter: BookingKind | 'ALL'): void {
    this._filter.set(filter);
  }

  retry(): void {
    this._bookings.set(STATIC_BOOKINGS);
    this._error.set(null);
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
