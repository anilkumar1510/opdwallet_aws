import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export class VendorContactInfo {
  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  address: string;
}

@Schema({ timestamps: true, collection: 'lab_vendors' })
export class LabVendor extends Document {
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

  // Collection types
  @Prop({ default: true })
  homeCollection: boolean;

  @Prop({ default: true })
  centerVisit: boolean;

  @Prop({ default: 50 })
  homeCollectionCharges: number;

  @Prop()
  description?: string;

  // Service type support
  @Prop({ default: true })
  offersLabServices: boolean;

  @Prop({ default: false })
  offersDiagnosticServices: boolean;

  @Prop({ type: Types.ObjectId })
  diagnosticVendorId?: Types.ObjectId; // Link to diagnostic vendor if same entity offers both

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const LabVendorSchema = SchemaFactory.createForClass(LabVendor);

// Indexes
LabVendorSchema.index({ vendorId: 1 }, { unique: true });
LabVendorSchema.index({ code: 1 }, { unique: true });
LabVendorSchema.index({ serviceablePincodes: 1 });
LabVendorSchema.index({ isActive: 1 });
