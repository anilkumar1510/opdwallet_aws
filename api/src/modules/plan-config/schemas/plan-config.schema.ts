import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

export type PlanConfigDocument = PlanConfig & Document;

@Schema({
  collection: 'plan_configs',
  timestamps: true,
})
export class PlanConfig {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Policy',
    required: true,
    index: true
  })
  policyId: mongoose.Types.ObjectId;

  @Prop({ required: true, default: 1 })
  version: number;

  @Prop({
    required: true,
    enum: ['DRAFT', 'PUBLISHED'],
    default: 'DRAFT'
  })
  status: string;

  @Prop({ type: Boolean, default: false })
  isCurrent: boolean;

  // Consolidated Benefits Configuration
  @Prop({ type: Object, default: {} })
  benefits: {
    'in-clinic-consultation'?: {
      enabled: boolean;
      claimEnabled: boolean;
      vasEnabled: boolean;
      annualLimit?: number;
      visitLimit?: number;
      notes?: string;
    };
    'online-consultation'?: {
      enabled: boolean;
      claimEnabled: boolean;
      vasEnabled: boolean;
      annualLimit?: number;
      visitLimit?: number;
      notes?: string;
    };
    pharmacy?: {
      enabled: boolean;
      claimEnabled: boolean;
      vasEnabled: boolean;
      annualLimit?: number;
      rxRequired?: boolean;
      notes?: string;
    };
    diagnostics?: {
      enabled: boolean;
      claimEnabled: boolean;
      vasEnabled: boolean;
      annualLimit?: number;
      rxRequired?: boolean;
      notes?: string;
    };
    labs?: {
      enabled: boolean;
      claimEnabled: boolean;
      vasEnabled: boolean;
      annualLimit?: number;
      rxRequired?: boolean;
      notes?: string;
    };
    dental?: {
      enabled: boolean;
      claimEnabled: boolean;
      vasEnabled: boolean;
      annualLimit?: number;
      notes?: string;
    };
    vision?: {
      enabled: boolean;
      claimEnabled: boolean;
      vasEnabled: boolean;
      annualLimit?: number;
      notes?: string;
    };
    wellness?: {
      enabled: boolean;
      claimEnabled: boolean;
      vasEnabled: boolean;
      annualLimit?: number;
      notes?: string;
    };
  };

  // Consolidated Wallet Configuration
  @Prop({ type: Object, default: {} })
  wallet: {
    totalAnnualAmount?: number;
    perClaimLimit?: number;
    copay?: { mode: 'PERCENT' | 'AMOUNT'; value: number };
    partialPaymentEnabled?: boolean;
    carryForward?: { enabled: boolean; percent?: number; months?: number };
    topUpAllowed?: boolean;
  };

  // Policy Description with Inclusions and Exclusions
  @Prop({ type: Object, default: {} })
  policyDescription: {
    inclusions?: Array<{
      headline: string;
      description: string;
    }>;
    exclusions?: Array<{
      headline: string;
      description: string;
    }>;
  };

  // Covered Relationships Configuration
  @Prop({ type: [String], default: ['SELF'] })
  coveredRelationships: string[];

  // Individual Member Configurations per Relationship
  @Prop({ type: Object, default: {} })
  memberConfigs: {
    [relationshipCode: string]: {
      benefits?: {
        'in-clinic-consultation'?: {
          enabled: boolean;
          claimEnabled: boolean;
          vasEnabled: boolean;
          annualLimit?: number;
          visitLimit?: number;
          notes?: string;
        };
        'online-consultation'?: {
          enabled: boolean;
          claimEnabled: boolean;
          vasEnabled: boolean;
          annualLimit?: number;
          visitLimit?: number;
          notes?: string;
        };
        pharmacy?: {
          enabled: boolean;
          claimEnabled: boolean;
          vasEnabled: boolean;
          annualLimit?: number;
          rxRequired?: boolean;
          notes?: string;
        };
        diagnostics?: {
          enabled: boolean;
          claimEnabled: boolean;
          vasEnabled: boolean;
          annualLimit?: number;
          rxRequired?: boolean;
          notes?: string;
        };
        labs?: {
          enabled: boolean;
          claimEnabled: boolean;
          vasEnabled: boolean;
          annualLimit?: number;
          rxRequired?: boolean;
          notes?: string;
        };
        dental?: {
          enabled: boolean;
          claimEnabled: boolean;
          vasEnabled: boolean;
          annualLimit?: number;
          notes?: string;
        };
        vision?: {
          enabled: boolean;
          claimEnabled: boolean;
          vasEnabled: boolean;
          annualLimit?: number;
          notes?: string;
        };
        wellness?: {
          enabled: boolean;
          claimEnabled: boolean;
          vasEnabled: boolean;
          annualLimit?: number;
          notes?: string;
        };
      };
      wallet?: {
        totalAnnualAmount?: number;
        perClaimLimit?: number;
        copay?: { mode: 'PERCENT' | 'AMOUNT'; value: number };
        partialPaymentEnabled?: boolean;
        carryForward?: { enabled: boolean; percent?: number; months?: number };
        topUpAllowed?: boolean;
        isFloater?: boolean; // Whether this wallet amount is shared across relationships
        floaterSharedWith?: string[]; // Array of relationship codes sharing this wallet
      };
      inheritFromPrimary?: boolean; // Whether to inherit benefits from SELF relationship
    };
  };

  @Prop() createdBy?: string;
  @Prop() updatedBy?: string;
  @Prop() publishedBy?: string;
  @Prop({ type: Date }) publishedAt?: Date;
}

export const PlanConfigSchema = SchemaFactory.createForClass(PlanConfig);

// Compound unique index
PlanConfigSchema.index({ policyId: 1, version: 1 }, { unique: true });