import { doctorFetch } from './session';
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

export interface AppointmentStats {
  total: number;
  confirmed: number;
  completed: number;
  pending: number;
  cancelled: number;
  upcoming: number;
}

export interface AllAppointmentsResponse {
  message: string;
  appointments: Appointment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: AppointmentStats;
}

export async function getAllAppointments(
  status?: string,
  page = 1,
  limit = 50,
): Promise<AllAppointmentsResponse> {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.append('status', status);
  params.append('page', String(page));
  params.append('limit', String(limit));

  const url = `/doctor/api/doctor/appointments?${params.toString()}`;

  const response = await doctorFetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch appointments');
  }

  return response.json();
}

export async function getAppointmentCounts(): Promise<{ message: string; counts: { [date: string]: number } }> {
  console.group('🔍 [API] getAppointmentCounts')
  console.log('🌐 Window location:', window.location.href)

  const url = '/doctor/api/doctor/appointments/counts'
  console.log('🎯 Target URL:', url)
  console.log('🎯 Full URL will be:', window.location.origin + url)

  console.log('📡 Making fetch request...')
  const fetchStart = Date.now()
  const response = await doctorFetch(url, {
    credentials: 'include',
  });
  const fetchDuration = Date.now() - fetchStart

  console.log(`📨 Response received in ${fetchDuration}ms`)
  console.log('📨 Response status:', response.status)
  console.log('📨 Response statusText:', response.statusText)
  console.log('📨 Response ok:', response.ok)
  console.log('📨 Response headers:', Object.fromEntries(response.headers.entries()))

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ Response not OK')
    console.error('❌ Response status:', response.status)
    console.error('❌ Response body:', errorText)
    console.groupEnd()
    throw new Error('Failed to fetch appointment counts');
  }

  const data = await response.json();
  console.log('✅ Success! Data:', data)
  console.groupEnd()
  return data;
}

export async function getTodayAppointments(): Promise<AppointmentsResponse> {
  const response = await doctorFetch('/doctor/api/doctor/appointments/today', {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch today\'s appointments');
  }

  return response.json();
}

export async function getAppointmentsByDate(date: string): Promise<AppointmentsResponse> {
  console.group('🔍 [API] getAppointmentsByDate')
  console.log('📆 Date parameter:', date)
  console.log('🌐 Window location:', window.location.href)

  const url = `/doctor/api/doctor/appointments/date/${date}`
  console.log('🎯 Target URL:', url)
  console.log('🎯 Full URL will be:', window.location.origin + url)

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    console.log('📡 Making fetch request...')
    const fetchStart = Date.now()
    const response = await doctorFetch(url, {
      credentials: 'include',
      signal: controller.signal,
    });
    const fetchDuration = Date.now() - fetchStart

    clearTimeout(timeoutId);

    console.log(`📨 Response received in ${fetchDuration}ms`)
    console.log('📨 Response status:', response.status)
    console.log('📨 Response statusText:', response.statusText)
    console.log('📨 Response ok:', response.ok)
    console.log('📨 Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Response not OK')
      console.error('❌ Response status:', response.status)
      console.error('❌ Response body:', errorText)
      console.groupEnd()
      throw new Error('Failed to fetch appointments');
    }

    const data = await response.json();
    console.log('✅ Success! Data:', data)
    console.groupEnd()
    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('💥 Fetch error caught')
    console.error('💥 Error name:', error.name)
    console.error('💥 Error message:', error.message)
    console.error('💥 Error stack:', error.stack)
    console.groupEnd()

    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please check your connection');
    }
    throw error;
  }
}

export async function getUpcomingAppointments(limit = 10): Promise<AppointmentsResponse> {
  console.group('🔍 [API] getUpcomingAppointments')
  console.log('📊 Limit parameter:', limit)
  console.log('🌐 Window location:', window.location.href)

  const url = `/doctor/api/doctor/appointments/upcoming?limit=${limit}`
  console.log('🎯 Target URL:', url)
  console.log('🎯 Full URL will be:', window.location.origin + url)

  console.log('📡 Making fetch request...')
  const fetchStart = Date.now()
  const response = await doctorFetch(url, {
    credentials: 'include',
  });
  const fetchDuration = Date.now() - fetchStart

  console.log(`📨 Response received in ${fetchDuration}ms`)
  console.log('📨 Response status:', response.status)
  console.log('📨 Response statusText:', response.statusText)
  console.log('📨 Response ok:', response.ok)
  console.log('📨 Response headers:', Object.fromEntries(response.headers.entries()))

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ Response not OK')
    console.error('❌ Response status:', response.status)
    console.error('❌ Response body:', errorText)
    console.groupEnd()
    throw new Error('Failed to fetch upcoming appointments');
  }

  const data = await response.json();
  console.log('✅ Success! Data:', data)
  console.log('✅ Appointments count:', data.appointments?.length || 0)
  console.groupEnd()
  return data;
}

export async function getAppointmentDetails(appointmentId: string): Promise<{ message: string; appointment: Appointment }> {
  const response = await doctorFetch(`/doctor/api/doctor/appointments/${appointmentId}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch appointment details');
  }

  return response.json();
}

export async function markAppointmentComplete(appointmentId: string): Promise<{ message: string; appointment: Appointment }> {
  const response = await doctorFetch(`/doctor/api/doctor/appointments/${appointmentId}/complete`, {
    method: 'PATCH',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to mark appointment as complete');
  }

  return response.json();
}

export async function confirmAppointment(appointmentId: string): Promise<{ message: string; appointment: Appointment }> {
  const response = await doctorFetch(`/doctor/api/doctor/appointments/${appointmentId}/confirm`, {
    method: 'PATCH',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to confirm appointment');
  }

  return response.json();
}
