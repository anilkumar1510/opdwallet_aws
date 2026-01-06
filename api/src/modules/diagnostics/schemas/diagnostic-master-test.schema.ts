import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum DiagnosticMasterTestCategory {
  RADIOLOGY = 'RADIOLOGY',
  ENDOSCOPY = 'ENDOSCOPY',
  OTHER = 'OTHER',
}

@Schema({ timestamps: true, collection: 'diagnostic_master_tests' })
export class DiagnosticMasterTest extends Document {
  @Prop({ required: true, unique: true })
  parameterId: string;

  @Prop({ required: true, unique: true, uppercase: true })
  code: string;

  @Prop({ required: true })
  standardName: string;

  @Prop({ required: true, enum: DiagnosticMasterTestCategory })
  category: DiagnosticMasterTestCategory;

  @Prop()
  description?: string;

  @Prop({ type: [String], default: [] })
  synonyms: string[]; // Alternative names for the test from different vendors

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  displayOrder: number;

  createdAt: Date;
  updatedAt: Date;
}

export const DiagnosticMasterTestSchema = SchemaFactory.createForClass(DiagnosticMasterTest);

// Indexes
DiagnosticMasterTestSchema.index({ parameterId: 1 }, { unique: true });
DiagnosticMasterTestSchema.index({ code: 1 }, { unique: true });
DiagnosticMasterTestSchema.index({ category: 1, isActive: 1 });
DiagnosticMasterTestSchema.index({ standardName: 'text', synonyms: 'text' }); // Text search
