import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionSummaryDocument = TransactionSummary & Document;

export enum TransactionServiceType {
  APPOINTMENT = 'APPOINTMENT',
  CLAIM = 'CLAIM',
  LAB_ORDER = 'LAB_ORDER',
  DIAGNOSTIC_ORDER = 'DIAGNOSTIC_ORDER',
  AHC_ORDER = 'AHC_ORDER',
  PHARMACY = 'PHARMACY',
  DENTAL = 'DENTAL',
  VISION = 'VISION',
}

export enum TransactionStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  WALLET_ONLY = 'WALLET_ONLY',
  COPAY = 'COPAY',
  OUT_OF_POCKET = 'OUT_OF_POCKET',
  PARTIAL = 'PARTIAL',
  FULL_PAYMENT = 'FULL_PAYMENT',
}

@Schema({ timestamps: true })
export class TransactionSummary {
  @Prop({ required: true, unique: true })
  transactionId: string; // TXN-20250116-0001

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  // What was purchased
  @Prop({
    type: String,
    enum: Object.values(TransactionServiceType),
    required: true,
    index: true,
  })
  serviceType: TransactionServiceType;

  @Prop({ type: Types.ObjectId, required: true })
  serviceId: Types.ObjectId; // Reference to appointment/claim/order

  @Prop({ required: true })
  serviceReferenceId: string; // APT-001, CLM-001

  @Prop({ required: true })
  serviceName: string; // "Dr. Sharma Consultation", "Lab Test - Blood Sugar"

  @Prop({ required: true })
  serviceDate: Date; // When the service is/was scheduled

  // Total amount breakdown
  @Prop({ required: true })
  totalAmount: number; // ₹1,000

  // Payment breakdown (the key feature!)
  @Prop({ default: 0 })
  walletAmount: number; // ₹800 (from wallet)

  @Prop({ default: 0 })
  selfPaidAmount: number; // ₹200 (copay or out-of-pocket)

  @Prop({ default: 0 })
  copayAmount: number; // ₹200 (if copay was configured)

  // Payment method for self-paid portion
  @Prop({
    type: String,
    enum: Object.values(PaymentMethod),
    required: true,
  })
  paymentMethod: PaymentMethod;

  @Prop({ type: Types.ObjectId, ref: 'Payment' })
  paymentId: Types.ObjectId; // Link to payment record if self-paid portion exists

  // Category for wallet debit
  @Prop()
  categoryCode: string; // CAT001

  @Prop()
  categoryName: string; // Consultation, Diagnostics, etc.

  // Status tracking
  @Prop({
    type: String,
    enum: Object.values(TransactionStatus),
    default: TransactionStatus.PENDING_PAYMENT,
    index: true,
  })
  status: TransactionStatus;

  // Timestamps
  @Prop()
  completedAt: Date;

  @Prop()
  refundedAt: Date;

  @Prop()
  cancelledAt: Date;

  // Additional metadata
  @Prop()
  description: string;

  @Prop()
  notes: string;

  // Wallet transaction references (if wallet was used)
  @Prop([{ type: Types.ObjectId, ref: 'WalletTransaction' }])
  walletTransactionIds: Types.ObjectId[];

  // Refund information
  @Prop()
  refundAmount: number;

  @Prop()
  refundReason: string;

  @Prop({ default: true })
  isActive: boolean;

  // Service transaction limit tracking
  @Prop()
  specificServiceId?: string; // ID of the specific service (specialty/lab test)

  @Prop()
  specificServiceName?: string; // Name of the specific service

  @Prop()
  serviceTransactionLimit?: number; // Configured limit that was applied

  @Prop({ default: false })
  wasServiceLimitApplied: boolean; // Whether limit was actually applied

  @Prop({ default: 0 })
  excessAmount: number; // Amount member pays beyond copay due to service limit
}

export const TransactionSummarySchema =
  SchemaFactory.createForClass(TransactionSummary);

// Indexes for better query performance
TransactionSummarySchema.index({ userId: 1, createdAt: -1 });
TransactionSummarySchema.index({ transactionId: 1 }, { unique: true });
TransactionSummarySchema.index({ serviceType: 1, serviceId: 1 });
TransactionSummarySchema.index({ status: 1 });
TransactionSummarySchema.index({ paymentMethod: 1 });
TransactionSummarySchema.index({ serviceDate: -1 });
