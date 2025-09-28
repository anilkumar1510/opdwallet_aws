import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ClinicDocument = Clinic & Document;

@Schema()
export class Address {
  @Prop({ required: true })
  line1: string;

  @Prop()
  line2?: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  state: string;

  @Prop({ required: true })
  pincode: string;

  @Prop({ default: 'India' })
  country: string;
}

@Schema()
export class Location {
  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;
}

@Schema()
export class OperatingHours {
  @Prop({ required: true })
  isOpen: boolean;

  @Prop()
  openTime?: string;

  @Prop()
  closeTime?: string;
}

const OperatingHoursSchema = SchemaFactory.createForClass(OperatingHours);

@Schema({ timestamps: true, collection: 'clinics' })
export class Clinic {
  @Prop({ required: true, unique: true })
  clinicId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: Address, required: true })
  address: Address;

  @Prop({ type: Location })
  location?: Location;

  @Prop({ required: true })
  contactNumber: string;

  @Prop()
  email?: string;

  @Prop({ type: Map, of: OperatingHoursSchema })
  operatingHours: Map<string, OperatingHours>;

  @Prop({ type: [String], default: [] })
  facilities: string[];

  @Prop({ default: true })
  isActive: boolean;
}

export const ClinicSchema = SchemaFactory.createForClass(Clinic);

ClinicSchema.index({ clinicId: 1 });
ClinicSchema.index({ 'address.city': 1 });
ClinicSchema.index({ isActive: 1 });