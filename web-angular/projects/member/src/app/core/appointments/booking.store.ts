import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  OrderValidation as CoverCheck,
  OrderValidationDto,
  toOrderValidation,
} from '../domain/cover-check';
import { AppError, appError, isAppError } from '../http/app-error';
import { SessionStore } from '../session/session.store';
import { PAYMENTS_API } from '../transactions/transaction.mapper';
import {
  APPOINTMENTS_API,
  ConsultDay,
  ConsultMode,
  AppointmentBookingResult,
  CreateAppointmentInput,
  Doctor,
  CONSULT_CATEGORY,
  DOCTOR_SEARCH_RADIUS_KM,
  DoctorDto,
  DoctorSearchLocation,
  DoctorSlotDto,
  DoctorsResponseDto,
  Specialty,
  SpecialtyDto,
  ValidateBookingInput,
  toAppointmentBookingResult,
  toConsultDay,
  toDoctor,
  toSpecialty,
} from './booking';

/** Specialties, doctors, slots and appointment creation. */
@Injectable({ providedIn: 'root' })
export class AppointmentBookingStore {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionStore);

  private readonly _specialties = signal<readonly Specialty[]>([]);
  private readonly _doctors = signal<readonly Doctor[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<AppError | null>(null);
  private readonly _booking = signal(false);
  private readonly _bookingError = signal<string | null>(null);

  private specialtiesLoaded: ConsultMode | null = null;
  private doctorsKey: string | null = null;

  readonly specialties = this._specialties.asReadonly();
  readonly doctors = this._doctors.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly booking = this._booking.asReadonly();
  readonly bookingError = this._bookingError.asReadonly();

  constructor() {
    effect(() => {
      if (!this.session.isAuthenticated()) this.reset();
    });
  }

  /** In-clinic and online draw from different categories, so each is loaded separately. */
  loadSpecialties(mode: ConsultMode): void {
    if (mode === this.specialtiesLoaded) return;
    this.specialtiesLoaded = mode;
    void this.runSpecialties(mode);
  }

  /**
   * Doctors for a specialty, optionally restricted to online consultation and
   * optionally located.
   *
   * `near` drives the sheet's "sorted by nearest doctor first" (flow 2, step 4).
   * The whole calculation is the API's: given a pincode or coordinates it
   * geocodes, measures each clinic, filters to `radius` and sorts closest first
   * (`doctors.service.ts:75-226`). Sending nothing returns the unlocated list,
   * which is what every caller did until now.
   *
   * Location is part of the cache key: the same specialty at a different place
   * is a different list, and without it the second search would return the
   * first one's results.
   */
  selectDoctors(specialtyId: string, mode: ConsultMode, near?: DoctorSearchLocation): void {
    const where = near?.pincode || (near?.latitude != null ? `${near.latitude},${near.longitude}` : '');
    const key = `${specialtyId}:${mode}:${where}`;
    if (!specialtyId || key === this.doctorsKey) return;
    this.doctorsKey = key;
    void this.runDoctors(specialtyId, mode, key, near);
  }

  /**
   * Refetches the current doctor list, ignoring the cache key.
   *
   * `selectDoctors` early-returns when the key is unchanged, and a failed run
   * leaves the key set — so calling it again with the same arguments, which is
   * exactly what a retry button does, did nothing at all. Clearing the key
   * first is what makes a retry a retry.
   */
  retryDoctors(specialtyId: string, mode: ConsultMode, near?: DoctorSearchLocation): void {
    this.doctorsKey = null;
    this.selectDoctors(specialtyId, mode, near);
  }

  doctorById(doctorId: string): Doctor | undefined {
    return this._doctors().find((doctor) => doctor.id === doctorId);
  }

  /**
   * Every bookable day for a doctor, each with its own times.
   *
   * One request: the API expands the recurring templates itself and returns
   * dates that actually have slots, so the screen offers only real days rather
   * than a fixed strip that is mostly empty.
   *
   * `clinicId` is not optional in practice — it decides whether the returned
   * slot ids are in-clinic or ONLINE.
   */
  async days(doctorId: string, clinicId: string): Promise<readonly ConsultDay[]> {
    if (!doctorId) return [];
    try {
      const response = await firstValueFrom(
        this.http.get<DoctorSlotDto[]>(APPOINTMENTS_API.doctorSlots(doctorId), {
          params: clinicId ? new HttpParams().set('clinicId', clinicId) : undefined,
        }),
      );
      return (response ?? []).map(toConsultDay).filter((day) => day.date && day.slots.length);
    } catch {
      return [];
    }
  }

  /**
   * The real backend status for one appointment — `PENDING_CONFIRMATION`,
   * `CONFIRMED`, `COMPLETED` or `CANCELLED`. Null on any failure.
   *
   * The in-clinic journey screen otherwise never asks: `InClinicFlowStore` is
   * entirely drawn from localStorage, so operations confirming a real
   * appointment left the member's screen saying "pending confirmation"
   * forever. This is the one field needed to reconcile CONFIRM/CANCEL against
   * what actually happened — PAID/VISITED/COMPLETED stay drawn, since nothing
   * on the backend distinguishes them from COMPLETED alone.
   */
  async remoteStatus(appointmentId: string): Promise<string | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ status?: string }>(APPOINTMENTS_API.byId(appointmentId)),
      );
      return response?.status?.trim().toUpperCase() || null;
    } catch {
      return null;
    }
  }

  /**
   * Checks wallet coverage before the member commits. Null if unavailable.
   *
   * Same cover-check shape as the lab and clinic journeys, so it shares their
   * mapper. This route spells the flag `isAllowed` rather than `valid`.
   */
  async validate(input: ValidateBookingInput): Promise<CoverCheck | null> {
    try {
      const response = await firstValueFrom(
        this.http.post<OrderValidationDto>(APPOINTMENTS_API.validate, input),
      );
      return response ? toOrderValidation(response) : null;
    } catch {
      return null;
    }
  }

  /**
   * Creates the appointment. Returns its id **and any payment the member still
   * owes**, or null with `bookingError`.
   *
   * This used to read `appointmentId` off the top level and so always returned
   * an empty string. Nothing caught it because the id was never used — the
   * journey navigates to a list, not to the appointment.
   */
  async create(input: CreateAppointmentInput): Promise<AppointmentBookingResult | null> {
    this._booking.set(true);
    this._bookingError.set(null);
    try {
      const response = await firstValueFrom(
        this.http.post<Record<string, unknown>>(APPOINTMENTS_API.create, input),
      );
      return toAppointmentBookingResult(response);
    } catch (error: unknown) {
      this._bookingError.set(
        isAppError(error) ? error.message : 'We could not book that appointment.',
      );
      return null;
    } finally {
      this._booking.set(false);
    }
  }

  /**
   * Cancels the appointment itself, by its business id.
   *
   * The in-clinic journey needs this because its cancel is not the bookings
   * list's cancel: cancelling there and not here would leave a live appointment
   * with the member told their request was withdrawn. The API refuses a
   * cancellation whose appointment time has already passed
   * (`appointments.service.ts:1188`), so false is a real answer, not a
   * swallowed error.
   */
  async cancelAppointment(appointmentId: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.patch(APPOINTMENTS_API.cancel(appointmentId), {}));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Cancels a payment the in-clinic journey did not ask for.
   *
   * Booking with the wallet switched off is what keeps the request unpaid and
   * pending, but the API answers that by raising a payment for the whole fee.
   * Leaving it would show the member a due they do not owe — the self-payment
   * is settled from the cart after the clinic confirms, and it is a different
   * number. Failure is swallowed: a stray PENDING payment is untidy, not
   * harmful, and must not sink a booking that already exists.
   */
  async discardPayment(paymentId: string): Promise<void> {
    try {
      await firstValueFrom(this.http.post(PAYMENTS_API.cancel(paymentId), {}));
    } catch {
      // Deliberately ignored — see above.
    }
  }

  private async runSpecialties(mode: ConsultMode): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      // This route answers `{ categoryId, services, total }`.
      const response = await firstValueFrom(
        this.http.get<{ services?: SpecialtyDto[] }>(
          APPOINTMENTS_API.specialties(CONSULT_CATEGORY[mode]),
        ),
      );
      if (this.specialtiesLoaded !== mode) return;
      this._specialties.set(
        (response?.services ?? []).filter((row) => row.isActive !== false).map(toSpecialty),
      );
    } catch (error: unknown) {
      this.specialtiesLoaded = null;
      this._error.set(isAppError(error) ? error : appError('server'));
    } finally {
      this._loading.set(false);
    }
  }

  private async runDoctors(
    specialtyId: string,
    mode: ConsultMode,
    key: string,
    near?: DoctorSearchLocation,
  ): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      let params = new HttpParams().set('specialtyId', specialtyId);
      if (mode === 'ONLINE') params = params.set('type', 'ONLINE');

      // ONLINE has no clinic to measure, and the API says so itself
      // (`doctors.service.ts:141`) — sending a location there would filter a
      // list that has nothing to filter on.
      if (mode !== 'ONLINE' && near) {
        if (near.pincode) {
          params = params.set('pincode', near.pincode);
        } else if (near.latitude != null && near.longitude != null) {
          params = params.set('latitude', near.latitude).set('longitude', near.longitude);
        }
        // The API defaults radius to 10km, which is tight for a city and
        // silently drops clinics. Widened deliberately; the member is choosing
        // a doctor, not a corner shop.
        params = params.set('radius', DOCTOR_SEARCH_RADIUS_KM);
      }

      const response = await firstValueFrom(
        this.http.get<DoctorsResponseDto | DoctorDto[]>(APPOINTMENTS_API.doctors, { params }),
      );
      if (this.doctorsKey !== key) return;

      const rows = Array.isArray(response) ? response : (response.data ?? []);
      // Inactive doctors cannot be booked, so they are not offered.
      this._doctors.set(rows.map(toDoctor).filter((doctor) => doctor.isActive));
    } catch (error: unknown) {
      if (this.doctorsKey !== key) return;
      this._doctors.set([]);
      this._error.set(isAppError(error) ? error : appError('server'));
    } finally {
      if (this.doctorsKey === key) this._loading.set(false);
    }
  }

  private reset(): void {
    this.specialtiesLoaded = null;
    this.doctorsKey = null;
    this._specialties.set([]);
    this._doctors.set([]);
    this._error.set(null);
    this._bookingError.set(null);
  }
}
