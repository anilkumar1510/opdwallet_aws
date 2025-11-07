import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DigitalPrescriptionDocument = DigitalPrescription & Document;

// Medicine item embedded subdocument
@Schema({ _id: false })
export class MedicineItem {
  @Prop({ required: true })
  medicineName: string;

  @Prop()
  genericName?: string;

  @Prop({ required: true })
  dosage: string;

  @Prop({ required: true })
  frequency: string; // OD, BD, TDS, QID, etc.

  @Prop({ required: true })
  duration: string; // e.g., "7 days", "2 weeks"

  @Prop({ required: true })
  route: string; // Oral, IV, IM, Topical, etc.

  @Prop()
  instructions?: string; // Before food, After food, etc.
}

export const MedicineItemSchema = SchemaFactory.createForClass(MedicineItem);

// Lab test item embedded subdocument
@Schema({ _id: false })
export class LabTestItem {
  @Prop({ required: true })
  testName: string;

  @Prop()
  instructions?: string;
}

export const LabTestItemSchema = SchemaFactory.createForClass(LabTestItem);

@Schema({ timestamps: true, collection: 'digitalprescriptions' })
export class DigitalPrescription {
  @Prop({ required: true, unique: true })
  prescriptionId: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Appointment' })
  appointmentId: Types.ObjectId;

  @Prop({ required: true })
  doctorId: string;

  @Prop({ required: true })
  doctorName: string;

  @Prop()
  doctorQualification?: string;

  @Prop()
  doctorSpecialty?: string;

  @Prop()
  doctorRegistrationNumber?: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  patientName: string;

  @Prop()
  patientAge?: number;

  @Prop()
  patientGender?: string;

  @Prop()
  chiefComplaint?: string;

  @Prop()
  clinicalFindings?: string;

  @Prop()
  diagnosis?: string;

  @Prop({ type: [MedicineItemSchema], default: [] })
  medicines: MedicineItem[];

  @Prop({ type: [LabTestItemSchema], default: [] })
  labTests: LabTestItem[];

  @Prop()
  followUpDate?: Date;

  @Prop()
  followUpInstructions?: string;

  @Prop()
  generalInstructions?: string;

  @Prop()
  precautions?: string;

  @Prop()
  dietaryAdvice?: string;

  @Prop({ required: true, default: 'DIGITAL', enum: ['DIGITAL', 'UPLOADED_PDF'] })
  prescriptionType: string;

  @Prop({ default: false })
  pdfGenerated: boolean;

  @Prop()
  pdfPath?: string;

  @Prop()
  pdfFileName?: string;

  @Prop({ required: true })
  createdDate: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const DigitalPrescriptionSchema = SchemaFactory.createForClass(DigitalPrescription);

// Indexes for performance
DigitalPrescriptionSchema.index({ doctorId: 1, createdDate: -1 });
DigitalPrescriptionSchema.index({ userId: 1, createdDate: -1 });
DigitalPrescriptionSchema.index({ appointmentId: 1 }, { unique: true });
DigitalPrescriptionSchema.index({ prescriptionId: 1 }, { unique: true });
DigitalPrescriptionSchema.index({ 'medicines.medicineName': 'text', 'medicines.genericName': 'text', diagnosis: 'text' });
