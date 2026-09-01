import { ClaimStatus } from '../claims/claim.model';
import { toDate } from '../domain/codes';
import { money } from '../domain/money';
import { LabOrderDto, LabPrescriptionDto } from './lab.dto';
import { LabKind, LabOrder, LabPrescription, LabTestItem } from './lab.model';

/**
 * Every URL these resources use, beside the shapes they return. Pathology
 * (CAT004) and Radiology (CAT003) are the same contract on two prefixes, so
 * both live here and the store picks by LabKind.
 */
/*
 * REMOVED 2026-08-10 (session 53) — four declarations with no caller, deleted
 * rather than wired, because wiring them would have invented behaviour neither
 * reference has:
 *
 *   activeCart      `member/lab/carts/active` exists API-side
 *                   (lab-member.controller.ts:196) but NOTHING in web-member or
 *                   web-member-rn calls it, and Angular's cart flow reads the
 *                   `carts` list. The DIAGNOSTIC twin was worse: it was declared
 *                   as `member/diagnostics/carts` — the COLLECTION path — because
 *                   diagnostics has no `carts/active` route at all. A silent
 *                   wrong answer rather than a 404.
 *   vendorPricing   Deleted, and the FIRST reason given here was wrong. It said
 *                   no reference calls it; that grep covered only
 *                   `web-member/lib/api/`, and both vendor screens do call it
 *                   from `web-member/app/` to show a per-test price breakdown.
 *
 *                   The deletion still stands, for a better reason: **Angular
 *                   already has that data.** `GET carts/:cartId/vendors` returns
 *                   `pricing[]` per vendor and `toCartVendor` maps it to
 *                   `CartVendor.prices` (`cart.ts:201`). Calling this endpoint
 *                   would be a second request for something already in hand —
 *                   the reference makes both calls; Angular needs one.
 *
 *                   What WAS missing was rendering it, which is a screen fix and
 *                   not an endpoint one. The diagnostics twin was additionally a
 *                   wrong path: diagnostics prices only cart-scoped, at
 *                   `carts/:cartId/vendors/:vendorId/pricing`
 *                   (diagnostic-member.controller.ts:227), while the reference's
 *                   diagnostics screen calls the LAB route — entry 14 again.
 *
 * The shapes are recorded here on purpose: `22-dead-endpoint-scan.mjs`'s standing
 * rule is that a dead endpoint is not closed by deleting it silently.
 */
/**
 * Cancelling a placed order — patient-flows flow 7, step 17.
 *
 * RADIOLOGY ONLY, deliberately. `POST member/diagnostics/orders/:id/cancel`
 * exists; pathology has no equivalent — `member/lab/orders` offers create,
 * list and read-one and nothing else. Keeping this out of `LAB_API`, which is
 * symmetric across both kinds, is what stops a caller assuming pathology has
 * it too.
 */
export const DIAGNOSTIC_ONLY_API = {
  cancelOrder: (orderId: string) => `member/diagnostics/orders/${orderId}/cancel`,
} as const;

/**
 * One report file — patient-flows flow 7, step 15.
 *
 * Both kinds have this, unlike cancel. The route loads the order, checks the
 * caller owns it, then streams; the file is addressed by the report's own _id
 * and the path is never taken from the URL.
 */
export const REPORT_DOWNLOAD_API: Readonly<Record<LabKind, (orderId: string, reportId: string) => string>> = {
  [LabKind.Lab]: (orderId, reportId) =>
    `member/lab/orders/${orderId}/reports/${reportId}/download`,
  [LabKind.Diagnostic]: (orderId, reportId) =>
    `member/diagnostics/orders/${orderId}/reports/${reportId}/download`,
};

export const LAB_API = {
  [LabKind.Lab]: {
    orders: 'member/lab/orders',
    prescriptions: 'member/lab/prescriptions',
    carts: 'member/lab/carts',
    orderById: (orderId: string) => `member/lab/orders/${orderId}`,
    uploadPrescription: 'member/lab/prescriptions/upload',
    submitExisting: 'member/lab/prescriptions/submit-existing',
    cancelPrescription: (id: string) => `member/lab/prescriptions/${id}/cancel`,
    // These take the business cartId (CART-…), not the Mongo _id.
    cartById: (cartId: string) => `member/lab/carts/${cartId}`,
    cartVendors: (cartId: string) => `member/lab/carts/${cartId}/vendors`,
    vendorSlots: (vendorId: string) => `member/lab/vendors/${vendorId}/slots`,
    validateOrder: 'member/lab/orders/validate',
    placeOrder: 'member/lab/orders',
  },
  [LabKind.Diagnostic]: {
    orders: 'member/diagnostics/orders',
    prescriptions: 'member/diagnostics/prescriptions',
    carts: 'member/diagnostics/carts',
    orderById: (orderId: string) => `member/diagnostics/orders/${orderId}`,
    uploadPrescription: 'member/diagnostics/prescriptions/upload',
    submitExisting: 'member/diagnostics/prescriptions/submit-existing',
    cancelPrescription: (id: string) => `member/diagnostics/prescriptions/${id}/cancel`,
    cartById: (cartId: string) => `member/diagnostics/carts/${cartId}`,
    cartVendors: (cartId: string) => `member/diagnostics/carts/${cartId}/vendors`,
    vendorSlots: (vendorId: string) => `member/diagnostics/vendors/${vendorId}/slots`,
    validateOrder: 'member/diagnostics/orders/validate',
    placeOrder: 'member/diagnostics/orders',
  },
} as const;

/** Fields POST member/{lab,diagnostics}/prescriptions/upload requires. */
export interface UploadPrescriptionInput {
  readonly file: File;
  readonly patientId: string;
  readonly patientName: string;
  readonly patientRelationship: string;
  readonly pincode: string;
  readonly prescriptionDate?: Date;
  readonly addressId?: string;
  readonly notes?: string;
}

/**
 * Multipart body for the upload endpoint. Built here so the field names live
 * beside every other detail of this resource's contract.
 */
export function toUploadFormData(input: UploadPrescriptionInput): FormData {
  const form = new FormData();
  form.append('file', input.file);
  form.append('patientId', input.patientId);
  form.append('patientName', input.patientName);
  form.append('patientRelationship', input.patientRelationship);
  form.append('pincode', input.pincode);
  form.append('prescriptionDate', (input.prescriptionDate ?? new Date()).toISOString());
  // Both optional on the API; omitted rather than sent empty.
  if (input.addressId) form.append('addressId', input.addressId);
  if (input.notes?.trim()) form.append('notes', input.notes.trim());
  return form;
}

const ORDER_STATUSES: Readonly<Record<string, ClaimStatus>> = {
  PENDING: { label: 'Pending', tone: 'progress', isFinal: false },
  CONFIRMED: { label: 'Confirmed', tone: 'positive', isFinal: false },
  SCHEDULED: { label: 'Scheduled', tone: 'progress', isFinal: false },
  SAMPLE_COLLECTED: { label: 'Sample collected', tone: 'progress', isFinal: false },
  PROCESSING: { label: 'Processing', tone: 'progress', isFinal: false },
  REPORT_READY: { label: 'Report ready', tone: 'positive', isFinal: true },
  COMPLETED: { label: 'Completed', tone: 'positive', isFinal: true },
  CANCELLED: { label: 'Cancelled', tone: 'negative', isFinal: true },
};

const PAYMENT_STATUSES: Readonly<Record<string, ClaimStatus>> = {
  PAID: { label: 'Paid', tone: 'positive', isFinal: true },
  COMPLETED: { label: 'Paid', tone: 'positive', isFinal: true },
  PENDING: { label: 'Payment pending', tone: 'progress', isFinal: false },
  FAILED: { label: 'Payment failed', tone: 'negative', isFinal: true },
  REFUNDED: { label: 'Refunded', tone: 'neutral', isFinal: true },
};

const PRESCRIPTION_STATUSES: Readonly<Record<string, ClaimStatus>> = {
  UPLOADED: { label: 'Uploaded', tone: 'neutral', isFinal: false },
  PENDING: { label: 'Awaiting review', tone: 'progress', isFinal: false },
  DIGITIZED: { label: 'Ready to order', tone: 'positive', isFinal: false },
  REJECTED: { label: 'Rejected', tone: 'negative', isFinal: true },
  EXPIRED: { label: 'Expired', tone: 'neutral', isFinal: true },
};

function humanise(value: string | undefined, fallback: string): string {
  const raw = value?.trim();
  if (!raw) return fallback;
  const words = raw.replace(/[_-]+/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function toStatus(
  map: Readonly<Record<string, ClaimStatus>>,
  value: string | undefined,
): ClaimStatus {
  const key = value?.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (key && map[key]) return map[key];
  // Unknown status still renders, as a neutral label rather than a raw code.
  return { label: humanise(value, 'Recorded'), tone: 'neutral', isFinal: false };
}

function toItems(dtos: LabOrderDto['items']): readonly LabTestItem[] {
  return (dtos ?? [])
    .map((item, index) => ({
      id: item.serviceId ?? item.serviceCode ?? String(index),
      name: item.serviceName?.trim() ?? '',
      // The discounted price is what the member is actually charged.
      price: money(item.discountedPrice ?? item.actualPrice),
    }))
    .filter((item) => item.name.length > 0);
}

/** "HOME_COLLECTION" plus a date and time, when the API supplies them. */
function toCollection(dto: LabOrderDto): { label: string | null; at: Date | null } {
  const label = dto.collectionType?.trim()
    ? humanise(dto.collectionType, 'Collection')
    : null;

  const date = toDate(dto.collectionDate);
  if (!date) return { label, at: null };

  const match = /^(\d{1,2}):(\d{2})/.exec(dto.collectionTime?.trim() ?? '');
  if (match) {
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours <= 23 && minutes <= 59) date.setHours(hours, minutes, 0, 0);
  }
  return { label, at: date };
}

export function toLabOrder(dto: LabOrderDto, kind: LabKind): LabOrder {
  const collection = toCollection(dto);

  return {
    id: dto._id ?? dto.orderId ?? '',
    kind,
    reference: dto.orderId ?? '',
    // vendorId is populated to an object on some responses and an id on others.
    vendorName:
      dto.vendorName?.trim() ||
      (typeof dto.vendorId === 'object' ? dto.vendorId?.name?.trim() : '') ||
      'Lab',
    tests: toItems(dto.items),
    status: toStatus(ORDER_STATUSES, dto.status),
    paymentStatus: dto.paymentStatus ? toStatus(PAYMENT_STATUSES, dto.paymentStatus) : null,
    collectionLabel: collection.label,
    collectionAt: collection.at,
    total: money(dto.finalAmount ?? dto.totalDiscountedPrice ?? dto.totalActualPrice),
    fromWallet: money(dto.walletDeduction),
    // finalPayable is what the member owes after wallet and limits.
    youPay: money(dto.finalPayable ?? dto.copayAmount),
    placedAt: toDate(dto.placedAt ?? dto.createdAt),
    reportCount: dto.reports?.length ?? 0,
    reports: (dto.reports ?? [])
      // Without an _id there is no way to address the file, so the row would
      // render a control that cannot work. Dropped rather than shown dead.
      .filter((report) => Boolean(report?._id))
      .map((report) => ({
        id: report._id ?? '',
        name: report.originalName?.trim() || report.fileName?.trim() || 'Report',
        uploadedAt: toDate(report.uploadedAt),
      })),
  };
}

export function toLabPrescription(dto: LabPrescriptionDto, kind: LabKind): LabPrescription {
  return {
    id: dto._id ?? dto.prescriptionId ?? '',
    kind,
    reference: dto.prescriptionId ?? '',
    patientName: dto.patientName?.trim() || 'Member',
    fileName: dto.fileName?.trim() || dto.originalName?.trim() || 'Prescription',
    sourceLabel: dto.source?.trim().toUpperCase() === 'UPLOAD' ? 'Uploaded' : 'Doctor issued',
    status: toStatus(PRESCRIPTION_STATUSES, dto.status),
    statusCode: dto.status?.trim().toUpperCase() ?? '',
    uploadedAt: toDate(dto.uploadedAt ?? dto.createdAt),
    cartId: dto.cartId?.trim() || null,
    hasOrder: dto.hasOrder === true,
    orderCount: dto.orderCount ?? 0,
  };
}
