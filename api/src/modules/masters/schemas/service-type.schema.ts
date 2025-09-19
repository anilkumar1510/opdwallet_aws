import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ServiceTypeDocument = ServiceType & Document;

@Schema({
  collection: 'service_types',
  timestamps: true,
})
export class ServiceType {
  @Prop({
    required: true,
    unique: true,
    index: true,
    uppercase: true
  })
  serviceCode: string;

  @Prop({
    required: true
  })
  serviceName: string;

  @Prop({
    required: true,
    index: true,
    uppercase: true,
    ref: 'CategoryMaster'
  })
  categoryId: string;

  @Prop({
    type: Boolean,
    default: true,
    index: true
  })
  isActive: boolean;

  @Prop({
    type: Number,
    default: 0
  })
  displayOrder: number;

  @Prop({
    type: String
  })
  description?: string;

  @Prop({
    type: Number
  })
  maxLimit?: number;

  @Prop({
    type: String
  })
  unit?: string;
}

export const ServiceTypeSchema = SchemaFactory.createForClass(ServiceType);

// Indexes
ServiceTypeSchema.index({ serviceCode: 1 }, { unique: true });
ServiceTypeSchema.index({ categoryId: 1, isActive: 1 });
ServiceTypeSchema.index({ categoryId: 1, displayOrder: 1 });