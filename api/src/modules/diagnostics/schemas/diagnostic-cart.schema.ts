import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum CartStatus {
  CREATED = 'CREATED',
  REVIEWED = 'REVIEWED',
  ORDERED = 'ORDERED',
  CANCELLED = 'CANCELLED',
}

export class CartItem {
  @Prop({ required: true, type: Types.ObjectId, ref: 'DiagnosticService' })
  serviceId: Types.ObjectId;

  @Prop({ required: true })
  serviceName: string;

  @Prop({ required: true })
  serviceCode: string;

  @Prop({ required: true })
  category: string;

  @Prop()
  description?: string;
}

@Schema({ timestamps: true, collection: 'diagnostic_carts' })
export class DiagnosticCart extends Document {
  @Prop({ required: true, unique: true })
  cartId: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'DiagnosticPrescription' })
  prescriptionId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  patientId: string;

  @Prop({ required: true })
  patientName: string;

  @Prop({ required: true })
  pincode: string;

  // Display tracking
  @Prop()
  displayedToMemberAt?: Date;

  // Cart items
  @Prop({ type: [CartItem], required: true, default: [] })
  items: CartItem[];

  // Vendors selected by operations team
  @Prop({ type: [{ type: Types.ObjectId, ref: 'DiagnosticVendor' }], default: [] })
  selectedVendorIds: Types.ObjectId[];

  // Status
  @Prop({ required: true, enum: CartStatus, default: CartStatus.CREATED })
  status: CartStatus;

  @Prop({ required: true })
  createdBy: string;

  // Order reference (after placement)
  @Prop({ type: Types.ObjectId, ref: 'DiagnosticOrder' })
  orderId?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const DiagnosticCartSchema = SchemaFactory.createForClass(DiagnosticCart);

// Indexes
DiagnosticCartSchema.index({ cartId: 1 }, { unique: true });
DiagnosticCartSchema.index({ userId: 1, status: 1 });
DiagnosticCartSchema.index({ prescriptionId: 1 });
DiagnosticCartSchema.index({ pincode: 1 });
