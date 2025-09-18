import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BenefitCoverageMatrixDocument = BenefitCoverageMatrix & Document;

export class CoverageRow {
  @Prop({ required: true })
  categoryId: string;

  @Prop()
  serviceCode?: string;

  @Prop({ required: true, default: false })
  enabled: boolean;

  @Prop()
  notes?: string;
}

@Schema({
  timestamps: true,
  collection: 'benefitCoverageMatrix',
})
export class BenefitCoverageMatrix {
  @Prop({ type: Types.ObjectId, ref: 'Policy', required: true })
  policyId: Types.ObjectId;

  @Prop({ required: true })
  planVersion: number;

  @Prop({ type: [CoverageRow], default: [] })
  rows: CoverageRow[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;
}

export const BenefitCoverageMatrixSchema = SchemaFactory.createForClass(BenefitCoverageMatrix);

// Create compound unique index
BenefitCoverageMatrixSchema.index({ policyId: 1, planVersion: 1 }, { unique: true });