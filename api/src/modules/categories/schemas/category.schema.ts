import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({
  timestamps: true,
  collection: 'category_master',
})
export class Category {
  @Prop({
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    immutable: true, // Category ID cannot be changed once created
  })
  categoryId!: string;

  @Prop({
    required: true,
    trim: true,
  })
  name!: string;

  @Prop({
    trim: true,
  })
  description?: string;

  @Prop({
    default: true,
  })
  isActive!: boolean;

  @Prop({
    type: Number,
    default: 0,
  })
  displayOrder!: number; // For sorting categories in UI

  @Prop()
  createdBy?: string;

  @Prop()
  updatedBy?: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);