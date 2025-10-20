import apiClient from './client'
import { User, AuthResponse } from './types'

/**
 * Users API
 * Handles user profile and authentication operations
 */
export const usersApi = {
  /**
   * Get current authenticated user
   */
  getCurrentUser: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/auth/me')
    return data
  },

  /**
   * Get user profile by ID
   */
  getProfile: async (userId: string): Promise<User> => {
    const { data } = await apiClient.get<User>(`/member/profile/${userId}`)
    return data
  },

  /**
   * Get member profile (current user)
   */
  getMemberProfile: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/member/profile')
    return data
  },

  /**
   * Update user profile
   */
  updateProfile: async (userId: string, updates: Partial<User>): Promise<User> => {
    const { data } = await apiClient.patch<User>(
      `/member/profile/${userId}`,
      updates
    )
    return data
  },

  /**
   * Get user dependents (family members)
   */
  getDependents: async (userId: string): Promise<any[]> => {
    const { data } = await apiClient.get<any[]>(`/users/${userId}/dependents`)
    return data
  },

  /**
   * Login
   */
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', {
      email,
      password,
    })
    return data
  },

  /**
   * Logout
   */
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
  },
}

export default usersApi
