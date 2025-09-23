import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RelationshipMasterDocument = RelationshipMaster & Document;

@Schema({
  timestamps: true,
  collection: 'relationship_masters',
})
export class RelationshipMaster {
  @Prop({
    required: true,
    unique: true,
    uppercase: true,
  })
  relationshipCode!: string;

  @Prop({
    required: true,
  })
  relationshipName!: string;

  @Prop({
    required: true,
  })
  displayName!: string;

  @Prop()
  description?: string;

  @Prop({
    default: true,
  })
  isActive!: boolean;

  @Prop({
    default: 1,
  })
  sortOrder!: number;

  @Prop()
  createdBy?: string;

  @Prop()
  updatedBy?: string;
}

export const RelationshipMasterSchema = SchemaFactory.createForClass(RelationshipMaster);

RelationshipMasterSchema.index({ relationshipCode: 1 });
RelationshipMasterSchema.index({ isActive: 1, sortOrder: 1 });