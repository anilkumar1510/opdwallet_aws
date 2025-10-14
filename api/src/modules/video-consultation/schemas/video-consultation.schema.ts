import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VideoConsultationDocument = VideoConsultation & Document;

@Schema({ timestamps: true })
export class VideoConsultation {
  @Prop({ required: true, unique: true })
  consultationId: string;

  @Prop({ type: Types.ObjectId, ref: 'Appointment', required: true })
  appointmentId: Types.ObjectId;

  // Participants
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  doctorId: Types.ObjectId;

  @Prop({ required: true })
  doctorName: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  patientId: Types.ObjectId;

  @Prop({ required: true })
  patientName: string;

  // Room Details
  @Prop({ required: true, unique: true })
  roomId: string;

  @Prop({ required: true })
  roomName: string;

  @Prop()
  roomPassword: string;

  @Prop({ default: 'meet.jit.si' })
  jitsiDomain: string;

  @Prop({ required: true })
  roomUrl: string;

  // Scheduling
  @Prop()
  scheduledStartTime: Date;

  @Prop()
  actualStartTime: Date;

  @Prop()
  endTime: Date;

  @Prop()
  duration: number; // in minutes

  // Status Tracking
  @Prop({
    required: true,
    enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
    default: 'SCHEDULED',
  })
  status: string;

  @Prop()
  doctorJoinedAt: Date;

  @Prop()
  patientJoinedAt: Date;

  // Recording (if enabled)
  @Prop({ default: false })
  recordingEnabled: boolean;

  @Prop()
  recordingUrl: string;

  @Prop()
  recordingDuration: number;

  @Prop()
  recordingSize: number; // in MB

  // Quality Metrics
  @Prop()
  videoQuality: string;

  @Prop()
  audioQuality: string;

  @Prop({ type: [{ timestamp: Date, issue: String, duration: Number }], default: [] })
  networkIssues: Array<{
    timestamp: Date;
    issue: string;
    duration: number;
  }>;

  // Post-Consultation
  @Prop({ type: Types.ObjectId, ref: 'Prescription' })
  prescriptionId: Types.ObjectId;

  @Prop()
  notesId: string;

  @Prop({
    type: {
      doctorRating: Number,
      patientRating: Number,
      doctorComments: String,
      patientComments: String,
    },
  })
  feedback: {
    doctorRating?: number;
    patientRating?: number;
    doctorComments?: string;
    patientComments?: string;
  };

  @Prop()
  endedBy: string; // 'DOCTOR' | 'PATIENT' | 'SYSTEM'

  @Prop()
  cancellationReason: string;
}

export const VideoConsultationSchema = SchemaFactory.createForClass(VideoConsultation);

// Indexes
VideoConsultationSchema.index({ appointmentId: 1 });
VideoConsultationSchema.index({ roomId: 1 });
VideoConsultationSchema.index({ doctorId: 1, scheduledStartTime: -1 });
VideoConsultationSchema.index({ patientId: 1, scheduledStartTime: -1 });
VideoConsultationSchema.index({ status: 1, scheduledStartTime: -1 });
