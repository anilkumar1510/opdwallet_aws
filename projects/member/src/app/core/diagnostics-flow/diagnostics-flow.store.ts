import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ProfileStore } from '../member/profile.store';
import {
  DIAGNOSTICS_FLOW_API,
  DiagnosticSlot,
  DiagnosticTest,
  DiagnosticVendor,
  FlowArea,
  toSlots,
  toTests,
  toVendor,
} from './diagnostics-flow';

/**
 * The choices a member makes on the way through flow 7, and the reads behind
 * them.
 *
 * Held in one root store rather than threaded through six sets of query
 * parameters: the journey is linear, every screen needs the ones before it, and
 * a URL carrying a test, a provider, a collection mode and a slot is a URL
 * nobody can read or fix by hand. The cost is that a deep link into the middle
 * of the journey starts over, which is the honest outcome — the earlier answers
 * really are missing.
 */
@Injectable({ providedIn: 'root' })
export class DiagnosticsFlowStore {
  private readonly http = inject(HttpClient);
  private readonly profile = inject(ProfileStore);

  private readonly _area = signal<FlowArea>('pathology');
  private readonly _tests = signal<readonly DiagnosticTest[]>([]);
  private readonly _vendors = signal<readonly DiagnosticVendor[]>([]);
  private readonly _slots = signal<readonly DiagnosticSlot[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly area = this._area.asReadonly();
  readonly tests = this._tests.asReadonly();
  readonly vendors = this._vendors.asReadonly();
  readonly slots = this._slots.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /** The member's postal code decides which providers serve them at all. */
  readonly pincode = signal('');

  readonly chosenTest = signal<DiagnosticTest | null>(null);
  readonly chosenVendor = signal<DiagnosticVendor | null>(null);
  readonly collection = signal<'HOME' | 'CENTRE' | null>(null);
  /**
   * True when home collection was chosen from a provider who does not offer it
   * — a walkthrough of that branch. Kept apart from `collection` so the later
   * screens can say the branch is a stand-in without having to re-derive it
   * from the vendor.
   */
  readonly collectionIsPlaceholder = signal(false);
  readonly chosenSlot = signal<DiagnosticSlot | null>(null);

  /** Home collection is charged on top; a centre visit is not. */
  readonly collectionCharge = computed(() => {
    const test = this.chosenTest();
    return this.collection() === 'HOME' && test ? test.homeCollectionCharge : null;
  });

  readonly total = computed(() => {
    const test = this.chosenTest();
    if (!test) return 0;
    return test.price.amount + (this.collectionCharge()?.amount ?? 0);
  });

  setArea(area: FlowArea): void {
    if (this._area() !== area) {
      this._area.set(area);
      this.reset();
    }
    if (!this.pincode()) this.pincode.set(this.profile.pincode() ?? '');
  }

  reset(): void {
    this._tests.set([]);
    this._vendors.set([]);
    this._slots.set([]);
    this.chosenTest.set(null);
    this.chosenVendor.set(null);
    this.collection.set(null);
    this.collectionIsPlaceholder.set(false);
    this.chosenSlot.set(null);
    this._error.set(null);
  }

  /**
   * Every test the providers serving this postal code will do, with the price
   * each one quotes.
   *
   * A test only has a price through a provider, so the catalogue is assembled
   * from their price lists rather than read from a test master — that master is
   * admin-only. It means a test nobody near you prices does not appear, which
   * is the truthful answer to "can I book this".
   */
  async loadCatalogue(): Promise<void> {
    const pincode = this.pincode().trim();
    if (!pincode) {
      this._error.set('Enter your postal code so we can find providers near you.');
      return;
    }

    this._loading.set(true);
    this._error.set(null);
    try {
      const response = await firstValueFrom(
        this.http.get<{ data?: Record<string, any>[] }>(
          DIAGNOSTICS_FLOW_API.vendors(this._area(), pincode),
        ),
      );
      const vendors = (response?.data ?? []).map(toVendor).filter((v) => v.id);
      this._vendors.set(vendors);

      const priced = await Promise.all(
        vendors.map(async (vendor) => {
          try {
            const rows = await firstValueFrom(
              this.http.get<{ data?: Record<string, any>[] }>(
                DIAGNOSTICS_FLOW_API.pricing(this._area(), vendor.id),
              ),
            );
            return toTests(vendor, rows?.data ?? []);
          } catch {
            // One provider's price list failing should not empty the catalogue.
            return [];
          }
        }),
      );
      this._tests.set(priced.flat());
      if (!priced.flat().length) {
        this._error.set('No provider near that postal code has published prices yet.');
      }
    } catch {
      this._error.set('We could not load tests for that postal code.');
      this._tests.set([]);
      this._vendors.set([]);
    } finally {
      this._loading.set(false);
    }
  }

  /** The providers who price the chosen test — step 4's list. */
  readonly providersForTest = computed(() => {
    const test = this.chosenTest();
    if (!test) return [];

    /*
     * A placeholder test has no price list behind it, so every provider serving
     * this postal code is offered with the stand-in price. Without this the
     * journey would stop dead one screen after the member chose it — which is
     * the opposite of what a walkthrough needs.
     */
    if (test.isPlaceholder) {
      return this.vendors().map((vendor) => ({
        vendor,
        quote: { ...test, vendorId: vendor.id, vendorName: vendor.name },
      }));
    }
    const codes = new Set(
      this.tests()
        .filter((candidate) => candidate.code === test.code)
        .map((candidate) => candidate.vendorId),
    );
    return this.vendors()
      .filter((vendor) => codes.has(vendor.id))
      .map((vendor) => ({
        vendor,
        quote: this.tests().find(
          (candidate) => candidate.code === test.code && candidate.vendorId === vendor.id,
        )!,
      }));
  });

  async loadSlots(date: string): Promise<void> {
    const vendor = this.chosenVendor();
    if (!vendor || !date) return;

    this._loading.set(true);
    try {
      const response = await firstValueFrom(
        this.http.get<{ data?: Record<string, any>[] }>(
          DIAGNOSTICS_FLOW_API.slots(this._area(), vendor.id, this.pincode().trim(), date),
        ),
      );
      this._slots.set(toSlots(response?.data ?? []));
    } catch {
      this._slots.set([]);
    } finally {
      this._loading.set(false);
    }
  }
}
