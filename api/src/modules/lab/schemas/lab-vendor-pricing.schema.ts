import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'lab_vendor_pricing' })
export class LabVendorPricing extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'LabVendor' })
  vendorId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'LabService' })
  serviceId: Types.ObjectId;

  @Prop({ required: true })
  actualPrice: number; // MRP

  @Prop({ required: true })
  discountedPrice: number; // Selling price

  @Prop({ default: 0 })
  homeCollectionCharges?: number;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const LabVendorPricingSchema = SchemaFactory.createForClass(LabVendorPricing);

// Indexes
LabVendorPricingSchema.index({ vendorId: 1, serviceId: 1 }, { unique: true });
LabVendorPricingSchema.index({ serviceId: 1, isActive: 1 });
