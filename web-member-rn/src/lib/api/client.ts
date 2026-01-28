import axios, { AxiosInstance, AxiosError } from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// API base URL - points to the same backend as web portal
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

/**
 * Token storage keys
 */
const AUTH_TOKEN_KEY = 'auth_token';

/**
 * Cross-platform secure storage
 * Uses SecureStore on native, localStorage on web
 */
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      }
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
      return;
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

  setToken: async (token: string): Promise<void> => {
    try {
      await storage.setItem(AUTH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to save token:', error);
    }
  },

  removeToken: async (): Promise<void> => {
    try {
      await storage.removeItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to remove token:', error);
    }
  },
};

// Export storage for use in other files
export { storage };

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

// Request interceptor - adds Bearer token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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

// Response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - trigger logout
      onUnauthorized?.();
    } else if (error.response?.status === 403) {
      console.error('API: Access denied:', error.response.data);
    } else if (error.response?.status && error.response.status >= 500) {
      console.error('API: Server error:', error.response.data);
    } else if (error.code === 'ECONNABORTED') {
      console.error('API: Request timeout');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
