import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ClinicServicePricingDocument = ClinicServicePricing & Document;

@Schema({
  collection: 'clinic_service_pricing',
  timestamps: true,
})
export class ClinicServicePricing {
  @Prop({ required: true, index: true })
  clinicId: string;

  @Prop({ required: true, uppercase: true, index: true })
  serviceCode: string;

  @Prop({ required: true, uppercase: true, index: true })
  category: string; // e.g., 'CAT006' for Dental

  @Prop({ type: Boolean, default: true, index: true })
  isEnabled: boolean;

  @Prop({ type: Number, min: 0 })
  price?: number;

  @Prop({ type: String, default: 'INR' })
  currency: string;

  @Prop({ type: Date })
  effectiveFrom?: Date;

  @Prop({ type: Date })
  effectiveTo?: Date;

  @Prop()
  createdBy?: string;

  @Prop()
  updatedBy?: string;
}

export const ClinicServicePricingSchema = SchemaFactory.createForClass(
  ClinicServicePricing,
);

// Compound unique index to prevent duplicate mappings
ClinicServicePricingSchema.index(
  { clinicId: 1, serviceCode: 1 },
  { unique: true },
);
