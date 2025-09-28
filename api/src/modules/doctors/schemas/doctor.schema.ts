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

  @Prop()
  email: string;

  @Prop()
  registrationNumber: string;

  @Prop()
  languages: string[];

  @Prop({ default: true })
  isActive: boolean;
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);

DoctorSchema.index({ specialtyId: 1, isActive: 1 });
DoctorSchema.index({ doctorId: 1 });