import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'vaccination_vendor_pricing' })
export class VaccinationVendorPricing extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'VaccinationVendor' })
  vendorId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'VaccinationService' })
  serviceId: Types.ObjectId;

  @Prop({ required: true })
  actualPrice: number; // MRP

  @Prop({ required: true })
  discountedPrice: number; // Selling price

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const VaccinationVendorPricingSchema = SchemaFactory.createForClass(VaccinationVendorPricing);

// Indexes
VaccinationVendorPricingSchema.index({ vendorId: 1, serviceId: 1 }, { unique: true });
VaccinationVendorPricingSchema.index({ serviceId: 1, isActive: 1 });
