import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PharmacyMedicineDocument = PharmacyMedicine & Document;

/**
 * The catalogue the sheet says comes "from the pharmacy partner" — no real
 * partner integration exists, so this is a seeded stand-in (see
 * scripts/seed-pharmacy-medicines.js). Real collection, real search/query
 * behaviour; only the data behind it is dummy.
 */
@Schema({ timestamps: true, collection: 'pharmacy_medicines' })
export class PharmacyMedicine {
  @Prop({ required: true, unique: true })
  medicineId: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  genericName?: string;

  @Prop()
  manufacturer?: string;

  @Prop({ required: true })
  category: string;

  @Prop()
  packSize?: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true, default: true })
  inStock: boolean;

  /** Drives adjudication: an item without an uploaded prescription is removed. */
  @Prop({ required: true, default: false })
  requiresPrescription: boolean;

  @Prop({ required: true, default: true })
  isActive: boolean;
}

export const PharmacyMedicineSchema = SchemaFactory.createForClass(PharmacyMedicine);

PharmacyMedicineSchema.index({ medicineId: 1 }, { unique: true });
PharmacyMedicineSchema.index({ name: 'text', genericName: 'text' });
PharmacyMedicineSchema.index({ isActive: 1 });
