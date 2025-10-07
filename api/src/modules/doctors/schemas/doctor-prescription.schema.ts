import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DoctorPrescriptionDocument = DoctorPrescription & Document;

@Schema({ timestamps: true })
export class DoctorPrescription {
  @Prop({ required: true, unique: true })
  prescriptionId: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Appointment' })
  appointmentId: Types.ObjectId;

  @Prop({ required: true })
  doctorId: string;

  @Prop({ required: true })
  doctorName: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  patientName: string;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  filePath: string;

  @Prop({ required: true })
  fileSize: number;

  @Prop({ required: true })
  uploadDate: Date;

  @Prop()
  diagnosis?: string;

  @Prop()
  notes?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const DoctorPrescriptionSchema = SchemaFactory.createForClass(DoctorPrescription);

// Indexes for performance
DoctorPrescriptionSchema.index({ doctorId: 1, uploadDate: -1 });
DoctorPrescriptionSchema.index({ userId: 1, uploadDate: -1 });
DoctorPrescriptionSchema.index({ appointmentId: 1 }, { unique: true });
DoctorPrescriptionSchema.index({ prescriptionId: 1 }, { unique: true });
