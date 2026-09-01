import { ClaimStatus } from '../claims/claim.model';
import { Money } from '../domain/money';

export const AppointmentMode = {
  Online: 'ONLINE',
  InClinic: 'IN_CLINIC',
} as const;

export type AppointmentMode = (typeof AppointmentMode)[keyof typeof AppointmentMode];

export interface Appointment {
  readonly id: string;
  readonly reference: string;
  readonly patientName: string;
  readonly doctorName: string;
  readonly specialty: string;
  readonly mode: AppointmentMode;
  readonly modeLabel: string;
  /** Where it happens: clinic name for in-clinic, or the video label. */
  readonly location: string;
  readonly scheduledFor: Date | null;
  readonly timeSlot: string;
  readonly fee: Money;
  readonly hasPrescription: boolean;
  /** Reuses the claim status shape — same label/tone/isFinal contract. */
  readonly status: ClaimStatus;
  readonly isUpcoming: boolean;
}
