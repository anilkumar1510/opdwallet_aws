import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'vaccination_vendor_slots' })
export class VaccinationVendorSlot extends Document {
  @Prop({ required: true })
  slotId: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'VaccinationVendor' })
  vendorId: Types.ObjectId;

  @Prop({ required: true })
  pincode: string;

  @Prop({ required: true })
  dayOfWeek: string; // "MONDAY", "TUESDAY", etc.

  @Prop({ required: true })
  startTime: string; // e.g., "09:00"

  @Prop({ required: true })
  endTime: string; // e.g., "17:00"

  @Prop({ required: true, default: 30 })
  slotDuration: number; // in minutes (e.g., 30)

  @Prop({ required: true, default: 20 })
  maxAppointments: number;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const VaccinationVendorSlotSchema = SchemaFactory.createForClass(VaccinationVendorSlot);

// Indexes
VaccinationVendorSlotSchema.index({ vendorId: 1, dayOfWeek: 1, pincode: 1 });
VaccinationVendorSlotSchema.index({ vendorId: 1, isActive: 1 });
