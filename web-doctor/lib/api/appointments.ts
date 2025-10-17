export interface Appointment {
  _id: string;
  appointmentId: string;
  appointmentNumber: string;
  userId: string;
  patientName: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  appointmentType: string;
  appointmentDate: string;
  timeSlot: string;
  consultationFee: number;
  status: string;
  hasPrescription: boolean;
  prescriptionId?: any;
  clinicName?: string;
  clinicAddress?: string;
  contactNumber?: string;
  callPreference?: string;
}

export interface AppointmentsResponse {
  message: string;
  appointments: Appointment[];
  total: number;
  date?: string;
}

export async function getAppointmentCounts(): Promise<{ message: string; counts: { [date: string]: number } }> {
  const response = await fetch('/api/doctor/appointments/counts', {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch appointment counts');
  }

  return response.json();
}

export async function getTodayAppointments(): Promise<AppointmentsResponse> {
  const response = await fetch('/api/doctor/appointments/today', {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch today\'s appointments');
  }

  return response.json();
}

export async function getAppointmentsByDate(date: string): Promise<AppointmentsResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(`/api/doctor/appointments/date/${date}`, {
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('Failed to fetch appointments');
    }

    return response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please check your connection');
    }
    throw error;
  }
}

export async function getUpcomingAppointments(limit = 10): Promise<AppointmentsResponse> {
  const response = await fetch(`/api/doctor/appointments/upcoming?limit=${limit}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch upcoming appointments');
  }

  return response.json();
}

export async function getAppointmentDetails(appointmentId: string): Promise<{ message: string; appointment: Appointment }> {
  const response = await fetch(`/api/doctor/appointments/${appointmentId}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch appointment details');
  }

  return response.json();
}

export async function markAppointmentComplete(appointmentId: string): Promise<{ message: string; appointment: Appointment }> {
  const response = await fetch(`/api/doctor/appointments/${appointmentId}/complete`, {
    method: 'PATCH',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to mark appointment as complete');
  }

  return response.json();
}

export async function confirmAppointment(appointmentId: string): Promise<{ message: string; appointment: Appointment }> {
  const response = await fetch(`/api/doctor/appointments/${appointmentId}/confirm`, {
    method: 'PATCH',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to confirm appointment');
  }

  return response.json();
}
