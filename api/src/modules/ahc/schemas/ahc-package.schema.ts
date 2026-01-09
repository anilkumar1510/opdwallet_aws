import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'ahc_packages' })
export class AhcPackage extends Document {
  @Prop({ required: true, unique: true })
  packageId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  effectiveFrom: Date;

  @Prop({ required: true })
  effectiveTo: Date;

  @Prop({ type: [String], default: [] })
  labServiceIds: string[];

  @Prop({ type: [String], default: [] })
  diagnosticServiceIds: string[];

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const AhcPackageSchema = SchemaFactory.createForClass(AhcPackage);

// Indexes
AhcPackageSchema.index({ packageId: 1 }, { unique: true });
AhcPackageSchema.index({ effectiveFrom: 1, effectiveTo: 1 });
AhcPackageSchema.index({ isActive: 1 });
