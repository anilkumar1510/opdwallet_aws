import { BenefitCategory, toBenefitCategory, toDate } from '../domain/codes';
import { money } from '../domain/money';
import { ClaimDto, ClaimsSummaryDto } from './claim.dto';
import { Claim, ClaimStatus, ClaimsSummary, StatusTone } from './claim.model';

/**
 * Every URL this resource uses, beside the shapes they return.
 *
 * Paths live with the mapper on purpose: when the API changes, the endpoint
 * and the payload almost always change together, so both edits land in one
 * file and no store or component needs touching.
 */
export const CLAIMS_API = {
  list: 'member/claims',
  /**
   * A claim's uploaded document. The `:userId` segment is decorative — the API
   * resolves the claim by FILENAME and authorises against the session
   * (`memberclaims.controller.ts:327-355`) — but it is part of the path, so it
   * is sent as the API expects it.
   */
  file: (userId: string, fileName: string) => `member/claims/files/${userId}/${fileName}`,
  /** Creates the claim as a DRAFT. It is not assessed until `submit`. */
  create: 'member/claims',
  /**
   * Moves a DRAFT to SUBMITTED and debits the wallet. Filing a claim is two
   * calls, not one — a created claim that is never submitted sits as a draft
   * nobody assesses. Takes the business CLM-… id.
   */
  submit: (reference: string) => `member/claims/${reference}/submit`,
  summary: 'member/claims/summary',
  /** Takes the Mongo `_id` (Claim.id). The business CLM-… id answers 500. */
  byId: (id: string) => `member/claims/${id}`,
  /** Takes the business CLM-… id (Claim.reference). The Mongo `_id` answers 404. */
  cancel: (reference: string) => `member/claims/${reference}/cancel`,
  availableCategories: 'member/claims/available-categories',
  /** Status history. Takes the business CLM-… id; the Mongo _id answers 404. */
  timeline: (reference: string) => `member/claims/${reference}/timeline`,
  /** Correspondence from the assessor. Business CLM-… id, likewise. */
  tpaNotes: (reference: string) => `member/claims/${reference}/tpa-notes`,
  /**
   * The member's answer to "additional documents requested" — patient-flows
   * flow 9. Business CLM-… id. The API rejects it unless the claim is in
   * DOCUMENTS_REQUIRED (`memberclaims.service.ts:1118`), so the screen offers it
   * on that status alone.
   */
  resubmitDocuments: (reference: string) => `member/claims/${reference}/resubmit-documents`,
} as const;

/**
 * Multipart body for resubmission. Two things about this contract are not
 * guessable and were established against the running API:
 *
 * 1. The files and the metadata share the field name `documents`. The files go
 *    in as repeated `documents` parts; the metadata goes in as bracket-indexed
 *    keys, `documents[0][documentType]`. A JSON string under `documents` is
 *    rejected with "documents must be an array".
 * 2. `fileName` and `filePath` are REQUIRED by `ResubmitDocumentsDto` and then
 *    immediately overwritten by the controller from the uploaded file
 *    (`memberclaims.controller.ts:449-454`). Sending only `documentType` fails
 *    validation. They are sent to satisfy the validator, and their values are
 *    never read — hence the placeholder path.
 */
/**
 * Claims accept MORE than the lab upload does — GIF, and 15 MB rather than 10
 * (`memberclaims/config/multer.config.ts:35-58`). Reusing `validateFile` from
 * the lab store would reject files this endpoint takes, so the limits live here
 * with the rest of this resource's contract.
 *
 * Checked client-side because the API's rejection names the type but never the
 * file, which is unhelpful when several are attached at once.
 */
const RESUBMIT_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
];
const RESUBMIT_MAX_BYTES = 5 * 1024 * 1024;
export const RESUBMIT_MAX_FILES = 10;

export function validateResubmitFile(file: File): string | null {
  if (!RESUBMIT_TYPES.includes(file.type)) {
    return 'send a PDF or a photo (JPG, PNG, GIF or WebP).';
  }
  if (file.size > RESUBMIT_MAX_BYTES) {
    return 'that file is larger than 5 MB. Try a smaller scan or photo.';
  }
  return null;
}

/**
 * `documentType` is an ENUM on the claim schema
 * (`memberclaim.schema.ts:113-116`), not free text. Anything outside these five
 * fails Mongoose validation on save and the endpoint answers **500**, with no
 * hint that the type was the problem.
 *
 * The API's own fallback is broken for the same reason: the controller defaults
 * a missing type to `'Supporting Document'`
 * (`memberclaims.controller.ts:452`), which is not in the enum — so any
 * resubmission that omits the type 500s. The member picks from this list
 * instead, which is why the screen offers a select and never an input.
 */
export const RESUBMIT_DOCUMENT_TYPES = [
  { value: 'INVOICE', label: 'Invoice or bill' },
  { value: 'PRESCRIPTION', label: 'Prescription' },
  { value: 'REPORT', label: 'Test or scan report' },
  { value: 'DISCHARGE_SUMMARY', label: 'Discharge summary' },
  { value: 'OTHER', label: 'Something else' },
] as const;

export type ResubmitDocumentType = (typeof RESUBMIT_DOCUMENT_TYPES)[number]['value'];

export function toResubmitFormData(
  files: readonly File[],
  documentType: ResubmitDocumentType,
  notes?: string,
): FormData {
  const form = new FormData();
  files.forEach((file, i) => {
    form.append('documents', file);
    form.append(`documents[${i}][fileName]`, file.name);
    // Ignored by the controller, required by the DTO. See above.
    form.append(`documents[${i}][filePath]`, `/uploads/claims/${file.name}`);
    form.append(`documents[${i}][documentType]`, documentType);
  });
  if (notes?.trim()) form.append('resubmissionNotes', notes.trim());
  return form;
}

export interface ClaimCategoryDto {
  categoryId?: string;
  categoryCode?: string;
  name?: string;
  claimCategory?: string;
  perClaimLimit?: number;
  annualLimit?: number;
  claimEnabled?: boolean;
}

export interface ClaimCategory {
  readonly id: string;
  readonly name: string;
  /** The value the create endpoint expects in `category`. */
  readonly claimCategory: string;
  readonly perClaimLimit: number;
  /**
   * True for a category the member's plan does NOT actually have configured,
   * injected so the whole claim flow can be tested against every category. The
   * form marks these and skips the balance gate — there is no wallet bucket
   * behind a placeholder. Real submissions of one would be rejected server-side.
   */
  readonly isPlaceholder?: boolean;
}

export function toClaimCategory(dto: ClaimCategoryDto, index: number): ClaimCategory {
  return {
    id: dto.categoryId ?? dto.categoryCode ?? String(index),
    name: dto.name?.trim() || 'Category',
    claimCategory: dto.claimCategory ?? dto.categoryCode ?? '',
    perClaimLimit: dto.perClaimLimit ?? 0,
    isPlaceholder: false,
  };
}

/**
 * Every claim category in the patient-flows matrix, used to fill in the ones a
 * member's plan has not configured so the flow is testable end to end. Keyed to
 * the category-master codes (`core/domain/codes.ts`). PLACEHOLDER — remove, or
 * gate behind a test flag, once real plans carry the full set.
 */
export const CANONICAL_CLAIM_CATEGORIES: readonly ClaimCategory[] = [
  { id: 'CAT001', name: 'In-Clinic / Offline Consultation', claimCategory: 'CAT001', perClaimLimit: 0, isPlaceholder: true },
  { id: 'CAT005', name: 'Teleconsultation', claimCategory: 'CAT005', perClaimLimit: 0, isPlaceholder: true },
  { id: 'CAT002', name: 'Pharmacy', claimCategory: 'CAT002', perClaimLimit: 0, isPlaceholder: true },
  { id: 'CAT004', name: 'Pathology (Labs)', claimCategory: 'CAT004', perClaimLimit: 0, isPlaceholder: true },
  { id: 'CAT003', name: 'Radiology & Cardiology', claimCategory: 'CAT003', perClaimLimit: 0, isPlaceholder: true },
  { id: 'CAT007', name: 'Vision Care', claimCategory: 'CAT007', perClaimLimit: 0, isPlaceholder: true },
  { id: 'CAT006', name: 'Dental Services', claimCategory: 'CAT006', perClaimLimit: 0, isPlaceholder: true },
  { id: 'CAT009', name: 'Vaccination', claimCategory: 'CAT009', perClaimLimit: 0, isPlaceholder: true },
];

/**
 * The plan's real categories first, then a placeholder for every canonical
 * category the plan is missing. Matched on the NORMALISED benefit identity, not
 * the raw code — the API sends benefit-name codes (e.g. IN_CLINIC_CONSULTATION)
 * while placeholders are keyed to CAT0xx, and both resolve to the same
 * `BenefitCategory`. Without this every real category was duplicated by its
 * placeholder (In-Clinic Consultation vs "In-Clinic / Offline (test)"), since
 * those name the same benefit. Only genuinely-absent benefits (e.g. Vaccination)
 * survive as a placeholder.
 */
export function withPlaceholderCategories(
  configured: readonly ClaimCategory[],
): readonly ClaimCategory[] {
  const present = new Set<BenefitCategory>(
    configured
      .map((c) => toBenefitCategory(c.claimCategory || c.id))
      .filter((benefit) => benefit !== BenefitCategory.Unknown),
  );
  const fillers = CANONICAL_CLAIM_CATEGORIES.filter(
    (c) => !present.has(toBenefitCategory(c.claimCategory)),
  );
  return [...configured, ...fillers];
}

/** Fields POST member/claims expects, sent as multipart. */
export interface CreateClaimInput {
  readonly userId: string;
  readonly patientName: string;
  readonly relationToMember: string;
  readonly claimType: string;
  readonly category: string;
  readonly treatmentDate: string;
  readonly providerName: string;
  readonly billAmount: number;
  readonly billNumber?: string;
  readonly treatmentDescription?: string;
  readonly documents: readonly File[];
}

export function toClaimFormData(input: CreateClaimInput): FormData {
  const form = new FormData();
  form.append('userId', input.userId);
  form.append('patientName', input.patientName);
  form.append('relationToMember', input.relationToMember);
  form.append('claimType', input.claimType);
  form.append('category', input.category);
  form.append('treatmentDate', input.treatmentDate);
  form.append('providerName', input.providerName);
  form.append('billAmount', String(input.billAmount));
  if (input.billNumber) form.append('billNumber', input.billNumber);
  if (input.treatmentDescription) form.append('treatmentDescription', input.treatmentDescription);
  // The API also accepts prescriptionFiles/billFiles for consultation claims;
  // `documents` is the generic field every category accepts.
  for (const file of input.documents) form.append('documents', file);
  return form;
}

/**
 * The API's claim status is a free-form string. It becomes a labelled,
 * tone-tagged value here so no screen inspects raw status text.
 */
const STATUSES: Readonly<Record<string, ClaimStatus>> = {
  DRAFT: { label: 'Draft', tone: 'neutral', isFinal: false },
  SUBMITTED: { label: 'Submitted', tone: 'progress', isFinal: false },
  ASSIGNED: { label: 'With assessor', tone: 'progress', isFinal: false },
  UNDER_REVIEW: { label: 'Under review', tone: 'progress', isFinal: false },
  PENDING: { label: 'Pending', tone: 'progress', isFinal: false },
  PROCESSING: { label: 'Processing', tone: 'progress', isFinal: false },
  DOCUMENTS_REQUIRED: { label: 'Documents needed', tone: 'negative', isFinal: false },
  APPROVED: { label: 'Approved', tone: 'positive', isFinal: true },
  PAID: { label: 'Paid', tone: 'positive', isFinal: true },
  REJECTED: { label: 'Rejected', tone: 'negative', isFinal: true },
  CANCELLED: { label: 'Cancelled', tone: 'neutral', isFinal: true },
};

/** Turns SCREAMING_SNAKE into Sentence case for anything not in a lookup. */
function humanise(value: string | undefined, fallback: string): string {
  const raw = value?.trim();
  if (!raw) return fallback;
  const words = raw.replace(/[_-]+/g, ' ').toLowerCase().trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function toStatus(value: string | undefined): ClaimStatus {
  const key = value?.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (key && STATUSES[key]) return STATUSES[key];
  // Unknown status still renders, as a neutral label rather than a raw code.
  return { label: humanise(value, 'Unknown'), tone: 'neutral' as StatusTone, isFinal: false };
}

/** Statuses web-member refuses to cancel from. */
const NON_CANCELLABLE: readonly string[] = [
  'APPROVED',
  'PARTIALLY_APPROVED',
  'REJECTED',
  'CANCELLED',
  'PAYMENT_COMPLETED',
  'PAYMENT_PROCESSING',
];

export function toClaim(dto: ClaimDto): Claim {
  const approved = dto.approvedAmount;
  const statusCode = dto.status?.trim().toUpperCase() ?? '';

  return {
    id: dto._id ?? dto.claimId ?? '',
    reference: dto.claimId ?? '',
    patientName: dto.patientName?.trim() || dto.memberName?.trim() || 'Member',
    categoryLabel: humanise(dto.category, 'Treatment'),
    typeLabel: humanise(dto.claimType, 'Claim'),
    providerName: dto.providerName?.trim() || 'Provider not recorded',
    billAmount: money(dto.billAmount),
    // Distinguish "not yet assessed" from "assessed at zero".
    approvedAmount: typeof approved === 'number' ? money(approved) : null,
    treatmentDate: toDate(dto.treatmentDate),
    submittedAt: toDate(dto.submittedAt ?? dto.createdAt),
    statusCode,
    documentCount: dto.documents?.length ?? 0,
    documents: (dto.documents ?? []).map((doc) => ({
      label: humanise(doc.documentType, 'Document'),
      fileName: doc.originalName?.trim() || doc.fileName?.trim() || 'Document',
      downloadPath:
        dto.userId && doc.fileName ? CLAIMS_API.file(dto.userId, doc.fileName) : null,
    })),
    status: toStatus(dto.status),
    isCancellable: !NON_CANCELLABLE.includes(statusCode),
  };
}

export function toClaimsSummary(dto: ClaimsSummaryDto): ClaimsSummary {
  const summary = dto.summary ?? {};
  return {
    total: summary.total ?? 0,
    approved: summary.approved ?? 0,
    inProgress: (summary.submitted ?? 0) + (summary.underReview ?? 0) + (summary.draft ?? 0),
    rejected: summary.rejected ?? 0,
    claimedAmount: money(summary.totalClaimedAmount),
    approvedAmount: money(summary.totalApprovedAmount),
  };
}

/**
 * Claim status history and TPA correspondence — the two panels web-member
 * renders under a claim.
 *
 * Both take the business CLM-… id, like cancel and unlike the detail route.
 * Both answer at the top level with the rows under their own key.
 */
export interface ClaimTimelineEntryDto {
  status?: string;
  changedAt?: string;
  changedBy?: string;
  changedByRole?: string;
  reason?: string;
}

export interface ClaimTimelineDto {
  currentStatus?: string;
  timeline?: ClaimTimelineEntryDto[];
  submittedAt?: string;
}

export interface TpaNoteDto {
  type?: string;
  message?: string;
  timestamp?: string;
}

export interface TpaNotesDto {
  notes?: TpaNoteDto[];
}

export interface ClaimTimelineEntry {
  readonly status: ClaimStatus;
  readonly changedAt: Date | null;
  /** Who moved it, with their role when the API says. */
  readonly changedBy: string;
  readonly reason: string | null;
}

export interface TpaNote {
  readonly typeLabel: string;
  readonly message: string;
  readonly at: Date | null;
}

export function toClaimTimeline(dto: ClaimTimelineDto): readonly ClaimTimelineEntry[] {
  return (dto?.timeline ?? []).map((entry) => ({
    status: toStatus(entry.status),
    changedAt: toDate(entry.changedAt),
    changedBy:
      [entry.changedBy?.trim(), entry.changedByRole?.trim()].filter(Boolean).join(' · ') ||
      'Not recorded',
    reason: entry.reason?.trim() || null,
  }));
}

export function toTpaNotes(dto: TpaNotesDto): readonly TpaNote[] {
  return (dto?.notes ?? [])
    .filter((note) => note.message?.trim())
    .map((note) => ({
      typeLabel: humanise(note.type, 'Note'),
      message: note.message?.trim() ?? '',
      at: toDate(note.timestamp),
    }));
}
