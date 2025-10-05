import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'auditLogs',
})
export class AuditLog {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  userEmail: string;

  @Prop({ required: true })
  userRole: string;

  @Prop({ required: true, enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'AUTH_FAILURE', 'ASSIGNMENT_PLAN_VERSION_UPDATE', 'PLAN_VERSION_CREATE', 'PLAN_VERSION_PUBLISH', 'PLAN_VERSION_MAKE_CURRENT', 'BENEFIT_COMPONENTS_UPSERT', 'WALLET_RULES_UPSERT', 'CLAIM_ASSIGNED', 'CLAIM_REASSIGNED', 'CLAIM_APPROVED', 'CLAIM_PARTIALLY_APPROVED', 'CLAIM_REJECTED', 'DOCUMENTS_REQUESTED', 'CLAIM_STATUS_UPDATED', 'PAYMENT_COMPLETED', 'PAYMENT_FAILED', 'DOCUMENTS_RESUBMITTED'] })
  action: string;

  @Prop({ required: true })
  resource: string;

  @Prop({ type: Types.ObjectId })
  resourceId?: Types.ObjectId;

  @Prop({ type: Object })
  before?: Record<string, any>;

  @Prop({ type: Object })
  after?: Record<string, any>;

  @Prop({ type: Object })
  metadata?: {
    ip?: string;
    userAgent?: string;
    method?: string;
    path?: string;
    statusCode?: number;
    duration?: number;
  };

  @Prop()
  description?: string;

  @Prop({ default: false })
  isSystemAction: boolean;

  @Prop({
    required: true,
    index: true,
    expires: 63072000 // TTL: 2 years in seconds
  })
  createdAt: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Performance indexes for common query patterns
AuditLogSchema.index({ userId: 1, createdAt: -1 }); // User activity queries
AuditLogSchema.index({ userRole: 1, action: 1, createdAt: -1 }); // Role-based audit queries
AuditLogSchema.index({ resource: 1, resourceId: 1, createdAt: -1 }); // Resource-specific audit trail
AuditLogSchema.index({ action: 1, createdAt: -1 }); // Action-based queries
AuditLogSchema.index({ 'metadata.statusCode': 1, createdAt: -1 }); // Error monitoring