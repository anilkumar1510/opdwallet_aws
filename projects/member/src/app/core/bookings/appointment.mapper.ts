import { ClaimStatus } from '../claims/claim.model';
import { toDate } from '../domain/codes';
import { money } from '../domain/money';
import { AppointmentDto } from './appointment.dto';
import { Appointment, AppointmentMode } from './appointment.model';

const STATUSES: Readonly<Record<string, ClaimStatus>> = {
  SCHEDULED: { label: 'Scheduled', tone: 'progress', isFinal: false },
  CONFIRMED: { label: 'Confirmed', tone: 'positive', isFinal: false },
  COMPLETED: { label: 'Completed', tone: 'neutral', isFinal: true },
  CANCELLED: { label: 'Cancelled', tone: 'negative', isFinal: true },
  NO_SHOW: { label: 'Missed', tone: 'negative', isFinal: true },
};

function toStatus(value: string | undefined): ClaimStatus {
  const key = value?.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (key && STATUSES[key]) return STATUSES[key];
  const label = key ? key.replace(/_+/g, ' ').toLowerCase() : 'unknown';
  return { label: label.charAt(0).toUpperCase() + label.slice(1), tone: 'neutral', isFinal: false };
}

/**
 * The API sends a date-only string plus a separate display slot ("2:00 PM").
 * Parsing the slot back into the date would be guesswork across formats, so
 * the date carries the day and `timeSlot` stays the API's own label.
 */
function toScheduledFor(dto: AppointmentDto): Date | null {
  return toDate(dto.appointmentDate);
}

export function toAppointment(dto: AppointmentDto, now: Date): Appointment {
  const mode =
    dto.appointmentType?.trim().toUpperCase() === 'ONLINE'
      ? AppointmentMode.Online
      : AppointmentMode.InClinic;
  const scheduledFor = toScheduledFor(dto);
  const status = toStatus(dto.status);

  // Compare on the day, since the API gives no appointment time we can trust.
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return {
    id: dto._id ?? dto.appointmentId ?? '',
    reference: dto.appointmentId ?? dto.appointmentNumber ?? '',
    patientName: dto.patientName?.trim() || 'Member',
    doctorName: dto.doctorName?.trim() ? `Dr. ${dto.doctorName.trim()}` : 'Doctor to be assigned',
    specialty: dto.specialty?.trim() || 'General',
    mode,
    modeLabel: mode === AppointmentMode.Online ? 'Video consultation' : 'In clinic',
    location:
      mode === AppointmentMode.Online
        ? 'Video consultation'
        : dto.clinicName?.trim() || 'Clinic to be confirmed',
    scheduledFor,
    timeSlot: dto.timeSlot?.trim() || '',
    fee: money(dto.consultationFee),
    hasPrescription: dto.hasPrescription === true,
    status,
    isUpcoming: !status.isFinal && scheduledFor !== null && scheduledFor >= today,
  };
}
