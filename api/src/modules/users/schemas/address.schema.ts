import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AddressDocument = Address & Document;

@Schema({
  timestamps: true,
  collection: 'addresses',
})
export class Address {
  @Prop({
    required: true,
    unique: true,
    immutable: true,
  })
  addressId!: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId!: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['HOME', 'WORK', 'OTHER'],
    default: 'HOME',
  })
  addressType!: string;

  @Prop({ required: true })
  addressLine1!: string;

  @Prop()
  addressLine2?: string;

  @Prop({ required: true })
  city!: string;

  @Prop({ required: true })
  state!: string;

  @Prop({ required: true })
  pincode!: string;

  @Prop()
  landmark?: string;

  @Prop({ default: false })
  isDefault!: boolean;
}

export const AddressSchema = SchemaFactory.createForClass(Address);

// Indexes for better query performance
AddressSchema.index({ userId: 1 });
AddressSchema.index({ userId: 1, isDefault: 1 });
AddressSchema.index({ addressId: 1 });
