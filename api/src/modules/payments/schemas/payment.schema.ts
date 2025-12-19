import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

export enum PaymentType {
  COPAY = 'COPAY',
  OUT_OF_POCKET = 'OUT_OF_POCKET',
  FULL_PAYMENT = 'FULL_PAYMENT',
  PARTIAL_PAYMENT = 'PARTIAL_PAYMENT',
  TOP_UP = 'TOP_UP',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum ServiceType {
  APPOINTMENT = 'APPOINTMENT',
  CLAIM = 'CLAIM',
  LAB_ORDER = 'LAB_ORDER',
  PHARMACY = 'PHARMACY',
  DENTAL = 'DENTAL',
  WALLET_TOPUP = 'WALLET_TOPUP',
}

@Schema({ timestamps: true })
export class Payment {
  @Prop({ required: true, unique: true })
  paymentId: string; // PAY-20250116-0001

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({
    type: String,
    enum: Object.values(PaymentType),
    required: true,
  })
  paymentType: PaymentType;

  @Prop({
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING,
    index: true,
  })
  status: PaymentStatus;

  // Link to what this payment is for
  @Prop({ type: String, enum: Object.values(ServiceType) })
  serviceType: ServiceType;

  @Prop({ type: Types.ObjectId })
  serviceId: Types.ObjectId; // appointment._id or claim._id

  @Prop()
  serviceReferenceId: string; // APT-001 or CLM-001

  @Prop()
  description: string;

  // Payment gateway fields (dummy for now)
  @Prop({ default: 'DUMMY_GATEWAY' })
  paymentMethod: string; // 'DUMMY_GATEWAY', 'UPI', 'CARD', etc.

  @Prop()
  transactionId: string; // External transaction ID from gateway

  @Prop()
  paidAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  markedAsPaidBy: Types.ObjectId; // userId who clicked "Mark as Paid"

  @Prop({ default: true })
  isActive: boolean;

  // Metadata
  @Prop()
  notes: string;

  @Prop()
  failureReason: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Indexes for better query performance
PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ serviceType: 1, serviceId: 1 });
PaymentSchema.index({ paymentId: 1 }, { unique: true });
PaymentSchema.index({ status: 1, createdAt: -1 });
