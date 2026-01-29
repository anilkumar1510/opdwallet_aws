import apiClient from './client';

/**
 * Claims API for React Native
 * Handles all claim/reimbursement operations
 */

export interface Claim {
  _id: string;
  claimId: string;
  userId: string;
  claimType: string;
  category: string;
  status: string;
  billAmount: number;
  approvedAmount?: number;
  treatmentDate: string;
  treatmentDescription?: string;
  billNumber?: string;
  patientName?: string;
  providerName?: string;
  documents?: ClaimDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface ClaimDocument {
  _id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface CreateClaimDto {
  userId: string;
  claimType: string;
  category: string;
  treatmentDate: string;
  billAmount: string;
  billNumber?: string;
  treatmentDescription?: string;
  providerName?: string;
  patientName?: string;
  relationToMember?: string;
}

export interface ClaimsSummary {
  total: number;
  draft: number;
  submitted: number;
  underReview: number;
  approved: number;
  rejected: number;
  totalClaimedAmount: number;
  totalApprovedAmount: number;
  totalPaidAmount: number;
}

export interface AvailableCategory {
  categoryId: string;
  claimCategory: string;
  name: string;
  description?: string;
  annualLimit?: number;
  perClaimLimit?: number;
}

/**
 * Claims API functions
 */
export const claimsApi = {
  /**
   * Get all claims for the current user
   */
  getUserClaims: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    claims: Claim[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const { data } = await apiClient.get<{
      claims: Claim[];
      total: number;
      page: number;
      totalPages: number;
    }>('/member/claims', { params });
    return data;
  },

  /**
   * Get claim by ID
   */
  getById: async (id: string): Promise<Claim> => {
    const { data } = await apiClient.get<{ message: string; claim: Claim }>(
      `/member/claims/${id}`
    );
    return data.claim;
  },

  /**
   * Get claim by claim ID (e.g., CLM-20250116-0001)
   */
  getByClaimId: async (claimId: string): Promise<Claim> => {
    const { data } = await apiClient.get<{ message: string; claim: Claim }>(
      `/member/claims/claim/${claimId}`
    );
    return data.claim;
  },

  /**
   * Get available claim categories
   */
  getAvailableCategories: async (): Promise<AvailableCategory[]> => {
    const { data } = await apiClient.get<AvailableCategory[]>(
      '/member/claims/available-categories'
    );
    return data;
  },

  /**
   * Create a new claim with file uploads
   * Note: For React Native, pass FormData with file objects
   */
  create: async (formData: FormData): Promise<Claim> => {
    const { data } = await apiClient.post<{ message: string; claim: Claim }>(
      '/member/claims',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data.claim;
  },

  /**
   * Submit a draft claim
   */
  submit: async (claimId: string): Promise<Claim> => {
    const { data } = await apiClient.post<{ message: string; claim: Claim }>(
      `/member/claims/${claimId}/submit`
    );
    return data.claim;
  },

  /**
   * Update a draft claim
   */
  update: async (id: string, updates: Partial<CreateClaimDto>): Promise<Claim> => {
    const { data } = await apiClient.patch<{ message: string; claim: Claim }>(
      `/member/claims/${id}`,
      updates
    );
    return data.claim;
  },

  /**
   * Add documents to a claim
   */
  addDocuments: async (claimId: string, formData: FormData): Promise<Claim> => {
    const { data } = await apiClient.post<{ message: string; claim: Claim }>(
      `/member/claims/${claimId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data.claim;
  },

  /**
   * Remove document from a claim
   */
  removeDocument: async (claimId: string, documentId: string): Promise<Claim> => {
    const { data } = await apiClient.delete<{ message: string; claim: Claim }>(
      `/member/claims/${claimId}/documents/${documentId}`
    );
    return data.claim;
  },

  /**
   * Delete a draft claim
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/member/claims/${id}`);
  },

  /**
   * Get claims summary
   */
  getSummary: async (): Promise<ClaimsSummary> => {
    const { data } = await apiClient.get<{ message: string; summary: ClaimsSummary }>(
      '/member/claims/summary'
    );
    return data.summary;
  },

  /**
   * Cancel a claim (if allowed)
   */
  cancel: async (claimId: string, reason?: string): Promise<Claim> => {
    const { data } = await apiClient.patch<{ message: string; claim: Claim }>(
      `/member/claims/${claimId}/cancel`,
      { reason }
    );
    return data.claim;
  },
};

export default claimsApi;
