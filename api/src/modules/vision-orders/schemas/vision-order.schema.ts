import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum VisionPurchaseMode {
  ONLINE = 'ONLINE',
  IN_STORE = 'IN_STORE',
}

/**
 * Where an order can be in its life.
 *
 * There is no PAID, SHIPPED or FULFILLED here on purpose. Once the coupon is
 * issued the journey leaves this platform entirely — the `Vision Backend` tab
 * records that order status, approval, rejection and fulfilment are all
 * communicated outside the application, and that the member has no status
 * visibility. Modelling states we are never told about would invent a status
 * the member cannot trust.
 */
export enum VisionOrderStatus {
  /** Started, prescription not yet uploaded or not yet submitted. */
  DRAFT = 'DRAFT',
  /** Submitted; the coupon has been issued and the member can go and buy. */
  COUPON_ISSUED = 'COUPON_ISSUED',
  /**
   * The member says they have spent the coupon.
   *
   * Self-declared, because nothing reports redemption back — no partner
   * callback exists. It is not proof, but it is the only signal available, and
   * without it cancelling after spending releases money that is already gone.
   * A used order is terminal: the reservation becomes a real consumption.
   */
  /**
   * The partner has told us what was ordered, so the cart exists and the money
   * is settled: copay and anything over the plan limit fall to the member, the
   * wallet share is captured and the unspent remainder released.
   */
  REPORTED = 'REPORTED',
  USED = 'USED',
  CANCELLED = 'CANCELLED',
}

export class VisionPrescription {
  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  filePath: string;

  @Prop({ required: true })
  uploadedAt: Date;
}

@Schema({ timestamps: true, collection: 'vision_orders' })
export class VisionOrder extends Document {
  @Prop({ required: true, unique: true })
  orderId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  /** Who the spectacles are for. May be the member or a dependant. */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  patientId: Types.ObjectId;

  @Prop({ required: true })
  patientName: string;

  @Prop({ required: true })
  partnerId: string;

  @Prop({ required: true })
  partnerName: string;

  @Prop({ type: String, enum: VisionPurchaseMode, required: true })
  mode: VisionPurchaseMode;

  /** Mandatory before submit — flow 3 step 5. */
  @Prop({ type: VisionPrescription })
  prescription?: VisionPrescription;

  @Prop({ type: String, enum: VisionOrderStatus, default: VisionOrderStatus.DRAFT })
  status: VisionOrderStatus;

  /**
   * One coupon to one order identifier, per flow 3 step 7.
   *
   * Generated here rather than fetched from the partner: no partner
   * integration exists, and the tab says the code is entered in Lenskart's own
   * coupon field, which a real integration would have to mint. This is the
   * dummy-gateway equivalent — a working local implementation behind a seam a
   * partner API can replace.
   */
  @Prop({ unique: true, sparse: true })
  couponCode?: string;

  /**
   * The benefit the coupon carries, captured when it is issued.
   *
   * The tab says vision "reserves value against the coupon" instead of blocking
   * the wallet, and that payment above it is collected outside the platform.
   * Nothing is debited here and no wallet hold is taken — this is the recorded
   * entitlement, not a ledger movement.
   */
  @Prop({ type: Number, default: 0 })
  eligibleAmount: number;

  @Prop()
  couponIssuedAt?: Date;

  /**
   * What the order came to at the partner, as the member reports it.
   *
   * The partner tells us nothing about the basket, so this is the only figure
   * we will ever have. It decides two things: how much of the reservation is
   * actually consumed, and whether anything was owed on top.
   */
  @Prop({ type: Number })
  orderValue?: number;

  /** The 20% (or configured) share the member funds. Recorded at issue. */
  @Prop({ type: Number, default: 0 })
  copayAmount?: number;

  /** Everything the member pays: copay, over-limit and any shortfall. */
  @Prop({ type: Number, default: 0 })
  memberPays?: number;

  /** Order value above the coupon. Paid to the partner, never collected here. */
  @Prop({ type: Number, default: 0 })
  excessAmount?: number;

  /** The member says they settled the excess. A declaration, not a receipt. */
  @Prop({ default: false })
  excessPaid?: boolean;

  /** The partner's own order identifier, per Vision Backend row 13. */
  @Prop()
  partnerOrderId?: string;

  /** What the wallet actually funded once copay and the cap were applied. */
  @Prop({ type: Number, default: 0 })
  walletPaid?: number;

  /**
   * The payment opened for the member's share, when they owe one.
   *
   * Only the COPAY is collected here. The amount above the plan's per-service
   * cap is paid to the partner directly — the sheet is explicit that it never
   * appears in the member payment flow — so charging it through this gateway
   * would bill the member twice for the same glasses.
   */
  @Prop()
  paymentId?: string;

  @Prop({ type: Number, default: 0 })
  payableHere?: number;

  @Prop()
  reportedAt?: Date;

  @Prop()
  usedAt?: Date;

  @Prop()
  cancelledAt?: Date;

  @Prop()
  cancelReason?: string;
}

export const VisionOrderSchema = SchemaFactory.createForClass(VisionOrder);
