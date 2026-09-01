import { Money } from '../domain/money';

/** How a status reads to a member, and how it should look. */
export type StatusTone = 'neutral' | 'progress' | 'positive' | 'negative';

export interface ClaimStatus {
  readonly label: string;
  readonly tone: StatusTone;
  /** No further action or change is expected. */
  readonly isFinal: boolean;
}

export interface ClaimDocument {
  readonly label: string;
  readonly fileName: string;
  /** Null when the payload lacks what the path needs, so the row shows no control. */
  readonly downloadPath: string | null;
}

export interface Claim {
  readonly id: string;
  readonly reference: string;
  readonly patientName: string;
  readonly categoryLabel: string;
  readonly typeLabel: string;
  readonly providerName: string;
  readonly billAmount: Money;
  readonly approvedAmount: Money | null;
  readonly treatmentDate: Date | null;
  readonly submittedAt: Date | null;
  /**
   * The API's raw status (`DOCUMENTS_REQUIRED`, `REJECTED`, …). `status` carries
   * the display label, which must not be matched on — it is presentation and can
   * be reworded without anything failing.
   */
  readonly statusCode: string;
  readonly documentCount: number;
  /**
   * The uploaded documents themselves. The list used to carry only a COUNT, so
   * the screen said "3 documents" beside no way to open any of them.
   */
  readonly documents: readonly ClaimDocument[];
  readonly status: ClaimStatus;
  /**
   * Whether the member may still withdraw this claim. web-member blocks six
   * terminal statuses; anything else — including an unrecognised one — stays
   * cancellable, so a new status does not silently trap a claim.
   */
  readonly isCancellable: boolean;
}

export interface ClaimsSummary {
  readonly total: number;
  readonly approved: number;
  readonly inProgress: number;
  readonly rejected: number;
  readonly claimedAmount: Money;
  readonly approvedAmount: Money;
}
