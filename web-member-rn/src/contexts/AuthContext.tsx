import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { usersApi } from '../lib/api/users';
import { tokenManager, setOnUnauthorized, storage, sanitizeErrorMessage } from '../lib/api/client';
import { User, MemberProfileResponse } from '../lib/api/types';
import { logger } from '../lib/utils/productionLogger';
import { auditLogger } from '../lib/audit/auditLogger';
import { useSessionTimeout } from '../hooks/useSessionTimeout';

/**
 * Auth Context
 *
 * Provides authentication state and methods with security enhancements:
 * - Session timeout with warning modal
 * - Audit logging for auth events
 * - Sanitized error messages
 *
 * HIPAA Compliance: Implements access controls per §164.312(d)
 */

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
  extendSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Session timeout warning modal component
 */
function SessionTimeoutModal({
  visible,
  timeRemaining,
  onExtend,
  onLogout,
}: {
  visible: boolean;
  timeRemaining: number;
  onExtend: () => void;
  onLogout: () => void;
}) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalIcon}>
            <Text style={styles.modalIconText}>⏱</Text>
          </View>
          <Text style={styles.modalTitle}>Session Expiring</Text>
          <Text style={styles.modalMessage}>
            Your session will expire in{' '}
            <Text style={styles.modalTimeText}>
              {minutes}:{seconds.toString().padStart(2, '0')}
            </Text>
          </Text>
          <Text style={styles.modalSubMessage}>
            For your security, you will be logged out due to inactivity.
          </Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.extendButton} onPress={onExtend}>
              <Text style={styles.extendButtonText}>Stay Logged In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<MemberProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

  // Handle session timeout
  const handleSessionTimeout = useCallback(async () => {
    logger.info('[AuthContext] Session timed out due to inactivity');
    await handleLogout();
  }, []);

  // Handle timeout warning
  const handleTimeoutWarning = useCallback((secondsRemaining: number) => {
    setShowTimeoutWarning(true);
  }, []);

  // Session timeout hook - timeout value is read from EXPO_PUBLIC_SESSION_TIMEOUT_MINUTES env variable
  const { timeRemaining, isWarningActive, extendSession, resetTimer } = useSessionTimeout({
    onTimeout: handleSessionTimeout,
    onWarning: handleTimeoutWarning,
    isActive: !!user,
  });

  // Update warning visibility based on hook state
  useEffect(() => {
    setShowTimeoutWarning(isWarningActive);
  }, [isWarningActive]);

  // Handle extending session
  const handleExtendSession = useCallback(() => {
    setShowTimeoutWarning(false);
    extendSession();
  }, [extendSession]);

  // Initialize auth state from stored data
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await tokenManager.getToken();
        if (token) {
          // Try to load cached user data first
          const cachedUser = await storage.getItem(USER_DATA_KEY);
          if (cachedUser) {
            const userData = JSON.parse(cachedUser);
            setUser(userData);
            // Set audit context
            auditLogger.setContext(userData._id, userData.email);
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
      } catch {
        logger.error('[AuthContext] Auth initialization error');
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
    // Clear audit context (this logs the logout event)
    auditLogger.clearContext();

    await tokenManager.removeToken();
    await storage.removeItem(USER_DATA_KEY);
    await storage.removeItem(PROFILE_DATA_KEY);
    setUser(null);
    setProfile(null);
    setShowTimeoutWarning(false);
  };

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await usersApi.login(email, password);

      // Store token if provided
      if (response.token && typeof response.token === 'string') {
        await tokenManager.setToken(response.token, response.expiresIn);
        if (response.refreshToken) {
          await tokenManager.setRefreshToken(response.refreshToken);
        }
      }

      // Store user data if provided
      if (response.user) {
        setUser(response.user);
        await storage.setItem(USER_DATA_KEY, JSON.stringify(response.user));

        // Set audit context and log login
        auditLogger.setContext(response.user._id, response.user.email);
        auditLogger.login(response.user._id, true, response.user.email);
      }

      // Reset session timer
      resetTimer();

      return { success: true };
    } catch (error: any) {
      // Log failed login attempt (without exposing email in production)
      auditLogger.login('unknown', false);

      // Return sanitized error message
      const message = sanitizeErrorMessage(error);
      return { success: false, error: message };
    }
  }, [resetTimer]);

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

      // Log PHI access
      if (profileData.user?._id) {
        auditLogger.viewPHI('PROFILE', profileData.user._id);
      }
    } catch {
      logger.error('[AuthContext] Failed to refresh profile');
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
    extendSession: handleExtendSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SessionTimeoutModal
        visible={showTimeoutWarning}
        timeRemaining={timeRemaining}
        onExtend={handleExtendSession}
        onLogout={logout}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconText: {
    fontSize: 32,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalTimeText: {
    fontWeight: '700',
    color: '#DC2626',
  },
  modalSubMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  logoutButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  extendButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#1E4A8D',
    alignItems: 'center',
  },
  extendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});
