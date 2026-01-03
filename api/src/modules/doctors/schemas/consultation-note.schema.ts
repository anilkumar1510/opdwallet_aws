import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ConsultationNoteDocument = ConsultationNote & Document;

@Schema({ timestamps: true, collection: 'consultation_notes' })
export class ConsultationNote {
  @Prop({ required: true, unique: true })
  noteId: string;

  @Prop({ required: true })
  appointmentId: string;

  @Prop({ required: true })
  doctorId: string;

  @Prop({ required: true })
  patientId: string;

  @Prop() // Optional - online appointments don't have clinicId
  clinicId?: string;

  @Prop({ type: Date, required: true })
  consultationDate: Date;

  // Chief Complaint
  @Prop()
  chiefComplaint?: string;

  // History of Present Illness
  @Prop()
  historyOfPresentIllness?: string;

  // Clinical Findings
  @Prop({ type: Object })
  clinicalFindings?: {
    generalExamination?: string;
    systemicExamination?: string;
    localExamination?: string;
  };

  // Provisional Diagnosis
  @Prop()
  provisionalDiagnosis?: string;

  // Investigations Ordered
  @Prop({ type: [String], default: [] })
  investigationsOrdered: string[];

  // Treatment Plan
  @Prop()
  treatmentPlan?: string;

  // Follow-up Instructions
  @Prop()
  followUpInstructions?: string;

  @Prop({ type: Date })
  nextFollowUpDate?: Date;

  // Additional Notes
  @Prop()
  additionalNotes?: string;

  // Private notes (not shared with patient)
  @Prop()
  privateNotes?: string;

  // Reference to prescription if created during consultation
  @Prop()
  prescriptionId?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date })
  createdAt?: Date;

  @Prop({ type: Date })
  updatedAt?: Date;
}

export const ConsultationNoteSchema = SchemaFactory.createForClass(ConsultationNote);

// Indexes for efficient queries
ConsultationNoteSchema.index({ noteId: 1 });
ConsultationNoteSchema.index({ appointmentId: 1 });
ConsultationNoteSchema.index({ doctorId: 1, consultationDate: -1 });
ConsultationNoteSchema.index({ patientId: 1, consultationDate: -1 });
ConsultationNoteSchema.index({ clinicId: 1, consultationDate: -1 });
