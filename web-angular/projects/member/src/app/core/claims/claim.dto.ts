/**
 * Transport shapes for GET /member/claims and GET /member/claims/summary.
 * Source: api/src/modules/memberclaims/memberclaims.controller.ts
 */

export interface ClaimDocumentDto {
  fileName?: string;
  originalName?: string;
  fileType?: string;
  documentType?: string;
}

export interface ClaimDto {
  _id?: string;
  claimId?: string;
  /** The claim owner, used to build the document download path. */
  userId?: string;
  memberName?: string;
  patientName?: string;
  claimType?: string;
  category?: string;
  treatmentDate?: string;
  providerName?: string;
  billAmount?: number;
  approvedAmount?: number;
  billNumber?: string;
  status?: string;
  paymentStatus?: string;
  documents?: ClaimDocumentDto[];
  submittedAt?: string;
  createdAt?: string;
}

export interface ClaimsResponseDto {
  message?: string;
  claims?: ClaimDto[];
  total?: number;
  page?: number;
}

export interface ClaimsSummaryDto {
  message?: string;
  summary?: {
    total?: number;
    draft?: number;
    submitted?: number;
    underReview?: number;
    approved?: number;
    rejected?: number;
    totalClaimedAmount?: number;
    totalApprovedAmount?: number;
    totalPaidAmount?: number;
  };
}
