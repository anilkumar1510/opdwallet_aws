import { Injectable, computed, signal } from '@angular/core';

import { AppError } from '../http/app-error';
import { Prescription, PrescriptionSource } from './prescription.model';

/**
 * Health records (prescriptions) — DUMMY / STATIC, zero backend.
 *
 * Replaces the digital-prescriptions / prescriptions endpoints. Held in memory.
 * Public surface unchanged. See REMOVED-APIS.md.
 */

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

const SEED: Prescription[] = [
  {
    id: 'p1', reference: 'RX-2026-0012', source: PrescriptionSource.Digital, sourceLabel: 'Digital',
    patientName: 'Shivam Jha', doctorName: 'Dr. A. Sharma', doctorSpecialty: 'General Physician',
    diagnosis: 'Viral fever', chiefComplaint: 'Fever and body ache',
    medicines: [
      { name: 'Crocin 500mg', schedule: '1 tablet · BD · 5 days', instructions: 'After food' },
      { name: 'Cetirizine 10mg', schedule: '1 tablet · HS · 3 days', instructions: 'At night' },
    ],
    labTestCount: 0, issuedAt: daysAgo(2), followUpDate: daysAgo(-5), isEmergency: false,
    hasDownload: false, downloadPath: null,
  },
  {
    id: 'p2', reference: 'RX-2026-0008', source: PrescriptionSource.Digital, sourceLabel: 'Digital',
    patientName: 'Sayani Kumari', doctorName: 'Dr. N. Gupta', doctorSpecialty: 'Dermatology',
    diagnosis: 'Allergic dermatitis', chiefComplaint: 'Skin rash',
    medicines: [{ name: 'Levocetirizine 5mg', schedule: '1 tablet · OD · 7 days', instructions: null }],
    labTestCount: 0, issuedAt: daysAgo(20), followUpDate: null, isEmergency: false,
    hasDownload: false, downloadPath: null,
  },
  {
    id: 'p3', reference: 'RX-2026-0003', source: PrescriptionSource.Uploaded, sourceLabel: 'Uploaded',
    patientName: 'Shivam Jha', doctorName: 'Dr. S. Khan', doctorSpecialty: null,
    diagnosis: null, chiefComplaint: null, medicines: [],
    labTestCount: 2, issuedAt: daysAgo(35), followUpDate: null, isEmergency: false,
    hasDownload: false, downloadPath: null,
  },
];

@Injectable({ providedIn: 'root' })
export class RecordsStore {
  private readonly _records = signal<readonly Prescription[]>([...SEED]);
  private readonly _filter = signal<PrescriptionSource | 'ALL'>('ALL');

  readonly loading = signal(false).asReadonly();
  readonly error = signal<AppError | null>(null).asReadonly();
  readonly partial = signal<readonly string[]>([]).asReadonly();
  readonly filter = this._filter.asReadonly();
  readonly all = this._records.asReadonly();

  readonly records = computed(() => {
    const filter = this._filter();
    const all = this._records();
    return filter === 'ALL' ? all : all.filter((r) => r.source === filter);
  });

  readonly counts = computed<Record<PrescriptionSource | 'ALL', number>>(() => {
    const all = this._records();
    const tally = { ALL: all.length } as Record<PrescriptionSource | 'ALL', number>;
    for (const source of Object.values(PrescriptionSource)) {
      tally[source] = all.filter((r) => r.source === source).length;
    }
    return tally;
  });

  setFilter(filter: PrescriptionSource | 'ALL'): void {
    this._filter.set(filter);
  }

  retry(): void {
    /* static — nothing to refetch */
  }
}
