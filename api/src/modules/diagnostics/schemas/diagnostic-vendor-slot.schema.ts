import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum TimeSlot {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  EVENING = 'EVENING',
}

@Schema({ timestamps: true, collection: 'diagnostic_vendor_slots' })
export class DiagnosticVendorSlot extends Document {
  @Prop({ required: true, unique: true })
  slotId: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'DiagnosticVendor' })
  vendorId: Types.ObjectId;

  @Prop({ required: true })
  pincode: string;

  @Prop({ required: true })
  date: string; // YYYY-MM-DD format

  @Prop({ required: true, enum: TimeSlot })
  timeSlot: TimeSlot;

  @Prop({ required: true })
  startTime: string; // HH:MM format (24-hour)

  @Prop({ required: true })
  endTime: string; // HH:MM format (24-hour)

  @Prop({ required: true, default: 5 })
  maxBookings: number;

  @Prop({ required: true, default: 0 })
  currentBookings: number;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const DiagnosticVendorSlotSchema = SchemaFactory.createForClass(DiagnosticVendorSlot);

// Indexes
DiagnosticVendorSlotSchema.index({ slotId: 1 }, { unique: true });
DiagnosticVendorSlotSchema.index({ vendorId: 1, pincode: 1, date: 1, timeSlot: 1 }, { unique: true });
DiagnosticVendorSlotSchema.index({ vendorId: 1, date: 1, isActive: 1 });
DiagnosticVendorSlotSchema.index({ pincode: 1, date: 1, isActive: 1 });
