import apiClient from './client'
import { UserWallet, WalletTransaction } from './types'

/**
 * Wallet API
 * Handles wallet balance and transaction operations
 */
export const walletApi = {
  /**
   * Get user wallet by policy assignment
   */
  getWallet: async (userId: string, assignmentId: string): Promise<UserWallet> => {
    const { data } = await apiClient.get<UserWallet>(
      `/wallet/${userId}/assignment/${assignmentId}`
    )
    return data
  },

  /**
   * Get wallet transactions
   */
  getTransactions: async (userId: string, params?: {
    page?: number
    limit?: number
    startDate?: string
    endDate?: string
  }): Promise<WalletTransaction[]> => {
    const { data } = await apiClient.get<WalletTransaction[]>(
      `/wallet/${userId}/transactions`,
      { params }
    )
    return data
  },

  /**
   * Get wallet balance
   */
  getBalance: async (userId: string, assignmentId: string): Promise<{
    totalBalance: {
      allocated: number
      current: number
      consumed: number
    }
    categoryBalances: Array<{
      categoryCode: string
      categoryName: string
      current: number
      consumed: number
    }>
  }> => {
    const wallet = await this.getWallet(userId, assignmentId)
    return {
      totalBalance: wallet.totalBalance,
      categoryBalances: wallet.categoryBalances,
    }
  },

  /**
   * Get transaction history with pagination
   */
  getTransactionHistory: async (
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    transactions: WalletTransaction[]
    total: number
    page: number
    totalPages: number
  }> => {
    const { data } = await apiClient.get<{
      transactions: WalletTransaction[]
      total: number
      page: number
      totalPages: number
    }>(`/wallet/${userId}/transactions/history`, {
      params: { page, limit },
    })
    return data
  },
}

export default walletApi
