import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AppointmentDocument = Appointment & Document;

export enum AppointmentType {
  IN_CLINIC = 'IN_CLINIC',
  ONLINE = 'ONLINE',
}

export enum AppointmentStatus {
  PENDING_CONFIRMATION = 'PENDING_CONFIRMATION',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FREE = 'FREE',
}

@Schema({ timestamps: true, collection: 'appointments' })
export class Appointment {
  @Prop({ required: true, unique: true })
  appointmentId: string;

  @Prop({ required: true })
  appointmentNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  patientName: string;

  @Prop({ required: true })
  patientId: string;

  @Prop({ required: true })
  doctorId: string;

  @Prop({ required: true })
  doctorName: string;

  @Prop({ required: true })
  specialty: string;

  @Prop({ required: true })
  clinicId: string;

  @Prop({ required: true })
  clinicName: string;

  @Prop({ required: true })
  clinicAddress: string;

  @Prop({ required: true, enum: AppointmentType })
  appointmentType: string;

  @Prop({ required: true })
  appointmentDate: string;

  @Prop({ required: true })
  timeSlot: string;

  @Prop({ required: true })
  consultationFee: number;

  @Prop({ required: true, enum: AppointmentStatus, default: AppointmentStatus.PENDING_CONFIRMATION })
  status: string;

  @Prop()
  requestedAt: Date;

  @Prop()
  confirmedAt: Date;

  @Prop({ required: true, enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: string;

  @Prop({ default: 0 })
  amountPaid: number;

  @Prop({ default: true })
  coveredByInsurance: boolean;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);

AppointmentSchema.index({ userId: 1, status: 1 });
AppointmentSchema.index({ appointmentId: 1 });
AppointmentSchema.index({ appointmentNumber: 1 });
AppointmentSchema.index({ doctorId: 1, appointmentDate: 1 });