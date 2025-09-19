import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BenefitCoverageMatrixDocument = BenefitCoverageMatrix & Document;

@Schema({
  collection: 'benefit_coverage_matrix',
  timestamps: true,
})
export class BenefitCoverageMatrix {
  @Prop({
    required: true,
    index: true
  })
  planVersionId: string;

  @Prop({
    required: true,
    index: true
  })
  serviceCode: string;

  @Prop({
    type: Boolean,
    default: false
  })
  isEnabled: boolean;

  @Prop({
    type: Number
  })
  coveragePercentage?: number;

  @Prop({
    type: Number
  })
  maxCoverageAmount?: number;

  @Prop({
    type: String
  })
  notes?: string;

  @Prop({
    type: String
  })
  updatedBy?: string;
}

export const BenefitCoverageMatrixSchema = SchemaFactory.createForClass(BenefitCoverageMatrix);

// Create a compound unique index for planVersionId + serviceCode
BenefitCoverageMatrixSchema.index({ planVersionId: 1, serviceCode: 1 }, { unique: true });
BenefitCoverageMatrixSchema.index({ planVersionId: 1, isEnabled: 1 });