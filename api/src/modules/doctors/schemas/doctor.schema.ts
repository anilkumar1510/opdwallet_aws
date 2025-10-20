import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DoctorDocument = Doctor & Document;

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

  @Prop()
  phone: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  password: string;

  @Prop({ default: 'DOCTOR' })
  role: string;

  @Prop()
  registrationNumber: string;

  @Prop()
  languages: string[];

  @Prop({ type: Date })
  lastLogin?: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [Object] })
  clinics?: any[];

  @Prop()
  consultationFee?: number;

  @Prop({ default: false })
  availableOnline?: boolean;

  @Prop({ default: false })
  availableOffline?: boolean;
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);

// PERFORMANCE: Removed duplicate index on doctorId (already unique at field level)
DoctorSchema.index({ specialtyId: 1, isActive: 1 });