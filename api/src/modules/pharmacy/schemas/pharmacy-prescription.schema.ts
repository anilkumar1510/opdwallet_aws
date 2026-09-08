import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * The prescription a pharmacy order is built from — flow 5 steps 2 and 3.
 *
 * "The member uploads a prescription and the adjudicator builds the cart." The
 * prescription is the ONLY thing the member submits, so it is the record the
 * whole journey hangs off: the queue works on it, the duplicate check works on
 * it, and the cart is written against it by someone else.
 *
 * Deliberately the same shape as `LabPrescription`. That module already runs
 * this exact pattern — upload, queue, digitise into a cart — and two
 * prescription lifecycles that differ only in their field names would be two
 * things to learn and two places for the same bug.
 */
export enum PharmacyPrescriptionStatus {
  UPLOADED = 'UPLOADED',
  DIGITIZING = 'DIGITIZING',
  DIGITIZED = 'DIGITIZED',
  CANCELLED = 'CANCELLED',
}

export enum PharmacyPrescriptionSource {
  UPLOAD = 'UPLOAD',
  HEALTH_RECORD = 'HEALTH_RECORD',
}

@Schema({ timestamps: true, collection: 'pharmacy_prescriptions' })
export class PharmacyPrescription extends Document {
  /** Step 3's "unique prescription identifier" — what the queue and the duplicate check run on. */
  @Prop({ required: true, unique: true })
  prescriptionId: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  patientId: string;

  @Prop({ required: true })
  patientName: string;

  @Prop({ required: true, enum: PharmacyPrescriptionSource })
  source: PharmacyPrescriptionSource;

  @Prop()
  fileName?: string;

  @Prop()
  originalName?: string;

  @Prop()
  filePath?: string;

  /**
   * Step 3's duplicate check.
   *
   * A sha256 of the uploaded bytes. Nothing else in this system has a duplicate
   * check of any kind, so this is the first: the same photograph submitted
   * twice for the same patient is the same prescription, whatever it is named.
   */
  @Prop({ index: true })
  fileHash?: string;

  /** Set when the member picked one already in their health records. */
  @Prop()
  healthRecordId?: string;

  @Prop({
    required: true,
    enum: PharmacyPrescriptionStatus,
    default: PharmacyPrescriptionStatus.UPLOADED,
    index: true,
  })
  status: PharmacyPrescriptionStatus;

  /** The cart the adjudicator built from it — step 4. */
  @Prop()
  cartId?: string;

  /** Who digitised it, and when. */
  @Prop()
  digitizedBy?: string;

  @Prop()
  digitizedAt?: Date;

  @Prop()
  cancellationReason?: string;
}

export type PharmacyPrescriptionDocument = PharmacyPrescription;
export const PharmacyPrescriptionSchema = SchemaFactory.createForClass(PharmacyPrescription);

// One member cannot submit the same file twice for the same patient — step 3.
PharmacyPrescriptionSchema.index(
  { userId: 1, patientId: 1, fileHash: 1 },
  { unique: true, partialFilterExpression: { fileHash: { $type: 'string' } } },
);
