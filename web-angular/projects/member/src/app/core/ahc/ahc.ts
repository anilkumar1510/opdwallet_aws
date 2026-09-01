import { toDate } from '../domain/codes';

/**
 * Annual Health Checkup — the benefit behind category CAT008.
 *
 * CAT008 is named inconsistently in the data: `category_master` calls it
 * "Health Packages" while the plan config returns "Wellness Programs". The
 * member-facing label always comes from the API, so both read correctly.
 *
 * It behaves unlike every other benefit: eligibility-gated, booked once per
 * policy year as a package, rather than drawn down through bookings and
 * transactions.
 *
 * Small read-only resource, so endpoints, shapes and mapping live together —
 * same as address.ts and policy-detail.ts.
 */
export const AHC_API = {
  eligibility: 'member/ahc/eligibility',
  package: 'member/ahc/package',
  orders: 'member/ahc/orders',
  labVendors: 'member/ahc/vendors/lab',
  diagnosticVendors: 'member/ahc/vendors/diagnostic',
  /** One placed order, by its business AHC-ORD-… id. */
  orderById: (orderId: string) => `member/ahc/orders/${orderId}`,
  /**
   * Report metadata per leg. These two return fileName/filePath as JSON despite
   * being named "download"; the `…ReportFile` routes below stream the actual
   * file. Both exist because the screen needs to know a report is there before
   * it offers to open it.
   */
  labReport: (orderId: string) => `member/ahc/reports/${orderId}/lab`,
  diagnosticReport: (orderId: string) => `member/ahc/reports/${orderId}/diagnostic`,
  /**
   * Streams the latest report for a leg — the same file the metadata route
   * above describes, so the member opens what the screen told them about.
   */
  labReportFile: (orderId: string) => `member/ahc/reports/${orderId}/lab/download`,
  diagnosticReportFile: (orderId: string) =>
    `member/ahc/reports/${orderId}/diagnostic/download`,
} as const;

/**
 * These three answer failure with `success: false` in an HTTP **200** body, not
 * a 4xx — an unowned order, and a leg whose report is not uploaded, both look
 * like successes to `HttpClient`. Read `success`, never the error channel.
 */
export interface AhcOrderDetailDto {
  orderId?: string;
  status?: string;
  packageName?: string;
  totalAmount?: number;
  walletDebitAmount?: number;
  copayAmount?: number;
  createdAt?: string;
  labOrder?: AhcLegDto;
  diagnosticOrder?: AhcLegDto;
}

export interface AhcLegDto {
  vendorId?: unknown;
  vendorName?: string;
  collectionType?: string;
  collectionDate?: string;
  collectionTime?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  status?: string;
  reports?: unknown[];
}

export interface AhcReportDto {
  fileName?: string;
  originalName?: string;
  uploadedAt?: string;
}

export interface AhcLeg {
  readonly booked: boolean;
  readonly vendorName: string;
  readonly whenLabel: string;
  readonly statusLabel: string;
  /** Null while no report has been uploaded for this leg. */
  readonly report: { readonly name: string; readonly uploadedAt: Date | null } | null;
}

export interface AhcOrderDetail {
  readonly orderId: string;
  readonly statusLabel: string;
  readonly packageName: string;
  readonly total: number;
  readonly walletPaid: number;
  readonly copayPaid: number;
  readonly placedAt: Date | null;
  readonly lab: AhcLeg;
  readonly diagnostic: AhcLeg;
}

const titleCase = (value: string | undefined, fallback: string): string =>
  value?.trim()
    ? value.trim().replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase())
    : fallback;

export function toAhcLeg(dto: AhcLegDto | undefined, report: AhcReportDto | null): AhcLeg {
  const booked = Boolean(dto?.vendorId);
  const when = dto?.collectionDate ?? dto?.appointmentDate ?? '';
  const at = dto?.collectionTime ?? dto?.appointmentTime ?? '';
  return {
    booked,
    vendorName: dto?.vendorName?.trim() || (booked ? 'Provider' : ''),
    whenLabel: when ? [when, at].filter(Boolean).join(' at ') : '',
    statusLabel: titleCase(dto?.status, booked ? 'Booked' : 'Not booked'),
    report: report
      ? {
          name: report.originalName?.trim() || report.fileName?.trim() || 'Report',
          uploadedAt: toDate(report.uploadedAt),
        }
      : null,
  };
}

export function toAhcOrderDetail(
  dto: AhcOrderDetailDto,
  labReport: AhcReportDto | null,
  diagnosticReport: AhcReportDto | null,
): AhcOrderDetail {
  return {
    orderId: dto.orderId?.trim() || '',
    statusLabel: titleCase(dto.status, 'Placed'),
    packageName: dto.packageName?.trim() || 'Annual health check',
    total: dto.totalAmount ?? 0,
    walletPaid: dto.walletDebitAmount ?? 0,
    copayPaid: dto.copayAmount ?? 0,
    placedAt: toDate(dto.createdAt),
    lab: toAhcLeg(dto.labOrder, labReport),
    diagnostic: toAhcLeg(dto.diagnosticOrder, diagnosticReport),
  };
}

/** These routes wrap their payload as `{ success, data }`. */
export interface AhcEnvelopeDto<T> {
  success?: boolean;
  data?: T;
  error?: string;
}

export interface AhcEligibilityDataDto {
  isEligible?: boolean;
  reason?: string;
  nextEligibleDate?: string;
}

export interface AhcServiceDto {
  serviceId?: string;
  name?: string;
  code?: string;
  category?: string;
}

export interface AhcPackageDataDto {
  packageId?: string;
  name?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  labServices?: AhcServiceDto[];
  diagnosticServices?: AhcServiceDto[];
  totalLabTests?: number;
  totalDiagnosticTests?: number;
  totalTests?: number;
}

export interface AhcEligibility {
  readonly isEligible: boolean;
  /** Why not, when the API says so. Null when eligible or unexplained. */
  readonly reason: string | null;
}

export interface AhcTest {
  readonly id: string;
  readonly name: string;
}

export interface AhcPackage {
  /** POST member/ahc/orders requires it; the display never shows it. */
  readonly id: string;
  readonly name: string;
  readonly labTests: readonly AhcTest[];
  readonly diagnosticTests: readonly AhcTest[];
  readonly totalTests: number;
  readonly validUntil: Date | null;
}

export function toAhcEligibility(dto: AhcEnvelopeDto<AhcEligibilityDataDto>): AhcEligibility {
  // A 200 carrying `success: false` is a failure this API expresses in the
  // body, so it is checked here rather than left to the error interceptor.
  if (dto.success === false) {
    return { isEligible: false, reason: dto.error?.trim() || null };
  }
  return {
    isEligible: dto.data?.isEligible === true,
    reason: dto.data?.reason?.trim() || null,
  };
}

function toTests(services: AhcServiceDto[] | undefined): readonly AhcTest[] {
  return (services ?? [])
    .map((service, index) => ({
      id: service.serviceId ?? service.code ?? String(index),
      name: service.name?.trim() ?? '',
    }))
    .filter((test) => test.name.length > 0);
}

export function toAhcPackage(dto: AhcEnvelopeDto<AhcPackageDataDto>): AhcPackage | null {
  const data = dto.data;
  if (dto.success === false || !data) return null;

  const labTests = toTests(data.labServices);
  const diagnosticTests = toTests(data.diagnosticServices);

  return {
    id: data.packageId?.trim() ?? '',
    name: data.name?.trim() || 'Health checkup package',
    labTests,
    diagnosticTests,
    // Prefer the API's own count; fall back to what actually resolved.
    totalTests: data.totalTests ?? labTests.length + diagnosticTests.length,
    validUntil: toDate(data.effectiveTo),
  };
}
