import { doctorFetch } from './session';
// Use relative path with basePath prefix for doctor portal
// This ensures API calls go through Next.js proxy: /doctor/api/* -> /api/* -> backend
const API_BASE = '/doctor/api';

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
  console.log('🔵 [API Client] ========== CREATE PRESCRIPTION START ==========');
  console.log('🔵 [API Client] Function: createDigitalPrescription');
  console.log('🔵 [API Client] API_BASE:', API_BASE);
  console.log('🔵 [API Client] Full URL:', `${API_BASE}/doctor/digital-prescriptions`);
  console.log('🔵 [API Client] Payload received:', JSON.stringify(payload, null, 2));
  console.log('🔵 [API Client] Medicines in payload:', {
    count: payload.medicines?.length || 0,
    medicines: payload.medicines || [],
  });

  const requestBody = JSON.stringify(payload);
  console.log('🔵 [API Client] Request body (stringified):', requestBody);
  console.log('🔵 [API Client] Request body length:', requestBody.length, 'bytes');

  try {
    console.log('🔵 [API Client] Sending POST request...');
    const response = await doctorFetch(`${API_BASE}/doctor/digital-prescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: requestBody,
    });

    console.log('🔵 [API Client] Response received');
    console.log('🔵 [API Client] Response status:', response.status, response.statusText);
    console.log('🔵 [API Client] Response ok:', response.ok);
    console.log('🔵 [API Client] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.error('❌ [API Client] Response not OK!');
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ [API Client] Error data:', JSON.stringify(errorData, null, 2));
      throw new Error(errorData.message || 'Failed to create digital prescription');
    }

    const responseData = await response.json();
    console.log('✅ [API Client] Response data:', JSON.stringify(responseData, null, 2));
    console.log('✅ [API Client] Prescription created:', responseData.prescription?.prescriptionId);
    console.log('✅ [API Client] Medicines in response:', {
      count: responseData.prescription?.medicines?.length || 0,
      medicines: responseData.prescription?.medicines || [],
    });
    console.log('🔵 [API Client] ========== CREATE PRESCRIPTION END ==========');

    return responseData;
  } catch (error) {
    console.error('❌ [API Client] ========== CREATE PRESCRIPTION ERROR ==========');
    console.error('❌ [API Client] Error:', error);
    console.error('❌ [API Client] Error message:', error instanceof Error ? error.message : String(error));
    console.error('❌ [API Client] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('❌ [API Client] ========== ERROR END ==========');
    throw error;
  }
}

export async function updateDigitalPrescription(
  prescriptionId: string,
  payload: UpdateDigitalPrescriptionPayload
): Promise<any> {
  const response = await doctorFetch(`${API_BASE}/doctor/digital-prescriptions/${prescriptionId}`, {
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
  const response = await doctorFetch(`${API_BASE}/doctor/digital-prescriptions/${prescriptionId}/generate-pdf`, {
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
  console.log('🔵 [API Client] ========== GET PRESCRIPTION START ==========');
  console.log('🔵 [API Client] Function: getDigitalPrescription');
  console.log('🔵 [API Client] Prescription ID:', prescriptionId);
  console.log('🔵 [API Client] API_BASE:', API_BASE);
  console.log('🔵 [API Client] Full URL:', `${API_BASE}/doctor/digital-prescriptions/${prescriptionId}`);

  try {
    console.log('🔵 [API Client] Sending GET request...');
    const response = await doctorFetch(`${API_BASE}/doctor/digital-prescriptions/${prescriptionId}`, {
      credentials: 'include',
    });

    console.log('🔵 [API Client] Response received');
    console.log('🔵 [API Client] Response status:', response.status, response.statusText);
    console.log('🔵 [API Client] Response ok:', response.ok);
    console.log('🔵 [API Client] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.error('❌ [API Client] Response not OK!');
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ [API Client] Error data:', JSON.stringify(errorData, null, 2));
      throw new Error(errorData.message || 'Failed to fetch digital prescription');
    }

    const responseData = await response.json();
    console.log('✅ [API Client] Response data:', JSON.stringify(responseData, null, 2));
    console.log('✅ [API Client] Prescription fetched:', responseData.prescription?.prescriptionId);
    console.log('✅ [API Client] Medicines in response:', {
      count: responseData.prescription?.medicines?.length || 0,
      medicines: responseData.prescription?.medicines || [],
    });
    console.log('✅ [API Client] Diagnosis:', responseData.prescription?.diagnosis);
    console.log('✅ [API Client] Lab tests:', responseData.prescription?.labTests || []);
    console.log('🔵 [API Client] ========== GET PRESCRIPTION END ==========');

    return responseData;
  } catch (error) {
    console.error('❌ [API Client] ========== GET PRESCRIPTION ERROR ==========');
    console.error('❌ [API Client] Error:', error);
    console.error('❌ [API Client] Error message:', error instanceof Error ? error.message : String(error));
    console.error('❌ [API Client] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('❌ [API Client] ========== ERROR END ==========');
    throw error;
  }
}

export async function searchMedicines(query: string, limit = 20): Promise<Medicine[]> {
  console.log('🔵 [API Client] searchMedicines called:', { query, limit });

  if (!query || query.trim().length < 2) {
    console.log('🔵 [API Client] Query too short, returning empty array');
    return [];
  }

  const url = `${API_BASE}/medicines/search?q=${encodeURIComponent(query)}&limit=${limit}`;
  console.log('🔵 [API Client] Fetching medicines from:', url);

  try {
    const response = await doctorFetch(url, {
      credentials: 'include',
    });

    console.log('🔵 [API Client] Medicine search response:', response.status, response.ok);

    if (!response.ok) {
      console.error('❌ [API Client] Medicine search failed:', response.status);
      return [];
    }

    const data = await response.json();
    console.log('✅ [API Client] Medicines found:', data.medicines?.length || 0);
    console.log('✅ [API Client] Medicine results:', data.medicines?.slice(0, 3) || []);
    return data.medicines || [];
  } catch (error) {
    console.error('❌ [API Client] Medicine search error:', error);
    return [];
  }
}

export async function searchDiagnoses(query: string, limit = 20): Promise<Diagnosis[]> {
  console.log('🔵 [API Client] searchDiagnoses called:', { query, limit });

  if (!query || query.trim().length < 2) {
    console.log('🔵 [API Client] Query too short, returning empty array');
    return [];
  }

  const url = `${API_BASE}/diagnoses/search?q=${encodeURIComponent(query)}&limit=${limit}`;
  console.log('🔵 [API Client] Fetching diagnoses from:', url);

  try {
    const response = await doctorFetch(url, {
      credentials: 'include',
    });

    console.log('🔵 [API Client] Diagnosis search response:', response.status, response.ok);

    if (!response.ok) {
      console.error('❌ [API Client] Diagnosis search failed:', response.status);
      return [];
    }

    const data = await response.json();
    console.log('✅ [API Client] Diagnoses found:', data.diagnoses?.length || 0);
    console.log('✅ [API Client] Diagnosis results:', data.diagnoses?.slice(0, 3) || []);
    return data.diagnoses || [];
  } catch (error) {
    console.error('❌ [API Client] Diagnosis search error:', error);
    return [];
  }
}

export async function searchSymptoms(query: string, limit = 20): Promise<Symptom[]> {
  console.log('🔵 [API Client] searchSymptoms called:', { query, limit });

  if (!query || query.trim().length < 2) {
    console.log('🔵 [API Client] Query too short, returning empty array');
    return [];
  }

  const url = `${API_BASE}/symptoms/search?q=${encodeURIComponent(query)}&limit=${limit}`;
  console.log('🔵 [API Client] Fetching symptoms from:', url);

  try {
    const response = await doctorFetch(url, {
      credentials: 'include',
    });

    console.log('🔵 [API Client] Symptom search response:', response.status, response.ok);

    if (!response.ok) {
      console.error('❌ [API Client] Symptom search failed:', response.status);
      return [];
    }

    const data = await response.json();
    console.log('✅ [API Client] Symptoms found:', data.symptoms?.length || 0);
    console.log('✅ [API Client] Symptom results:', data.symptoms?.slice(0, 3) || []);
    return data.symptoms || [];
  } catch (error) {
    console.error('❌ [API Client] Symptom search error:', error);
    return [];
  }
}

export function getDigitalPrescriptionPDFUrl(prescriptionId: string): string {
  return `${API_BASE}/doctor/digital-prescriptions/${prescriptionId}/download-pdf`;
}
