import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MemberClaimDocument = MemberClaim & Document;

export enum ClaimType {
  REIMBURSEMENT = 'REIMBURSEMENT',
  CASHLESS_PREAUTH = 'CASHLESS_PREAUTH',
}

export enum ClaimCategory {
  CONSULTATION = 'CONSULTATION',
  DIAGNOSTICS = 'DIAGNOSTICS',
  PHARMACY = 'PHARMACY',
  DENTAL = 'DENTAL',
  VISION = 'VISION',
  WELLNESS = 'WELLNESS',
  IPD = 'IPD',
  OPD = 'OPD',
}

export enum ClaimStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNASSIGNED = 'UNASSIGNED',
  ASSIGNED = 'ASSIGNED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  DOCUMENTS_REQUIRED = 'DOCUMENTS_REQUIRED',
  APPROVED = 'APPROVED',
  PARTIALLY_APPROVED = 'PARTIALLY_APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_PROCESSING = 'PAYMENT_PROCESSING',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
  RESUBMISSION_REQUIRED = 'RESUBMISSION_REQUIRED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  PAID = 'PAID',
  FAILED = 'FAILED',
}

@Schema({ timestamps: true, collection: 'memberclaims' })
export class MemberClaim {
  @Prop({ required: true, unique: true })
  claimId: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  memberName: string;

  @Prop()
  memberId: string;

  @Prop()
  patientName: string;

  @Prop({ default: 'SELF' })
  relationToMember: string;

  @Prop({ type: String, enum: ClaimType, required: true })
  claimType: ClaimType;

  @Prop({ type: String, enum: ClaimCategory, required: true })
  category: ClaimCategory;

  @Prop({ required: true })
  treatmentDate: Date;

  @Prop({ required: true })
  providerName: string;

  @Prop()
  providerLocation: string;

  @Prop({ required: true, type: Number })
  billAmount: number;

  @Prop()
  billNumber: string;

  @Prop()
  treatmentDescription: string;

  // Document storage
  @Prop({
    type: [{
      fileName: String,
      originalName: String,
      fileType: String,
      fileSize: Number,
      filePath: String,
      uploadedAt: Date,
      documentType: {
        type: String,
        enum: ['INVOICE', 'PRESCRIPTION', 'REPORT', 'DISCHARGE_SUMMARY', 'OTHER'],
      },
    }],
  })
  documents: {
    fileName: string;
    originalName: string;
    fileType: string;
    fileSize: number;
    filePath: string;
    uploadedAt: Date;
    documentType: string;
  }[];

  // Claim processing details
  @Prop({ type: String, enum: ClaimStatus, default: ClaimStatus.DRAFT })
  status: ClaimStatus;

  @Prop({ type: Number })
  approvedAmount: number;

  @Prop({ type: Number })
  copayAmount: number;

  @Prop({ type: Number })
  walletDebitAmount: number;

  // Per-claim limit auto-cap tracking
  @Prop({ type: Number })
  originalBillAmount: number;

  @Prop({ type: Number })
  cappedAmount: number;

  @Prop({ type: Boolean, default: false })
  wasAutoCapped: boolean;

  @Prop({ type: Number })
  perClaimLimitApplied: number;

  @Prop()
  paymentId: string;

  @Prop()
  transactionId: string;

  @Prop({ type: Number })
  deductibleAmount: number;

  @Prop({ type: Number })
  reimbursableAmount: number;

  // Payment details
  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Prop()
  paymentDate: Date;

  @Prop()
  paymentReferenceNumber: string;

  @Prop()
  paymentMode: string;

  // Processing information
  @Prop()
  submittedAt: Date;

  @Prop()
  reviewedBy: string;

  @Prop()
  reviewedAt: Date;

  @Prop()
  reviewComments: string;

  @Prop()
  rejectionReason: string;

  @Prop()
  internalNotes: string;

  // TPA Assignment fields
  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignedTo: Types.ObjectId;

  @Prop()
  assignedToName: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignedBy: Types.ObjectId;

  @Prop()
  assignedByName: string;

  @Prop()
  assignedAt: Date;

  @Prop({
    type: [{
      previousAssignee: { type: Types.ObjectId, ref: 'User' },
      previousAssigneeName: String,
      newAssignee: { type: Types.ObjectId, ref: 'User' },
      newAssigneeName: String,
      reassignedBy: { type: Types.ObjectId, ref: 'User' },
      reassignedByName: String,
      reassignedAt: Date,
      reason: String,
    }],
  })
  reassignmentHistory: {
    previousAssignee: Types.ObjectId;
    previousAssigneeName: string;
    newAssignee: Types.ObjectId;
    newAssigneeName: string;
    reassignedBy: Types.ObjectId;
    reassignedByName: string;
    reassignedAt: Date;
    reason: string;
  }[];

  // TPA Review fields
  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedByUser: Types.ObjectId;

  @Prop()
  reviewedByName: string;

  @Prop()
  reviewNotes: string;

  @Prop({
    type: [{
      reviewedBy: { type: Types.ObjectId, ref: 'User' },
      reviewedByName: String,
      reviewedAt: Date,
      action: String,
      notes: String,
      previousStatus: String,
      newStatus: String,
    }],
  })
  reviewHistory: {
    reviewedBy: Types.ObjectId;
    reviewedByName: string;
    reviewedAt: Date;
    action: string;
    notes: string;
    previousStatus: string;
    newStatus: string;
  }[];

  // Documents Required fields
  @Prop({ default: false })
  documentsRequired: boolean;

  @Prop()
  documentsRequiredReason: string;

  @Prop()
  documentsRequiredAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  documentsRequiredBy: Types.ObjectId;

  @Prop([String])
  requiredDocumentsList: string[];

  // Approval fields (enhanced)
  @Prop()
  approvalReason: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy: Types.ObjectId;

  @Prop()
  approvedByName: string;

  @Prop()
  approvedAt: Date;

  // Rejection fields (enhanced)
  @Prop({ type: Types.ObjectId, ref: 'User' })
  rejectedBy: Types.ObjectId;

  @Prop()
  rejectedByName: string;

  @Prop()
  rejectedAt: Date;

  @Prop({ type: Number })
  rejectedAmount: number;

  // Cancellation fields
  @Prop()
  cancellationReason: string;

  @Prop()
  cancelledAt: Date;

  // Payment tracking (enhanced)
  @Prop({ type: Number })
  paidAmount: number;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  paidBy: Types.ObjectId;

  @Prop()
  paidByName: string;

  @Prop()
  paymentNotes: string;

  @Prop()
  paymentProcessedAt: Date;

  // Status history
  @Prop({
    type: [{
      status: String,
      changedBy: { type: Types.ObjectId, ref: 'User' },
      changedByName: String,
      changedByRole: String,
      changedAt: Date,
      reason: String,
      notes: String,
    }],
  })
  statusHistory: {
    status: string;
    changedBy: Types.ObjectId;
    changedByName: string;
    changedByRole: string;
    changedAt: Date;
    reason: string;
    notes: string;
  }[];

  // Policy and wallet information
  @Prop({ type: Types.ObjectId, ref: 'Policy' })
  policyId: Types.ObjectId;

  @Prop()
  policyNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'UserPolicyAssignment' })
  assignmentId: Types.ObjectId;

  // Wallet transaction reference
  @Prop({ type: Types.ObjectId, ref: 'WalletTransaction' })
  walletTransactionId: Types.ObjectId;

  // Additional metadata
  @Prop()
  corporateName: string;

  @Prop({ default: false })
  isUrgent: boolean;

  @Prop({ default: false })
  requiresPreAuth: boolean;

  @Prop()
  preAuthNumber: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  createdBy: string;

  @Prop()
  updatedBy: string;
}

export const MemberClaimSchema = SchemaFactory.createForClass(MemberClaim);

// Create indexes for better query performance
MemberClaimSchema.index({ claimId: 1 });
MemberClaimSchema.index({ userId: 1, status: 1 });
MemberClaimSchema.index({ status: 1, createdAt: -1 });
MemberClaimSchema.index({ policyId: 1 });
MemberClaimSchema.index({ treatmentDate: -1 });
MemberClaimSchema.index({ submittedAt: -1 });
// TPA indexes
MemberClaimSchema.index({ assignedTo: 1, status: 1 });
MemberClaimSchema.index({ assignedBy: 1 });
MemberClaimSchema.index({ assignedAt: -1 });
MemberClaimSchema.index({ status: 1, assignedTo: 1 });
// Payment indexes
MemberClaimSchema.index({ paymentStatus: 1, status: 1 });
MemberClaimSchema.index({ paidBy: 1 });
MemberClaimSchema.index({ paymentProcessedAt: -1 });