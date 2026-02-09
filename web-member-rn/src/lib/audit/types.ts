/**
 * Audit Logging Types
 *
 * Defines types for HIPAA-compliant audit logging of PHI access.
 * Per HIPAA §164.312(b): Implement hardware, software, and/or procedural
 * mechanisms that record and examine activity in information systems
 * that contain or use electronic PHI.
 */

/**
 * PHI access action types
 */
export type AuditAction =
  | 'VIEW_PHI'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'DOWNLOAD'
  | 'PRINT'
  | 'EXPORT'
  | 'SHARE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'SESSION_TIMEOUT'
  | 'PROFILE_SWITCH';

/**
 * PHI resource types that can be accessed
 */
export type AuditResourceType =
  | 'PRESCRIPTION'
  | 'CLAIM'
  | 'HEALTH_RECORD'
  | 'LAB_REPORT'
  | 'MEDICAL_HISTORY'
  | 'PROFILE'
  | 'WALLET'
  | 'POLICY'
  | 'DEPENDENT'
  | 'DOCUMENT'
  | 'SESSION';

/**
 * Audit event structure
 * Contains all required HIPAA audit information
 */
export interface AuditEvent {
  /**
   * ISO 8601 timestamp of the event
   */
  timestamp: string;

  /**
   * ID of the user performing the action
   */
  userId: string;

  /**
   * Email of the user (for identification)
   */
  userEmail?: string;

  /**
   * The action being performed
   */
  action: AuditAction;

  /**
   * Type of PHI resource being accessed
   */
  resourceType: AuditResourceType;

  /**
   * Unique identifier of the resource
   */
  resourceId?: string;

  /**
   * ID of the patient whose data is being accessed
   * (may differ from userId for dependent access)
   */
  patientId?: string;

  /**
   * Whether access was granted or denied
   */
  accessGranted: boolean;

  /**
   * Reason for denial if access was not granted
   */
  denialReason?: string;

  /**
   * Client IP address
   */
  ipAddress?: string;

  /**
   * User agent string
   */
  userAgent?: string;

  /**
   * Session ID for tracking
   */
  sessionId?: string;

  /**
   * Additional context-specific metadata
   * Should NOT contain PHI
   */
  metadata?: Record<string, unknown>;
}

/**
 * Audit event creation parameters
 * Simplified interface for creating audit events
 */
export interface CreateAuditEventParams {
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string;
  patientId?: string;
  accessGranted?: boolean;
  denialReason?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Audit log batch for efficient transmission
 */
export interface AuditBatch {
  events: AuditEvent[];
  batchId: string;
  sentAt: string;
}
