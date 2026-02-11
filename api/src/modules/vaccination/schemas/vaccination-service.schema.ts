import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'vaccination_services' })
export class VaccinationService extends Document {
  @Prop({ required: true, unique: true })
  serviceId: string;

  @Prop({ required: true, unique: true, uppercase: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, default: 'VACCINATION' })
  category: string; // Always 'VACCINATION'

  @Prop()
  description?: string;

  @Prop()
  vaccineType?: string; // e.g., mRNA, Inactivated, Live Attenuated

  @Prop()
  manufacturer?: string;

  @Prop()
  dosesRequired?: number;

  @Prop()
  doseIntervalDays?: number; // Days between doses

  @Prop()
  ageGroup?: string; // e.g., "0-5 years", "Adults", "All ages"

  @Prop()
  administrationRoute?: string; // e.g., Intramuscular, Subcutaneous, Oral

  @Prop()
  storageRequirements?: string;

  @Prop()
  contraindications?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  displayOrder: number;

  createdAt: Date;
  updatedAt: Date;
}

export const VaccinationServiceSchema = SchemaFactory.createForClass(VaccinationService);

// Indexes
VaccinationServiceSchema.index({ serviceId: 1 }, { unique: true });
VaccinationServiceSchema.index({ code: 1 }, { unique: true });
VaccinationServiceSchema.index({ isActive: 1 });
