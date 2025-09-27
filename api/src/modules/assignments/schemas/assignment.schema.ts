import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AssignmentDocument = Assignment & Document;

@Schema({
  timestamps: true,
  collection: 'userPolicyAssignments',
})
export class Assignment {
  @Prop({
    required: true,
    unique: true,
  })
  assignmentId: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Policy',
    required: true,
  })
  policyId: Types.ObjectId;

  @Prop({
    type: Date,
    required: true,
    default: Date.now,
  })
  effectiveFrom: Date;

  @Prop({
    type: Date,
  })
  effectiveTo?: Date;

  @Prop({
    type: Number,
  })
  planVersionOverride?: number;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive: boolean;

  @Prop({
    type: String,
  })
  relationshipId?: string;

  @Prop({
    type: String,
  })
  primaryMemberId?: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'PlanConfig',
  })
  planConfigId?: Types.ObjectId;

  @Prop()
  createdBy?: string;

  @Prop()
  updatedBy?: string;
}

export const AssignmentSchema = SchemaFactory.createForClass(Assignment);

// Indexes
AssignmentSchema.index({ userId: 1, isActive: 1 });
AssignmentSchema.index({ policyId: 1, isActive: 1 });
AssignmentSchema.index({ assignmentId: 1 }, { unique: true });