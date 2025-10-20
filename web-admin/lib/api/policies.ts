import { apiFetch } from '../api'

/**
 * Policies API
 * For policy and assignment management
 */
export const policiesApi = {
  // Policies
  getAllPolicies: async (params?: { isActive?: boolean; search?: string; page?: number; pageSize?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.isActive !== undefined) searchParams.set('isActive', params.isActive.toString())
    if (params?.search) searchParams.set('search', params.search)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString())

    const response = await apiFetch(`/api/policies?${searchParams}`)
    return response.json()
  },

  getPolicyById: async (id: string) => {
    const response = await apiFetch(`/api/policies/${id}`)
    return response.json()
  },

  createPolicy: async (data: any) => {
    const response = await apiFetch('/api/policies', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response.json()
  },

  updatePolicy: async (id: string, data: any) => {
    const response = await apiFetch(`/api/policies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    return response.json()
  },

  deletePolicy: async (id: string) => {
    const response = await apiFetch(`/api/policies/${id}`, {
      method: 'DELETE',
    })
    return response.json()
  },

  // Policy Assignments
  getAssignments: async (params?: { userId?: string; policyId?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.userId) searchParams.set('userId', params.userId)
    if (params?.policyId) searchParams.set('policyId', params.policyId)

    const response = await apiFetch(`/api/assignments?${searchParams}`)
    return response.json()
  },

  assignPolicy: async (data: any) => {
    const response = await apiFetch('/api/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response.json()
  },

  updateAssignment: async (id: string, data: any) => {
    const response = await apiFetch(`/api/assignments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    return response.json()
  },

  deleteAssignment: async (id: string) => {
    const response = await apiFetch(`/api/assignments/${id}`, {
      method: 'DELETE',
    })
    return response.json()
  },
}

export default policiesApi
