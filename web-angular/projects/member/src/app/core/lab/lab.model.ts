import { ClaimStatus } from '../claims/claim.model';
import { Money } from '../domain/money';

/** Pathology and Radiology share one shape; only the endpoints differ. */
export const LabKind = {
  Lab: 'LAB',
  Diagnostic: 'DIAGNOSTIC',
} as const;

export type LabKind = (typeof LabKind)[keyof typeof LabKind];

export interface LabTestItem {
  readonly id: string;
  readonly name: string;
  readonly price: Money;
}

export interface LabOrder {
  readonly id: string;
  readonly kind: LabKind;
  readonly reference: string;
  readonly vendorName: string;
  readonly tests: readonly LabTestItem[];
  readonly status: ClaimStatus;
  readonly paymentStatus: ClaimStatus | null;
  /** Home collection vs walk-in, when the API says. */
  readonly collectionLabel: string | null;
  readonly collectionAt: Date | null;
  readonly total: Money;
  readonly fromWallet: Money;
  readonly youPay: Money;
  readonly placedAt: Date | null;
  readonly reportCount: number;
  /**
   * The reports themselves, not just a count. The count alone was the same
   * shape of defect this codebase already fixed once on claims: a screen
   * saying "3 reports" beside no way to open any of them.
   */
  readonly reports: readonly LabReport[];
}

export interface LabReport {
  readonly id: string;
  readonly name: string;
  readonly uploadedAt: Date | null;
}

export interface LabPrescription {
  readonly id: string;
  readonly kind: LabKind;
  readonly reference: string;
  readonly patientName: string;
  /** The uploaded file's name, which is what the reference lists. */
  readonly fileName: string;
  readonly sourceLabel: string;
  readonly status: ClaimStatus;
  /** Raw API status (UPLOADED, DIGITIZED …), shown verbatim as a badge. */
  readonly statusCode: string;
  readonly uploadedAt: Date | null;
  /** Set once digitised — the cart this prescription became. */
  readonly cartId: string | null;
  /** An order has already been placed against this prescription. */
  readonly hasOrder: boolean;
  readonly orderCount: number;
}
