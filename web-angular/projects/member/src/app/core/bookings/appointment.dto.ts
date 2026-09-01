/**
 * Transport shape for GET /appointments/user/:userId.
 * Source: api/src/modules/appointments/appointments.controller.ts
 */
export interface AppointmentDto {
  _id?: string;
  appointmentId?: string;
  appointmentNumber?: string;
  patientName?: string;
  patientId?: string;
  doctorName?: string;
  specialty?: string;
  clinicName?: string;
  clinicAddress?: string;
  appointmentType?: string;
  /** Date only, e.g. "2026-08-05". */
  appointmentDate?: string;
  timeSlot?: string;
  consultationFee?: number;
  status?: string;
  hasPrescription?: boolean;
  /** Present on the ongoing-appointment payload; used to open the prescription directly. */
  prescriptionId?: string;
  createdAt?: string;
}
