import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

export type UserWalletDocument = UserWallet & Document;

@Schema({
  collection: 'user_wallets',
  timestamps: true,
})
export class UserWallet {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  })
  userId: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserPolicyAssignment',
    required: true,
    index: true
  })
  policyAssignmentId: mongoose.Types.ObjectId;

  // Floater wallet reference - if set, this wallet shares balance with the master wallet
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserWallet',
    index: true
  })
  floaterMasterWalletId?: mongoose.Types.ObjectId;

  // Indicates if this is the master wallet in a floater group
  @Prop({ type: Boolean, default: false })
  isFloaterMaster?: boolean;

  // For floater wallets, track individual member consumption
  @Prop({
    type: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      consumed: { type: Number, default: 0 },
      categoryBreakdown: [{
        categoryCode: { type: String },
        consumed: { type: Number, default: 0 }
      }]
    }],
    default: []
  })
  memberConsumption?: Array<{
    userId: mongoose.Types.ObjectId;
    consumed: number;
    categoryBreakdown: Array<{
      categoryCode: string;
      consumed: number;
    }>;
  }>;

  // Total wallet balance
  @Prop({
    type: {
      allocated: { type: Number, required: true, default: 0 },
      current: { type: Number, required: true, default: 0 },
      consumed: { type: Number, required: true, default: 0 },
      lastUpdated: { type: Date, default: Date.now }
    },
    required: true
  })
  totalBalance: {
    allocated: number;
    current: number;
    consumed: number;
    lastUpdated: Date;
  };

  // Category-wise balances
  @Prop({
    type: [{
      categoryCode: { type: String, required: true },
      categoryName: { type: String, required: true },
      allocated: { type: Number, required: true, default: 0 },
      current: { type: Number, required: true, default: 0 },
      consumed: { type: Number, required: true, default: 0 },
      isUnlimited: { type: Boolean, default: false },
      lastTransaction: { type: Date, default: Date.now }
    }],
    default: []
  })
  categoryBalances: Array<{
    categoryCode: string;
    categoryName: string;
    allocated: number;
    current: number;
    consumed: number;
    isUnlimited: boolean;
    lastTransaction: Date;
  }>;

  // Policy year and validity
  @Prop({ required: true })
  policyYear: string;

  @Prop({ required: true })
  effectiveFrom: Date;

  @Prop({ required: true })
  effectiveTo: Date;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const UserWalletSchema = SchemaFactory.createForClass(UserWallet);

// Compound unique index to ensure one wallet per user per policy assignment
UserWalletSchema.index({ userId: 1, policyAssignmentId: 1 }, { unique: true });

// Performance optimization: Compound indexes for common query patterns
// This index optimizes queries for active user wallets
UserWalletSchema.index({ userId: 1, isActive: 1 });

// This index optimizes queries for finding wallets within validity periods
// Useful for determining which wallet is currently active for a user
UserWalletSchema.index({ userId: 1, effectiveFrom: 1, effectiveTo: 1, isActive: 1 });

// Index for finding dependent wallets of a floater master
// Optimizes queries to find all wallets linked to a master wallet
UserWalletSchema.index({ floaterMasterWalletId: 1, isActive: 1 });