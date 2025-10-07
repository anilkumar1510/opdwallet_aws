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
  console.log('[auth.ts] loginDoctor called with email:', credentials.email)
  console.log('[auth.ts] Current window.location:', typeof window !== 'undefined' ? window.location.href : 'SSR')

  const apiUrl = '/api/auth/doctor/login'
  console.log('[auth.ts] API URL:', apiUrl)
  console.log('[auth.ts] Full URL will be:', typeof window !== 'undefined' ? new URL(apiUrl, window.location.origin).href : 'SSR')

  const requestBody = JSON.stringify(credentials)
  console.log('[auth.ts] Request body:', requestBody)
  console.log('[auth.ts] Request body length:', requestBody.length)

  console.log('[auth.ts] Making fetch request...')

  let response: Response
  try {
    response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: requestBody,
    });

    console.log('[auth.ts] Fetch completed')
    console.log('[auth.ts] Response status:', response.status)
    console.log('[auth.ts] Response statusText:', response.statusText)
    console.log('[auth.ts] Response ok:', response.ok)
    console.log('[auth.ts] Response headers:', Object.fromEntries(response.headers.entries()))
    console.log('[auth.ts] Response type:', response.type)
    console.log('[auth.ts] Response url:', response.url)
  } catch (fetchError: any) {
    console.error('[auth.ts] Fetch threw an error:', fetchError)
    console.error('[auth.ts] Fetch error message:', fetchError.message)
    console.error('[auth.ts] Fetch error stack:', fetchError.stack)
    throw new Error('Network error: ' + fetchError.message)
  }

  if (!response.ok) {
    console.log('[auth.ts] Response not OK, reading error...')

    const contentType = response.headers.get('content-type')
    console.log('[auth.ts] Error response content-type:', contentType)

    let errorText: string
    try {
      errorText = await response.text()
      console.log('[auth.ts] Error response text:', errorText)
      console.log('[auth.ts] Error response text length:', errorText.length)
      console.log('[auth.ts] First 200 chars:', errorText.substring(0, 200))
    } catch (textError: any) {
      console.error('[auth.ts] Failed to read error text:', textError)
      throw new Error('Failed to read error response')
    }

    if (contentType && contentType.includes('application/json')) {
      console.log('[auth.ts] Error response is JSON, parsing...')
      try {
        const error = JSON.parse(errorText)
        console.log('[auth.ts] Parsed error object:', error)
        throw new Error(error.message || 'Login failed');
      } catch (parseError: any) {
        console.error('[auth.ts] Failed to parse error JSON:', parseError)
        throw new Error('Invalid JSON in error response: ' + errorText.substring(0, 100))
      }
    } else {
      console.error('[auth.ts] Error response is NOT JSON!')
      console.error('[auth.ts] Content-Type:', contentType)
      console.error('[auth.ts] Response text:', errorText.substring(0, 500))
      throw new Error('Server returned non-JSON error: ' + errorText.substring(0, 100))
    }
  }

  console.log('[auth.ts] Response OK, reading success response...')

  const contentType = response.headers.get('content-type')
  console.log('[auth.ts] Success response content-type:', contentType)

  let responseText: string
  try {
    responseText = await response.text()
    console.log('[auth.ts] Success response text:', responseText)
    console.log('[auth.ts] Success response text length:', responseText.length)
  } catch (textError: any) {
    console.error('[auth.ts] Failed to read success text:', textError)
    throw new Error('Failed to read success response')
  }

  if (contentType && contentType.includes('application/json')) {
    console.log('[auth.ts] Success response is JSON, parsing...')
    try {
      const data = JSON.parse(responseText)
      console.log('[auth.ts] Parsed success data:', data)
      return data
    } catch (parseError: any) {
      console.error('[auth.ts] Failed to parse success JSON:', parseError)
      throw new Error('Invalid JSON in success response: ' + responseText.substring(0, 100))
    }
  } else {
    console.error('[auth.ts] Success response is NOT JSON!')
    console.error('[auth.ts] Content-Type:', contentType)
    console.error('[auth.ts] Response text:', responseText.substring(0, 500))
    throw new Error('Server returned non-JSON response: ' + responseText.substring(0, 100))
  }
}

export async function logoutDoctor(): Promise<void> {
  console.log('[auth.ts] logoutDoctor called');

  // Clear all cookies manually on the client side
  if (typeof document !== 'undefined') {
    console.log('[auth.ts] Clearing client-side cookies...');
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();

      // Delete cookie for multiple domain/path combinations to ensure it's fully cleared
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;

      console.log('[auth.ts] Cleared cookie:', name);
    }

    console.log('[auth.ts] All cookies cleared');
    console.log('[auth.ts] Remaining cookies:', document.cookie);
  }

  // Call backend logout endpoint
  try {
    console.log('[auth.ts] Calling backend logout endpoint...');
    const response = await fetch('/api/auth/doctor/logout', {
      method: 'POST',
      credentials: 'include',
    });

    console.log('[auth.ts] Logout response status:', response.status);

    if (!response.ok) {
      console.error('[auth.ts] Logout request failed with status:', response.status);
      // Don't throw - we already cleared cookies, so logout is successful from UI perspective
    } else {
      console.log('[auth.ts] Backend logout successful');
    }
  } catch (error) {
    console.error('[auth.ts] Logout request error:', error);
    // Don't throw - we already cleared cookies
  }

  console.log('[auth.ts] Logout complete');
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
