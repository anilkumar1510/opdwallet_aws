import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DoctorSlotDocument = DoctorSlot & Document;

export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export enum ConsultationType {
  IN_CLINIC = 'IN_CLINIC',
  ONLINE = 'ONLINE',
}

@Schema({ timestamps: true, collection: 'doctor_slots' })
export class DoctorSlot {
  @Prop({ required: true, unique: true })
  slotId: string;

  @Prop({ required: true })
  doctorId: string;

  @Prop({ required: true })
  clinicId: string;

  @Prop({ required: true, enum: DayOfWeek })
  dayOfWeek: string;

  @Prop({ required: true })
  startTime: string;

  @Prop({ required: true })
  endTime: string;

  @Prop({ required: true })
  slotDuration: number;

  @Prop({ required: true })
  consultationFee: number;

  @Prop({ required: true, enum: ConsultationType })
  consultationType: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  validFrom?: Date;

  @Prop()
  validUntil?: Date;

  @Prop({ type: [String], default: [] })
  blockedDates: string[];

  @Prop({ default: 20 })
  maxAppointments: number;
}

export const DoctorSlotSchema = SchemaFactory.createForClass(DoctorSlot);

// Note: slotId already has unique constraint via @Prop decorator, no separate index needed
// Performance optimization: Compound indexes for common query patterns
// This index optimizes queries filtering by doctor, consultation type, and active status
DoctorSlotSchema.index({ doctorId: 1, consultationType: 1, isActive: 1 });

// This index optimizes queries for fetching doctor's schedule by day of week
DoctorSlotSchema.index({ doctorId: 1, dayOfWeek: 1, isActive: 1 });

// Index for clinic-based queries
DoctorSlotSchema.index({ clinicId: 1 });