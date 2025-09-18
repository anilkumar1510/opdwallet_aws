import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WalletRuleDocument = WalletRule & Document;

export enum CopayMode {
  PERCENT = 'PERCENT',
  AMOUNT = 'AMOUNT',
}

@Schema({ _id: false })
export class Copay {
  @Prop({ type: String, enum: CopayMode, required: true })
  mode: CopayMode;

  @Prop({ type: Number, required: true, min: 0 })
  value: number;
}

@Schema({ _id: false })
export class CarryForward {
  @Prop({ type: Boolean, required: true })
  enabled: boolean;

  @Prop({ type: Number, min: 0, max: 100 })
  percent?: number;

  @Prop({ type: Number, min: 1 })
  months?: number;
}

@Schema({
  timestamps: true,
  collection: 'walletRules',
})
export class WalletRule {
  @Prop({ type: Types.ObjectId, ref: 'Policy', required: true })
  policyId: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1 })
  planVersion: number;

  @Prop({ type: Number, required: true, min: 0 })
  totalAnnualAmount: number;

  @Prop({ type: Number, min: 0 })
  perClaimLimit?: number;

  @Prop({ type: Copay })
  copay?: Copay;

  @Prop({ type: Boolean, default: false })
  partialPaymentEnabled: boolean;

  @Prop({ type: CarryForward })
  carryForward?: CarryForward;

  @Prop({ type: Boolean, default: false })
  topUpAllowed?: boolean;

  @Prop({ type: String, maxlength: 500 })
  notes?: string;

  @Prop({ type: String })
  createdBy?: string;

  @Prop({ type: String })
  updatedBy?: string;
}

export const WalletRuleSchema = SchemaFactory.createForClass(WalletRule);

// Create compound unique index
WalletRuleSchema.index({ policyId: 1, planVersion: 1 }, { unique: true });