import { HttpClient } from '@angular/common/http';
import { Injectable, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { SessionStore } from '../session/session.store';
import {
  AHC_API,
  AhcEligibility,
  AhcEligibilityDataDto,
  AhcEnvelopeDto,
  AhcOrderDetail,
  AhcOrderDetailDto,
  AhcPackage,
  AhcPackageDataDto,
  AhcReportDto,
  toAhcEligibility,
  toAhcOrderDetail,
  toAhcPackage,
} from './ahc';

/**
 * Annual Health Checkup eligibility and package (category CAT008).
 *
 * Loads lazily — only the benefit screen for that one category needs it, so
 * it is not fetched on sign-in like the wallet or family.
 */
@Injectable({ providedIn: 'root' })
export class AhcStore {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionStore);

  /**
   * One placed AHC order with both legs and whatever reports exist.
   *
   * Three requests rather than one because the API splits them that way, and
   * the two report calls are allowed to fail: a leg with no report yet answers
   * `{ success: false, error: 'Lab report not uploaded yet' }` — a normal state
   * for an order in progress, not an error worth failing the screen over.
   *
   * Returns null when the order cannot be read at all. Note the API reports
   * that with `success: false` inside an HTTP 200, so the check is on the
   * payload, never on a thrown error.
   */
  async orderById(orderId: string): Promise<AhcOrderDetail | null> {
    if (!orderId) return null;
    try {
      const order = await firstValueFrom(
        this.http.get<AhcEnvelopeDto<AhcOrderDetailDto>>(AHC_API.orderById(orderId)),
      );
      if (!order?.success || !order.data) return null;

      const leg = async (url: string): Promise<AhcReportDto | null> => {
        try {
          const response = await firstValueFrom(
            this.http.get<AhcEnvelopeDto<AhcReportDto>>(url),
          );
          return response?.success && response.data ? response.data : null;
        } catch {
          return null;
        }
      };

      const [labReport, diagnosticReport] = await Promise.all([
        leg(AHC_API.labReport(orderId)),
        leg(AHC_API.diagnosticReport(orderId)),
      ]);

      return toAhcOrderDetail(order.data, labReport, diagnosticReport);
    } catch {
      return null;
    }
  }

  private readonly _eligibility = signal<AhcEligibility | null>(null);
  private readonly _package = signal<AhcPackage | null>(null);
  private readonly _loading = signal(false);

  private loaded = false;
  private inFlight: Promise<void> | null = null;

  readonly eligibility = this._eligibility.asReadonly();
  readonly checkupPackage = this._package.asReadonly();
  readonly loading = this._loading.asReadonly();

  constructor() {
    effect(() => {
      if (!this.session.isAuthenticated()) this.reset();
    });
  }

  /**
   * Reads eligibility and the package again, ignoring the once-only guard on
   * `load`. Needed when something outside this store changes whether the check
   * can be taken — cancelling this year's order, for instance.
   */
  refresh(): Promise<void> {
    this.loaded = false;
    this.inFlight = null;
    return this.load();
  }

  load(): Promise<void> {
    if (this.loaded) return Promise.resolve();
    this.inFlight ??= this.run().finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  private async run(): Promise<void> {
    this._loading.set(true);
    try {
      const [eligibility, pkg] = await Promise.all([
        firstValueFrom(
          this.http.get<AhcEnvelopeDto<AhcEligibilityDataDto>>(AHC_API.eligibility),
        ).catch(() => null),
        // GET member/ahc/package 404s with "No active policy assignment found
        // for user" when cover has lapsed — a business 404, not a missing
        // route; it returns a real package for a member in force. Treated as
        // "no package published" rather than an error, so eligibility still
        // shows either way.
        firstValueFrom(this.http.get<AhcEnvelopeDto<AhcPackageDataDto>>(AHC_API.package)).catch(
          () => null,
        ),
      ]);

      this._eligibility.set(eligibility ? toAhcEligibility(eligibility) : null);
      this._package.set(pkg ? toAhcPackage(pkg) : null);
      this.loaded = true;
    } finally {
      this._loading.set(false);
    }
  }

  private reset(): void {
    this.loaded = false;
    this._eligibility.set(null);
    this._package.set(null);
  }
}
