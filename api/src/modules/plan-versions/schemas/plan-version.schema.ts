import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum PlanVersionStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export type PlanVersionDocument = PlanVersion & Document;

@Schema({
  timestamps: true,
  collection: 'planVersions',
})
export class PlanVersion {
  @Prop({
    type: Types.ObjectId,
    ref: 'Policy',
    required: true,
  })
  policyId!: Types.ObjectId;

  @Prop({
    type: Number,
    required: true,
    min: 1,
  })
  planVersion!: number;

  @Prop({
    type: String,
    enum: PlanVersionStatus,
    required: true,
    default: PlanVersionStatus.DRAFT,
  })
  status!: PlanVersionStatus;

  @Prop({
    type: Date,
    required: true,
  })
  effectiveFrom!: Date;

  @Prop({
    type: Date,
  })
  effectiveTo?: Date;

  @Prop({
    type: Date,
  })
  publishedAt?: Date;

  @Prop()
  createdBy?: string;

  @Prop()
  updatedBy?: string;

  @Prop()
  publishedBy?: string;
}

export const PlanVersionSchema = SchemaFactory.createForClass(PlanVersion);

// Indexes
PlanVersionSchema.index({ policyId: 1, planVersion: 1 }, { unique: true });
PlanVersionSchema.index({ status: 1, effectiveFrom: 1 });

// Set publishedAt when status changes to PUBLISHED
PlanVersionSchema.pre('save', function(next) {
  if (this.status === PlanVersionStatus.PUBLISHED && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});