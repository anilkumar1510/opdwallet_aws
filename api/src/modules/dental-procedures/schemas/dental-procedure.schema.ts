import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * The procedure route — patient-flows flow 4, steps 18 to 33.
 *
 * It begins where the consultation ends: the dentist recommended something, the
 * member has the estimate, and it is adjudicated before any money moves. That
 * ordering is the whole point of the route, and it is why this is a separate
 * record rather than more fields on the booking — a procedure has its own
 * estimate, its own approved value, its own slot and its own payment.
 */
export enum DentalProcedureStatus {
  /** Estimate captured, cart on hold, nothing charged — steps 18-19. */
  PENDING_ADJUDICATION = 'PENDING_ADJUDICATION',
  /** Adjudicator built the cart with an approved value — steps 20-22. */
  CART_READY = 'CART_READY',
  /**
   * Slot chosen, wallet share taken, copay still outstanding — between steps
   * 26 and 27. A procedure with nothing left to pay never rests here; it goes
   * straight to PAID, because there is no payment to wait for.
   */
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  /** Slot chosen and paid in full — steps 24-27. */
  PAID = 'PAID',
  /** Operations confirmed the slot with the clinic — steps 28-29. */
  CONFIRMED = 'CONFIRMED',
  /** Visit done, invoice raised — steps 31-32. */
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

@Schema({ timestamps: true, collection: 'dental_procedures' })
export class DentalProcedure extends Document {
  @Prop({ required: true, unique: true })
  procedureId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  /**
   * The consultation this came out of.
   *
   * Kept because the sheet is explicit that the estimate is captured "against
   * the same prescription and the same dentist" — the procedure is not a fresh
   * booking, and the slot must come from the dentist who recommended it.
   */
  @Prop({ required: true, index: true })
  bookingId: string;

  @Prop({ required: true })
  clinicId: string;

  @Prop({ required: true })
  clinicName: string;

  /**
   * The dentist, when one is known — and today one is not.
   *
   * Flow 4 step 24 says slots are "restricted to the same dentist who
   * recommended the procedure". That rule CANNOT be enforced: a dental booking
   * records a clinic and no dentist at all (`dental-booking.schema.ts` has
   * clinicId, clinicName, clinicAddress, clinicContact — no doctor field), so
   * there is nothing to carry forward or match against.
   *
   * Optional rather than faked. The clinic below is what the procedure is
   * actually tied to, and the same-dentist constraint needs the booking to
   * start recording a dentist before it can mean anything.
   */
  @Prop()
  doctorId?: string;

  @Prop()
  doctorName?: string;

  @Prop({ required: true })
  patientName: string;

  /** What the dentist quoted — step 18. The member's figure, not ours. */
  @Prop({ type: Number, required: true })
  estimateAmount: number;

  @Prop()
  procedureNotes?: string;

  /**
   * What adjudication approved — step 21.
   *
   * Distinct from the estimate on purpose: the sheet says the member "can see
   * what was approved and what was not", so the two are kept side by side
   * rather than the estimate being overwritten.
   */
  @Prop({ type: Number, default: 0 })
  approvedAmount: number;

  @Prop({ type: Number, default: 0 })
  copayAmount: number;

  @Prop({ type: Number, default: 0 })
  walletPays: number;

  @Prop({ type: Number, default: 0 })
  memberPays: number;

  @Prop()
  adjudicationNotes?: string;

  @Prop()
  rejectionReason?: string;

  /** Same dentist as the consultation — step 24. */
  @Prop()
  appointmentDate?: string;

  @Prop()
  appointmentTime?: string;

  @Prop()
  paymentId?: string;

  @Prop({
    type: String,
    enum: DentalProcedureStatus,
    default: DentalProcedureStatus.PENDING_ADJUDICATION,
    index: true,
  })
  status: DentalProcedureStatus;

  @Prop()
  adjudicatedAt?: Date;

  @Prop()
  paidAt?: Date;

  @Prop()
  confirmedAt?: Date;

  @Prop()
  completedAt?: Date;
}

export const DentalProcedureSchema = SchemaFactory.createForClass(DentalProcedure);
