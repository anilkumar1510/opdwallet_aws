import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DoctorDocument = Doctor & Document;

@Schema()
export class ClinicLocation {
  @Prop({ required: true })
  clinicId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  address: string;

  @Prop()
  city: string;

  @Prop()
  state: string;

  @Prop()
  pincode: string;

  @Prop({ type: { latitude: Number, longitude: Number } })
  location: {
    latitude: number;
    longitude: number;
  };

  @Prop()
  distanceKm: number;

  @Prop({ required: true })
  consultationFee: number;
}

@Schema()
export class TimeSlot {
  @Prop({ required: true })
  date: string;

  @Prop({ type: [String], required: true })
  slots: string[];
}

@Schema({ timestamps: true, collection: 'doctors' })
export class Doctor {
  @Prop({ required: true, unique: true })
  doctorId: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  profilePhoto: string;

  @Prop({ required: true })
  qualifications: string;

  @Prop({ type: [String], required: true })
  specializations: string[];

  @Prop({ required: true })
  specialtyId: string;

  @Prop({ required: true })
  specialty: string;

  @Prop({ required: true })
  experienceYears: number;

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  reviewCount: number;

  @Prop({ type: [ClinicLocation], required: true })
  clinics: ClinicLocation[];

  @Prop({ required: true })
  consultationFee: number;

  @Prop({ default: true })
  cashlessAvailable: boolean;

  @Prop({ type: [String] })
  insuranceAccepted: string[];

  @Prop({ default: false })
  requiresConfirmation: boolean;

  @Prop({ default: true })
  allowDirectBooking: boolean;

  @Prop({ type: [TimeSlot] })
  availableSlots: TimeSlot[];

  @Prop({ default: true })
  availableOnline: boolean;

  @Prop({ default: true })
  availableOffline: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);

DoctorSchema.index({ specialtyId: 1, isActive: 1 });
DoctorSchema.index({ doctorId: 1 });
DoctorSchema.index({ 'clinics.city': 1 });