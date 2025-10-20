import { apiFetch } from '../api'

/**
 * Operations API
 * For operations portal - member management, lab prescriptions, etc.
 */
export const operationsApi = {
  // Member Operations
  searchMembers: async (params: { search?: string; page?: number; pageSize?: number }) => {
    const searchParams = new URLSearchParams()
    if (params.search) searchParams.set('search', params.search)
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString())

    const response = await apiFetch(`/api/ops/members/search?${searchParams}`)
    return response.json()
  },

  getMemberById: async (id: string) => {
    const response = await apiFetch(`/api/ops/members/${id}`)
    return response.json()
  },

  getMemberDependents: async (id: string) => {
    const response = await apiFetch(`/api/ops/members/${id}/dependents`)
    return response.json()
  },

  // Lab Prescription Operations
  getPrescriptions: async (params?: { status?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    const response = await apiFetch(`/api/ops/lab/prescriptions?${searchParams}`)
    return response.json()
  },

  getPrescriptionById: async (id: string) => {
    const response = await apiFetch(`/api/ops/lab/prescriptions/${id}`)
    return response.json()
  },

  digitizePrescription: async (id: string, tests: string[]) => {
    const response = await apiFetch(`/api/ops/lab/prescriptions/${id}/digitize`, {
      method: 'POST',
      body: JSON.stringify({ tests }),
    })
    return response.json()
  },

  // Lab Orders
  getLabOrders: async (params?: { status?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    const response = await apiFetch(`/api/ops/lab/orders?${searchParams}`)
    return response.json()
  },
}

export default operationsApi
