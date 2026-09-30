import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { AppService } from '../../core/http/api.service';
import { PharmacyAddress, PharmacyAddressInput, toOrderAddressBody, toPharmacyAddress } from './pharmacy-address.model';

const APPLICATION = 'master-management';
const RESOURCE = 'order_address';
const GET_QUERY = 'queryId=GET_PAGE&args=';

/**
 * Saved delivery addresses for the pharmacy prescription flow, backed by
 * `master-management/api/v1/order_address`. The patient filter is the same pair
 * (`patient_id`, `uhId`) the POST body carries.
 */
@Injectable({ providedIn: 'root' })
export class PharmacyAddressService {
  private readonly http = inject(HttpClient);
  private readonly appService = inject(AppService);

  /**
   * Returns the patient's saved addresses, or an empty list on any failure —
   * an unreachable address book must not block the prescription step, which stays
   * usable because the member can add a new address instead.
   */
  async list(patientId: string, uhId: string): Promise<PharmacyAddress[]> {
    const filter = encodeURIComponent(`patient_id:${patientId},uhId:${uhId}`);
    const arg = `${GET_QUERY}&application=${APPLICATION}&filter=${filter}`;
    try {
      const raw = await this.appService.getcall(RESOURCE, APPLICATION, arg).toPromise();
      return this.parseList(raw);
    } catch {
      return [];
    }
  }

  private parseList(raw: unknown): PharmacyAddress[] {
    const parsed = this.asJson(raw);
    const resource = parsed?.['resource'];
    const rows: unknown[] = Array.isArray(resource)
      ? resource
      : typeof resource === 'object' && resource !== null
        ? Object.values(resource as Record<string, unknown>)
        : [];
    return rows
      .map((row, index) => toPharmacyAddress(row, this.appService, index))
      .filter((address): address is PharmacyAddress => address !== null);
  }

  private asJson(raw: unknown): Record<string, unknown> | null {
    if (typeof raw === 'string') {
      try {
        const parsed: unknown = JSON.parse(raw);
        return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
      } catch {
        return null;
      }
    }
    return typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : null;
  }

  /**
   * Saves a new address. The body is the base64 `resource` envelope the
   * master-management endpoints expect, matching the shape the claims page posts
   * to habit-opd. Returns null when encryption is unavailable or the save fails.
   */
  async save(input: PharmacyAddressInput, patientId: string, uhId: string): Promise<PharmacyAddress | null> {
    const body = toOrderAddressBody(input, patientId, uhId, this.appService);
    if (!body) return null;

    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(body))));
    const params = `resource=${encoded}&application=${APPLICATION}`;
    try {
      const envelope = await this.http
        .post(`/${APPLICATION}/api/v1/${RESOURCE}`, params, this.appService.addXsrfToken(encoded, true))
        .toPromise();
      return this.parseSaved(this.unwrapBody(envelope));
    } catch {
      return null;
    }
  }

  /** addXsrfToken sets `observe: 'response'`, so the body arrives one level down. */
  private unwrapBody(envelope: unknown): unknown {
    return envelope instanceof HttpResponse ? envelope.body : envelope;
  }

  /**
   * The save response may echo the created row or return only a success envelope.
   * Echoed data is preferred so the card shows exactly what was stored; otherwise
   * the form input is used, which is still the address the member just gave.
   */
  private parseSaved(response: unknown): PharmacyAddress | null {
    const parsed = this.asJson(response);
    const resource = parsed?.['resource'];
    const echoed = Array.isArray(resource) ? resource[0] : resource;
    const fromApi = toPharmacyAddress(echoed, this.appService, 0);
    if (fromApi && fromApi.lines.length > 0) return fromApi;
    return null;
  }
}
