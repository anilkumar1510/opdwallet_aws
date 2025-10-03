import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum LabServiceCategory {
  PATHOLOGY = 'PATHOLOGY',
  RADIOLOGY = 'RADIOLOGY',
  CARDIOLOGY = 'CARDIOLOGY',
  ENDOSCOPY = 'ENDOSCOPY',
  OTHER = 'OTHER',
}

@Schema({ timestamps: true, collection: 'lab_services' })
export class LabService extends Document {
  @Prop({ required: true, unique: true })
  serviceId: string;

  @Prop({ required: true, unique: true, uppercase: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: LabServiceCategory })
  category: LabServiceCategory;

  @Prop()
  description?: string;

  @Prop()
  sampleType?: string; // Blood, Urine, etc.

  @Prop()
  preparationInstructions?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  displayOrder: number;

  createdAt: Date;
  updatedAt: Date;
}

export const LabServiceSchema = SchemaFactory.createForClass(LabService);

// Indexes
LabServiceSchema.index({ serviceId: 1 }, { unique: true });
LabServiceSchema.index({ code: 1 }, { unique: true });
LabServiceSchema.index({ category: 1, isActive: 1 });
