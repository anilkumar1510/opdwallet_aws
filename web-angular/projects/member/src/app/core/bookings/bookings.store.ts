import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { FamilyStore } from '../family/family.store';
import { AppError, appError, isAppError } from '../http/app-error';
import { SessionStore } from '../session/session.store';
// Reuse the AHC map rather than redeclaring the path here — two declarations of
// one endpoint is the stale-duplicate shape 22-dead-endpoint-scan.mjs flags.
import { AHC_API } from '../ahc/ahc';
import { AhcOrderDto } from './booking.dto';
import { AppointmentDto } from './appointment.dto';
import { ServiceBookingDto } from './booking.dto';
import { CartDto, toCart } from '../lab/cart';
import { LabEnvelopeDto, LabOrderDto, LabPrescriptionDto } from '../lab/lab.dto';
import { LAB_API, toLabOrder, toLabPrescription } from '../lab/lab.mapper';
import { LabKind } from '../lab/lab.model';
import { OrderDto as PharmacyOrderDto, PHARMACY_API } from '../pharmacy/pharmacy';
import {
  BOOKINGS_API,
  appointmentToBooking,
  cartToBooking,
  ahcOrderToBooking,
  labOrderToBooking,
  labPrescriptionToBooking,
  pharmacyOrderToBooking,
  serviceBookingToBooking,
} from './booking.mapper';
import { Booking, BookingKind } from './booking.model';

/**
 * Consultations, dental and vision in one list, for whichever family member
 * is active. Three endpoints, one normalised Booking model.
 */
@Injectable({ providedIn: 'root' })
export class BookingsStore {
  private readonly http = inject(HttpClient);
  private readonly family = inject(FamilyStore);
  private readonly session = inject(SessionStore);

  private readonly _bookings = signal<readonly Booking[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<AppError | null>(null);
  /** Sources that failed while others succeeded, so the UI can say so. */
  private readonly _partial = signal<readonly string[]>([]);
  private readonly _filter = signal<BookingKind | 'ALL'>('ALL');
  private readonly _cancelling = signal(false);
  private readonly _cancelError = signal<string | null>(null);
  private readonly _cancellingPrescription = signal<string | null>(null);
  private readonly _prescriptionError = signal<string | null>(null);
  /** Booking id whose invoice is in flight, so one row spins and not all of them. */
  private readonly _downloading = signal<string | null>(null);
  private readonly _invoiceError = signal<string | null>(null);

  private loadedFor: string | null = null;

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

  /** Every booking, ignoring the screen filter. Use this for cross-screen views. */
  readonly all = this._bookings.asReadonly();

  readonly bookings = computed(() => {
    const filter = this._filter();
    const all = this._bookings();
    return filter === 'ALL' ? all : all.filter((booking) => booking.kind === filter);
  });

  readonly upcoming = computed(() => this.bookings().filter((b) => b.isUpcoming));
  readonly past = computed(() => this.bookings().filter((b) => !b.isUpcoming));

  /**
   * Derived from BookingKind rather than listed by hand, so adding a kind can
   * never leave a hole here — a missing key used to surface as a TS7053 at the
   * call site rather than at the source.
   */
  readonly counts = computed<Record<BookingKind | 'ALL', number>>(() => {
    const all = this._bookings();
    const tally = { ALL: all.length } as Record<BookingKind | 'ALL', number>;
    for (const kind of Object.values(BookingKind)) {
      tally[kind] = all.filter((booking) => booking.kind === kind).length;
    }
    return tally;
  });

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

  /**
   * Cancels a booking and refunds the wallet.
   *
   * Three sources, three contracts: appointments are PATCH .../user-cancel with
   * no body, dental and vision are PUT .../cancel with an optional reason. All
   * three look the booking up by its business id, not the Mongo _id.
   */
  async cancel(booking: Booking, reason = 'Cancelled by member'): Promise<boolean> {
    if (!booking.isCancellable || !booking.reference) return false;

    this._cancelling.set(true);
    this._cancelError.set(null);
    try {
      if (booking.kind === BookingKind.Appointment) {
        await firstValueFrom(
          this.http.patch(BOOKINGS_API.cancelAppointment(booking.reference), {}),
        );
      } else if (booking.kind === BookingKind.Dental || booking.kind === BookingKind.Vision) {
        const url =
          booking.kind === BookingKind.Dental
            ? BOOKINGS_API.cancelDental(booking.reference)
            : BOOKINGS_API.cancelVision(booking.reference);
        await firstValueFrom(this.http.put(url, { reason }));
      } else if (booking.kind === BookingKind.Vaccination) {
        await firstValueFrom(
          this.http.post(BOOKINGS_API.cancelVaccination(booking.reference), { reason }),
        );
      } else if (booking.kind === BookingKind.Pharmacy) {
        await firstValueFrom(this.http.post(PHARMACY_API.cancel(booking.reference), { reason }));
      } else {
        return false;
      }

      // Refetch so the status and the tab counts both settle.
      const activeId = this.family.activeMember()?.id;
      this.loadedFor = null;
      if (activeId) {
        this.loadedFor = activeId;
        void this.load(activeId);
      }
      return true;
    } catch (error: unknown) {
      this._cancelError.set(
        isAppError(error) ? error.message : 'We could not cancel that booking.',
      );
      return false;
    } finally {
      this._cancelling.set(false);
    }
  }

  setFilter(filter: BookingKind | 'ALL'): void {
    this._filter.set(filter);
  }

  /**
   * Fetch a booking's invoice PDF and hand it to the browser.
   *
   * `CLINIC_BOOKING_API[area].invoice` was declared with no caller from the day
   * it was written, while `/member/bookings` rendered "Invoice available" beside
   * it — a screen naming a document the portal could not produce. The reference
   * downloads it the same way (`bookings/page.tsx:761-793`).
   *
   * No navigation: the journey does not move, a file arrives. Dental and vision
   * only — `invoicePath` is null for every other kind, and a lab order's
   * `hasInvoice` is a report count, not an invoice.
   */
  async downloadInvoice(booking: Booking): Promise<boolean> {
    if (!booking.invoicePath) return false;
    this._invoiceError.set(null);
    this._downloading.set(booking.id);
    try {
      const blob = await firstValueFrom(
        this.http.get(booking.invoicePath, { responseType: 'blob' }),
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${booking.reference || booking.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      return true;
    } catch {
      this._invoiceError.set('We could not download that invoice. Please try again.');
      return false;
    } finally {
      this._downloading.set(null);
    }
  }

  /**
   * Cancel an uploaded prescription. The reference offers this on the bookings
   * screen (`bookings/page.tsx:824-885`); `LAB_API[kind].cancelPrescription` was
   * declared here and never called.
   *
   * The reason is the API's requirement, not decoration: 10-500 characters,
   * enforced by `CancelLabPrescriptionDto`. It is checked here as well so a
   * too-short reason costs the member nothing instead of a 400.
   */
  async cancelPrescription(booking: Booking, reason: string): Promise<boolean> {
    const path = booking.cancelPrescriptionPath;
    const trimmed = reason.trim();
    if (!path || trimmed.length < 10 || trimmed.length > 500) return false;
    this._prescriptionError.set(null);
    this._cancellingPrescription.set(booking.id);
    try {
      await firstValueFrom(this.http.post(path, { reason: trimmed }));
      // The row must disappear, so re-read from the API rather than patching
      // local state — a cancelled prescription also changes what the lab hub
      // shows, and one source of truth is cheaper than two that can drift.
      const activeId = this.family.activeMember()?.id;
      if (activeId) await this.load(activeId);
      return true;
    } catch (error) {
      this._prescriptionError.set(
        isAppError(error) ? error.message : 'We could not cancel that prescription. Please try again.',
      );
      return false;
    } finally {
      this._cancellingPrescription.set(null);
    }
  }

  retry(): void {
    const activeId = this.family.activeMember()?.id;
    if (activeId) void this.load(activeId);
  }

  private async load(userId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    this._partial.set([]);

    // One clock reading for the whole batch, so two rows on the same day can
    // never disagree about whether that day is still upcoming.
    const now = new Date();
    // A Set, because a kind with three sources could otherwise report itself
    // failed three times and skew the "everything failed" check below.
    const failures = new Set<string>();
    const failed = {
      push: (label: string) => failures.add(label),
      get length() {
        return failures.size;
      },
    };

    const appointments = firstValueFrom(
      this.http.get<AppointmentDto[]>(BOOKINGS_API.appointmentsByUser(userId)),
    )
      .then((rows) => (rows ?? []).map((dto) => appointmentToBooking(dto, now)))
      .catch(() => {
        failed.push('Consultations');
        return [] as Booking[];
      });

    const service = (url: string, kind: BookingKind, label: string) =>
      firstValueFrom(this.http.get<ServiceBookingDto[]>(url))
        .then((rows) => (rows ?? []).map((dto) => serviceBookingToBooking(dto, kind, now)))
        .catch(() => {
          failed.push(label);
          return [] as Booking[];
        });

    /**
     * Orders, carts and prescriptions all appear under these tabs — a member
     * who has only uploaded a prescription still needs to see it here, which
     * is what web-member shows as "In Queue".
     */
    const labLike = (kind: LabKind, bookingKind: BookingKind, label: string) => {
      const api = LAB_API[kind];

      // Each source resolves independently: one failing endpoint must not
      // take the other two down with it.
      const unwrap = <T>(url: string): Promise<T[]> =>
        firstValueFrom(this.http.get<LabEnvelopeDto<T[]>>(url, { params: { userId } }))
          .then((response) => (response.success === false ? [] : (response.data ?? [])))
          .catch(() => {
            failed.push(label);
            return [] as T[];
          });

      return Promise.all([
        unwrap<LabOrderDto>(api.orders),
        unwrap<CartDto>(api.carts),
        unwrap<LabPrescriptionDto>(api.prescriptions),
      ]).then(([orders, carts, prescriptions]) => [
        ...orders.map((dto) => labOrderToBooking(toLabOrder(dto, kind), now, bookingKind)),
        ...carts
          .map(toCart)
          .filter((cart) => cart.status !== 'ORDERED' && cart.status !== 'CANCELLED')
          .map((cart) => cartToBooking(cart, bookingKind)),
        // Once an order exists the prescription is represented by it. The
        // diagnostics endpoint omits hasOrder entirely, so its prescriptions
        // always pass this filter — the same behaviour web-member shows.
        ...prescriptions
          .map((dto) => toLabPrescription(dto, kind))
          .filter((prescription) => !prescription.hasOrder)
          .map((prescription) => labPrescriptionToBooking(prescription, bookingKind)),
      ]);
    };

    /**
     * AHC. Its envelope is `{ success, data }`, not the bare array dental and
     * vision return, so it cannot use `service()`.
     */
    const ahc = firstValueFrom(
      this.http.get<{ success?: boolean; data?: AhcOrderDto[] }>(AHC_API.orders, {
        params: { userId },
      }),
    )
      .then((response) =>
        (response?.success === false ? [] : (response?.data ?? [])).map((dto) =>
          ahcOrderToBooking(dto, now),
        ),
      )
      .catch(() => {
        failed.push('Health checkup');
        return [] as Booking[];
      });

    /** Pharmacy. Scoped to the caller's own JWT, so no userId param needed. */
    const pharmacy = firstValueFrom(this.http.get<{ orders?: PharmacyOrderDto[] }>(PHARMACY_API.orders))
      .then((response) => (response?.orders ?? []).map((dto) => pharmacyOrderToBooking(dto, now)))
      .catch(() => {
        failed.push('Pharmacy');
        return [] as Booking[];
      });

    try {
      const batches = await Promise.all([
        appointments,
        service(BOOKINGS_API.dentalByUser(userId), BookingKind.Dental, 'Dental'),
        service(BOOKINGS_API.visionByUser(userId), BookingKind.Vision, 'Vision'),
        labLike(LabKind.Lab, BookingKind.Lab, 'Lab'),
        labLike(LabKind.Diagnostic, BookingKind.Diagnostic, 'Diagnostic'),
        ahc,
        service(BOOKINGS_API.vaccinationByUser(userId), BookingKind.Vaccination, 'Vaccination'),
        pharmacy,
      ]);
      if (this.loadedFor !== userId) return;

      const merged = batches.flat().sort((a, b) => {
        const at = a.scheduledFor?.getTime() ?? 0;
        const bt = b.scheduledFor?.getTime() ?? 0;
        return bt - at;
      });

      this._bookings.set(merged);
      this._partial.set([...failures]);

      // Every source failing is a real failure, not a partial one. Eight
      // sources as of this session — Pharmacy joined, so the threshold moved
      // with it. Leaving it lower would have declared a total failure while
      // one source still worked.
      if (failed.length >= 8) this._error.set(appError('server'));
    } catch (error: unknown) {
      if (this.loadedFor !== userId) return;
      this._bookings.set([]);
      this._error.set(isAppError(error) ? error : appError('server'));
    } finally {
      if (this.loadedFor === userId) this._loading.set(false);
    }
  }

  private reset(): void {
    this.loadedFor = null;
    this._bookings.set([]);
    this._error.set(null);
    this._partial.set([]);
    this._filter.set('ALL');
  }
}
