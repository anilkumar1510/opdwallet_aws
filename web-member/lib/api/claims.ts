import apiClient from './client'
import { Claim, CreateClaimDto, ClaimDocument } from './types'

/**
 * Additional types specific to claims API
 */
export interface ClaimsSummary {
  total: number
  draft: number
  submitted: number
  underReview: number
  approved: number
  rejected: number
  totalClaimedAmount: number
  totalApprovedAmount: number
  totalPaidAmount: number
}

/**
 * Claims API
 * Handles all claim/reimbursement operations
 */
export const claimsApi = {
  /**
   * Get all claims for the current user
   */
  getUserClaims: async (params?: {
    status?: string
    page?: number
    limit?: number
  }): Promise<{
    claims: Claim[]
    total: number
    page: number
    totalPages: number
  }> => {
    const { data } = await apiClient.get<{
      claims: Claim[]
      total: number
      page: number
      totalPages: number
    }>('/member/claims', { params })
    return data
  },

  /**
   * Get claim by MongoDB ID
   */
  getById: async (id: string): Promise<Claim> => {
    const { data } = await apiClient.get<{ message: string; claim: Claim }>(
      `/member/claims/${id}`
    )
    return data.claim
  },

  /**
   * Get claim by claim ID (e.g., CLM-20250116-0001)
   */
  getByClaimId: async (claimId: string): Promise<Claim> => {
    const { data } = await apiClient.get<{ message: string; claim: Claim }>(
      `/member/claims/claim/${claimId}`
    )
    return data.claim
  },

  /**
   * Create a new claim with file uploads
   */
  create: async (
    claimData: CreateClaimDto,
    files?: File[]
  ): Promise<Claim> => {
    console.log('=== createClaim API CALLED ===')
    console.log('Claim Data:', claimData)
    console.log('Files Count:', files?.length || 0)

    const formData = new FormData()

    // Add claim data fields
    Object.keys(claimData).forEach((key) => {
      const value = claimData[key as keyof CreateClaimDto]
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString())
      }
    })

    // Add files
    if (files && files.length > 0) {
      console.log('Adding files to FormData:')
      files.forEach((file, index) => {
        formData.append('documents', file)
        console.log(`File ${index + 1}: ${file.name} (${file.size} bytes)`)
      })
    }

    const { data } = await apiClient.post<{ message: string; claim: Claim }>(
      '/member/claims',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            console.log(`Upload Progress: ${percentCompleted}%`)
          }
        },
      }
    )

    console.log('Claim created successfully:', data)
    return data.claim
  },

  /**
   * Submit a draft claim
   */
  submit: async (claimId: string): Promise<Claim> => {
    console.log('=== submitClaim API CALLED ===', claimId)
    const { data } = await apiClient.post<{ message: string; claim: Claim }>(
      `/member/claims/${claimId}/submit`
    )
    console.log('Claim submitted successfully:', data)
    return data.claim
  },

  /**
   * Update a draft claim
   */
  update: async (
    id: string,
    updates: Partial<CreateClaimDto>
  ): Promise<Claim> => {
    const { data } = await apiClient.patch<{ message: string; claim: Claim }>(
      `/member/claims/${id}`,
      updates
    )
    return data.claim
  },

  /**
   * Add documents to a claim
   */
  addDocuments: async (claimId: string, files: File[]): Promise<Claim> => {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('documents', file)
    })

    const { data } = await apiClient.post<{ message: string; claim: Claim }>(
      `/member/claims/${claimId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return data.claim
  },

  /**
   * Remove document from a claim
   */
  removeDocument: async (claimId: string, documentId: string): Promise<Claim> => {
    const { data } = await apiClient.delete<{ message: string; claim: Claim }>(
      `/member/claims/${claimId}/documents/${documentId}`
    )
    return data.claim
  },

  /**
   * Delete a draft claim
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/member/claims/${id}`)
  },

  /**
   * Get claims summary
   */
  getSummary: async (): Promise<ClaimsSummary> => {
    const { data } = await apiClient.get<{ message: string; summary: ClaimsSummary }>(
      '/member/claims/summary'
    )
    return data.summary
  },

  /**
   * Get file URL for viewing
   */
  getFileUrl: (userId: string, fileName: string): string => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
    return `${baseUrl}/member/claims/files/${userId}/${fileName}`
  },

  /**
   * Cancel a claim (if allowed)
   */
  cancel: async (claimId: string, reason?: string): Promise<Claim> => {
    const { data } = await apiClient.patch<{ message: string; claim: Claim }>(
      `/member/claims/${claimId}/cancel`,
      { reason }
    )
    return data.claim
  },
}

export default claimsApi
