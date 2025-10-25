import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SymptomDocument = Symptom & Document;

@Schema({ collection: 'symptom_database', timestamps: true })
export class Symptom {
  @Prop({ required: true, trim: true })
  symptomName: string;

  @Prop({ required: true, enum: ['General', 'Respiratory', 'Gastrointestinal', 'Neurological', 'Cardiovascular', 'Musculoskeletal', 'Dermatological', 'Psychological', 'Other'] })
  category: string;

  @Prop({ type: [String], enum: ['Mild', 'Moderate', 'Severe'], default: ['Mild', 'Moderate', 'Severe'] })
  severityLevels?: string[];

  @Prop({ type: [String], default: [] })
  relatedConditions?: string[];

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  searchText?: string; // Combined text for searching

  @Prop({ default: true })
  isActive: boolean;
}

export const SymptomSchema = SchemaFactory.createForClass(Symptom);

// Create text index for fast autocomplete search
SymptomSchema.index({ symptomName: 'text', searchText: 'text' });
SymptomSchema.index({ category: 1 });
SymptomSchema.index({ isActive: 1 });
