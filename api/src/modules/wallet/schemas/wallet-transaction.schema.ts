import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

export type WalletTransactionDocument = WalletTransaction & Document;

@Schema({
  collection: 'wallet_transactions',
  timestamps: true,
})
export class WalletTransaction {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  })
  userId: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserWallet',
    required: true,
    index: true
  })
  userWalletId: mongoose.Types.ObjectId;

  // Transaction details
  @Prop({ required: true, unique: true })
  transactionId: string;

  @Prop({
    required: true,
    enum: ['DEBIT', 'CREDIT', 'REFUND', 'ADJUSTMENT', 'INITIALIZATION']
  })
  type: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop()
  categoryCode?: string;

  // Balance tracking before and after transaction
  @Prop({
    type: {
      total: { type: Number, required: true },
      category: { type: Number }
    },
    required: true
  })
  previousBalance: {
    total: number;
    category?: number;
  };

  @Prop({
    type: {
      total: { type: Number, required: true },
      category: { type: Number }
    },
    required: true
  })
  newBalance: {
    total: number;
    category?: number;
  };

  // Reference data
  @Prop()
  serviceType?: string;

  @Prop()
  serviceProvider?: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId
  })
  bookingId?: mongoose.Types.ObjectId;

  @Prop()
  notes?: string;

  // Processing metadata
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  })
  processedBy?: mongoose.Types.ObjectId;

  @Prop({ default: Date.now })
  processedAt: Date;

  @Prop({ type: Boolean, default: false })
  isReversed: boolean;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WalletTransaction'
  })
  reversalTransactionId?: mongoose.Types.ObjectId;
}

export const WalletTransactionSchema = SchemaFactory.createForClass(WalletTransaction);

// Indexes for performance
WalletTransactionSchema.index({ userId: 1, createdAt: -1 });
WalletTransactionSchema.index({ userWalletId: 1, createdAt: -1 });
WalletTransactionSchema.index({ transactionId: 1 }, { unique: true });
WalletTransactionSchema.index({ type: 1, createdAt: -1 });
WalletTransactionSchema.index({ bookingId: 1 });