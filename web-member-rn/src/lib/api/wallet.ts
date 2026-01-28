import apiClient from './client';

/**
 * Wallet API - Matches web-member API calls
 */

export interface WalletBalance {
  totalBalance: {
    allocated: number;
    current: number;
    consumed: number;
  };
  categories: WalletCategory[];
}

export interface WalletCategory {
  categoryCode: string;
  name: string;
  total: number;
  available: number;
  consumed: number;
}

/**
 * Fetch wallet balance for a specific user
 * Endpoint: GET /wallet/balance?userId={userId}
 * Note: /api prefix is already in apiClient baseURL
 */
export const fetchWalletBalance = async (userId: string): Promise<WalletBalance> => {
  try {
    console.log('Fetching wallet balance for userId:', userId);
    const response = await apiClient.get<WalletBalance>(`/wallet/balance`, {
      params: { userId },
    });

    console.log('Wallet balance response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch wallet balance:', error);
    throw error;
  }
};

/**
 * Fetch wallet transactions for a specific user
 * Endpoint: GET /wallet/transactions?userId={userId}
 * Note: /api prefix is already in apiClient baseURL
 */
export const fetchWalletTransactions = async (userId: string) => {
  try {
    const response = await apiClient.get(`/wallet/transactions`, {
      params: { userId },
    });

    return response.data;
  } catch (error) {
    console.error('Failed to fetch wallet transactions:', error);
    throw error;
  }
};
