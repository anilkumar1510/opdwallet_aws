import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export class DiagnosticVendorContactInfo {
  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  address: string;
}

export class EquipmentCapabilities {
  @Prop({ default: false })
  ctScan: boolean;

  @Prop({ default: false })
  mri: boolean;

  @Prop({ default: false })
  xRay: boolean;

  @Prop({ default: false })
  ultrasound: boolean;

  @Prop({ default: false })
  ecg: boolean;

  @Prop({ default: false })
  echo: boolean;

  @Prop({ default: false })
  mammography: boolean;

  @Prop({ default: false })
  petScan: boolean;

  @Prop({ default: false })
  boneDensity: boolean;
}

@Schema({ timestamps: true, collection: 'diagnostic_vendors' })
export class DiagnosticVendor extends Document {
  @Prop({ required: true, unique: true })
  vendorId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, uppercase: true })
  code: string;

  @Prop({ type: DiagnosticVendorContactInfo, required: true })
  contactInfo: DiagnosticVendorContactInfo;

  // Service areas
  @Prop({ type: [String], required: true, default: [] })
  serviceablePincodes: string[];

  // Equipment capabilities (deprecated - keeping for backwards compatibility)
  @Prop({ type: EquipmentCapabilities })
  equipmentCapabilities?: EquipmentCapabilities;

  // Diagnostic services offered by this vendor
  @Prop({ type: [String], default: [] })
  services: string[];

  // Service aliases (vendor-specific names for services)
  @Prop({ type: Map, of: String, default: {} })
  serviceAliases: Record<string, string>;

  // Collection types
  @Prop({ default: true })
  homeCollection: boolean;

  @Prop({ default: true })
  centerVisit: boolean;

  @Prop({ default: 100 })
  homeCollectionCharges: number;

  @Prop()
  description?: string;

  // Link to lab vendor if same entity
  @Prop({ type: Types.ObjectId, ref: 'LabVendor' })
  labVendorId?: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const DiagnosticVendorSchema = SchemaFactory.createForClass(DiagnosticVendor);

// Indexes
DiagnosticVendorSchema.index({ vendorId: 1 }, { unique: true });
DiagnosticVendorSchema.index({ code: 1 }, { unique: true });
DiagnosticVendorSchema.index({ serviceablePincodes: 1 });
DiagnosticVendorSchema.index({ isActive: 1 });
