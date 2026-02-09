import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { auditLogger } from '../lib/audit/auditLogger';

/**
 * Session Timeout Hook
 *
 * Implements automatic session timeout after period of inactivity.
 * Tracks user activity and triggers logout when timeout is reached.
 *
 * HIPAA Compliance: Implements automatic logoff per §164.312(a)(2)(iii)
 */

// Read timeout from environment variable (in minutes), default to 15 minutes
const ENV_TIMEOUT_MINUTES = process.env.EXPO_PUBLIC_SESSION_TIMEOUT_MINUTES;
const TIMEOUT_MINUTES = ENV_TIMEOUT_MINUTES ? parseInt(ENV_TIMEOUT_MINUTES, 10) : 15;

// Default timeout in milliseconds
const DEFAULT_TIMEOUT = TIMEOUT_MINUTES * 60 * 1000;

// Warning before timeout: 2 minutes (in milliseconds) or 1/3 of timeout if timeout < 6 minutes
const WARNING_BEFORE_TIMEOUT = TIMEOUT_MINUTES >= 6
  ? 2 * 60 * 1000
  : Math.floor(TIMEOUT_MINUTES * 60 * 1000 / 3);

// Log configuration on startup (dev only)
if (__DEV__) {
  console.log(`[SessionTimeout] Config: timeout=${TIMEOUT_MINUTES}min, warning=${WARNING_BEFORE_TIMEOUT / 1000}s before timeout`);
}

// Activity events to track on web
// Note: mousemove is excluded as it fires too frequently and would prevent timeout
const WEB_ACTIVITY_EVENTS = [
  'mousedown',
  'keydown',
  'touchstart',
  'click',
];

interface UseSessionTimeoutOptions {
  /**
   * Timeout duration in milliseconds
   * @default 300000 (5 minutes)
   */
  timeout?: number;

  /**
   * Callback when session times out
   */
  onTimeout: () => void;

  /**
   * Callback when warning should be shown
   * Returns time remaining in seconds
   */
  onWarning?: (secondsRemaining: number) => void;

  /**
   * Whether the session is active (user is authenticated)
   */
  isActive: boolean;
}

interface UseSessionTimeoutReturn {
  /**
   * Manually reset the activity timer
   */
  resetTimer: () => void;

  /**
   * Time remaining until timeout (in seconds)
   */
  timeRemaining: number;

  /**
   * Whether the warning is currently active
   */
  isWarningActive: boolean;

  /**
   * Extend the session (dismiss warning and reset timer)
   */
  extendSession: () => void;
}

export function useSessionTimeout({
  timeout = DEFAULT_TIMEOUT,
  onTimeout,
  onWarning,
  isActive,
}: UseSessionTimeoutOptions): UseSessionTimeoutReturn {
  const [timeRemaining, setTimeRemaining] = useState(Math.floor(timeout / 1000));
  const [isWarningActive, setIsWarningActive] = useState(false);

  // Use ref for synchronous access in event handlers (state updates are async)
  const isWarningActiveRef = useRef(false);
  const lastActivityRef = useRef<number>(Date.now());
  const lastLogRef = useRef<number>(0);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Clears all timers
   */
  const clearTimers = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    if (warningIdRef.current) {
      clearTimeout(warningIdRef.current);
      warningIdRef.current = null;
    }
    if (countdownIdRef.current) {
      clearInterval(countdownIdRef.current);
      countdownIdRef.current = null;
    }
  }, []);

  /**
   * Handles session timeout
   */
  const handleTimeout = useCallback(() => {
    if (__DEV__) {
      console.log('[SessionTimeout] Timeout triggered - logging out user');
    }
    clearTimers();
    isWarningActiveRef.current = false;
    setIsWarningActive(false);

    // Log the session timeout
    auditLogger.sessionTimeout();

    onTimeout();
  }, [clearTimers, onTimeout]);

  /**
   * Handles warning period
   */
  const handleWarning = useCallback(() => {
    // Set ref immediately (synchronous) to prevent race conditions
    isWarningActiveRef.current = true;
    setIsWarningActive(true);

    if (__DEV__) {
      console.log('[SessionTimeout] Warning triggered - showing modal for', WARNING_BEFORE_TIMEOUT / 1000, 'seconds');
    }

    // Clear any existing countdown
    if (countdownIdRef.current) {
      clearInterval(countdownIdRef.current);
    }

    // Start countdown
    let remaining = Math.floor(WARNING_BEFORE_TIMEOUT / 1000);
    setTimeRemaining(remaining);

    if (onWarning) {
      onWarning(remaining);
    }

    countdownIdRef.current = setInterval(() => {
      remaining -= 1;
      setTimeRemaining(remaining);

      if (__DEV__ && remaining % 30 === 0) {
        console.log('[SessionTimeout] Countdown:', remaining, 'seconds remaining');
      }

      if (remaining <= 0) {
        handleTimeout();
      }
    }, 1000);
  }, [handleTimeout, onWarning]);

  /**
   * Resets the activity timer
   */
  const resetTimer = useCallback(() => {
    // Don't reset if warning is active (user must explicitly extend session)
    if (isWarningActiveRef.current) {
      if (__DEV__) {
        console.log('[SessionTimeout] Timer reset blocked - warning is active');
      }
      return;
    }

    lastActivityRef.current = Date.now();
    clearTimers();
    isWarningActiveRef.current = false;
    setIsWarningActive(false);
    setTimeRemaining(Math.floor(timeout / 1000));

    if (!isActive) return;

    // Set warning timer
    const warningTime = timeout - WARNING_BEFORE_TIMEOUT;
    warningIdRef.current = setTimeout(handleWarning, warningTime);

    // Set timeout timer (backup - countdown should trigger timeout)
    timeoutIdRef.current = setTimeout(handleTimeout, timeout);

    if (__DEV__) {
      console.log(`[SessionTimeout] Timer started. Warning in ${warningTime / 1000}s, timeout in ${timeout / 1000}s`);
    }
  }, [clearTimers, handleTimeout, handleWarning, isActive, timeout]);

  /**
   * Extends the session (user clicked "Stay logged in")
   */
  const extendSession = useCallback(() => {
    if (__DEV__) {
      console.log('[SessionTimeout] Session extended by user');
    }
    clearTimers();
    isWarningActiveRef.current = false;
    setIsWarningActive(false);

    // Now reset timer (ref is cleared so it won't be blocked)
    lastActivityRef.current = Date.now();
    setTimeRemaining(Math.floor(timeout / 1000));

    if (!isActive) return;

    const warningTime = timeout - WARNING_BEFORE_TIMEOUT;
    warningIdRef.current = setTimeout(handleWarning, warningTime);
    timeoutIdRef.current = setTimeout(handleTimeout, timeout);
  }, [clearTimers, handleTimeout, handleWarning, isActive, timeout]);

  /**
   * Handles app state changes (for mobile)
   */
  const handleAppStateChange = useCallback(
    (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App came to foreground - check if session expired
        const timeSinceActivity = Date.now() - lastActivityRef.current;
        if (timeSinceActivity >= timeout) {
          handleTimeout();
        } else if (timeSinceActivity >= timeout - WARNING_BEFORE_TIMEOUT) {
          handleWarning();
        }
      }
    },
    [handleTimeout, handleWarning, timeout]
  );

  /**
   * Web activity event handler
   */
  const handleActivity = useCallback(() => {
    // Check ref (synchronous) instead of state (async) to avoid race conditions
    if (isWarningActiveRef.current) {
      if (__DEV__) {
        console.log('[SessionTimeout] Activity ignored - warning modal is active');
      }
      return;
    }

    // Throttle debug logging to once per 30 seconds
    if (__DEV__) {
      const now = Date.now();
      if (now - lastLogRef.current > 30000) {
        console.log('[SessionTimeout] Activity detected - resetting timer');
        lastLogRef.current = now;
      }
    }
    resetTimer();
  }, [resetTimer]);

  // Set up activity listeners
  useEffect(() => {
    if (!isActive) {
      clearTimers();
      isWarningActiveRef.current = false;
      return;
    }

    // Initialize timer
    resetTimer();

    // Set up platform-specific listeners
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Web: Listen for user activity events
      WEB_ACTIVITY_EVENTS.forEach((event) => {
        window.addEventListener(event, handleActivity, { passive: true });
      });

      // Also track visibility changes
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && !isWarningActiveRef.current) {
          const timeSinceActivity = Date.now() - lastActivityRef.current;
          if (timeSinceActivity >= timeout) {
            handleTimeout();
          } else if (timeSinceActivity >= timeout - WARNING_BEFORE_TIMEOUT) {
            handleWarning();
          }
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        WEB_ACTIVITY_EVENTS.forEach((event) => {
          window.removeEventListener(event, handleActivity);
        });
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        clearTimers();
      };
    } else {
      // Native: Listen for app state changes
      const subscription = AppState.addEventListener('change', handleAppStateChange);

      return () => {
        subscription.remove();
        clearTimers();
      };
    }
  }, [
    isActive,
    resetTimer,
    handleActivity,
    handleAppStateChange,
    handleTimeout,
    handleWarning,
    timeout,
    clearTimers,
  ]);

  return {
    resetTimer,
    timeRemaining,
    isWarningActive,
    extendSession,
  };
}

export default useSessionTimeout;
