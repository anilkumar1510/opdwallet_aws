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

export async function getTodayAppointments(): Promise<AppointmentsResponse> {
  console.log('=== GET TODAY APPOINTMENTS DEBUG START ===');
  console.log('[getTodayAppointments] Called at:', new Date().toISOString());
  console.log('[getTodayAppointments] Request URL:', '/api/doctor/appointments/today');
  console.log('[getTodayAppointments] Full URL:', typeof window !== 'undefined' ? new URL('/api/doctor/appointments/today', window.location.origin).href : 'SSR');
  console.log('[getTodayAppointments] Cookies:', typeof document !== 'undefined' ? document.cookie : 'SSR');

  let response: Response;
  try {
    console.log('[getTodayAppointments] Making fetch request with credentials: include');
    response = await fetch('/api/doctor/appointments/today', {
      credentials: 'include',
    });
    console.log('[getTodayAppointments] Fetch completed');
  } catch (fetchError: any) {
    console.error('[getTodayAppointments] Fetch threw error:', fetchError);
    console.error('[getTodayAppointments] Error message:', fetchError.message);
    console.error('[getTodayAppointments] Error stack:', fetchError.stack);
    throw new Error('Network error: ' + fetchError.message);
  }

  console.log('[getTodayAppointments] Response status:', response.status);
  console.log('[getTodayAppointments] Response statusText:', response.statusText);
  console.log('[getTodayAppointments] Response ok:', response.ok);
  console.log('[getTodayAppointments] Response headers:', Object.fromEntries(response.headers.entries()));
  console.log('[getTodayAppointments] Response type:', response.type);
  console.log('[getTodayAppointments] Response url:', response.url);

  if (!response.ok) {
    console.error('[getTodayAppointments] Response not OK!');

    const contentType = response.headers.get('content-type');
    console.log('[getTodayAppointments] Error response content-type:', contentType);

    let errorText: string;
    try {
      errorText = await response.text();
      console.log('[getTodayAppointments] Error response text:', errorText);
      console.log('[getTodayAppointments] Error response length:', errorText.length);
    } catch (textError: any) {
      console.error('[getTodayAppointments] Failed to read error text:', textError);
      throw new Error('Failed to read error response');
    }

    if (contentType && contentType.includes('application/json')) {
      console.log('[getTodayAppointments] Error is JSON, parsing...');
      try {
        const error = JSON.parse(errorText);
        console.error('[getTodayAppointments] Parsed error:', error);
        throw new Error(error.message || 'Failed to fetch today\'s appointments');
      } catch (parseError: any) {
        console.error('[getTodayAppointments] Failed to parse JSON:', parseError);
        throw new Error('Invalid JSON error: ' + errorText.substring(0, 100));
      }
    } else {
      console.error('[getTodayAppointments] Error is NOT JSON!');
      throw new Error('Server error: ' + errorText.substring(0, 100));
    }
  }

  console.log('[getTodayAppointments] Response OK, reading body...');

  const contentType = response.headers.get('content-type');
  console.log('[getTodayAppointments] Success response content-type:', contentType);

  let responseText: string;
  try {
    responseText = await response.text();
    console.log('[getTodayAppointments] Success response text:', responseText);
    console.log('[getTodayAppointments] Success response length:', responseText.length);
  } catch (textError: any) {
    console.error('[getTodayAppointments] Failed to read success text:', textError);
    throw new Error('Failed to read success response');
  }

  if (contentType && contentType.includes('application/json')) {
    console.log('[getTodayAppointments] Success response is JSON, parsing...');
    try {
      const data = JSON.parse(responseText);
      console.log('[getTodayAppointments] Parsed data:', data);
      console.log('[getTodayAppointments] Appointments count:', data.appointments?.length);
      console.log('=== GET TODAY APPOINTMENTS DEBUG END ===');
      return data;
    } catch (parseError: any) {
      console.error('[getTodayAppointments] Failed to parse success JSON:', parseError);
      throw new Error('Invalid JSON: ' + responseText.substring(0, 100));
    }
  } else {
    console.error('[getTodayAppointments] Success response is NOT JSON!');
    throw new Error('Non-JSON response: ' + responseText.substring(0, 100));
  }
}

export async function getAppointmentsByDate(date: string): Promise<AppointmentsResponse> {
  const response = await fetch(`/api/doctor/appointments/date/${date}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch appointments');
  }

  return response.json();
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
