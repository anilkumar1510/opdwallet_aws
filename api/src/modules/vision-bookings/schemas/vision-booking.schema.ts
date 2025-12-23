import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VisionBookingDocument = VisionBooking & Document;

@Schema({ timestamps: true, collection: 'vision_bookings' })
export class VisionBooking {
  @Prop({ required: true, unique: true })
  bookingId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  patientId: string;

  @Prop({ required: true })
  patientName: string;

  @Prop({ required: true })
  patientRelationship: string;

  // Service details
  @Prop({ required: true })
  serviceCode: string;

  @Prop({ required: true })
  serviceName: string;

  @Prop({ required: true, default: 'CAT007' })
  categoryCode: string;

  // Clinic details
  @Prop({ required: true })
  clinicId: string;

  @Prop({ required: true })
  clinicName: string;

  @Prop({
    type: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },
    required: true,
  })
  clinicAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };

  @Prop()
  clinicContact: string;

  // Appointment details
  @Prop({ type: Types.ObjectId, ref: 'VisionServiceSlot', required: true })
  slotId: Types.ObjectId;

  @Prop({ required: true, index: true })
  appointmentDate: Date;

  @Prop({ required: true })
  appointmentTime: string;

  @Prop({ default: 30 })
  duration: number;

  // Pricing
  @Prop({ required: true })
  servicePrice: number;

  // Payment breakdown
  @Prop({ required: true })
  billAmount: number;

  @Prop({ required: true, default: 0 })
  copayAmount: number;

  @Prop({ required: true })
  insuranceEligibleAmount: number;

  @Prop({ default: null })
  serviceTransactionLimit: number;

  @Prop({ required: true })
  insurancePayment: number;

  @Prop({ required: true, default: 0 })
  excessAmount: number;

  @Prop({ required: true })
  totalMemberPayment: number;

  @Prop({ required: true })
  walletDebitAmount: number;

  // Payment details
  @Prop({ required: true, enum: ['WALLET_ONLY', 'COPAY', 'OUT_OF_POCKET'] })
  paymentMethod: string;

  @Prop({ type: Types.ObjectId, ref: 'Payment', default: null })
  paymentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TransactionSummary', default: null })
  transactionId: Types.ObjectId;

  // Payment status (tracks payment completion)
  @Prop({
    required: true,
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
    default: 'PENDING',
    index: true,
  })
  paymentStatus: string;

  // Booking status (tracks booking lifecycle)
  @Prop({
    required: true,
    enum: ['PENDING_CONFIRMATION', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
    default: 'PENDING_CONFIRMATION',
    index: true,
  })
  status: string;

  // Metadata
  @Prop({ required: true, default: 'MEMBER_PORTAL' })
  bookingSource: string;

  @Prop({ required: true, default: Date.now })
  bookedAt: Date;

  @Prop({ default: null })
  confirmedAt: Date;

  @Prop({ default: null })
  completedAt: Date;

  @Prop({ default: null })
  cancelledAt: Date;

  @Prop({ default: null })
  cancelledBy: string; // 'MEMBER', 'OPS', 'ADMIN'

  @Prop({ default: null })
  cancellationReason: string;

  @Prop({ default: null })
  noShowAt: Date;

  @Prop({ default: null })
  rescheduledFrom: Date;

  @Prop({ default: null })
  rescheduledReason: string;

  // Invoice fields
  @Prop({ default: null })
  invoiceId: string; // INV-VIS-{bookingId}-{random}

  @Prop({ default: null })
  invoicePath: string;

  @Prop({ default: null })
  invoiceFileName: string;

  @Prop({ default: false })
  invoiceGenerated: boolean;

  @Prop({ default: null })
  invoiceGeneratedAt: Date;

  // Bill generation fields (before payment)
  @Prop({ default: false })
  billGenerated: boolean;

  @Prop({ default: null })
  billGeneratedAt: Date;

  @Prop({ default: null })
  billGeneratedBy: string; // Admin user ID who generated the bill

  // Policy tracking
  @Prop({ type: Types.ObjectId, ref: 'Policy', required: true })
  policyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'PlanConfig', required: true })
  planConfigId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Assignment', required: true })
  assignmentId: Types.ObjectId;
}

export const VisionBookingSchema = SchemaFactory.createForClass(VisionBooking);

// Create indexes for common queries
VisionBookingSchema.index({ userId: 1, appointmentDate: -1 });
VisionBookingSchema.index({ userId: 1, status: 1 });
VisionBookingSchema.index({ patientId: 1, status: 1 });
VisionBookingSchema.index({ appointmentDate: 1, status: 1 });
// Admin query indexes
VisionBookingSchema.index({ status: 1, appointmentDate: 1 });
VisionBookingSchema.index({ clinicId: 1, appointmentDate: 1 });
VisionBookingSchema.index({ serviceCode: 1 });
