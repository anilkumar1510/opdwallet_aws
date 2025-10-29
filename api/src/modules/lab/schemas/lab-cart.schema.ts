import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum CartStatus {
  CREATED = 'CREATED',
  REVIEWED = 'REVIEWED',
  ORDERED = 'ORDERED',
  CANCELLED = 'CANCELLED',
}

export class CartItem {
  @Prop({ required: true, type: Types.ObjectId, ref: 'LabService' })
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

@Schema({ timestamps: true, collection: 'lab_carts' })
export class LabCart extends Document {
  @Prop({ required: true, unique: true })
  cartId: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'LabPrescription' })
  prescriptionId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  patientId: string;

  @Prop({ required: true })
  patientName: string;

  @Prop({ required: true })
  pincode: string;

  // Cart items
  @Prop({ type: [CartItem], required: true, default: [] })
  items: CartItem[];

  // Vendors selected by operations team
  @Prop({ type: [{ type: Types.ObjectId, ref: 'LabVendor' }], default: [] })
  selectedVendorIds: Types.ObjectId[];

  // Status
  @Prop({ required: true, enum: CartStatus, default: CartStatus.CREATED })
  status: CartStatus;

  @Prop({ required: true })
  createdBy: string;

  // Order reference (after placement)
  @Prop({ type: Types.ObjectId, ref: 'LabOrder' })
  orderId?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const LabCartSchema = SchemaFactory.createForClass(LabCart);

// Indexes
LabCartSchema.index({ cartId: 1 }, { unique: true });
LabCartSchema.index({ userId: 1, status: 1 });
LabCartSchema.index({ prescriptionId: 1 });
LabCartSchema.index({ pincode: 1 });
