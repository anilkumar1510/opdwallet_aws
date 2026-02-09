import { Platform } from 'react-native';
import { secureStorage } from '../storage/secureStorage';
import { logger } from '../utils/productionLogger';
import type {
  AuditEvent,
  AuditAction,
  AuditResourceType,
  CreateAuditEventParams,
} from './types';

/**
 * Audit Logger
 *
 * Provides HIPAA-compliant audit logging for PHI access.
 * Events are queued locally and sent to the backend in batches.
 *
 * HIPAA Compliance: Implements audit controls per §164.312(b)
 */

const AUDIT_QUEUE_KEY = 'audit_queue';
const AUDIT_BATCH_SIZE = 10;
const AUDIT_FLUSH_INTERVAL = 30000; // 30 seconds
const MAX_QUEUE_SIZE = 100;

// API endpoint for audit logs (relative to API base URL)
const AUDIT_ENDPOINT = '/audit/log';

// Current user context (set by AuthContext)
let currentUserId: string | null = null;
let currentUserEmail: string | null = null;
let currentSessionId: string | null = null;

// Queue flush timer
let flushTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Generates a unique session ID
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Gets the client IP address (if available)
 */
function getClientInfo(): { ipAddress?: string; userAgent?: string } {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return {
      userAgent: navigator.userAgent,
      // IP will be captured server-side
    };
  }
  return {};
}

/**
 * Sets the current user context for audit logging
 * Should be called on login
 */
export function setAuditContext(userId: string, email?: string): void {
  currentUserId = userId;
  currentUserEmail = email;
  currentSessionId = generateSessionId();
  startFlushTimer();
}

/**
 * Clears the current user context
 * Should be called on logout
 */
export function clearAuditContext(): void {
  // Log logout event before clearing context
  if (currentUserId) {
    logAuditEvent({
      action: 'LOGOUT',
      resourceType: 'SESSION',
    });
  }

  // Flush remaining events
  flushAuditQueue();

  currentUserId = null;
  currentUserEmail = null;
  currentSessionId = null;
  stopFlushTimer();
}

/**
 * Starts the periodic flush timer
 */
function startFlushTimer(): void {
  if (flushTimer) return;
  flushTimer = setInterval(() => {
    flushAuditQueue();
  }, AUDIT_FLUSH_INTERVAL);
}

/**
 * Stops the periodic flush timer
 */
function stopFlushTimer(): void {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
}

/**
 * Gets the current audit queue from storage
 */
async function getAuditQueue(): Promise<AuditEvent[]> {
  try {
    const queueData = await secureStorage.getItem(AUDIT_QUEUE_KEY);
    if (queueData) {
      return JSON.parse(queueData);
    }
  } catch (error) {
    logger.error('[AuditLogger] Failed to get audit queue:', error);
  }
  return [];
}

/**
 * Saves the audit queue to storage
 */
async function saveAuditQueue(queue: AuditEvent[]): Promise<void> {
  try {
    // Limit queue size to prevent storage overflow
    const limitedQueue = queue.slice(-MAX_QUEUE_SIZE);
    await secureStorage.setItem(AUDIT_QUEUE_KEY, JSON.stringify(limitedQueue));
  } catch (error) {
    logger.error('[AuditLogger] Failed to save audit queue:', error);
  }
}

/**
 * Creates an audit event with full context
 */
function createAuditEvent(params: CreateAuditEventParams): AuditEvent {
  const clientInfo = getClientInfo();

  return {
    timestamp: new Date().toISOString(),
    userId: currentUserId || 'anonymous',
    userEmail: currentUserEmail,
    sessionId: currentSessionId || undefined,
    action: params.action,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    patientId: params.patientId,
    accessGranted: params.accessGranted ?? true,
    denialReason: params.denialReason,
    metadata: params.metadata,
    ...clientInfo,
  };
}

/**
 * Logs an audit event
 * Events are queued and sent to the backend in batches
 */
export async function logAuditEvent(params: CreateAuditEventParams): Promise<void> {
  const event = createAuditEvent(params);

  // Log to console in development
  if (__DEV__) {
    logger.debug('[AuditLogger] Event:', event);
  }

  try {
    const queue = await getAuditQueue();
    queue.push(event);
    await saveAuditQueue(queue);

    // Flush if queue is full
    if (queue.length >= AUDIT_BATCH_SIZE) {
      await flushAuditQueue();
    }
  } catch (error) {
    logger.error('[AuditLogger] Failed to log audit event:', error);
  }
}

/**
 * Flushes the audit queue to the backend
 */
export async function flushAuditQueue(): Promise<void> {
  try {
    const queue = await getAuditQueue();
    if (queue.length === 0) return;

    // Dynamic import to avoid circular dependency
    const { default: apiClient } = await import('../api/client');

    const batchId = `batch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    await apiClient.post(AUDIT_ENDPOINT, {
      events: queue,
      batchId,
      sentAt: new Date().toISOString(),
    });

    // Clear queue on successful send
    await secureStorage.removeItem(AUDIT_QUEUE_KEY);

    if (__DEV__) {
      logger.debug(`[AuditLogger] Flushed ${queue.length} events (batch: ${batchId})`);
    }
  } catch (error) {
    // Keep events in queue for retry
    logger.error('[AuditLogger] Failed to flush audit queue:', error);
  }
}

/**
 * Convenience methods for common audit actions
 */
export const auditLogger = {
  /**
   * Log PHI view access
   */
  viewPHI: (resourceType: AuditResourceType, resourceId?: string, patientId?: string) =>
    logAuditEvent({
      action: 'VIEW_PHI',
      resourceType,
      resourceId,
      patientId,
    }),

  /**
   * Log document download
   */
  download: (resourceType: AuditResourceType, resourceId: string, patientId?: string) =>
    logAuditEvent({
      action: 'DOWNLOAD',
      resourceType,
      resourceId,
      patientId,
    }),

  /**
   * Log profile switch (for dependent access)
   */
  profileSwitch: (fromUserId: string, toUserId: string) =>
    logAuditEvent({
      action: 'PROFILE_SWITCH',
      resourceType: 'PROFILE',
      resourceId: toUserId,
      patientId: toUserId,
      metadata: { fromUserId },
    }),

  /**
   * Log login attempt
   */
  login: (userId: string, success: boolean, email?: string) =>
    logAuditEvent({
      action: success ? 'LOGIN' : 'LOGIN_FAILED',
      resourceType: 'SESSION',
      resourceId: userId,
      accessGranted: success,
      metadata: { email: email ? '[redacted]' : undefined },
    }),

  /**
   * Log session timeout
   */
  sessionTimeout: () =>
    logAuditEvent({
      action: 'SESSION_TIMEOUT',
      resourceType: 'SESSION',
    }),

  /**
   * Log claim creation
   */
  createClaim: (claimId: string, patientId: string) =>
    logAuditEvent({
      action: 'CREATE',
      resourceType: 'CLAIM',
      resourceId: claimId,
      patientId,
    }),

  /**
   * Set user context
   */
  setContext: setAuditContext,

  /**
   * Clear user context
   */
  clearContext: clearAuditContext,

  /**
   * Manual flush
   */
  flush: flushAuditQueue,
};

export default auditLogger;
