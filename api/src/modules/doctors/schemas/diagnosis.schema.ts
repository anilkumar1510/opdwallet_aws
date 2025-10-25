import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DiagnosisDocument = Diagnosis & Document;

@Schema({ collection: 'diagnosis_database', timestamps: true })
export class Diagnosis {
  @Prop({ required: true, trim: true })
  diagnosisName: string;

  @Prop({ trim: true })
  icdCode?: string; // ICD-10 code

  @Prop({ required: true, enum: ['Infectious', 'Chronic', 'Respiratory', 'Cardiovascular', 'Gastrointestinal', 'Neurological', 'Musculoskeletal', 'Endocrine', 'Dermatological', 'Other'] })
  category: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: [String], default: [] })
  commonSymptoms?: string[];

  @Prop({ trim: true })
  searchText?: string; // Combined text for searching

  @Prop({ default: true })
  isActive: boolean;
}

export const DiagnosisSchema = SchemaFactory.createForClass(Diagnosis);

// Create text index for fast autocomplete search
DiagnosisSchema.index({ diagnosisName: 'text', searchText: 'text', icdCode: 'text' });
DiagnosisSchema.index({ category: 1 });
DiagnosisSchema.index({ isActive: 1 });
