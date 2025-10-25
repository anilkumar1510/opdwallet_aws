import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MedicineDocument = Medicine & Document;

@Schema({ collection: 'medicine_database' })
export class Medicine {
  @Prop({ required: true })
  genericName: string;

  @Prop({ type: [String], default: [] })
  brandNames: string[];

  @Prop()
  manufacturer?: string;

  @Prop()
  composition?: string;

  @Prop()
  form?: string; // tablet, capsule, syrup, injection, etc.

  @Prop()
  strength?: string; // e.g., "500mg", "10ml"

  @Prop()
  searchText?: string; // Combined text for searching

  @Prop({ default: true })
  isActive: boolean;
}

export const MedicineSchema = SchemaFactory.createForClass(Medicine);

// Indexes for fast autocomplete search
MedicineSchema.index({ genericName: 'text', brandNames: 'text', searchText: 'text' });
MedicineSchema.index({ genericName: 1 });
MedicineSchema.index({ isActive: 1 });
