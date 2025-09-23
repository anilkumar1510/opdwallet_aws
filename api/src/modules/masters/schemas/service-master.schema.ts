import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ServiceMasterDocument = ServiceMaster & Document;

@Schema({
  collection: 'service_master',
  timestamps: true,
})
export class ServiceMaster {
  @Prop({
    required: true,
    unique: true,
    uppercase: true,
    index: true,
  })
  code: string;

  @Prop({
    required: true,
  })
  name: string;

  @Prop()
  description?: string;

  @Prop({
    required: true,
    uppercase: true,
  })
  category: string;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive: boolean;

  @Prop({
    type: Number,
    default: 100,
  })
  coveragePercentage: number;

  @Prop({
    type: Number,
    default: 0,
  })
  copayAmount: number;

  @Prop({
    type: Boolean,
    default: false,
  })
  requiresPreAuth: boolean;

  @Prop({
    type: Boolean,
    default: false,
  })
  requiresReferral: boolean;

  @Prop({
    type: {
      min: Number,
      max: Number,
    },
  })
  priceRange?: {
    min: number;
    max: number;
  };

  @Prop({
    type: Number,
  })
  annualLimit?: number;

  @Prop({
    type: Number,
    default: 0,
  })
  waitingPeriodDays: number;

  @Prop({
    type: [String],
    default: [],
  })
  requiredDocuments: string[];

  @Prop()
  createdBy?: string;

  @Prop()
  updatedBy?: string;
}

export const ServiceMasterSchema = SchemaFactory.createForClass(ServiceMaster);

// Indexes
ServiceMasterSchema.index({ code: 1 }, { unique: true });
ServiceMasterSchema.index({ category: 1, isActive: 1 });