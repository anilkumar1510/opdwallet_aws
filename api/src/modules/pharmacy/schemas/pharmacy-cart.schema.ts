import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum PharmacyCartStatus {
  CREATED = 'CREATED',
  ORDERED = 'ORDERED',
  CANCELLED = 'CANCELLED',
}

export class PharmacyCartItem {
  @Prop({ required: true })
  medicineId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true, default: 1 })
  quantity: number;

  @Prop({ required: true, default: false })
  requiresPrescription: boolean;
}

export type PharmacyCartDocument = PharmacyCart & Document;

@Schema({ timestamps: true, collection: 'pharmacy_carts' })
export class PharmacyCart {
  @Prop({ required: true, unique: true })
  cartId: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  patientId: string;

  @Prop({ required: true })
  patientName: string;

  /**
   * "Upload prescription, or Do not have a prescription and consult a
   * doctor" — null is the deliberate second path, not a missing upload.
   */
  @Prop()
  prescriptionFileName?: string;

  @Prop({ type: [PharmacyCartItem], required: true, default: [] })
  items: PharmacyCartItem[];

  @Prop({ required: true, enum: PharmacyCartStatus, default: PharmacyCartStatus.CREATED })
  status: PharmacyCartStatus;

  @Prop({ type: Types.ObjectId, ref: 'PharmacyOrder' })
  orderId?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const PharmacyCartSchema = SchemaFactory.createForClass(PharmacyCart);

PharmacyCartSchema.index({ cartId: 1 }, { unique: true });
PharmacyCartSchema.index({ userId: 1, status: 1 });
