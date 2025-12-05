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
  cugId: string; // Auto-generated: CUG001, CUG002, etc.

  @Prop({
    type: String,
    uppercase: true,
    sparse: true // Allow null/undefined, but unique when provided
  })
  shortCode?: string; // Optional short identifier (e.g., GOOGLE, TCS)

  @Prop({
    required: true
  })
  companyName: string; // Official company name

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
    default: 0
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
CugMasterSchema.index({ shortCode: 1 }, { unique: true, sparse: true });
CugMasterSchema.index({ isActive: 1, displayOrder: 1 });
CugMasterSchema.index({ companyName: 1 });