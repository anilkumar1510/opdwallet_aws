export interface PatientHealthRecords {
  patient: {
    allergies: string[];
    chronicConditions: string[];
    currentMedications: string[];
  };
  prescriptions: any[];
  consultationHistory: any[];
}

export async function getPatientHealthRecords(patientId: string): Promise<PatientHealthRecords> {
  const response = await fetch(`/doctor/api/doctor/health-records/${patientId}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch patient health records');
  }

  const result = await response.json();
  return result.data;
}
