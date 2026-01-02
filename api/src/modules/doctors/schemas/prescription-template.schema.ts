import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { MedicineItemSchema, MedicineItem } from './digital-prescription.schema';
import { LabTestItemSchema, LabTestItem } from './digital-prescription.schema';

export type PrescriptionTemplateDocument = PrescriptionTemplate & Document;

@Schema({ timestamps: true, collection: 'prescription_templates' })
export class PrescriptionTemplate {
  @Prop({ required: true, unique: true })
  templateId: string;

  @Prop({ required: true })
  doctorId: string;

  @Prop({ required: true })
  templateName: string;

  @Prop()
  description?: string;

  @Prop()
  diagnosis?: string;

  @Prop({ type: [MedicineItemSchema], default: [] })
  medicines: MedicineItem[];

  @Prop({ type: [LabTestItemSchema], default: [] })
  labTests: LabTestItem[];

  @Prop()
  generalInstructions?: string;

  @Prop()
  dietaryAdvice?: string;

  @Prop()
  precautions?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  usageCount: number;

  @Prop()
  lastUsedAt?: Date;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const PrescriptionTemplateSchema = SchemaFactory.createForClass(PrescriptionTemplate);

// Indexes
PrescriptionTemplateSchema.index({ doctorId: 1, isActive: 1 });
PrescriptionTemplateSchema.index({ doctorId: 1, templateName: 1 });
PrescriptionTemplateSchema.index({ templateId: 1 }, { unique: true });
