import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum NotificationType {
  // Claim notifications
  CLAIM_ASSIGNED = 'CLAIM_ASSIGNED',
  CLAIM_STATUS_CHANGED = 'CLAIM_STATUS_CHANGED',
  DOCUMENTS_REQUESTED = 'DOCUMENTS_REQUESTED',
  CLAIM_APPROVED = 'CLAIM_APPROVED',
  CLAIM_REJECTED = 'CLAIM_REJECTED',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
  CLAIM_UNDER_REVIEW = 'CLAIM_UNDER_REVIEW',
  // Cart notifications
  CART_CREATED = 'CART_CREATED',
  // Appointment notifications
  APPOINTMENT_CREATED = 'APPOINTMENT_CREATED',
  APPOINTMENT_CONFIRMED = 'APPOINTMENT_CONFIRMED',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  APPOINTMENT_RESCHEDULED = 'APPOINTMENT_RESCHEDULED',
  APPOINTMENT_COMPLETED = 'APPOINTMENT_COMPLETED',
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: NotificationType, required: true })
  type: NotificationType;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: Types.ObjectId, ref: 'MemberClaim' })
  claimId?: Types.ObjectId;

  @Prop()
  claimNumber?: string;

  @Prop({ type: String, enum: NotificationPriority, default: NotificationPriority.MEDIUM })
  priority: NotificationPriority;

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  readAt?: Date;

  @Prop({ type: Object })
  metadata?: {
    oldStatus?: string;
    newStatus?: string;
    actionBy?: string;
    amount?: number;
    documentsRequested?: string[];
    [key: string]: any;
  };

  @Prop()
  actionUrl?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Indexes for efficient queries
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ userId: 1, type: 1 });
