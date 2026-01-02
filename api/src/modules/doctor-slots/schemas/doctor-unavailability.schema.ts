import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DoctorUnavailabilityDocument = DoctorUnavailability & Document;

export enum UnavailabilityType {
  VACATION = 'VACATION',
  CONFERENCE = 'CONFERENCE',
  EMERGENCY = 'EMERGENCY',
  PERSONAL = 'PERSONAL',
  SICK_LEAVE = 'SICK_LEAVE',
  OTHER = 'OTHER',
}

export enum RecurrencePattern {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

@Schema({ timestamps: true, collection: 'doctor_unavailabilities' })
export class DoctorUnavailability {
  @Prop({ required: true, unique: true })
  unavailabilityId: string;

  @Prop({ required: true })
  doctorId: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop()
  startTime?: string; // Format: HH:mm (24-hour). If not provided, entire day is blocked

  @Prop()
  endTime?: string; // Format: HH:mm (24-hour)

  @Prop({ required: true, enum: UnavailabilityType })
  type: string;

  @Prop()
  reason?: string;

  @Prop({ default: false })
  isAllDay: boolean;

  @Prop({ enum: RecurrencePattern, default: RecurrencePattern.NONE })
  recurrence: string;

  @Prop()
  recurrenceEndDate?: Date;

  @Prop({ type: [String], default: [] })
  affectedClinicIds: string[]; // If empty, applies to all clinics

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  notifyPatients: boolean; // Whether to notify patients with appointments during this period

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const DoctorUnavailabilitySchema = SchemaFactory.createForClass(DoctorUnavailability);

// Indexes for efficient querying
DoctorUnavailabilitySchema.index({ doctorId: 1, isActive: 1 });
DoctorUnavailabilitySchema.index({ doctorId: 1, startDate: 1, endDate: 1 });
DoctorUnavailabilitySchema.index({ unavailabilityId: 1 }, { unique: true });
