/**
 * Session Keep-Alive Utility
 * Prevents session timeout by periodically pinging the server
 */

let keepAliveInterval: NodeJS.Timeout | null = null;

export function startSessionKeepAlive(intervalMs: number = 5 * 60 * 1000) {
  // Default: ping every 5 minutes
  if (keepAliveInterval) {
    return; // Already running
  }

  console.log('[SessionKeepAlive] Starting session keep-alive');

  keepAliveInterval = setInterval(async () => {
    try {
      await fetch('/doctor/api/auth/doctor/profile', {
        method: 'GET',
        credentials: 'include',
      });
      console.log('[SessionKeepAlive] Session refreshed');
    } catch (error) {
      console.error('[SessionKeepAlive] Failed to refresh session:', error);
    }
  }, intervalMs);
}

export function stopSessionKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
    console.log('[SessionKeepAlive] Stopped session keep-alive');
  }
}
