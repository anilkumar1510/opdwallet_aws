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
import {
  CLINIC_BOOKING_API,
  Clinic,
  ClinicArea,
  ClinicBookingResult,
  ClinicSlot,
  ClinicsResponseDto,
  CreateClinicBookingInput,
  ValidateClinicBookingInput,
  SlotsResponseDto,
  toBookingResult,
  toClinic,
  toClinicSlot,
} from './clinic-booking';

/**
 * Clinics, slots and booking creation for Vision and Dental.
 *
 * Keyed by area rather than split into two stores, because the two areas are
 * the same contract on different prefixes.
 */
@Injectable({ providedIn: 'root' })
export class ClinicBookingStore {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionStore);

  private readonly _clinics = signal<readonly Clinic[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<AppError | null>(null);
  private readonly _booking = signal(false);
  private readonly _validating = signal(false);
  private readonly _bookingError = signal<string | null>(null);

  private loadedKey: string | null = null;
  private inFlight: Promise<void> | null = null;

  readonly clinics = this._clinics.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly booking = this._booking.asReadonly();
  readonly validating = this._validating.asReadonly();
  readonly bookingError = this._bookingError.asReadonly();

  constructor() {
    effect(() => {
      if (!this.session.isAuthenticated()) this.reset();
    });
  }

  /** Clinics offering a service, optionally near a pincode. */
  selectClinics(area: ClinicArea, serviceCode: string, pincode?: string): void {
    const key = `${area}:${serviceCode}:${pincode ?? ''}`;
    if (!serviceCode || key === this.loadedKey) return;
    this.loadedKey = key;
    this.inFlight ??= this.loadClinics(area, serviceCode, pincode, key).finally(() => {
      this.inFlight = null;
    });
  }

  retry(area: ClinicArea, serviceCode: string, pincode?: string): void {
    this.loadedKey = null;
    this.selectClinics(area, serviceCode, pincode);
  }

  clinicById(clinicId: string): Clinic | undefined {
    return this._clinics().find((clinic) => clinic.id === clinicId);
  }

  /** Slots for a clinic on one day. Empty on failure — never throws. */
  async slots(area: ClinicArea, clinicId: string, date: string): Promise<readonly ClinicSlot[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<SlotsResponseDto>(CLINIC_BOOKING_API[area].slots, {
          params: new HttpParams().set('clinicId', clinicId).set('date', date),
        }),
      );
      return (response.slots ?? []).map(toClinicSlot);
    } catch {
      return [];
    }
  }

  /**
   * Dry run before confirming, as web-member does — the same check the lab
   * journey runs, on the same response shape. Returns null if the check itself
   * failed, which is not the same as the booking being refused.
   */
  async validate(area: ClinicArea, input: ValidateClinicBookingInput): Promise<CoverCheck | null> {
    this._validating.set(true);
    try {
      const response = await firstValueFrom(
        this.http.post<OrderValidationDto>(CLINIC_BOOKING_API[area].validate, input),
      );
      return response ? toOrderValidation(response) : null;
    } catch {
      return null;
    } finally {
      this._validating.set(false);
    }
  }

  /**
   * Completes a vision booking after it has been created: debits the wallet and
   * reports whether the member still owes something at the gateway.
   *
   * Returns null on failure with `bookingError` set. A `paymentId` in the
   * result means the journey continues at /member/payments/:id.
   */
  async processVisionPayment(
    bookingId: string,
  ): Promise<{ paymentRequired: boolean; paymentId: string | null } | null> {
    this._booking.set(true);
    this._bookingError.set(null);
    try {
      const response = await firstValueFrom(
        this.http.post<Record<string, unknown>>(
          CLINIC_BOOKING_API.VISION.processPayment(bookingId),
          {},
        ),
      );
      const booking = (response?.['booking'] as Record<string, unknown> | undefined) ?? {};
      const paymentId = booking['paymentId'] ? String(booking['paymentId']) : null;
      return { paymentRequired: response?.['paymentRequired'] === true, paymentId };
    } catch (error: unknown) {
      this._bookingError.set(
        isAppError(error) ? error.message : 'We could not complete that payment.',
      );
      return null;
    } finally {
      this._booking.set(false);
    }
  }

  /**
   * Creates the booking. Returns its id **and any payment the member still
   * owes**, or null with `bookingError` set.
   *
   * The payment reference is part of the result, not a detail: dental settles
   * the wallet here and leaves a copay behind. The confirm page does not yet act
   * on it — see `ClinicBookingResult` and `audit/20-copay-continuation.md`.
   */
  async create(
    area: ClinicArea,
    input: CreateClinicBookingInput,
  ): Promise<ClinicBookingResult | null> {
    this._booking.set(true);
    this._bookingError.set(null);
    try {
      const response = await firstValueFrom(
        this.http.post<Record<string, unknown>>(CLINIC_BOOKING_API[area].create, input),
      );
      // These routes return the booking directly, not wrapped.
      const data = (response['data'] as Record<string, unknown> | undefined) ?? response;
      const result = toBookingResult(data);
      if (!result.bookingId) throw appError('server');
      return result;
    } catch (error: unknown) {
      this._bookingError.set(
        isAppError(error) ? error.message : 'We could not confirm that booking.',
      );
      return null;
    } finally {
      this._booking.set(false);
    }
  }

  private async loadClinics(
    area: ClinicArea,
    serviceCode: string,
    pincode: string | undefined,
    key: string,
  ): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      let params = new HttpParams().set('serviceCode', serviceCode);
      if (pincode) params = params.set('pincode', pincode);

      const response = await firstValueFrom(
        this.http.get<ClinicsResponseDto>(CLINIC_BOOKING_API[area].clinics, { params }),
      );
      if (this.loadedKey !== key) return;
      this._clinics.set((response.clinics ?? []).map(toClinic));
    } catch (error: unknown) {
      if (this.loadedKey !== key) return;
      this._clinics.set([]);
      this._error.set(isAppError(error) ? error : appError('server'));
    } finally {
      if (this.loadedKey === key) this._loading.set(false);
    }
  }

  private reset(): void {
    this.loadedKey = null;
    this.inFlight = null;
    this._clinics.set([]);
    this._error.set(null);
    this._bookingError.set(null);
  }
}
