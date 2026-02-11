import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export class VendorContactInfo {
  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  address: string;
}

@Schema({ timestamps: true, collection: 'vaccination_vendors' })
export class VaccinationVendor extends Document {
  @Prop({ required: true, unique: true })
  vendorId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, uppercase: true })
  code: string;

  @Prop({ type: VendorContactInfo, required: true })
  contactInfo: VendorContactInfo;

  // Service areas
  @Prop({ type: [String], required: true, default: [] })
  serviceablePincodes: string[];

  // Vaccination is center visit only - no home collection
  @Prop({ default: true })
  centerVisit: boolean;

  @Prop()
  description?: string;

  // Vaccination services offered by this vendor
  @Prop({ type: [String], default: [] })
  services: string[];

  // Service aliases (vendor-specific names for vaccines)
  @Prop({ type: Map, of: String, default: {} })
  serviceAliases: Record<string, string>;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const VaccinationVendorSchema = SchemaFactory.createForClass(VaccinationVendor);

// Indexes
VaccinationVendorSchema.index({ vendorId: 1 }, { unique: true });
VaccinationVendorSchema.index({ code: 1 }, { unique: true });
VaccinationVendorSchema.index({ serviceablePincodes: 1 });
VaccinationVendorSchema.index({ isActive: 1 });
