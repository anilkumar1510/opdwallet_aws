import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CategoryLabServiceMappingDocument = CategoryLabServiceMapping & Document;

@Schema({
  collection: 'category_lab_service_mapping',
  timestamps: true,
})
export class CategoryLabServiceMapping {
  @Prop({
    required: true,
    uppercase: true,
    index: true,
  })
  categoryId: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'LabService',
    required: true,
    index: true,
  })
  labServiceId: MongooseSchema.Types.ObjectId;

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

export const CategoryLabServiceMappingSchema = SchemaFactory.createForClass(CategoryLabServiceMapping);

// Compound unique index to prevent duplicate mappings
CategoryLabServiceMappingSchema.index(
  { categoryId: 1, labServiceId: 1 },
  { unique: true }
);

// Index for efficient queries by category and enabled status
CategoryLabServiceMappingSchema.index({ categoryId: 1, isEnabled: 1 });
