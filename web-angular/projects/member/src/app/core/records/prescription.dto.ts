/**
 * Health records are two separate prescription sources, exactly as
 * web-member/app/member/health-records/page.tsx fetches them:
 *
 *   GET /member/prescriptions?userId=          uploaded / scanned
 *   GET /member/digital-prescriptions?userId=  doctor-issued
 *
 * Both share the `{ message, prescriptions, total, page, totalPages }`
 * envelope.
 */

export interface MedicineDto {
  medicineName?: string;
  genericName?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  route?: string;
  instructions?: string;
}

/** Populated appointment reference on a digital prescription. */
export interface PrescriptionAppointmentDto {
  appointmentId?: string;
  specialty?: string;
  appointmentDate?: string;
  appointmentType?: string;
}

export interface DigitalPrescriptionDto {
  _id?: string;
  prescriptionId?: string;
  appointmentId?: PrescriptionAppointmentDto | string;
  doctorName?: string;
  doctorQualification?: string;
  doctorSpecialty?: string;
  patientName?: string;
  chiefComplaint?: string;
  diagnosis?: string;
  medicines?: MedicineDto[];
  labTests?: unknown[];
  followUpDate?: string;
  isEmergency?: boolean;
  pdfGenerated?: boolean;
  createdDate?: string;
  createdAt?: string;
}

/** Uploaded prescriptions carry a file rather than structured medicines. */
export interface UploadedPrescriptionDto {
  _id?: string;
  prescriptionId?: string;
  patientName?: string;
  doctorName?: string;
  fileName?: string;
  originalName?: string;
  fileType?: string;
  uploadedAt?: string;
  createdAt?: string;
  notes?: string;
}

export interface PrescriptionsResponseDto<T> {
  message?: string;
  prescriptions?: T[];
  total?: number;
  page?: number;
  totalPages?: number;
}
