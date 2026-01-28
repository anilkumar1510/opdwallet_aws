import apiClient from './client';
import { User, AuthResponse, MemberProfileResponse } from './types';

/**
 * Users API
 * Handles user profile and authentication operations
 */
export const usersApi = {
  /**
   * Get current authenticated user
   */
  getCurrentUser: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/auth/me');
    return data;
  },

  /**
   * Get member profile (current user with all data)
   */
  getMemberProfile: async (): Promise<MemberProfileResponse> => {
    const { data } = await apiClient.get<MemberProfileResponse>('/member/profile');
    return data;
  },

  /**
   * Login with email and password
   */
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    return data;
  },

  /**
   * Logout
   */
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },
};

export default usersApi;
