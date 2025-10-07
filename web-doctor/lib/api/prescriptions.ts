export interface Prescription {
  _id: string;
  prescriptionId: string;
  appointmentId: string;
  doctorId: string;
  doctorName: string;
  userId: string;
  patientName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  uploadDate: string;
  diagnosis?: string;
  notes?: string;
  isActive: boolean;
}

export interface UploadPrescriptionData {
  appointmentId: string;
  diagnosis?: string;
  notes?: string;
  file: File;
}

export async function uploadPrescription(data: UploadPrescriptionData): Promise<{ message: string; prescription: Prescription }> {
  const formData = new FormData();
  formData.append('appointmentId', data.appointmentId);
  formData.append('file', data.file);

  if (data.diagnosis) {
    formData.append('diagnosis', data.diagnosis);
  }

  if (data.notes) {
    formData.append('notes', data.notes);
  }

  const response = await fetch('/api/doctor/prescriptions/upload', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload prescription');
  }

  return response.json();
}

export async function getDoctorPrescriptions(page = 1, limit = 20): Promise<{
  message: string;
  prescriptions: Prescription[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const response = await fetch(`/api/doctor/prescriptions?page=${page}&limit=${limit}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch prescriptions');
  }

  return response.json();
}

export async function deletePrescription(prescriptionId: string): Promise<{ message: string }> {
  const response = await fetch(`/api/doctor/prescriptions/${prescriptionId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to delete prescription');
  }

  return response.json();
}
