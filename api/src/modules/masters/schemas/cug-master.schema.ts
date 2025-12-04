import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { EmployeeCount } from '@/common/constants/status.enum';

export type CugMasterDocument = CugMaster & Document;

@Schema({
  collection: 'cug_master',
  timestamps: true,
})
export class CugMaster {
  @Prop({
    required: true,
    unique: true,
    index: true,
    uppercase: true
  })
  cugId: string;

  @Prop({
    required: true,
    unique: true,
    uppercase: true
  })
  code: string;

  @Prop({
    required: true
  })
  name: string;

  @Prop({
    required: true
  })
  companyName: string;

  @Prop({
    required: true,
    enum: EmployeeCount,
    type: String,
  })
  employeeCount: EmployeeCount;

  @Prop({
    type: Boolean,
    default: true
  })
  isActive: boolean;

  @Prop({
    type: Number,
    required: true
  })
  displayOrder: number;

  @Prop({
    type: String
  })
  description?: string;

  @Prop({
    type: String
  })
  createdBy?: string;

  @Prop({
    type: String
  })
  updatedBy?: string;
}

export const CugMasterSchema = SchemaFactory.createForClass(CugMaster);

// Indexes
CugMasterSchema.index({ cugId: 1 }, { unique: true });
CugMasterSchema.index({ code: 1 }, { unique: true });
CugMasterSchema.index({ isActive: 1, displayOrder: 1 });
CugMasterSchema.index({ companyName: 1 });