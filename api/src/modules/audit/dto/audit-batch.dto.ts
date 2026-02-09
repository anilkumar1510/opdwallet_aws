import { IsArray, IsString, IsOptional, IsBoolean, IsEnum, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * PHI access action types for HIPAA compliance
 */
export enum AuditAction {
  // Existing actions
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  AUTH_FAILURE = 'AUTH_FAILURE',

  // PHI-specific actions for member portal
  VIEW_PHI = 'VIEW_PHI',
  DOWNLOAD = 'DOWNLOAD',
  PRINT = 'PRINT',
  EXPORT = 'EXPORT',
  SHARE = 'SHARE',
  LOGIN_FAILED = 'LOGIN_FAILED',
  SESSION_TIMEOUT = 'SESSION_TIMEOUT',
  PROFILE_SWITCH = 'PROFILE_SWITCH',

  // Admin actions
  ASSIGNMENT_PLAN_VERSION_UPDATE = 'ASSIGNMENT_PLAN_VERSION_UPDATE',
  PLAN_VERSION_CREATE = 'PLAN_VERSION_CREATE',
  PLAN_VERSION_PUBLISH = 'PLAN_VERSION_PUBLISH',
  PLAN_VERSION_MAKE_CURRENT = 'PLAN_VERSION_MAKE_CURRENT',
  BENEFIT_COMPONENTS_UPSERT = 'BENEFIT_COMPONENTS_UPSERT',
  WALLET_RULES_UPSERT = 'WALLET_RULES_UPSERT',

  // Claims actions
  CLAIM_ASSIGNED = 'CLAIM_ASSIGNED',
  CLAIM_REASSIGNED = 'CLAIM_REASSIGNED',
  CLAIM_APPROVED = 'CLAIM_APPROVED',
  CLAIM_PARTIALLY_APPROVED = 'CLAIM_PARTIALLY_APPROVED',
  CLAIM_REJECTED = 'CLAIM_REJECTED',
  DOCUMENTS_REQUESTED = 'DOCUMENTS_REQUESTED',
  CLAIM_STATUS_UPDATED = 'CLAIM_STATUS_UPDATED',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  DOCUMENTS_RESUBMITTED = 'DOCUMENTS_RESUBMITTED',
}

/**
 * PHI resource types
 */
export enum AuditResourceType {
  PRESCRIPTION = 'PRESCRIPTION',
  CLAIM = 'CLAIM',
  HEALTH_RECORD = 'HEALTH_RECORD',
  LAB_REPORT = 'LAB_REPORT',
  MEDICAL_HISTORY = 'MEDICAL_HISTORY',
  PROFILE = 'PROFILE',
  WALLET = 'WALLET',
  POLICY = 'POLICY',
  DEPENDENT = 'DEPENDENT',
  DOCUMENT = 'DOCUMENT',
  SESSION = 'SESSION',
}

/**
 * Single audit event from frontend
 */
export class AuditEventDto {
  @IsDateString()
  timestamp: string;

  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  userEmail?: string;

  @IsEnum(AuditAction)
  action: AuditAction;

  @IsString()
  resourceType: string;

  @IsOptional()
  @IsString()
  resourceId?: string;

  @IsOptional()
  @IsString()
  patientId?: string;

  @IsBoolean()
  accessGranted: boolean;

  @IsOptional()
  @IsString()
  denialReason?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

/**
 * Batch of audit events from frontend
 */
export class AuditBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AuditEventDto)
  events: AuditEventDto[];

  @IsString()
  batchId: string;

  @IsDateString()
  sentAt: string;
}
