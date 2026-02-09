import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

/**
 * Audit action types
 * Includes both backend actions and PHI-specific actions from member portal
 */
export type AuditActionType =
  // Core actions
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'AUTH_FAILURE'
  // PHI-specific actions (from member portal)
  | 'VIEW_PHI'
  | 'DOWNLOAD'
  | 'PRINT'
  | 'EXPORT'
  | 'SHARE'
  | 'LOGIN_FAILED'
  | 'SESSION_TIMEOUT'
  | 'PROFILE_SWITCH'
  // Admin actions
  | 'ASSIGNMENT_PLAN_VERSION_UPDATE'
  | 'PLAN_VERSION_CREATE'
  | 'PLAN_VERSION_PUBLISH'
  | 'PLAN_VERSION_MAKE_CURRENT'
  | 'BENEFIT_COMPONENTS_UPSERT'
  | 'WALLET_RULES_UPSERT'
  // Claims actions
  | 'CLAIM_ASSIGNED'
  | 'CLAIM_REASSIGNED'
  | 'CLAIM_APPROVED'
  | 'CLAIM_PARTIALLY_APPROVED'
  | 'CLAIM_REJECTED'
  | 'DOCUMENTS_REQUESTED'
  | 'CLAIM_STATUS_UPDATED'
  | 'PAYMENT_COMPLETED'
  | 'PAYMENT_FAILED'
  | 'DOCUMENTS_RESUBMITTED';

export interface AuditLogDto {
  userId: string;
  userEmail: string;
  userRole: string;
  action: AuditActionType;
  resource: string;
  resourceId?: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  metadata?: {
    ip?: string;
    userAgent?: string;
    method?: string;
    path?: string;
    statusCode?: number;
    duration?: number;
    sessionId?: string;
    patientId?: string;
    accessGranted?: boolean;
    denialReason?: string;
    frontendTimestamp?: string;
    [key: string]: any; // Allow additional fields
  };
  description?: string;
  isSystemAction?: boolean;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private readonly isEnabled: boolean;

  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
    private configService: ConfigService,
  ) {
    // Debug: Log raw environment variable
    const envValue = process.env.AUDIT_LOG_ENABLED;
    this.logger.log(`AUDIT_LOG_ENABLED env var: "${envValue}" (type: ${typeof envValue})`);

    // Handle both boolean and string values from config/env
    const auditEnabled = this.configService.get('audit.enabled');
    this.logger.log(`audit.enabled from config: ${auditEnabled} (type: ${typeof auditEnabled})`);

    // Enable if env var is 'true' or config is true
    this.isEnabled = envValue === 'true' || auditEnabled === true || auditEnabled === 'true';

    this.logger.log(`Audit logging initialized: enabled=${this.isEnabled}`);
  }

  async log(auditData: AuditLogDto): Promise<void> {
    if (!this.isEnabled) {
      this.logger.debug('Audit logging is disabled, skipping log');
      return;
    }

    try {
      const auditLog = new this.auditLogModel({
        ...auditData,
        createdAt: new Date(),
      });

      await auditLog.save();

      this.logger.debug(`Audit log saved: ${auditData.action} on ${auditData.resource}`);

      // Log critical actions
      if (['DELETE', 'AUTH_FAILURE'].includes(auditData.action)) {
        this.logger.warn(`Audit: ${auditData.action} on ${auditData.resource} by ${auditData.userEmail}`);
      }
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${error.message}`, error.stack);
      // Don't throw - audit logging should not break the application
    }
  }

  async getAuditLogs(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditLogDocument[]> {
    const query: any = {};

    if (filters.userId) query.userId = filters.userId;
    if (filters.action) query.action = filters.action;
    if (filters.resource) query.resource = filters.resource;

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

    return this.auditLogModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(filters.limit || 100)
      .exec();
  }

  async getUserActivity(userId: string, days: number = 30): Promise<AuditLogDocument[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.getAuditLogs({
      userId,
      startDate,
      limit: 500,
    });
  }

  async getFailedLoginAttempts(email: string, hours: number = 24): Promise<number> {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);

    const logs = await this.auditLogModel.countDocuments({
      userEmail: email,
      action: 'AUTH_FAILURE',
      createdAt: { $gte: startDate },
    });

    return logs;
  }
}