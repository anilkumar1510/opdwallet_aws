import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SpecialtyDocument = Specialty & Document;

@Schema({ timestamps: true, collection: 'specialty_master' })
export class Specialty {
  @Prop({ required: true, unique: true })
  specialtyId: string;

  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop()
  icon: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  displayOrder: number;
}

export const SpecialtySchema = SchemaFactory.createForClass(Specialty);

SpecialtySchema.index({ isActive: 1, displayOrder: 1 });
SpecialtySchema.index({ code: 1 });