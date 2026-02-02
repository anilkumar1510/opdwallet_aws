import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DoctorClinicAssignmentDocument = DoctorClinicAssignment & Document;

@Schema({ timestamps: true, collection: 'doctorClinicAssignments' })
export class DoctorClinicAssignment {
  @Prop({ required: true, unique: true })
  assignmentId: string;

  @Prop({ required: true, ref: 'Doctor' })
  doctorId: string;

  @Prop({ required: true, ref: 'Clinic' })
  clinicId: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date, default: Date.now })
  assignedAt: Date;

  @Prop({ required: true })
  assignedBy: string;

  @Prop()
  createdBy: string;

  @Prop()
  updatedBy: string;
}

export const DoctorClinicAssignmentSchema = SchemaFactory.createForClass(DoctorClinicAssignment);

// Indexes
DoctorClinicAssignmentSchema.index({ doctorId: 1, isActive: 1 });
DoctorClinicAssignmentSchema.index({ clinicId: 1, isActive: 1 });
DoctorClinicAssignmentSchema.index({ doctorId: 1, clinicId: 1 }, { unique: true });
DoctorClinicAssignmentSchema.index({ assignmentId: 1 }, { unique: true });
