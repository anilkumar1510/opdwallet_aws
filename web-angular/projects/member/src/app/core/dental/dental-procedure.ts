import { toDate } from '../domain/codes';
import { Money, money } from '../domain/money';

/**
 * The dental procedure route — patient-flows flow 4, steps 18 to 33.
 *
 * It is a separate journey from the consultation, not a continuation: its own
 * estimate, its own approved value, its own slot and its own payment. The one
 * thing it inherits is the clinic, because the sheet requires the procedure to
 * happen where it was recommended.
 */
export const DENTAL_PROCEDURE_API = {
  list: 'member/dental/procedures',
  byId: (procedureId: string) => `member/dental/procedures/${procedureId}`,
  create: 'member/dental/procedures',
  schedule: (procedureId: string) => `member/dental/procedures/${procedureId}/schedule`,
  /**
   * Development only — the API refuses it elsewhere. Stands in for operations
   * at whichever step the procedure is waiting on, so the route can be walked.
   */
  demoAdvance: (procedureId: string) => `member/dental/procedures/${procedureId}/demo-advance`,
} as const;

export interface DentalProcedureDto {
  procedureId?: string;
  bookingId?: string;
  status?: string;
  clinicId?: string;
  clinicName?: string;
  doctorName?: string;
  patientName?: string;
  estimateAmount?: number;
  approvedAmount?: number;
  copayAmount?: number;
  walletPays?: number;
  memberPays?: number;
  procedureNotes?: string;
  adjudicationNotes?: string;
  rejectionReason?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  paymentId?: string;
  createdAt?: string;
}

export interface DentalProcedure {
  readonly id: string;
  readonly bookingId: string;
  readonly statusCode: string;
  readonly statusLabel: string;
  /** Needed to ask the clinic for its slots — step 24 books real availability. */
  readonly clinicId: string;
  readonly clinicName: string;
  /** Null: dental holds no dentist, which is why step 24 cannot be enforced. */
  readonly doctorName: string | null;
  readonly patientName: string;
  readonly estimate: Money;
  readonly approved: Money;
  readonly copay: Money;
  readonly walletPays: Money;
  readonly memberPays: Money;
  readonly notes: string | null;
  readonly adjudicationNotes: string | null;
  readonly rejectionReason: string | null;
  readonly appointmentDate: string | null;
  readonly appointmentTime: string | null;
  readonly paymentId: string | null;
  readonly placedAt: Date | null;
  /** Adjudicated and waiting for the member to pick a slot and pay. */
  readonly isCartReady: boolean;
  readonly isRejected: boolean;
  /** Still moving: not rejected, cancelled or finished. */
  readonly isOpen: boolean;
}

const STATUS_LABELS: Readonly<Record<string, string>> = {
  PENDING_ADJUDICATION: 'Being reviewed',
  CART_READY: 'Ready to book',
  AWAITING_PAYMENT: 'Awaiting your payment',
  PAID: 'Paid, awaiting confirmation',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  REJECTED: 'Not approved',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'Missed',
};

export function toDentalProcedure(dto: DentalProcedureDto): DentalProcedure {
  const status = dto.status?.trim() ?? 'PENDING_ADJUDICATION';
  return {
    id: dto.procedureId ?? '',
    bookingId: dto.bookingId ?? '',
    statusCode: status,
    // An unrecognised status shows its raw value rather than a wrong friendly
    // one — a new server status must not silently read as something else.
    statusLabel: STATUS_LABELS[status] ?? status,
    clinicId: dto.clinicId?.trim() ?? '',
    clinicName: dto.clinicName?.trim() || 'the clinic',
    doctorName: dto.doctorName?.trim() || null,
    patientName: dto.patientName?.trim() || '',
    estimate: money(dto.estimateAmount),
    approved: money(dto.approvedAmount),
    copay: money(dto.copayAmount),
    walletPays: money(dto.walletPays),
    memberPays: money(dto.memberPays),
    notes: dto.procedureNotes?.trim() || null,
    adjudicationNotes: dto.adjudicationNotes?.trim() || null,
    rejectionReason: dto.rejectionReason?.trim() || null,
    appointmentDate: dto.appointmentDate?.trim() || null,
    appointmentTime: dto.appointmentTime?.trim() || null,
    paymentId: dto.paymentId?.trim() || null,
    placedAt: toDate(dto.createdAt),
    isCartReady: status === 'CART_READY',
    isRejected: status === 'REJECTED',
    isOpen: !['REJECTED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(status),
  };
}
