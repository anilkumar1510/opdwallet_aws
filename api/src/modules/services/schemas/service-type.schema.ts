import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ServiceTypeDocument = ServiceType & Document;

@Schema({
  timestamps: true,
  collection: 'service_master',
})
export class ServiceType {
  @Prop({
    required: true,
    unique: true,
    trim: true,
  })
  code!: string;

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
    required: true,
    trim: true,
  })
  category!: string; // e.g., 'CONSULTATION', 'DIAGNOSTIC', 'PHARMACY', 'PROCEDURE', 'PREVENTIVE'

  @Prop({
    default: true,
  })
  isActive!: boolean;

  @Prop({
    type: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
  })
  priceRange?: {
    min: number;
    max: number;
  };

  @Prop({
    type: [String],
    default: [],
  })
  requiredDocuments?: string[];

  @Prop({
    type: Number,
    min: 0,
    max: 100,
    default: 100,
  })
  coveragePercentage?: number;

  @Prop({
    type: Number,
    min: 0,
    default: 0,
  })
  copayAmount?: number;

  @Prop({
    default: false,
  })
  requiresPreAuth?: boolean;

  @Prop({
    default: false,
  })
  requiresReferral?: boolean;

  @Prop({
    type: Number,
    min: 0,
  })
  waitingPeriodDays?: number;

  @Prop({
    type: Number,
    min: 0,
  })
  annualLimit?: number;

  @Prop({
    type: Number,
    min: 0,
  })
  perClaimLimit?: number;

  @Prop()
  createdBy?: string;

  @Prop()
  updatedBy?: string;
}

export const ServiceTypeSchema = SchemaFactory.createForClass(ServiceType);