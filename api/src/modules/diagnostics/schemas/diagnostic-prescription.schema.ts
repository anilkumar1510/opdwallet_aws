import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum PrescriptionStatus {
  UPLOADED = 'UPLOADED',
  DIGITIZING = 'DIGITIZING',
  DIGITIZED = 'DIGITIZED',
  DELAYED = 'DELAYED',
  CANCELLED = 'CANCELLED',
}

export enum CancelledBy {
  MEMBER = 'MEMBER',
  OPERATIONS = 'OPERATIONS',
}

export enum PrescriptionSource {
  UPLOAD = 'UPLOAD',
  HEALTH_RECORD = 'HEALTH_RECORD',
}

@Schema({ timestamps: true, collection: 'diagnostic_prescriptions' })
export class DiagnosticPrescription extends Document {
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

  // Source tracking
  @Prop({ required: true, enum: PrescriptionSource, default: PrescriptionSource.UPLOAD })
  source: PrescriptionSource;

  @Prop({ type: Types.ObjectId })
  healthRecordId?: Types.ObjectId; // If source is HEALTH_RECORD

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

  // Cancellation tracking
  @Prop({ type: String, enum: CancelledBy })
  cancelledBy?: CancelledBy;

  @Prop()
  cancelledAt?: Date;

  @Prop()
  cancellationReason?: string;

  // Cart reference
  @Prop({ type: Types.ObjectId, ref: 'DiagnosticCart' })
  cartId?: Types.ObjectId;

  @Prop()
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

export type DiagnosticPrescriptionDocument = DiagnosticPrescription & Document;
export const DiagnosticPrescriptionSchema = SchemaFactory.createForClass(DiagnosticPrescription);

// Indexes
DiagnosticPrescriptionSchema.index({ prescriptionId: 1 }, { unique: true });
DiagnosticPrescriptionSchema.index({ userId: 1, status: 1 });
DiagnosticPrescriptionSchema.index({ status: 1, uploadedAt: 1 });
DiagnosticPrescriptionSchema.index({ pincode: 1, status: 1 });
DiagnosticPrescriptionSchema.index({ cancelledAt: 1 });
DiagnosticPrescriptionSchema.index({ cancelledBy: 1 });
