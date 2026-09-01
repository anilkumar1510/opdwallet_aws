import { toDate } from '../domain/codes';
import {
  DigitalPrescriptionDto,
  MedicineDto,
  UploadedPrescriptionDto,
} from './prescription.dto';
import { Medicine, Prescription, PrescriptionSource } from './prescription.model';

/**
 * Every URL these two sources use, beside the shapes they return. Changing an
 * endpoint means editing this file only — including the download paths, which
 * differ per source.
 */
export const RECORDS_API = {
  digital: 'member/digital-prescriptions',
  uploaded: 'member/prescriptions',
  digitalDownload: (prescriptionId: string) =>
    `member/digital-prescriptions/${prescriptionId}/download-pdf`,
  uploadedDownload: (prescriptionId: string) =>
    `member/prescriptions/${prescriptionId}/download`,
} as const;

function toMedicine(dto: MedicineDto): Medicine {
  const name = [dto.medicineName?.trim(), dto.genericName?.trim()]
    .filter(Boolean)
    // Only show the generic when it adds something the brand name does not.
    .filter((value, index, all) => index === 0 || !all[0]?.includes(value ?? ''))
    .join(' · ');

  return {
    name: name || 'Medicine',
    schedule:
      [dto.dosage?.trim(), dto.frequency?.trim(), dto.duration?.trim()]
        .filter(Boolean)
        .join(' · ') || 'As directed',
    instructions: [dto.route?.trim(), dto.instructions?.trim()].filter(Boolean).join(' · ') || null,
  };
}

export function toDigitalPrescription(dto: DigitalPrescriptionDto): Prescription {
  return {
    id: dto._id ?? dto.prescriptionId ?? '',
    reference: dto.prescriptionId ?? '',
    source: PrescriptionSource.Digital,
    sourceLabel: 'Doctor issued',
    patientName: dto.patientName?.trim() || 'Member',
    doctorName: dto.doctorName?.trim() ? `Dr. ${dto.doctorName.trim()}` : 'Doctor',
    doctorSpecialty: dto.doctorSpecialty?.trim() || null,
    diagnosis: dto.diagnosis?.trim() || null,
    chiefComplaint: dto.chiefComplaint?.trim() || null,
    medicines: (dto.medicines ?? []).map(toMedicine),
    labTestCount: dto.labTests?.length ?? 0,
    issuedAt: toDate(dto.createdDate ?? dto.createdAt),
    followUpDate: toDate(dto.followUpDate),
    isEmergency: dto.isEmergency === true,
    hasDownload: dto.pdfGenerated === true,
    downloadPath: dto.prescriptionId ? RECORDS_API.digitalDownload(dto.prescriptionId) : null,
  };
}

export function toUploadedPrescription(dto: UploadedPrescriptionDto): Prescription {
  return {
    id: dto._id ?? dto.prescriptionId ?? '',
    reference: dto.prescriptionId ?? '',
    source: PrescriptionSource.Uploaded,
    sourceLabel: 'Uploaded',
    patientName: dto.patientName?.trim() || 'Member',
    doctorName: dto.doctorName?.trim() || 'Not recorded',
    doctorSpecialty: null,
    diagnosis: null,
    chiefComplaint: dto.notes?.trim() || null,
    // An uploaded prescription is a file, so there is nothing structured here.
    medicines: [],
    labTestCount: 0,
    issuedAt: toDate(dto.uploadedAt ?? dto.createdAt),
    followUpDate: null,
    isEmergency: false,
    hasDownload: Boolean(dto.fileName),
    downloadPath: dto.prescriptionId ? RECORDS_API.uploadedDownload(dto.prescriptionId) : null,
  };
}
