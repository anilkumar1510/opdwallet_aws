import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum DiagnosticServiceCategory {
  RADIOLOGY = 'RADIOLOGY',
  ENDOSCOPY = 'ENDOSCOPY',
  OTHER = 'OTHER',
}

@Schema({ timestamps: true, collection: 'diagnostic_services' })
export class DiagnosticService extends Document {
  @Prop({ required: true, unique: true })
  serviceId: string;

  @Prop({ required: true, unique: true, uppercase: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: DiagnosticServiceCategory })
  category: DiagnosticServiceCategory;

  @Prop()
  description?: string;

  @Prop()
  bodyPart?: string; // e.g., "Chest", "Abdomen", "Head"

  @Prop({ default: false })
  requiresContrast?: boolean; // For CT/MRI scans

  @Prop()
  preparationInstructions?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  displayOrder: number;

  createdAt: Date;
  updatedAt: Date;
}

export const DiagnosticServiceSchema = SchemaFactory.createForClass(DiagnosticService);

// Indexes
DiagnosticServiceSchema.index({ serviceId: 1 }, { unique: true });
DiagnosticServiceSchema.index({ code: 1 }, { unique: true });
DiagnosticServiceSchema.index({ category: 1, isActive: 1 });
