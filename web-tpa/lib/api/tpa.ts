import { apiFetch } from '../api'

/**
 * TPA (Third Party Administrator) API
 * For TPA portal - claims management, assignment, review
 */
export const tpaApi = {
  // Claims Management
  getAllClaims: async (params?: {
    status?: string
    assignedTo?: string
    page?: number
    limit?: number
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.assignedTo) searchParams.set('assignedTo', params.assignedTo)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    const response = await apiFetch(`/api/tpa/claims?${searchParams}`)
    return response.json()
  },

  getUnassignedClaims: async (params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    const response = await apiFetch(`/api/tpa/claims/unassigned?${searchParams}`)
    return response.json()
  },

  getAssignedClaims: async (params?: {
    assignedTo?: string
    page?: number
    limit?: number
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.assignedTo) searchParams.set('assignedTo', params.assignedTo)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    const response = await apiFetch(`/api/tpa/claims/assigned?${searchParams}`)
    return response.json()
  },

  getClaimById: async (claimId: string) => {
    const response = await apiFetch(`/api/tpa/claims/${claimId}`)
    return response.json()
  },

  assignClaim: async (claimId: string, userId: string) => {
    const response = await apiFetch(`/api/tpa/claims/${claimId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    })
    return response.json()
  },

  reassignClaim: async (claimId: string, userId: string, reason?: string) => {
    const response = await apiFetch(`/api/tpa/claims/${claimId}/reassign`, {
      method: 'POST',
      body: JSON.stringify({ userId, reason }),
    })
    return response.json()
  },

  reviewClaim: async (claimId: string, action: string, data: any) => {
    const response = await apiFetch(`/api/tpa/claims/${claimId}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, ...data }),
    })
    return response.json()
  },

  approveClaim: async (
    claimId: string,
    approvedAmount: number,
    approvalReason?: string
  ) => {
    const response = await apiFetch(`/api/tpa/claims/${claimId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approvedAmount, approvalReason }),
    })
    return response.json()
  },

  rejectClaim: async (claimId: string, rejectionReason: string) => {
    const response = await apiFetch(`/api/tpa/claims/${claimId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason }),
    })
    return response.json()
  },

  requestDocuments: async (claimId: string, requiredDocuments: string[], reason?: string) => {
    const response = await apiFetch(`/api/tpa/claims/${claimId}/request-documents`, {
      method: 'POST',
      body: JSON.stringify({ requiredDocuments, reason }),
    })
    return response.json()
  },

  // TPA Users
  getTpaUsers: async () => {
    const response = await apiFetch('/api/tpa/users')
    return response.json()
  },

  // Analytics
  getAnalytics: async (params?: { startDate?: string; endDate?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.startDate) searchParams.set('startDate', params.startDate)
    if (params?.endDate) searchParams.set('endDate', params.endDate)

    const response = await apiFetch(`/api/tpa/analytics?${searchParams}`)
    return response.json()
  },
}

export default tpaApi
