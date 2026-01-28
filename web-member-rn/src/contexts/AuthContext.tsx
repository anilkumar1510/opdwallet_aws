import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usersApi } from '../lib/api/users';
import { tokenManager, setOnUnauthorized, storage } from '../lib/api/client';
import { User, MemberProfileResponse } from '../lib/api/types';

const USER_DATA_KEY = 'user_data';
const PROFILE_DATA_KEY = 'profile_data';

interface AuthContextType {
  user: User | null;
  profile: MemberProfileResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<MemberProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from stored data
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await tokenManager.getToken();
        if (token) {
          // Try to load cached user data first
          const cachedUser = await storage.getItem(USER_DATA_KEY);
          if (cachedUser) {
            setUser(JSON.parse(cachedUser));
          }

          // Fetch fresh profile from server
          try {
            const profileData = await usersApi.getMemberProfile();
            setProfile(profileData);
            await storage.setItem(PROFILE_DATA_KEY, JSON.stringify(profileData));
          } catch {
            // Token might be invalid, clear auth state
            await handleLogout();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Set up unauthorized handler
  useEffect(() => {
    setOnUnauthorized(() => {
      handleLogout();
    });
  }, []);

  const handleLogout = async () => {
    await tokenManager.removeToken();
    await storage.removeItem(USER_DATA_KEY);
    await storage.removeItem(PROFILE_DATA_KEY);
    setUser(null);
    setProfile(null);
  };

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await usersApi.login(email, password);

      // Store token if provided
      if (response.token && typeof response.token === 'string') {
        await tokenManager.setToken(response.token);
      }

      // Store user data if provided
      if (response.user) {
        setUser(response.user);
        await storage.setItem(USER_DATA_KEY, JSON.stringify(response.user));
      }

      // Profile will be fetched on dashboard mount via refreshProfile
      // This avoids timing issues with token storage

      return { success: true };
    } catch (error: any) {
      // Handle various error response formats from NestJS
      const errorData = error.response?.data;
      let message = 'Login failed';

      if (typeof errorData?.message === 'string') {
        message = errorData.message;
      } else if (Array.isArray(errorData?.message)) {
        message = errorData.message.join(', ');
      } else if (errorData?.error) {
        message = typeof errorData.error === 'string' ? errorData.error : 'Login failed';
      } else if (error.message) {
        message = error.message;
      }

      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await usersApi.logout();
    } catch {
      // Ignore logout API errors
    } finally {
      await handleLogout();
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profileData = await usersApi.getMemberProfile();
      setProfile(profileData);
      await storage.setItem(PROFILE_DATA_KEY, JSON.stringify(profileData));
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  }, []);

  const value: AuthContextType = {
    user,
    profile,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
