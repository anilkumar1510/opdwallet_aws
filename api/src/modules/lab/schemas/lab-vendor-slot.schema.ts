import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'lab_vendor_slots' })
export class LabVendorSlot extends Document {
  @Prop({ required: true })
  slotId: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'LabVendor' })
  vendorId: Types.ObjectId;

  @Prop({ required: true })
  pincode: string;

  @Prop({ required: true })
  date: string; // YYYY-MM-DD

  @Prop({ required: true })
  timeSlot: string; // "09:00 AM - 10:00 AM"

  @Prop({ required: true })
  startTime: string; // "09:00"

  @Prop({ required: true })
  endTime: string; // "10:00"

  @Prop({ required: true, default: 5 })
  maxBookings: number;

  @Prop({ default: 0 })
  currentBookings: number;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const LabVendorSlotSchema = SchemaFactory.createForClass(LabVendorSlot);

// Indexes
LabVendorSlotSchema.index({ vendorId: 1, date: 1, pincode: 1 });
LabVendorSlotSchema.index({ date: 1, isActive: 1 });
