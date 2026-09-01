import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AppError, appError, isAppError } from '../http/app-error';
import { SessionStore } from '../session/session.store';
import { Address, AddressDto, AddressInput, AddressesResponseDto, toAddress } from './address';
import { MEMBER_API } from './member.mapper';

interface SaveAddressResponseDto {
  success?: boolean;
  data?: AddressDto;
}

/**
 * Saved addresses for the signed-in member.
 *
 * Addresses are scoped to the session - GET /member/addresses takes no userId
 * so this does not follow the active family member the way the other stores
 * do.
 */
@Injectable({ providedIn: 'root' })
export class ProfileStore {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionStore);

  private readonly _addresses = signal<readonly Address[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<AppError | null>(null);
  private readonly _saving = signal(false);
  private readonly _saveError = signal<AppError | null>(null);

  private loaded = false;
  private inFlight: Promise<void> | null = null;

  readonly addresses = this._addresses.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly saveError = this._saveError.asReadonly();

  /** Default address first — lab uploads need a pincode to route the sample. */
  readonly pincode = computed(() => {
    const all = this._addresses();
    const preferred = all.find((address) => address.isDefault) ?? all[0];
    return preferred?.pincode ?? null;
  });

  constructor() {
    effect(() => {
      if (this.session.isAuthenticated()) {
        void this.load();
      } else {
        this.reset();
      }
    });
  }

  load(): Promise<void> {
    if (this.loaded) return Promise.resolve();
    this.inFlight ??= this.run().finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  retry(): void {
    this.loaded = false;
    void this.load();
  }

  /**
   * Create (no id) or replace (id) one address, then refresh the list so every
   * page reading this store sees the change. Returns the saved address so the
   * caller can select what the member just typed.
   */
  async save(input: AddressInput, id?: string): Promise<Address | null> {
    this._saving.set(true);
    this._saveError.set(null);
    try {
      const url = id ? `${MEMBER_API.addresses}/${id}` : MEMBER_API.addresses;
      const response = await firstValueFrom(
        id
          ? this.http.put<SaveAddressResponseDto>(url, input)
          : this.http.post<SaveAddressResponseDto>(url, input),
      );
      if (response.success === false) throw appError('server');

      this.loaded = false;
      await this.load();
      const saved = response.data ? toAddress(response.data) : null;
      // The list is the source of truth — match the refreshed copy by id so the
      // caller selects an address that is actually in `addresses()`.
      return this._addresses().find((a) => a.id === saved?.id) ?? saved;
    } catch (error: unknown) {
      this._saveError.set(isAppError(error) ? error : appError('server'));
      return null;
    } finally {
      this._saving.set(false);
    }
  }

  private async run(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const response = await firstValueFrom(
        this.http.get<AddressesResponseDto>(MEMBER_API.addresses),
      );
      // This route reports failure in the body with a 200 status, so success
      // is checked here rather than left to the error interceptor.
      if (response.success === false) throw appError('server');

      this._addresses.set((response.data ?? []).map(toAddress));
      this.loaded = true;
    } catch (error: unknown) {
      this._addresses.set([]);
      this._error.set(isAppError(error) ? error : appError('server'));
    } finally {
      this._loading.set(false);
    }
  }

  private reset(): void {
    this.loaded = false;
    this._addresses.set([]);
    this._error.set(null);
  }
}
