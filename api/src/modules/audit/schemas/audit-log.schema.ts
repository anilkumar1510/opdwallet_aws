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

  @Prop({ required: true, enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'AUTH_FAILURE'] })
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