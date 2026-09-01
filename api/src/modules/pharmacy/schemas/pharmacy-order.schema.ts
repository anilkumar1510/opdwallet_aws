import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum PharmacyOrderStatus {
  /** Cart submitted, adjudication running. Nothing charged yet. */
  ON_HOLD = 'ON_HOLD',
  /** Adjudication done, adjustments (if any) are visible, awaiting payment. */
  ADJUDICATED = 'ADJUDICATED',
  /** Paid — "sent to the partner", who is not real; see confirm(). */
  CONFIRMED = 'CONFIRMED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PharmacyPaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PharmacyCancelledBy {
  MEMBER = 'MEMBER',
  SYSTEM = 'SYSTEM',
}

export class PharmacyOrderItem {
  @Prop({ required: true })
  medicineId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  requestedQuantity: number;

  @Prop({ required: true })
  price: number;

  /**
   * What adjudication decided. `retained: false` means dropped from the
   * order entirely — the sheet's "what was removed" — and carries the reason
   * rather than leaving the member to guess.
   */
  @Prop({ required: true, default: true })
  retained: boolean;

  @Prop()
  removedReason?: string;
}

export class PharmacyDeliveryAddress {
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

export type PharmacyOrderDocument = PharmacyOrder & Document;

@Schema({ timestamps: true, collection: 'pharmacy_orders' })
export class PharmacyOrder {
  @Prop({ required: true, unique: true })
  orderId: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'PharmacyCart' })
  cartId: Types.ObjectId;

  @Prop({ required: true })
  patientId: string;

  @Prop({ required: true })
  patientName: string;

  @Prop({ type: [PharmacyOrderItem], required: true })
  items: PharmacyOrderItem[];

  @Prop({ type: PharmacyDeliveryAddress, required: true })
  deliveryAddress: PharmacyDeliveryAddress;

  @Prop({ required: true, enum: PharmacyOrderStatus, default: PharmacyOrderStatus.ON_HOLD })
  status: PharmacyOrderStatus;

  // Payment breakdown — computed once adjudication has retained/removed items,
  // same shape as every other category's copay/wallet/excess split.
  @Prop({ default: 0 })
  billAmount: number;

  @Prop({ default: 0 })
  copayAmount: number;

  @Prop({ default: 0 })
  walletDebitAmount: number;

  @Prop({ default: 0 })
  excessAmount: number;

  @Prop({ default: 0 })
  totalMemberPayment: number;

  @Prop()
  paymentId?: string;

  @Prop({ type: Types.ObjectId, ref: 'TransactionSummary' })
  transactionId?: Types.ObjectId;

  @Prop({ required: true, enum: PharmacyPaymentStatus, default: PharmacyPaymentStatus.PENDING })
  paymentStatus: PharmacyPaymentStatus;

  @Prop()
  invoicePath?: string;

  @Prop({ default: false })
  invoiceGenerated: boolean;

  @Prop()
  adjudicatedAt?: Date;

  @Prop()
  confirmedAt?: Date;

  @Prop()
  deliveredAt?: Date;

  @Prop()
  cancelledAt?: Date;

  @Prop({ enum: PharmacyCancelledBy })
  cancelledBy?: PharmacyCancelledBy;

  @Prop()
  cancellationReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const PharmacyOrderSchema = SchemaFactory.createForClass(PharmacyOrder);

PharmacyOrderSchema.index({ orderId: 1 }, { unique: true });
PharmacyOrderSchema.index({ userId: 1, status: 1 });
PharmacyOrderSchema.index({ cartId: 1 });
