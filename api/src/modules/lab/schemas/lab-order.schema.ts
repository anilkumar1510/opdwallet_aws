import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum OrderStatus {
  PLACED = 'PLACED',
  CONFIRMED = 'CONFIRMED',
  SAMPLE_COLLECTED = 'SAMPLE_COLLECTED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum CollectionType {
  HOME_COLLECTION = 'HOME_COLLECTION',
  IN_CLINIC = 'IN_CLINIC',
  CENTER_VISIT = 'CENTER_VISIT', // Backward compatibility
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum ServiceType {
  LAB = 'LAB',
  DIAGNOSTIC = 'DIAGNOSTIC',
}

export enum CancelledBy {
  MEMBER = 'MEMBER',
  OPERATIONS = 'OPERATIONS',
}

export class OrderItem {
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

export class PaymentInfo {
  @Prop({ required: true, enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Prop()
  transactionId?: string;

  @Prop()
  paymentMethod?: string;

  @Prop()
  paidAt?: Date;

  @Prop({ required: true })
  amount: number;
}

@Schema({ timestamps: true, collection: 'lab_orders' })
export class LabOrder extends Document {
  @Prop({ required: true, unique: true })
  orderId: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'LabCart' })
  cartId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'LabPrescription' })
  prescriptionId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'LabVendor' })
  vendorId: Types.ObjectId;

  @Prop({ required: true })
  vendorName: string;

  // Service type
  @Prop({ required: true, enum: ServiceType, default: ServiceType.LAB })
  serviceType: ServiceType;

  @Prop({ type: [OrderItem], required: true })
  items: OrderItem[];

  @Prop({ required: true, enum: OrderStatus, default: OrderStatus.PLACED })
  status: OrderStatus;

  @Prop({ required: true, enum: CollectionType })
  collectionType: CollectionType;

  @Prop({ type: CollectionAddress })
  collectionAddress?: CollectionAddress;

  @Prop()
  collectionDate?: string; // YYYY-MM-DD

  @Prop()
  collectionTime?: string; // "09:00 AM - 10:00 AM"

  @Prop({ type: Types.ObjectId, ref: 'LabVendorSlot' })
  slotId?: Types.ObjectId;

  @Prop({ required: true })
  totalActualPrice: number;

  @Prop({ required: true })
  totalDiscountedPrice: number;

  @Prop({ required: true })
  homeCollectionCharges: number;

  @Prop({ required: true })
  finalAmount: number;

  // Payment breakdown fields
  @Prop()
  copayAmount?: number;

  @Prop()
  serviceLimitDeduction?: number;

  @Prop()
  walletDeduction?: number;

  @Prop()
  finalPayable?: number;

  @Prop({ required: true, enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Prop()
  paymentMode?: string;

  @Prop()
  paymentDate?: Date;

  @Prop({ type: Types.ObjectId, ref: 'TransactionSummary' })
  transactionId?: Types.ObjectId;

  // Legacy fields for backward compatibility
  @Prop()
  subtotal?: number;

  @Prop()
  discount?: number;

  @Prop()
  totalAmount?: number;

  @Prop({ type: PaymentInfo })
  paymentInfo?: PaymentInfo;

  @Prop()
  reportUrl?: string;

  @Prop({ type: [{ fileName: String, originalName: String, filePath: String, uploadedAt: Date, uploadedBy: String }] })
  reports: Array<{
    fileName: string;
    originalName: string;
    filePath: string;
    uploadedAt: Date;
    uploadedBy: string;
  }>;

  @Prop()
  reportUploadedAt?: Date;

  @Prop()
  placedAt?: Date;

  @Prop()
  confirmedAt?: Date;

  @Prop()
  confirmedBy?: string;

  @Prop()
  collectedAt?: Date;

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

export type LabOrderDocument = LabOrder & Document;
export const LabOrderSchema = SchemaFactory.createForClass(LabOrder);

// Indexes
LabOrderSchema.index({ orderId: 1 }, { unique: true });
LabOrderSchema.index({ userId: 1, status: 1 });
LabOrderSchema.index({ vendorId: 1, status: 1 });
LabOrderSchema.index({ status: 1, createdAt: -1 });
LabOrderSchema.index({ prescriptionId: 1 });
LabOrderSchema.index({ cartId: 1 });
LabOrderSchema.index({ serviceType: 1, status: 1 });
