import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'diagnostic_vendor_pricing' })
export class DiagnosticVendorPricing extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'DiagnosticVendor' })
  vendorId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'DiagnosticService' })
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

export const DiagnosticVendorPricingSchema = SchemaFactory.createForClass(DiagnosticVendorPricing);

// Indexes
DiagnosticVendorPricingSchema.index({ vendorId: 1, serviceId: 1 }, { unique: true });
DiagnosticVendorPricingSchema.index({ serviceId: 1, isActive: 1 });
