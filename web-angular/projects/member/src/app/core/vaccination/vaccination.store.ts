import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ClinicSlot, SlotsResponseDto, toClinicSlot } from '../clinic-booking/clinic-booking';
import { ClinicBookingResult, toBookingResult } from '../clinic-booking/clinic-booking';
import { OrderValidation as CoverCheck, OrderValidationDto, toOrderValidation } from '../domain/cover-check';
import { AppError, appError, isAppError } from '../http/app-error';
import { SessionStore } from '../session/session.store';
import {
  CreateVaccinationBookingInput,
  VACCINATION_API,
  ValidateVaccinationBookingInput,
  VaccineService,
  VaccineServicesResponseDto,
  Vendor,
  VendorsResponseDto,
  toVaccineService,
  toVendor,
} from './vaccination';

/**
 * Vaccine catalogue, vendors, slots and booking creation.
 *
 * The API is fully built (services, vendors, slots, validate, create, cancel,
 * invoice) — this store is pure wiring, no drawn state. Reuses the same
 * CoverCheck/ClinicSlot/ClinicBookingResult shapes Vision/Dental/Lab already
 * share, since Vaccination's validate/slots/create responses are identical.
 */
@Injectable({ providedIn: 'root' })
export class VaccinationStore {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionStore);

  private readonly _services = signal<readonly VaccineService[]>([]);
  private readonly _servicesLoading = signal(false);
  private readonly _servicesError = signal<AppError | null>(null);

  private readonly _vendors = signal<readonly Vendor[]>([]);
  private readonly _vendorsLoading = signal(false);
  private readonly _vendorsError = signal<AppError | null>(null);

  private readonly _validating = signal(false);
  private readonly _booking = signal(false);
  private readonly _bookingError = signal<string | null>(null);

  private loadedServicesFor: string | null = null;
  private loadedVendorsKey: string | null = null;

  readonly services = this._services.asReadonly();
  readonly servicesLoading = this._servicesLoading.asReadonly();
  readonly servicesError = this._servicesError.asReadonly();

  readonly vendors = this._vendors.asReadonly();
  readonly vendorsLoading = this._vendorsLoading.asReadonly();
  readonly vendorsError = this._vendorsError.asReadonly();

  readonly validating = this._validating.asReadonly();
  readonly booking = this._booking.asReadonly();
  readonly bookingError = this._bookingError.asReadonly();

  constructor() {
    effect(() => {
      if (!this.session.isAuthenticated()) this.reset();
    });
  }

  serviceById(serviceId: string): VaccineService | undefined {
    return this._services().find((service) => service.id === serviceId);
  }

  vendorById(vendorId: string): Vendor | undefined {
    return this._vendors().find((vendor) => vendor.id === vendorId);
  }

  /** Eligible vaccines for the signed-in member's policy. Loaded once per session. */
  loadServices(): void {
    if (this.loadedServicesFor === 'loaded') return;
    this.loadedServicesFor = 'loaded';
    void this.fetchServices();
  }

  retryServices(): void {
    this.loadedServicesFor = null;
    this.loadServices();
  }

  /** Vendors offering one vaccine, optionally near a pincode. */
  loadVendors(serviceId: string, pincode?: string): void {
    const key = `${serviceId}:${pincode ?? ''}`;
    if (!serviceId || key === this.loadedVendorsKey) return;
    this.loadedVendorsKey = key;
    void this.fetchVendors(serviceId, pincode, key);
  }

  retryVendors(serviceId: string, pincode?: string): void {
    this.loadedVendorsKey = null;
    this.loadVendors(serviceId, pincode);
  }

  /** Slots for one vendor on one day. Empty on failure — never throws. */
  async slots(vendorId: string, date: string, pincode?: string): Promise<readonly ClinicSlot[]> {
    try {
      let params = new HttpParams().set('date', date);
      if (pincode) params = params.set('pincode', pincode);
      const response = await firstValueFrom(
        this.http.get<SlotsResponseDto>(VACCINATION_API.slots(vendorId), { params }),
      );
      return (response.slots ?? []).map(toClinicSlot);
    } catch {
      return [];
    }
  }

  /** Dry run before confirming — same pattern as every other booking journey. */
  async validate(input: ValidateVaccinationBookingInput): Promise<CoverCheck | null> {
    this._validating.set(true);
    try {
      const response = await firstValueFrom(
        this.http.post<OrderValidationDto>(VACCINATION_API.validate, input),
      );
      return response ? toOrderValidation(response) : null;
    } catch {
      return null;
    } finally {
      this._validating.set(false);
    }
  }

  /** Creates the booking. Returns its id and any payment still owed, or null with bookingError set. */
  async create(input: CreateVaccinationBookingInput): Promise<ClinicBookingResult | null> {
    this._booking.set(true);
    this._bookingError.set(null);
    try {
      const response = await firstValueFrom(
        this.http.post<Record<string, unknown>>(VACCINATION_API.create, input),
      );
      const result = toBookingResult(response);
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

  private async fetchServices(): Promise<void> {
    this._servicesLoading.set(true);
    this._servicesError.set(null);
    try {
      const response = await firstValueFrom(
        this.http.get<VaccineServicesResponseDto>(VACCINATION_API.services),
      );
      this._services.set((response.services ?? []).map(toVaccineService));
    } catch (error: unknown) {
      this._services.set([]);
      this._servicesError.set(isAppError(error) ? error : appError('server'));
    } finally {
      this._servicesLoading.set(false);
    }
  }

  private async fetchVendors(serviceId: string, pincode: string | undefined, key: string): Promise<void> {
    this._vendorsLoading.set(true);
    this._vendorsError.set(null);
    try {
      let params = new HttpParams().set('serviceId', serviceId);
      if (pincode) params = params.set('pincode', pincode);
      const response = await firstValueFrom(
        this.http.get<VendorsResponseDto>(VACCINATION_API.vendors, { params }),
      );
      if (this.loadedVendorsKey !== key) return;
      this._vendors.set((response.vendors ?? []).map(toVendor));
    } catch (error: unknown) {
      if (this.loadedVendorsKey !== key) return;
      this._vendors.set([]);
      this._vendorsError.set(isAppError(error) ? error : appError('server'));
    } finally {
      if (this.loadedVendorsKey === key) this._vendorsLoading.set(false);
    }
  }

  private reset(): void {
    this.loadedServicesFor = null;
    this.loadedVendorsKey = null;
    this._services.set([]);
    this._vendors.set([]);
    this._servicesError.set(null);
    this._vendorsError.set(null);
    this._bookingError.set(null);
  }
}
