import apiClient from './client'
import { TransactionSummary, Payment } from './types'

/**
 * Transactions API
 * Handles payment transactions and transaction summaries
 */
export const transactionsApi = {
  /**
   * Get user transaction summaries
   */
  getSummaries: async (userId: string, params?: {
    serviceType?: string
    status?: string
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
  }): Promise<{
    transactions: TransactionSummary[]
    total: number
    page: number
    totalPages: number
  }> => {
    const { data } = await apiClient.get<{
      transactions: TransactionSummary[]
      total: number
      page: number
      totalPages: number
    }>(`/transactions/user/${userId}`, { params })
    return data
  },

  /**
   * Get transaction summary by ID
   */
  getById: async (transactionId: string): Promise<TransactionSummary> => {
    const { data } = await apiClient.get<{ transaction: TransactionSummary }>(
      `/transactions/${transactionId}`
    )
    return data.transaction
  },

  /**
   * Get payment by ID
   */
  getPayment: async (paymentId: string): Promise<Payment> => {
    const { data } = await apiClient.get<{ payment: Payment }>(
      `/payments/${paymentId}`
    )
    return data.payment
  },

  /**
   * Get user payments
   */
  getUserPayments: async (userId: string, params?: {
    status?: string
    serviceType?: string
    page?: number
    limit?: number
  }): Promise<{
    payments: Payment[]
    total: number
    page: number
    totalPages: number
  }> => {
    const { data } = await apiClient.get<{
      payments: Payment[]
      total: number
      page: number
      totalPages: number
    }>(`/payments/user/${userId}`, { params })
    return data
  },

  /**
   * Initiate payment (dummy gateway)
   */
  initiatePayment: async (paymentData: {
    serviceType: string
    serviceId: string
    amount: number
    paymentType: string
  }): Promise<Payment> => {
    const { data } = await apiClient.post<{ message: string; payment: Payment }>(
      '/payments/initiate',
      paymentData
    )
    return data.payment
  },

  /**
   * Mark payment as paid (dummy gateway)
   */
  markAsPaid: async (paymentId: string): Promise<Payment> => {
    const { data } = await apiClient.post<{ message: string; payment: Payment }>(
      `/payments/${paymentId}/mark-paid`
    )
    return data.payment
  },
}

export default transactionsApi
