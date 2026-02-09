import apiClient from './client';
import { logger } from '../utils/productionLogger';
import { auditLogger } from '../audit/auditLogger';

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
    logger.debug('[Wallet] Fetching wallet balance');
    const response = await apiClient.get<WalletBalance>(`/wallet/balance`, {
      params: { userId },
    });

    // Log PHI access for wallet data
    auditLogger.viewPHI('WALLET', userId, userId);

    logger.debug('[Wallet] Wallet balance fetched successfully');
    return response.data;
  } catch (error) {
    logger.error('[Wallet] Failed to fetch wallet balance:', error);
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

    // Log PHI access for transaction data
    auditLogger.viewPHI('WALLET', userId, userId);

    return response.data;
  } catch (error) {
    logger.error('[Wallet] Failed to fetch wallet transactions:', error);
    throw error;
  }
};
