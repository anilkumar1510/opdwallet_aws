import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BenefitComponentDocument = BenefitComponent & Document;

// Individual component configurations
@Schema({ _id: false })
export class ConsultationConfig {
  @Prop({ required: true, default: false })
  enabled: boolean;

  @Prop({ type: Number, min: 0 })
  annualAmountLimit?: number;

  @Prop({ type: Number, min: 0 })
  visitsLimit?: number;

  @Prop({ type: Boolean })
  rxRequired?: boolean;

  @Prop({ type: String, maxlength: 500 })
  notes?: string;
}

@Schema({ _id: false })
export class PharmacyConfig {
  @Prop({ required: true, default: false })
  enabled: boolean;

  @Prop({ type: Number, min: 0 })
  annualAmountLimit?: number;

  @Prop({ type: Boolean })
  rxRequired?: boolean;

  @Prop({ type: String, maxlength: 500 })
  notes?: string;
}

@Schema({ _id: false })
export class DiagnosticsConfig {
  @Prop({ required: true, default: false })
  enabled: boolean;

  @Prop({ type: Number, min: 0 })
  annualAmountLimit?: number;

  @Prop({ type: Number, min: 0 })
  visitsLimit?: number;

  @Prop({ type: Boolean })
  rxRequired?: boolean;

  @Prop({ type: String, maxlength: 500 })
  notes?: string;
}

@Schema({ _id: false })
export class AHCConfig {
  @Prop({ required: true, default: false })
  enabled: boolean;

  @Prop({ type: Boolean })
  includesFasting?: boolean;

  @Prop({ type: String, maxlength: 500 })
  notes?: string;
}

@Schema({ _id: false })
export class SimpleComponentConfig {
  @Prop({ required: true, default: false })
  enabled: boolean;

  @Prop({ type: String, maxlength: 500 })
  notes?: string;
}

@Schema({ _id: false })
export class ComponentsConfig {
  @Prop({ type: ConsultationConfig })
  consultation?: ConsultationConfig;

  @Prop({ type: PharmacyConfig })
  pharmacy?: PharmacyConfig;

  @Prop({ type: DiagnosticsConfig })
  diagnostics?: DiagnosticsConfig;

  @Prop({ type: AHCConfig })
  ahc?: AHCConfig;

  @Prop({ type: SimpleComponentConfig })
  vaccination?: SimpleComponentConfig;

  @Prop({ type: SimpleComponentConfig })
  dental?: SimpleComponentConfig;

  @Prop({ type: SimpleComponentConfig })
  vision?: SimpleComponentConfig;

  @Prop({ type: SimpleComponentConfig })
  wellness?: SimpleComponentConfig;
}

@Schema({
  timestamps: true,
  collection: 'benefitComponents',
})
export class BenefitComponent {
  @Prop({
    type: Types.ObjectId,
    ref: 'Policy',
    required: true,
  })
  policyId: Types.ObjectId;

  @Prop({
    type: Number,
    required: true,
    min: 1,
  })
  planVersion: number;

  @Prop({ type: ComponentsConfig })
  components: ComponentsConfig;

  @Prop()
  createdBy?: string;

  @Prop()
  updatedBy?: string;
}

export const BenefitComponentSchema = SchemaFactory.createForClass(BenefitComponent);

// Create unique compound index
BenefitComponentSchema.index({ policyId: 1, planVersion: 1 }, { unique: true });