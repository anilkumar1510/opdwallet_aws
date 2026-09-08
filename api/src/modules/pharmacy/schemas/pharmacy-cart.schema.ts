import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum PharmacyCartStatus {
  CREATED = 'CREATED',
  ORDERED = 'ORDERED',
  CANCELLED = 'CANCELLED',
}

/**
 * A real sub-schema, not a bare class.
 *
 * Passing the class straight to `@Prop({ type: [PharmacyCartItem] })` left
 * Mongoose treating each item as Mixed, and Mixed does not track changes made
 * in place: `item.quantity = n; cart.save()` wrote nothing at all, while the
 * in-memory document still answered with the new number. On screen a reduced
 * line came back the moment another line was touched and the cart was re-read.
 *
 * `_id: false` keeps the stored shape exactly as it was.
 */
@Schema({ _id: false })
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

export const PharmacyCartItemSchema = SchemaFactory.createForClass(PharmacyCartItem);

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

  @Prop({ type: [PharmacyCartItemSchema], required: true, default: [] })
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
