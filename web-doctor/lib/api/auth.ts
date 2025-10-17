export interface DoctorLoginDto {
  email: string;
  password: string;
}

export interface Doctor {
  doctorId: string;
  name: string;
  email: string;
  specializations: string[];
  specialty: string;
  role: string;
}

export interface LoginResponse {
  message: string;
  doctor: Doctor;
}

export async function loginDoctor(credentials: DoctorLoginDto): Promise<LoginResponse> {
  const apiUrl = '/api/auth/doctor/login'

  let response: Response
  try {
    response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(credentials),
    });
  } catch (fetchError: any) {
    throw new Error('Network error: ' + fetchError.message)
  }

  if (!response.ok) {
    const contentType = response.headers.get('content-type')
    let errorText: string

    try {
      errorText = await response.text()
    } catch (textError: any) {
      throw new Error('Failed to read error response')
    }

    if (contentType && contentType.includes('application/json')) {
      try {
        const error = JSON.parse(errorText)
        throw new Error(error.message || 'Login failed');
      } catch (parseError: any) {
        throw new Error('Invalid JSON in error response')
      }
    } else {
      throw new Error('Server returned non-JSON error')
    }
  }

  const contentType = response.headers.get('content-type')
  let responseText: string

  try {
    responseText = await response.text()
  } catch (textError: any) {
    throw new Error('Failed to read success response')
  }

  if (contentType && contentType.includes('application/json')) {
    try {
      const data = JSON.parse(responseText)
      return data
    } catch (parseError: any) {
      throw new Error('Invalid JSON in success response')
    }
  } else {
    throw new Error('Server returned non-JSON response')
  }
}

export async function logoutDoctor(): Promise<void> {
  // Call backend logout endpoint - backend will clear HttpOnly cookies
  try {
    const response = await fetch('/api/auth/doctor/logout', {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      // Don't throw - logout should succeed even if backend call fails
    }
  } catch (error) {
    // Don't throw - logout should succeed even if backend call fails
  }
}

export async function getDoctorProfile(): Promise<Doctor> {
  const response = await fetch('/api/auth/doctor/profile', {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }

  const data = await response.json();
  return data.doctor;
}
