import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

export interface AuditLogDto {
  userId: string;
  userEmail: string;
  userRole: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'AUTH_FAILURE' | 'ASSIGNMENT_PLAN_VERSION_UPDATE' | 'PLAN_VERSION_CREATE' | 'PLAN_VERSION_PUBLISH' | 'PLAN_VERSION_MAKE_CURRENT' | 'BENEFIT_COMPONENTS_UPSERT' | 'WALLET_RULES_UPSERT';
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
    this.isEnabled = this.configService.get<boolean>('audit.enabled', false);
  }

  async log(auditData: AuditLogDto): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    try {
      const auditLog = new this.auditLogModel({
        ...auditData,
        createdAt: new Date(),
      });

      await auditLog.save();

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