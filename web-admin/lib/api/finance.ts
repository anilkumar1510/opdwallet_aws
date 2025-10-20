import { apiFetch } from '../api'

/**
 * Finance API
 * For finance portal - payment processing and tracking
 */
export const financeApi = {
  // Payments
  getPendingPayments: async (params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    const response = await apiFetch(`/api/finance/payments/pending?${searchParams}`)
    return response.json()
  },

  getPaymentHistory: async (params?: {
    status?: string
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.startDate) searchParams.set('startDate', params.startDate)
    if (params?.endDate) searchParams.set('endDate', params.endDate)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    const response = await apiFetch(`/api/finance/payments/history?${searchParams}`)
    return response.json()
  },

  getPaymentById: async (paymentId: string) => {
    const response = await apiFetch(`/api/finance/payments/${paymentId}`)
    return response.json()
  },

  processPayment: async (paymentId: string, data: any) => {
    const response = await apiFetch(`/api/finance/payments/${paymentId}/process`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response.json()
  },

  markPaymentPaid: async (paymentId: string, data: any) => {
    const response = await apiFetch(`/api/finance/payments/${paymentId}/mark-paid`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response.json()
  },

  // Reports
  getFinanceReports: async (params?: { startDate?: string; endDate?: string; type?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.startDate) searchParams.set('startDate', params.startDate)
    if (params?.endDate) searchParams.set('endDate', params.endDate)
    if (params?.type) searchParams.set('type', params.type)

    const response = await apiFetch(`/api/finance/reports?${searchParams}`)
    return response.json()
  },
}

export default financeApi
