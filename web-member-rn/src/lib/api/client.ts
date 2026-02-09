import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { secureStorage, clearSecureStorage } from '../storage/secureStorage';
import { logger } from '../utils/productionLogger';

/**
 * API Client
 *
 * Provides secure API communication with:
 * - Encrypted token storage on web
 * - HTTPS enforcement in production
 * - Token refresh mechanism
 * - Sanitized error messages
 *
 * Security: Implements secure communication per HIPAA requirements
 */

// API base URL - points to the same backend as web portal
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

/**
 * Validates API URL for security
 * Ensures HTTPS is used in production
 */
function validateApiUrl(url: string): void {
  if (!__DEV__) {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'https:') {
      throw new Error(
        'Security Error: HTTPS is required for API calls in production. ' +
        'Please configure EXPO_PUBLIC_API_URL with an HTTPS URL.'
      );
    }
  }
}

// Validate URL on startup
try {
  validateApiUrl(API_BASE_URL);
} catch (error) {
  if (!__DEV__) {
    logger.error('[API Client] URL validation failed:', error);
    throw error;
  }
}

/**
 * Token storage keys
 */
const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';

/**
 * Cross-platform secure storage
 * Uses SecureStore on native, encrypted localStorage on web
 */
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return secureStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      return secureStorage.setItem(key, value);
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      return secureStorage.removeItem(key);
    }
    return SecureStore.deleteItemAsync(key);
  },
};

/**
 * Token management functions
 */
export const tokenManager = {
  getToken: async (): Promise<string | null> => {
    try {
      return await storage.getItem(AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setToken: async (token: string, expiresIn?: number): Promise<void> => {
    try {
      await storage.setItem(AUTH_TOKEN_KEY, token);
      if (expiresIn) {
        const expiryTime = Date.now() + expiresIn * 1000;
        await storage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      }
    } catch (error) {
      logger.error('[TokenManager] Failed to save token');
    }
  },

  getRefreshToken: async (): Promise<string | null> => {
    try {
      return await storage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setRefreshToken: async (token: string): Promise<void> => {
    try {
      await storage.setItem(REFRESH_TOKEN_KEY, token);
    } catch (error) {
      logger.error('[TokenManager] Failed to save refresh token');
    }
  },

  removeToken: async (): Promise<void> => {
    try {
      await storage.removeItem(AUTH_TOKEN_KEY);
      await storage.removeItem(REFRESH_TOKEN_KEY);
      await storage.removeItem(TOKEN_EXPIRY_KEY);
      // Clear all secure storage on logout
      if (Platform.OS === 'web') {
        await clearSecureStorage();
      }
    } catch (error) {
      logger.error('[TokenManager] Failed to remove token');
    }
  },

  isTokenExpired: async (): Promise<boolean> => {
    try {
      const expiry = await storage.getItem(TOKEN_EXPIRY_KEY);
      if (!expiry) return false;
      return Date.now() >= parseInt(expiry, 10);
    } catch {
      return true;
    }
  },

  isTokenExpiringSoon: async (thresholdSeconds: number = 300): Promise<boolean> => {
    try {
      const expiry = await storage.getItem(TOKEN_EXPIRY_KEY);
      if (!expiry) return false;
      return Date.now() >= parseInt(expiry, 10) - thresholdSeconds * 1000;
    } catch {
      return true;
    }
  },
};

// Export storage for use in other files
export { storage };

/**
 * Error message sanitization
 * Converts backend errors to user-friendly messages
 */
const ERROR_MESSAGES: Record<string, string> = {
  'Invalid credentials': 'The email or password you entered is incorrect.',
  'User not found': 'No account found with this email address.',
  'Account locked': 'Your account has been locked. Please contact support.',
  'Token expired': 'Your session has expired. Please log in again.',
  'Unauthorized': 'You are not authorized to perform this action.',
  'Forbidden': 'Access denied. You do not have permission to access this resource.',
  'Internal server error': 'Something went wrong. Please try again later.',
  'Network Error': 'Unable to connect to the server. Please check your internet connection.',
  'timeout of': 'The request timed out. Please try again.',
};

/**
 * Sanitizes error messages for display to users
 * Removes technical details that could be exploited
 */
export function sanitizeErrorMessage(error: AxiosError | Error | string): string {
  let message = typeof error === 'string' ? error : '';

  if (error instanceof AxiosError) {
    const responseData = error.response?.data as { message?: string | string[]; error?: string } | undefined;
    if (responseData) {
      if (typeof responseData.message === 'string') {
        message = responseData.message;
      } else if (Array.isArray(responseData.message)) {
        message = responseData.message[0] || 'An error occurred.';
      } else if (responseData.error) {
        message = responseData.error;
      }
    } else {
      message = error.message || 'An error occurred.';
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  // Check for known error patterns and return sanitized message
  for (const [pattern, sanitized] of Object.entries(ERROR_MESSAGES)) {
    if (message.toLowerCase().includes(pattern.toLowerCase())) {
      return sanitized;
    }
  }

  // If no pattern matched, return a generic message in production
  if (!__DEV__) {
    // Check for common HTTP status codes in message
    if (message.includes('401') || message.includes('Unauthorized')) {
      return ERROR_MESSAGES['Unauthorized'];
    }
    if (message.includes('403') || message.includes('Forbidden')) {
      return ERROR_MESSAGES['Forbidden'];
    }
    if (message.includes('500') || message.includes('Internal')) {
      return ERROR_MESSAGES['Internal server error'];
    }
    // Generic fallback - don't expose technical details
    return 'An error occurred. Please try again.';
  }

  return message;
}

/**
 * Base API client with axios
 * Uses Bearer token authentication instead of cookies
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

/**
 * Subscribes to token refresh
 */
function subscribeTokenRefresh(callback: (token: string) => void): void {
  refreshSubscribers.push(callback);
}

/**
 * Notifies all subscribers of new token
 */
function onTokenRefreshed(token: string): void {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

/**
 * Attempts to refresh the access token
 */
async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = await tokenManager.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken,
    });

    const { token, expiresIn, refreshToken: newRefreshToken } = response.data;

    await tokenManager.setToken(token, expiresIn);
    if (newRefreshToken) {
      await tokenManager.setRefreshToken(newRefreshToken);
    }

    return token;
  } catch (error) {
    logger.error('[API Client] Token refresh failed');
    return null;
  }
}

// Request interceptor - adds Bearer token and checks expiry
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Skip auth for certain endpoints
    const publicEndpoints = ['/auth/login', '/auth/refresh', '/auth/register'];
    const isPublicEndpoint = publicEndpoints.some((ep) => config.url?.includes(ep));

    if (!isPublicEndpoint) {
      // Check if token is expiring soon
      const isExpiringSoon = await tokenManager.isTokenExpiringSoon();

      if (isExpiringSoon && !isRefreshing) {
        isRefreshing = true;
        const newToken = await refreshAccessToken();
        isRefreshing = false;

        if (newToken) {
          onTokenRefreshed(newToken);
          config.headers.Authorization = `Bearer ${newToken}`;
        }
      } else {
        const token = await tokenManager.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Callback for handling 401 errors (set by AuthContext)
let onUnauthorized: (() => void) | null = null;

export const setOnUnauthorized = (callback: () => void) => {
  onUnauthorized = callback;
};

// Response interceptor for global error handling and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await refreshAccessToken();
        isRefreshing = false;

        if (newToken) {
          onTokenRefreshed(newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        } else {
          // Refresh failed - trigger logout
          onUnauthorized?.();
        }
      } else {
        // Wait for refresh to complete
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }
    } else if (error.response?.status === 401) {
      // Already retried - trigger logout
      onUnauthorized?.();
    } else if (error.response?.status === 403) {
      logger.warn('[API Client] Access denied');
    } else if (error.response?.status && error.response.status >= 500) {
      logger.error('[API Client] Server error occurred');
    } else if (error.code === 'ECONNABORTED') {
      logger.warn('[API Client] Request timeout');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
