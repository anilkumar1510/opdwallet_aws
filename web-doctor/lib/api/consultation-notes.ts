export interface ClinicalFindings {
  generalExamination?: string;
  systemicExamination?: string;
  localExamination?: string;
}

export interface ConsultationNote {
  _id: string;
  noteId: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  clinicId: string;
  consultationDate: string;
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  clinicalFindings?: ClinicalFindings;
  provisionalDiagnosis?: string;
  investigationsOrdered: string[];
  treatmentPlan?: string;
  followUpInstructions?: string;
  nextFollowUpDate?: string;
  additionalNotes?: string;
  privateNotes?: string;
  prescriptionId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConsultationNoteDto {
  appointmentId: string;
  patientId: string;
  clinicId: string;
  consultationDate: string;
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  clinicalFindings?: ClinicalFindings;
  provisionalDiagnosis?: string;
  investigationsOrdered?: string[];
  treatmentPlan?: string;
  followUpInstructions?: string;
  nextFollowUpDate?: string;
  additionalNotes?: string;
  privateNotes?: string;
}

export interface UpdateConsultationNoteDto {
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  clinicalFindings?: ClinicalFindings;
  provisionalDiagnosis?: string;
  investigationsOrdered?: string[];
  treatmentPlan?: string;
  followUpInstructions?: string;
  nextFollowUpDate?: string;
  additionalNotes?: string;
  privateNotes?: string;
}

export async function createConsultationNote(data: CreateConsultationNoteDto): Promise<ConsultationNote> {
  const response = await fetch('/doctor/api/doctor/consultation-notes', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create consultation note');
  }

  const result = await response.json();
  return result.data;
}

export async function getConsultationNoteByAppointment(appointmentId: string): Promise<ConsultationNote | null> {
  const response = await fetch(`/doctor/api/doctor/consultation-notes/appointment/${appointmentId}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch consultation note');
  }

  const result = await response.json();
  return result.data;
}

export async function getConsultationNotesByPatient(patientId: string): Promise<ConsultationNote[]> {
  const response = await fetch(`/doctor/api/doctor/consultation-notes/patient/${patientId}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch consultation notes');
  }

  const result = await response.json();
  return result.data;
}

export async function getConsultationNote(noteId: string): Promise<ConsultationNote> {
  const response = await fetch(`/doctor/api/doctor/consultation-notes/${noteId}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch consultation note');
  }

  const result = await response.json();
  return result.data;
}

export async function updateConsultationNote(
  noteId: string,
  data: UpdateConsultationNoteDto
): Promise<ConsultationNote> {
  const response = await fetch(`/doctor/api/doctor/consultation-notes/${noteId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update consultation note');
  }

  const result = await response.json();
  return result.data;
}

export async function deleteConsultationNote(noteId: string): Promise<void> {
  const response = await fetch(`/doctor/api/doctor/consultation-notes/${noteId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete consultation note');
  }
}

export async function linkPrescriptionToNote(noteId: string, prescriptionId: string): Promise<ConsultationNote> {
  const response = await fetch(`/doctor/api/doctor/consultation-notes/${noteId}/link-prescription`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prescriptionId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to link prescription to note');
  }

  const result = await response.json();
  return result.data;
}
