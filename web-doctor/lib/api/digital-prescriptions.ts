const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export interface MedicineItem {
  medicineName: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  instructions?: string;
}

export interface LabTestItem {
  testName: string;
  instructions?: string;
}

export interface CreateDigitalPrescriptionPayload {
  appointmentId: string;
  chiefComplaint?: string;
  clinicalFindings?: string;
  diagnosis?: string;
  medicines?: MedicineItem[];
  labTests?: LabTestItem[];
  followUpDate?: string;
  followUpInstructions?: string;
  generalInstructions?: string;
  precautions?: string;
  dietaryAdvice?: string;
}

export interface UpdateDigitalPrescriptionPayload {
  chiefComplaint?: string;
  clinicalFindings?: string;
  diagnosis?: string;
  medicines?: MedicineItem[];
  labTests?: LabTestItem[];
  followUpDate?: string;
  followUpInstructions?: string;
  generalInstructions?: string;
  precautions?: string;
  dietaryAdvice?: string;
}

export interface Medicine {
  _id: string;
  genericName: string;
  brandNames: string[];
  manufacturer?: string;
  composition?: string;
  form?: string;
  strength?: string;
}

export interface Diagnosis {
  _id: string;
  diagnosisName: string;
  icdCode?: string;
  category: string;
  description?: string;
  commonSymptoms?: string[];
}

export interface Symptom {
  _id: string;
  symptomName: string;
  category: string;
  severityLevels?: string[];
  relatedConditions?: string[];
  description?: string;
}

export async function createDigitalPrescription(
  payload: CreateDigitalPrescriptionPayload
): Promise<any> {
  const response = await fetch(`${API_BASE}/doctor/digital-prescriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create digital prescription');
  }

  return response.json();
}

export async function updateDigitalPrescription(
  prescriptionId: string,
  payload: UpdateDigitalPrescriptionPayload
): Promise<any> {
  const response = await fetch(`${API_BASE}/doctor/digital-prescriptions/${prescriptionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update digital prescription');
  }

  return response.json();
}

export async function generatePrescriptionPDF(prescriptionId: string): Promise<any> {
  const response = await fetch(`${API_BASE}/doctor/digital-prescriptions/${prescriptionId}/generate-pdf`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to generate PDF');
  }

  return response.json();
}

export async function getDigitalPrescription(prescriptionId: string): Promise<any> {
  const response = await fetch(`${API_BASE}/doctor/digital-prescriptions/${prescriptionId}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch digital prescription');
  }

  return response.json();
}

export async function searchMedicines(query: string, limit = 20): Promise<Medicine[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const response = await fetch(
    `${API_BASE}/medicines/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    {
      credentials: 'include',
    }
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.medicines || [];
}

export async function searchDiagnoses(query: string, limit = 20): Promise<Diagnosis[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const response = await fetch(
    `${API_BASE}/diagnoses/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    {
      credentials: 'include',
    }
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.diagnoses || [];
}

export async function searchSymptoms(query: string, limit = 20): Promise<Symptom[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const response = await fetch(
    `${API_BASE}/symptoms/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    {
      credentials: 'include',
    }
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.symptoms || [];
}

export function getDigitalPrescriptionPDFUrl(prescriptionId: string): string {
  return `${API_BASE}/doctor/digital-prescriptions/${prescriptionId}/download-pdf`;
}
