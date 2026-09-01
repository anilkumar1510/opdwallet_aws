import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { FamilyStore } from '../family/family.store';
import { AppError, appError, isAppError } from '../http/app-error';
import { SessionStore } from '../session/session.store';
import {
  DigitalPrescriptionDto,
  PrescriptionsResponseDto,
  UploadedPrescriptionDto,
} from './prescription.dto';
import { RECORDS_API, toDigitalPrescription, toUploadedPrescription } from './prescription.mapper';
import { Prescription, PrescriptionSource } from './prescription.model';

/**
 * Health records: doctor-issued and uploaded prescriptions, merged, for
 * whichever family member is active.
 */
@Injectable({ providedIn: 'root' })
export class RecordsStore {
  private readonly http = inject(HttpClient);
  private readonly family = inject(FamilyStore);
  private readonly session = inject(SessionStore);

  private readonly _records = signal<readonly Prescription[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<AppError | null>(null);
  private readonly _partial = signal<readonly string[]>([]);
  private readonly _filter = signal<PrescriptionSource | 'ALL'>('ALL');

  private loadedFor: string | null = null;

  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly partial = this._partial.asReadonly();
  readonly filter = this._filter.asReadonly();
  readonly all = this._records.asReadonly();

  readonly records = computed(() => {
    const filter = this._filter();
    const all = this._records();
    return filter === 'ALL' ? all : all.filter((record) => record.source === filter);
  });

  /** Derived from the source enum, so a new source cannot leave a hole. */
  readonly counts = computed<Record<PrescriptionSource | 'ALL', number>>(() => {
    const all = this._records();
    const tally = { ALL: all.length } as Record<PrescriptionSource | 'ALL', number>;
    for (const source of Object.values(PrescriptionSource)) {
      tally[source] = all.filter((record) => record.source === source).length;
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

  setFilter(filter: PrescriptionSource | 'ALL'): void {
    this._filter.set(filter);
  }

  retry(): void {
    const activeId = this.family.activeMember()?.id;
    if (activeId) void this.load(activeId);
  }

  private async load(userId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    this._partial.set([]);

    const params = new HttpParams().set('userId', userId);
    const failed: string[] = [];

    const digital = firstValueFrom(
      this.http.get<PrescriptionsResponseDto<DigitalPrescriptionDto>>(
        RECORDS_API.digital,
        { params },
      ),
    )
      .then((response) => (response.prescriptions ?? []).map(toDigitalPrescription))
      .catch(() => {
        failed.push('doctor-issued prescriptions');
        return [] as Prescription[];
      });

    const uploaded = firstValueFrom(
      this.http.get<PrescriptionsResponseDto<UploadedPrescriptionDto>>(RECORDS_API.uploaded, {
        params,
      }),
    )
      .then((response) => (response.prescriptions ?? []).map(toUploadedPrescription))
      .catch(() => {
        failed.push('uploaded prescriptions');
        return [] as Prescription[];
      });

    try {
      const batches = await Promise.all([digital, uploaded]);
      if (this.loadedFor !== userId) return;

      this._records.set(
        batches.flat().sort((a, b) => (b.issuedAt?.getTime() ?? 0) - (a.issuedAt?.getTime() ?? 0)),
      );
      this._partial.set(failed);
      // Both sources failing is a real failure, not a partial one.
      if (failed.length === 2) this._error.set(appError('server'));
    } catch (error: unknown) {
      if (this.loadedFor !== userId) return;
      this._records.set([]);
      this._error.set(isAppError(error) ? error : appError('server'));
    } finally {
      if (this.loadedFor === userId) this._loading.set(false);
    }
  }

  private reset(): void {
    this.loadedFor = null;
    this._records.set([]);
    this._error.set(null);
    this._partial.set([]);
    this._filter.set('ALL');
  }
}
