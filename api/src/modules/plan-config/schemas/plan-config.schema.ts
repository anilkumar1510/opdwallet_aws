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
  // Keys are category IDs (CAT001, CAT002, etc.)
  @Prop({ type: Object, default: {} })
  benefits: {
    CAT001?: { // In-Clinic Consultation
      enabled: boolean;
      claimEnabled: boolean;
      vasEnabled: boolean;
      annualLimit?: number;
      visitLimit?: number;
      notes?: string;
    };
    CAT005?: { // Online Consultation
      enabled: boolean;
      claimEnabled: boolean;
      vasEnabled: boolean;
      annualLimit?: number;
      visitLimit?: number;
      notes?: string;
    };
    CAT002?: { // Pharmacy
      enabled: boolean;
      claimEnabled: boolean;
      vasEnabled: boolean;
      annualLimit?: number;
      rxRequired?: boolean;
      notes?: string;
    };
    CAT003?: { // Diagnostics
      enabled: boolean;
      claimEnabled: boolean;
      vasEnabled: boolean;
      annualLimit?: number;
      rxRequired?: boolean;
      notes?: string;
    };
    CAT004?: { // Labs
      enabled: boolean;
      claimEnabled: boolean;
      vasEnabled: boolean;
      annualLimit?: number;
      rxRequired?: boolean;
      notes?: string;
    };
    dental?: { // Future: Will be CAT006
      enabled: boolean;
      claimEnabled: boolean;
      vasEnabled: boolean;
      annualLimit?: number;
      notes?: string;
    };
    vision?: { // Future: Will be CAT007
      enabled: boolean;
      claimEnabled: boolean;
      vasEnabled: boolean;
      annualLimit?: number;
      notes?: string;
    };
    wellness?: { // Future: Will be CAT008
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
    allocationType?: 'INDIVIDUAL' | 'FLOATER'; // Wallet allocation type - INDIVIDUAL (default) or FLOATER (shared)
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
        CAT001?: { // In-Clinic Consultation
          enabled: boolean;
          claimEnabled: boolean;
          vasEnabled: boolean;
          annualLimit?: number;
          visitLimit?: number;
          notes?: string;
        };
        CAT005?: { // Online Consultation
          enabled: boolean;
          claimEnabled: boolean;
          vasEnabled: boolean;
          annualLimit?: number;
          visitLimit?: number;
          notes?: string;
        };
        CAT002?: { // Pharmacy
          enabled: boolean;
          claimEnabled: boolean;
          vasEnabled: boolean;
          annualLimit?: number;
          rxRequired?: boolean;
          notes?: string;
        };
        CAT003?: { // Diagnostics
          enabled: boolean;
          claimEnabled: boolean;
          vasEnabled: boolean;
          annualLimit?: number;
          rxRequired?: boolean;
          notes?: string;
        };
        CAT004?: { // Labs
          enabled: boolean;
          claimEnabled: boolean;
          vasEnabled: boolean;
          annualLimit?: number;
          rxRequired?: boolean;
          notes?: string;
        };
        dental?: { // Future: Will be CAT006
          enabled: boolean;
          claimEnabled: boolean;
          vasEnabled: boolean;
          annualLimit?: number;
          notes?: string;
        };
        vision?: { // Future: Will be CAT007
          enabled: boolean;
          claimEnabled: boolean;
          vasEnabled: boolean;
          annualLimit?: number;
          notes?: string;
        };
        wellness?: { // Future: Will be CAT008
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