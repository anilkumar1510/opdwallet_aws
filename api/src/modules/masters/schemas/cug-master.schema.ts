import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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
}

export const CugMasterSchema = SchemaFactory.createForClass(CugMaster);

// Indexes
CugMasterSchema.index({ cugId: 1 }, { unique: true });
CugMasterSchema.index({ code: 1 }, { unique: true });
CugMasterSchema.index({ isActive: 1, displayOrder: 1 });