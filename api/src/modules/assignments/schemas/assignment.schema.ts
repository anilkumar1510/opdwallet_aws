import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AssignmentStatus } from '@/common/constants/status.enum';

export type AssignmentDocument = Assignment & Document;

@Schema({
  timestamps: true,
  collection: 'userPolicyAssignments',
})
export class Assignment {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Policy',
    required: true,
  })
  policyId!: Types.ObjectId;

  @Prop({
    required: true,
    enum: AssignmentStatus,
    default: AssignmentStatus.ACTIVE,
  })
  status!: AssignmentStatus;

  @Prop({
    type: Date,
    default: Date.now,
  })
  effectiveFrom!: Date;

  @Prop({ type: Date })
  effectiveTo?: Date;

  @Prop({ type: Date, default: Date.now })
  assignedAt!: Date;

  @Prop()
  assignedBy?: string;

  @Prop()
  notes?: string;

  @Prop({
    type: Number,
    required: false,
  })
  planVersion?: number;
}

export const AssignmentSchema = SchemaFactory.createForClass(Assignment);

AssignmentSchema.index({ userId: 1, status: 1 });
AssignmentSchema.index({ policyId: 1, status: 1 });
AssignmentSchema.index({ userId: 1, policyId: 1, effectiveFrom: 1 });