import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '@/common/constants/roles.enum';
import { UserStatus, RelationshipType } from '@/common/constants/status.enum';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User {
  @Prop({
    required: true,
    unique: true,
    immutable: true,
  })
  userId!: string;

  @Prop({
    required: true,
    unique: true,
  })
  uhid!: string;

  @Prop({
    required: true,
    unique: true,
  })
  memberId!: string;

  @Prop({
    unique: true,
    sparse: true,
  })
  employeeId?: string;

  @Prop({
    required: true,
    enum: RelationshipType,
    default: RelationshipType.SELF,
  })
  relationship!: RelationshipType;

  @Prop({
    required: function() {
      return this.relationship !== RelationshipType.SELF;
    },
  })
  primaryMemberId?: string;

  @Prop({
    type: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      fullName: { type: String },
    },
  })
  name!: {
    firstName: string;
    lastName: string;
    fullName?: string;
  };

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
  })
  email!: string;

  @Prop({
    required: true,
    unique: true,
  })
  phone!: string;

  @Prop({ type: Date })
  dob?: Date;

  @Prop({ enum: ['MALE', 'FEMALE', 'OTHER'] })
  gender?: string;

  @Prop()
  corporateName?: string;

  @Prop({
    type: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
    },
  })
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };

  @Prop({
    required: true,
    enum: UserRole,
    default: UserRole.MEMBER,
  })
  role!: UserRole;

  @Prop({
    required: true,
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ default: false })
  mustChangePassword!: boolean;

  @Prop()
  createdBy?: string;

  @Prop()
  updatedBy?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ uhid: 1 });
UserSchema.index({ memberId: 1 });
UserSchema.index({ employeeId: 1 }, { sparse: true });
UserSchema.index({ userId: 1 });
UserSchema.index({ primaryMemberId: 1, relationship: 1 });

UserSchema.pre('save', function(next) {
  if (this.name) {
    this.name.fullName = `${this.name.firstName} ${this.name.lastName}`;
  }
  next();
});