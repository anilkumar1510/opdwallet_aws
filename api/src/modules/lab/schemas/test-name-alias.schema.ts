import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'test_name_aliases' })
export class TestNameAlias extends Document {
  @Prop({ required: true, unique: true })
  aliasId: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'MasterTestParameter' })
  masterParameterId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'LabVendor' })
  vendorId: Types.ObjectId;

  @Prop({ required: true })
  vendorTestName: string; // Vendor-specific test name (e.g., "CBC1", "Complete Blood Count Premium")

  @Prop()
  vendorTestCode?: string; // Vendor-specific test code

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const TestNameAliasSchema = SchemaFactory.createForClass(TestNameAlias);

// Indexes
TestNameAliasSchema.index({ aliasId: 1 }, { unique: true });
TestNameAliasSchema.index({ vendorId: 1, masterParameterId: 1 });
TestNameAliasSchema.index({ vendorId: 1, vendorTestName: 1 }, { unique: true }); // Same vendor can't have duplicate test names
TestNameAliasSchema.index({ vendorTestName: 'text', vendorTestCode: 'text' }); // Text search
