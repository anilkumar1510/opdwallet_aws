import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '@/common/constants/roles.enum';
import { UserStatus } from '@/common/constants/status.enum';

export type InternalUserDocument = InternalUser & Document;

/**
 * Internal User Schema
 * For internal staff only: SUPER_ADMIN, ADMIN, TPA_ADMIN, TPA_USER, FINANCE_ADMIN, FINANCE_USER, OPS_ADMIN, OPS_USER
 * Excludes MEMBER and DOCTOR roles
 */
@Schema({
  timestamps: true,
  collection: 'internal_users',
})
export class InternalUser {
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
  employeeId!: string;

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
    type: {
      countryCode: { type: String, default: '+91' },
      number: { type: String, required: true },
    },
    required: true,
  })
  phone!: {
    countryCode: string;
    number: string;
  };

  @Prop({
    required: true,
    enum: [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.TPA_ADMIN,
      UserRole.TPA_USER,
      UserRole.FINANCE_ADMIN,
      UserRole.FINANCE_USER,
      UserRole.OPS_ADMIN,
      UserRole.OPS_USER,
    ],
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

  // Internal-specific fields
  @Prop()
  department?: string;

  @Prop()
  designation?: string;

  @Prop({
    type: String,
    ref: 'InternalUser',
  })
  reportingTo?: string;

  // Enhanced security for internal users
  @Prop({ default: false })
  mfaEnabled!: boolean;

  @Prop({ type: [String] })
  allowedIPs?: string[];

  @Prop({ type: Date })
  lastLoginAt?: Date;

  @Prop({ type: String })
  lastLoginIP?: string;

  // Address information
  @Prop({
    type: {
      line1: { type: String, required: true },
      line2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
  })
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };

  // Discriminator for user type
  @Prop({ default: 'internal', immutable: true })
  userType!: string;

  @Prop()
  createdBy?: string;

  @Prop()
  updatedBy?: string;
}

export const InternalUserSchema = SchemaFactory.createForClass(InternalUser);

// Indexes
InternalUserSchema.index({ userId: 1 });
InternalUserSchema.index({ employeeId: 1 });
InternalUserSchema.index({ email: 1 });
InternalUserSchema.index({ phone: 1 });
InternalUserSchema.index({ role: 1, status: 1 });
InternalUserSchema.index({ department: 1 });
InternalUserSchema.index({ reportingTo: 1 });
InternalUserSchema.index({ lastLoginAt: -1 });

// Pre-save hook
InternalUserSchema.pre('save', async function (next) {
  // Auto-generate fullName
  if (this.name) {
    this.name.fullName = `${this.name.firstName} ${this.name.lastName}`;
  }

  // Validate that role is not MEMBER or DOCTOR
  if (this.role === UserRole.MEMBER || this.role === UserRole.DOCTOR) {
    throw new Error(
      'Internal users cannot have MEMBER or DOCTOR role. Use Member collection for members and doctors.',
    );
  }

  next();
});
