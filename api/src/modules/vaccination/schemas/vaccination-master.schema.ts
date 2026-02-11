import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'vaccination_master_parameters' })
export class VaccinationMasterParameter extends Document {
  @Prop({ required: true, unique: true })
  parameterId: string;

  @Prop({ required: true, unique: true, uppercase: true })
  code: string;

  @Prop({ required: true })
  standardName: string;

  @Prop({ required: true, default: 'VACCINATION' })
  category: string; // Always 'VACCINATION'

  @Prop()
  description?: string;

  @Prop({ type: [String], default: [] })
  synonyms: string[]; // Alternative names for the vaccine

  @Prop()
  vaccineType?: string; // e.g., mRNA, Inactivated, Live Attenuated

  @Prop()
  targetDisease?: string; // e.g., COVID-19, Influenza, Hepatitis B

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  displayOrder: number;

  createdAt: Date;
  updatedAt: Date;
}

export const VaccinationMasterParameterSchema = SchemaFactory.createForClass(VaccinationMasterParameter);

// Indexes
VaccinationMasterParameterSchema.index({ parameterId: 1 }, { unique: true });
VaccinationMasterParameterSchema.index({ code: 1 }, { unique: true });
VaccinationMasterParameterSchema.index({ isActive: 1 });
VaccinationMasterParameterSchema.index({ standardName: 'text', synonyms: 'text' }); // Text search
