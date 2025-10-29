import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum PrescriptionStatus {
  UPLOADED = 'UPLOADED',
  DIGITIZING = 'DIGITIZING',
  DIGITIZED = 'DIGITIZED',
  DELAYED = 'DELAYED',
}

@Schema({ timestamps: true, collection: 'lab_prescriptions' })
export class LabPrescription extends Document {
  @Prop({ required: true, unique: true })
  prescriptionId: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  patientId: string;

  @Prop({ required: true })
  patientName: string;

  @Prop({ required: true })
  patientRelationship: string; // SELF, SPOUSE, SON, DAUGHTER, FATHER, MOTHER

  @Prop({ required: true })
  prescriptionDate: Date;

  @Prop({ type: Types.ObjectId, ref: 'Address' })
  addressId?: Types.ObjectId;

  @Prop({ required: true })
  pincode: string;

  // File info
  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  fileType: string;

  @Prop({ required: true })
  fileSize: number;

  @Prop({ required: true })
  filePath: string;

  @Prop({ required: true, default: Date.now })
  uploadedAt: Date;

  // Status tracking
  @Prop({ required: true, enum: PrescriptionStatus, default: PrescriptionStatus.UPLOADED })
  status: PrescriptionStatus;

  @Prop()
  digitizedBy?: string;

  @Prop()
  digitizedAt?: Date;

  @Prop()
  digitizingStartedAt?: Date;

  @Prop()
  delayReason?: string;

  // Cart reference
  @Prop({ type: Types.ObjectId, ref: 'LabCart' })
  cartId?: Types.ObjectId;

  @Prop()
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const LabPrescriptionSchema = SchemaFactory.createForClass(LabPrescription);

// Indexes
LabPrescriptionSchema.index({ prescriptionId: 1 }, { unique: true });
LabPrescriptionSchema.index({ userId: 1, status: 1 });
LabPrescriptionSchema.index({ status: 1, uploadedAt: 1 });
LabPrescriptionSchema.index({ pincode: 1, status: 1 });
