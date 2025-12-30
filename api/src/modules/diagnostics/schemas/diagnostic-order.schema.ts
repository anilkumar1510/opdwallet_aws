import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum OrderStatus {
  PLACED = 'PLACED',
  CONFIRMED = 'CONFIRMED',
  SCHEDULED = 'SCHEDULED',
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

export class OrderItem {
  @Prop({ required: true, type: Types.ObjectId, ref: 'DiagnosticService' })
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

@Schema({ timestamps: true, collection: 'diagnostic_orders' })
export class DiagnosticOrder extends Document {
  @Prop({ required: true, unique: true })
  orderId: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'DiagnosticCart' })
  cartId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'DiagnosticPrescription' })
  prescriptionId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'DiagnosticVendor' })
  vendorId: Types.ObjectId;

  @Prop({ required: true })
  vendorName: string;

  @Prop({ type: [OrderItem], required: true })
  items: OrderItem[];

  @Prop({ required: true, enum: OrderStatus, default: OrderStatus.PLACED })
  status: OrderStatus;

  @Prop({ required: true, enum: CollectionType })
  collectionType: CollectionType;

  @Prop({ type: CollectionAddress })
  collectionAddress?: CollectionAddress;

  @Prop()
  appointmentDate?: string; // YYYY-MM-DD

  @Prop()
  appointmentTime?: string; // "09:00 AM - 10:00 AM"

  @Prop({ type: Types.ObjectId, ref: 'DiagnosticVendorSlot' })
  slotId?: Types.ObjectId;

  @Prop({ required: true })
  totalActualPrice: number;

  @Prop({ required: true })
  totalDiscountedPrice: number;

  @Prop({ required: true })
  homeCollectionCharges: number;

  @Prop({ required: true })
  finalAmount: number;

  @Prop({ required: true, enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Prop()
  paymentMode?: string;

  @Prop()
  paymentDate?: Date;

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
  scheduledAt?: Date;

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

export type DiagnosticOrderDocument = DiagnosticOrder & Document;
export const DiagnosticOrderSchema = SchemaFactory.createForClass(DiagnosticOrder);

// Indexes
DiagnosticOrderSchema.index({ orderId: 1 }, { unique: true });
DiagnosticOrderSchema.index({ userId: 1, status: 1 });
DiagnosticOrderSchema.index({ vendorId: 1, status: 1 });
DiagnosticOrderSchema.index({ status: 1, createdAt: -1 });
DiagnosticOrderSchema.index({ prescriptionId: 1 });
DiagnosticOrderSchema.index({ cartId: 1 });
