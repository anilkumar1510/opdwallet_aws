import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CategorySpecialtyMappingDocument = CategorySpecialtyMapping & Document;

@Schema({
  collection: 'category_specialty_mapping',
  timestamps: true,
})
export class CategorySpecialtyMapping {
  @Prop({
    required: true,
    uppercase: true,
    index: true,
  })
  categoryId: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Specialty',
    required: true,
    index: true,
  })
  specialtyId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: Boolean,
    default: true,
  })
  isEnabled: boolean;

  @Prop()
  createdBy?: string;

  @Prop()
  updatedBy?: string;
}

export const CategorySpecialtyMappingSchema = SchemaFactory.createForClass(CategorySpecialtyMapping);

// Compound unique index to prevent duplicate mappings
CategorySpecialtyMappingSchema.index(
  { categoryId: 1, specialtyId: 1 },
  { unique: true }
);

// Index for efficient queries by category
CategorySpecialtyMappingSchema.index({ categoryId: 1, isEnabled: 1 });
