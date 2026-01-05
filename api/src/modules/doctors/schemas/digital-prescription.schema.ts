import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DigitalPrescriptionDocument = DigitalPrescription & Document;

// Vitals subdocument - NEW
@Schema({ _id: false })
export class Vitals {
  @Prop()
  bloodPressure?: string; // e.g., "120/80 mmHg"

  @Prop()
  pulse?: number; // beats per minute

  @Prop()
  temperature?: number; // in Fahrenheit or Celsius

  @Prop()
  respiratoryRate?: number; // breaths per minute

  @Prop()
  oxygenSaturation?: number; // SpO2 percentage

  @Prop()
  weight?: number; // in kg

  @Prop()
  height?: number; // in cm

  @Prop()
  bmi?: number; // calculated

  @Prop({ type: Date })
  recordedAt?: Date; // when vitals were taken
}

export const VitalsSchema = SchemaFactory.createForClass(Vitals);

// Allergies subdocument - NEW
@Schema({ _id: false })
export class Allergies {
  @Prop({ default: false })
  hasKnownAllergies: boolean; // false = NKDA (No Known Drug Allergies)

  @Prop({ type: [String], default: [] })
  drugAllergies: string[]; // e.g., ["Penicillin", "Sulfa"]

  @Prop({ type: [String], default: [] })
  foodAllergies: string[]; // e.g., ["Peanuts", "Shellfish"]

  @Prop({ type: [String], default: [] })
  otherAllergies: string[]; // e.g., ["Latex", "Dust"]
}

export const AllergiesSchema = SchemaFactory.createForClass(Allergies);

// Medical History subdocument - NEW
@Schema({ _id: false })
export class MedicalHistory {
  @Prop({ type: [String], default: [] })
  conditions: string[]; // e.g., ["Diabetes", "Hypertension"]

  @Prop({ type: [String], default: [] })
  currentMedications: string[]; // Medications patient is already taking

  @Prop()
  surgicalHistory?: string; // Past surgeries

  @Prop()
  familyHistory?: string; // Relevant family conditions
}

export const MedicalHistorySchema = SchemaFactory.createForClass(MedicalHistory);

// Medicine item embedded subdocument - ENHANCED
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

  // NEW FIELDS
  @Prop()
  strength?: string; // e.g., "500mg", "10ml"

  @Prop()
  quantity?: number; // Total units to dispense

  @Prop({ default: 0 })
  refills?: number; // Number of refills allowed (0 = no refills)

  @Prop({ default: false })
  isControlled?: boolean; // Schedule H/X drug flag

  @Prop({ default: true })
  substitutionAllowed?: boolean; // Generic substitution permitted

  @Prop()
  specialInstructions?: string; // e.g., "Take with food", "Avoid sunlight"
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

  @Prop()
  doctorSignatureImage?: string; // Path to doctor's signature image (copied at prescription creation)

  // CLINIC INFORMATION - NEW (from appointment)
  @Prop()
  clinicName?: string;

  @Prop()
  clinicAddress?: string;

  @Prop()
  clinicPhone?: string;

  @Prop()
  clinicLogo?: string; // Optional branding

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  patientName: string;

  @Prop()
  patientAge?: number;

  @Prop()
  patientGender?: string;

  // ENHANCED PATIENT INFORMATION - NEW
  @Prop()
  patientPhone?: string; // Contact for follow-up

  @Prop()
  patientAddress?: string; // Required for Schedule H/X drugs

  @Prop()
  patientWeight?: number; // In kg - important for dosage

  @Prop()
  patientBloodGroup?: string; // Emergency reference

  // VITALS SECTION - NEW
  @Prop({ type: VitalsSchema })
  vitals?: Vitals;

  // ALLERGIES SECTION - NEW (Critical for Safety)
  @Prop({ type: AllergiesSchema })
  allergies?: Allergies;

  // MEDICAL HISTORY - NEW
  @Prop({ type: MedicalHistorySchema })
  medicalHistory?: MedicalHistory;

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

  // PRESCRIPTION METADATA - NEW
  @Prop()
  prescriptionNumber?: string; // Sequential number (e.g., "RX2024-001234")

  @Prop({ default: 30 })
  validityDays?: number; // How long prescription is valid (default 30)

  @Prop({ default: false })
  isEmergency?: boolean; // Emergency prescription flag

  @Prop()
  consultationType?: string; // "IN_CLINIC" | "ONLINE" | "EMERGENCY"

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
