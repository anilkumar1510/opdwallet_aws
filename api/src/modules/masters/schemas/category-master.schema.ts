import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryMasterDocument = CategoryMaster & Document;

@Schema({
  collection: 'category_master',
  timestamps: true,
})
export class CategoryMaster {
  @Prop({
    required: true,
    unique: true,
    index: true,
    uppercase: true
  })
  categoryId: string;

  @Prop({
    required: true,
    unique: true,
    uppercase: true
  })
  code: string;

  @Prop({
    required: true
  })
  name: string;

  @Prop({
    type: Boolean,
    default: true
  })
  isActive: boolean;

  @Prop({
    type: Number,
    required: true
  })
  displayOrder: number;

  @Prop({
    type: String
  })
  description?: string;
}

export const CategoryMasterSchema = SchemaFactory.createForClass(CategoryMaster);

// Indexes
CategoryMasterSchema.index({ categoryId: 1 }, { unique: true });
CategoryMasterSchema.index({ code: 1 }, { unique: true });
CategoryMasterSchema.index({ isActive: 1, displayOrder: 1 });