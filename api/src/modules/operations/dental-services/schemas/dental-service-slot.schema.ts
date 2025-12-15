import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DentalServiceSlotDocument = DentalServiceSlot & Document;

@Schema({ timestamps: true, collection: 'dental_service_slots' })
export class DentalServiceSlot {
  @Prop({ required: true, unique: true })
  slotId: string;

  @Prop({ required: true })
  clinicId: string;

  @Prop({ required: true })
  date: string; // YYYY-MM-DD format

  @Prop({ required: true })
  startTime: string; // HH:mm format (e.g., "09:00")

  @Prop({ required: true })
  endTime: string; // HH:mm format (e.g., "17:00")

  @Prop({ required: true, default: 30 })
  slotDuration: number; // Duration in minutes (e.g., 30 = 30-minute slots)

  @Prop({ default: 10 })
  maxAppointments: number; // Maximum appointments per time slot

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  createdBy?: string;

  @Prop()
  updatedBy?: string;
}

export const DentalServiceSlotSchema = SchemaFactory.createForClass(DentalServiceSlot);

// Indexes for query optimization
DentalServiceSlotSchema.index({ clinicId: 1, date: 1 }); // Query slots by clinic and date
DentalServiceSlotSchema.index({ clinicId: 1, isActive: 1 }); // Query active slots by clinic
