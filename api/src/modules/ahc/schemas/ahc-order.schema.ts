import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AhcOrderDocument = AhcOrder & Document;

export enum AhcOrderStatus {
  PLACED = 'PLACED',
  CONFIRMED = 'CONFIRMED',
  LAB_COMPLETED = 'LAB_COMPLETED',
  DIAGNOSTIC_COMPLETED = 'DIAGNOSTIC_COMPLETED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum CollectionType {
  HOME_COLLECTION = 'HOME_COLLECTION',
  CENTER_VISIT = 'CENTER_VISIT',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum CancelledBy {
  MEMBER = 'MEMBER',
  OPERATIONS = 'OPERATIONS',
}

// Embedded classes for lab order items
@Schema({ _id: false })
export class LabOrderItem {
  @Prop({ required: true, type: Types.ObjectId, ref: 'LabService' })
  serviceId: Types.ObjectId;

  @Prop({ required: true })
  serviceName: string;

  @Prop({ required: true })
  serviceCode: string;

  @Prop({ required: true })
  actualPrice: number;

  @Prop({ required: true })
  discountedPrice: number;
}

// Embedded classes for diagnostic order items
@Schema({ _id: false })
export class DiagnosticOrderItem {
  @Prop({ required: true, type: Types.ObjectId, ref: 'DiagnosticService' })
  serviceId: Types.ObjectId;

  @Prop({ required: true })
  serviceName: string;

  @Prop({ required: true })
  serviceCode: string;

  @Prop()
  category?: string;

  @Prop({ required: true })
  actualPrice: number;

  @Prop({ required: true })
  discountedPrice: number;
}

@Schema({ _id: false })
export class CollectionAddress {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  addressLine1: string;

  @Prop()
  addressLine2?: string;

  @Prop({ required: true })
  pincode: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  state: string;
}

@Schema({ _id: false })
export class ReportInfo {
  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  filePath: string;

  @Prop({ required: true })
  uploadedAt: Date;

  @Prop({ required: true })
  uploadedBy: string;
}
export const ReportInfoSchema = SchemaFactory.createForClass(ReportInfo);

// Embedded schema for lab portion of AHC order
@Schema({ _id: false })
export class LabOrderDetails {
  @Prop({ required: false, type: Types.ObjectId, ref: 'LabVendor' })
  vendorId?: Types.ObjectId;

  @Prop({ required: false })
  vendorName?: string;

  @Prop({ type: [LabOrderItem], default: [] })
  items: LabOrderItem[];

  @Prop({ required: false, enum: CollectionType })
  collectionType?: CollectionType;

  @Prop({ type: CollectionAddress })
  collectionAddress?: CollectionAddress;

  @Prop({ required: false })
  collectionDate?: string; // YYYY-MM-DD

  @Prop({ required: false })
  collectionTime?: string; // "09:00 AM - 10:00 AM"

  @Prop({ required: false })
  slotId?: string; // Slot string ID like "SLOT-xxx"

  @Prop({ required: true, default: 0 })
  totalActualPrice: number;

  @Prop({ required: true, default: 0 })
  totalDiscountedPrice: number;

  @Prop({ required: true, default: 0 })
  homeCollectionCharges: number;

  @Prop({ type: [ReportInfoSchema], default: [] })
  reports: ReportInfo[];

  @Prop()
  completedAt?: Date;
}

// Embedded schema for diagnostic portion of AHC order
@Schema({ _id: false })
export class DiagnosticOrderDetails {
  @Prop({ required: false, type: Types.ObjectId, ref: 'DiagnosticVendor' })
  vendorId?: Types.ObjectId;

  @Prop({ required: false })
  vendorName?: string;

  @Prop({ type: [DiagnosticOrderItem], default: [] })
  items: DiagnosticOrderItem[];

  @Prop({ required: false, enum: CollectionType, default: CollectionType.CENTER_VISIT })
  collectionType?: CollectionType;

  @Prop({ required: false })
  appointmentDate?: string; // YYYY-MM-DD

  @Prop({ required: false })
  appointmentTime?: string; // "09:00 AM - 10:00 AM"

  @Prop({ required: false })
  slotId?: string; // Slot string ID like "DIAG-SLOT-xxx"

  @Prop({ required: true, default: 0 })
  totalActualPrice: number;

  @Prop({ required: true, default: 0 })
  totalDiscountedPrice: number;

  @Prop({ required: true, default: 0 })
  homeCollectionCharges: number;

  @Prop({ type: [ReportInfoSchema], default: [] })
  reports: ReportInfo[];

  @Prop()
  completedAt?: Date;
}

@Schema({ timestamps: true, collection: 'ahc_orders' })
export class AhcOrder extends Document {
  @Prop({ required: true, unique: true })
  orderId: string; // Format: AHC-ORD-{timestamp}-{random}

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'AhcPackage' })
  packageId: Types.ObjectId;

  @Prop({ required: true })
  packageName: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Policy' })
  policyId: Types.ObjectId;

  @Prop({ required: true })
  policyYear: number; // For once-per-year validation

  // Embedded lab order details
  @Prop({ type: LabOrderDetails, required: true })
  labOrder: LabOrderDetails;

  // Embedded diagnostic order details
  @Prop({ type: DiagnosticOrderDetails, required: true })
  diagnosticOrder: DiagnosticOrderDetails;

  @Prop({ required: true, enum: AhcOrderStatus, default: AhcOrderStatus.PLACED })
  status: AhcOrderStatus;

  // Payment breakdown (NO service transaction limits for AHC)
  @Prop({ required: true })
  totalActualPrice: number;

  @Prop({ required: true })
  totalDiscountedPrice: number;

  @Prop({ required: true, default: 0 })
  totalHomeCollectionCharges: number;

  @Prop({ required: true })
  finalAmount: number;

  @Prop({ required: true, default: 0 })
  copayAmount: number; // From global wallet.copay

  @Prop({ required: true, default: 0 })
  walletDeduction: number;

  @Prop({ required: true, default: 0 })
  finalPayable: number;

  @Prop({ required: true, enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Prop()
  paymentMode?: string;

  @Prop()
  paymentDate?: Date;

  @Prop({ type: Types.ObjectId, ref: 'TransactionSummary' })
  transactionId?: Types.ObjectId;

  // Timestamps
  @Prop({ required: true })
  placedAt: Date;

  @Prop()
  confirmedAt?: Date;

  @Prop()
  confirmedBy?: string;

  @Prop()
  completedAt?: Date;

  @Prop()
  cancelledAt?: Date;

  @Prop({ enum: CancelledBy })
  cancelledBy?: CancelledBy;

  @Prop()
  cancellationReason?: string;

  @Prop()
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const AhcOrderSchema = SchemaFactory.createForClass(AhcOrder);

// Indexes for optimal query performance
AhcOrderSchema.index({ orderId: 1 }, { unique: true });
AhcOrderSchema.index({ userId: 1, policyYear: 1 }); // For once-per-year validation
AhcOrderSchema.index({ userId: 1, status: 1 });
AhcOrderSchema.index({ status: 1, createdAt: -1 });
AhcOrderSchema.index({ packageId: 1 });
AhcOrderSchema.index({ policyId: 1 });
