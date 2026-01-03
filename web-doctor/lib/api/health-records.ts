export interface PatientHealthRecords {
  patient: {
    name: string;
    age?: number;
    gender?: string;
    bloodGroup?: string;
    phone?: string;
    address?: string;
    allergies: any;
    chronicConditions: string[];
    currentMedications: string[];
  };
  prescriptions: Array<{
    prescriptionId: string;
    doctorName: string;
    doctorSpecialty: string;
    date: string;
    diagnosis?: string;
    medicines?: any[];
    labTests?: any[];
    chiefComplaint?: string;
    clinicalFindings?: string;
    vitals?: any;
  }>;
  consultationHistory: Array<{
    prescriptionId: string;
    doctorName: string;
    specialty: string;
    date: string;
    chiefComplaint?: string;
    diagnosis?: string;
  }>;
  labReports?: any[];
  diagnosticReports?: any[];
}

export async function getPatientHealthRecords(patientId: string): Promise<PatientHealthRecords> {
  const response = await fetch(`/doctor/api/doctor/appointments/patients/${patientId}/health-records`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch patient health records');
  }

  const result = await response.json();
  return result.data;
}
