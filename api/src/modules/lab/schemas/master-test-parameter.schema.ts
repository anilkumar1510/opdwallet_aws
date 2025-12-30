import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum MasterTestCategory {
  PATHOLOGY = 'PATHOLOGY',
  RADIOLOGY = 'RADIOLOGY',
  CARDIOLOGY = 'CARDIOLOGY',
  ENDOSCOPY = 'ENDOSCOPY',
  HEMATOLOGY = 'HEMATOLOGY',
  BIOCHEMISTRY = 'BIOCHEMISTRY',
  MICROBIOLOGY = 'MICROBIOLOGY',
  IMMUNOLOGY = 'IMMUNOLOGY',
  OTHER = 'OTHER',
}

@Schema({ timestamps: true, collection: 'master_test_parameters' })
export class MasterTestParameter extends Document {
  @Prop({ required: true, unique: true })
  parameterId: string;

  @Prop({ required: true, unique: true, uppercase: true })
  code: string;

  @Prop({ required: true })
  standardName: string;

  @Prop({ required: true, enum: MasterTestCategory })
  category: MasterTestCategory;

  @Prop()
  description?: string;

  @Prop({ type: [String], default: [] })
  synonyms: string[]; // Alternative names for the test

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  displayOrder: number;

  createdAt: Date;
  updatedAt: Date;
}

export const MasterTestParameterSchema = SchemaFactory.createForClass(MasterTestParameter);

// Indexes
MasterTestParameterSchema.index({ parameterId: 1 }, { unique: true });
MasterTestParameterSchema.index({ code: 1 }, { unique: true });
MasterTestParameterSchema.index({ category: 1, isActive: 1 });
MasterTestParameterSchema.index({ standardName: 'text', synonyms: 'text' }); // Text search
