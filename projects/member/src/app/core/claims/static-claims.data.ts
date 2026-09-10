import { money } from '../domain/money';
import {
  ClaimCategory,
  ClaimTimelineEntry,
  CreateClaimInput,
  TpaNote,
  toStatus,
} from './claim.mapper';
import { Claim } from './claim.model';

/**
 * DUMMY / STATIC claims data — zero backend.
 *
 * Replaces every `member/claims/*` call. The list lives in memory; submit adds
 * to it, cancel/resubmit mutate it. See REMOVED-APIS.md.
 */

/** Claimable categories with real-ish limits + co-payment (matches the dummy policy). */
export const STATIC_CLAIM_CATEGORIES: readonly ClaimCategory[] = [
  cat('CAT005', 'Online Consultation'),
  cat('CAT001', 'In-Clinic Consultation'),
  cat('CAT007', 'Vision'),
  cat('CAT006', 'Dental'),
  cat('CAT002', 'Pharmacy'),
  cat('CAT009', 'Vaccination'),
  cat('CAT004', 'Pathology'),
  cat('CAT003', 'Radiology & Cardiology'),
];

function cat(code: string, name: string): ClaimCategory {
  return {
    id: code,
    name,
    claimCategory: code,
    perClaimLimit: 500,
    copayMode: 'PERCENT',
    copayValue: 20,
    perTransactionLimit: 400,
    isPlaceholder: false,
  };
}

function nameFor(code: string): string {
  return STATIC_CLAIM_CATEGORIES.find((c) => c.claimCategory === code)?.name ?? 'Treatment';
}

function claim(o: {
  ref: string; category: string; patient: string; provider: string;
  bill: number; approved: number | null; status: string; days: number; cancellable: boolean;
  docs?: number;
}): Claim {
  return {
    id: o.ref,
    reference: o.ref,
    patientName: o.patient,
    categoryLabel: nameFor(o.category),
    typeLabel: 'Reimbursement',
    providerName: o.provider,
    billAmount: money(o.bill),
    approvedAmount: o.approved === null ? null : money(o.approved),
    treatmentDate: daysAgo(o.days + 2),
    submittedAt: daysAgo(o.days),
    statusCode: o.status,
    documentCount: o.docs ?? 2,
    documents: [],
    status: toStatus(o.status),
    isCancellable: o.cancellable,
  };
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/** Seed list across a few statuses so the screen looks alive. */
export const STATIC_CLAIMS: readonly Claim[] = [
  claim({ ref: 'CLM-2026-0009', category: 'CAT004', patient: 'Shivam Jha', provider: 'Metropolis Labs', bill: 528, approved: null, status: 'UNDER_REVIEW', days: 2, cancellable: true }),
  claim({ ref: 'CLM-2026-0006', category: 'CAT002', patient: 'Shivam Jha', provider: 'Apollo Pharmacy', bill: 320, approved: null, status: 'DOCUMENTS_REQUIRED', days: 6, cancellable: true }),
  claim({ ref: 'CLM-2026-0004', category: 'CAT001', patient: 'Sayani Kumari', provider: 'HealthFirst Clinic', bill: 600, approved: 400, status: 'APPROVED', days: 12, cancellable: false }),
  claim({ ref: 'CLM-2026-0002', category: 'CAT005', patient: 'Shivam Jha', provider: 'Dr. A. Sharma', bill: 500, approved: null, status: 'REJECTED', days: 20, cancellable: false }),
];

/** Build a Claim from a submitted form. */
export function buildClaim(input: CreateClaimInput, seq: number): Claim {
  const ref = `CLM-2026-${String(1000 + seq).slice(-4)}`;
  return {
    id: ref,
    reference: ref,
    patientName: input.patientName || 'Member',
    categoryLabel: nameFor(input.category),
    typeLabel: input.claimType === 'CASHLESS_PREAUTH' ? 'Cashless pre-auth' : 'Reimbursement',
    providerName: input.providerName || 'Provider',
    billAmount: money(input.billAmount),
    approvedAmount: null,
    treatmentDate: input.treatmentDate ? new Date(input.treatmentDate) : null,
    submittedAt: new Date(),
    statusCode: 'SUBMITTED',
    documentCount: input.documents.length,
    documents: input.documents.map((f) => ({ label: 'Document', fileName: f.name, downloadPath: null })),
    status: toStatus('SUBMITTED'),
    isCancellable: true,
  };
}

/** A simple static timeline + assessor notes for a claim's current status. */
export function staticHistory(c: Claim): { timeline: readonly ClaimTimelineEntry[]; notes: readonly TpaNote[] } {
  const now = new Date();
  const step = (code: string, reason: string | null = null): ClaimTimelineEntry => ({
    status: toStatus(code), changedAt: now, changedBy: 'TPA · Assessor', reason,
  });
  const timeline: ClaimTimelineEntry[] = [step('SUBMITTED')];
  const notes: TpaNote[] = [];
  switch (c.statusCode) {
    case 'DOCUMENTS_REQUIRED':
      timeline.push(step('UNDER_REVIEW'), step('DOCUMENTS_REQUIRED'));
      notes.push({ typeLabel: 'Documents requested', message: 'Please upload a clearer, itemised invoice showing the provider and total.', at: now });
      break;
    case 'APPROVED': case 'PARTIALLY_APPROVED':
      timeline.push(step('UNDER_REVIEW'), step(c.statusCode));
      notes.push({ typeLabel: 'Approved', message: 'Approved and credited to your bank account.', at: now });
      break;
    case 'REJECTED':
      timeline.push(step('UNDER_REVIEW'), step('REJECTED'));
      notes.push({ typeLabel: 'Rejected', message: 'Claim submission window has lapsed — filed more than 45 days after treatment.', at: now });
      break;
    case 'UNDER_REVIEW':
      timeline.push(step('UNDER_REVIEW'));
      break;
  }
  return { timeline, notes };
}
