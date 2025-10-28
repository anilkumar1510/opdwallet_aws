import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PolicyStatus, OwnerPayerType } from '@/common/constants/status.enum';

export type PolicyDocument = Policy & Document;

@Schema({
  timestamps: true,
  collection: 'policies',
})
export class Policy {
  @Prop({
    required: true,
    unique: true,
    immutable: true,
  })
  policyNumber!: string;

  @Prop({
    required: true,
    minlength: 3,
    maxlength: 80,
    trim: true,
  })
  name!: string;

  @Prop()
  description?: string;

  @Prop({
    required: true,
    enum: OwnerPayerType,
  })
  ownerPayer!: OwnerPayerType;

  @Prop()
  sponsorName?: string;

  @Prop()
  corporateName?: string;

  @Prop({
    required: true,
    enum: PolicyStatus,
    default: PolicyStatus.DRAFT,
  })
  status!: PolicyStatus;

  @Prop({ type: Date, required: true })
  effectiveFrom!: Date;

  @Prop({ type: Date })
  effectiveTo?: Date;

  @Prop()
  createdBy?: string;

  @Prop()
  updatedBy?: string;
}

export const PolicySchema = SchemaFactory.createForClass(Policy);

PolicySchema.index({ policyNumber: 1 });
PolicySchema.index({ status: 1, effectiveFrom: 1 });