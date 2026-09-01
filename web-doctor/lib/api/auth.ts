import { storeDoctorToken } from './session';
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
  /** Also set as a cookie, but the header is what survives sharing localhost. */
  token?: string;
}

export async function loginDoctor(credentials: DoctorLoginDto): Promise<LoginResponse> {
  console.log('🚀 [AUTH API] ========== DOCTOR LOGIN API CALL START ==========');
  console.log('📥 [INPUT] Login credentials:', {
    email: credentials.email,
    passwordLength: credentials.password?.length || 0,
    hasPassword: !!credentials.password
  });

  // With basePath: '/doctor', API routes are at /doctor/api/*
  const apiUrl = '/doctor/api/auth/doctor/login'
  console.log('🌐 [REQUEST] Target API URL:', apiUrl);
  console.log('🌐 [REQUEST] Full window location:', window.location.href);
  console.log('🌐 [REQUEST] Current origin:', window.location.origin);

  const requestBody = JSON.stringify(credentials);
  console.log('📦 [REQUEST] Request body:', requestBody);
  console.log('📦 [REQUEST] Request body length:', requestBody.length);

  const requestConfig = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include' as RequestCredentials,
    body: requestBody,
  };
  console.log('⚙️ [REQUEST] Request config:', JSON.stringify(requestConfig, null, 2));

  let response: Response
  console.log('📡 [FETCH] Initiating fetch request...');
  const fetchStartTime = Date.now();

  try {
    response = await fetch(apiUrl, requestConfig);
    const fetchDuration = Date.now() - fetchStartTime;
    console.log(`✅ [FETCH] Fetch completed successfully in ${fetchDuration}ms`);
    console.log('📊 [RESPONSE] Status:', response.status);
    console.log('📊 [RESPONSE] Status text:', response.statusText);
    console.log('📊 [RESPONSE] OK:', response.ok);
    console.log('📊 [RESPONSE] Type:', response.type);
    console.log('📊 [RESPONSE] URL:', response.url);
    console.log('📊 [RESPONSE] Redirected:', response.redirected);

    // Log all response headers
    const headers: { [key: string]: string } = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log('📊 [RESPONSE] Headers:', JSON.stringify(headers, null, 2));

    // Check for Set-Cookie header (might not be visible in browser due to HttpOnly)
    const setCookie = response.headers.get('set-cookie');
    console.log('🍪 [COOKIE] Set-Cookie header:', setCookie || 'NOT VISIBLE (HttpOnly)');

  } catch (fetchError: any) {
    const fetchDuration = Date.now() - fetchStartTime;
    console.error(`❌ [FETCH] Fetch failed after ${fetchDuration}ms`);
    console.error('❌ [FETCH] Error name:', fetchError.name);
    console.error('❌ [FETCH] Error message:', fetchError.message);
    console.error('❌ [FETCH] Error stack:', fetchError.stack);
    console.error('❌ [FETCH] Full error:', JSON.stringify(fetchError, Object.getOwnPropertyNames(fetchError)));
    throw new Error('Network error: ' + fetchError.message)
  }

  if (!response.ok) {
    console.warn('⚠️ [ERROR PATH] Response not OK, entering error handling...');
    console.warn('⚠️ [ERROR PATH] Status code:', response.status);

    const contentType = response.headers.get('content-type')
    console.warn('⚠️ [ERROR PATH] Content-Type:', contentType);

    let errorText: string

    try {
      console.log('📖 [ERROR PATH] Reading error response text...');
      errorText = await response.text()
      console.log('📖 [ERROR PATH] Error response text:', errorText);
      console.log('📖 [ERROR PATH] Error response length:', errorText.length);
    } catch (textError: any) {
      console.error('❌ [ERROR PATH] Failed to read error response text');
      console.error('❌ [ERROR PATH] Text read error:', textError);
      throw new Error('Failed to read error response')
    }

    if (contentType && contentType.includes('application/json')) {
      console.log('🔍 [ERROR PATH] Content-Type is JSON, attempting to parse...');

      let error: any
      try {
        error = JSON.parse(errorText)
        console.log('📋 [ERROR PATH] Parsed error object:', JSON.stringify(error, null, 2));
      } catch (parseError: any) {
        console.error('❌ [ERROR PATH] JSON parse failed');
        console.error('❌ [ERROR PATH] Parse error:', parseError);
        console.error('❌ [ERROR PATH] Raw text that failed to parse:', errorText);
        throw new Error('Invalid JSON in error response')
      }

      // Throw outside the try above: it used to sit inside, so its own catch
      // swallowed it and every failed login reported a JSON parse error. The
      // API nests the real text under message.message.
      const message = typeof error.message === 'object' && error.message !== null
        ? error.message.message
        : error.message
      console.log('📋 [ERROR PATH] Error message:', message || 'NO MESSAGE');
      throw new Error(
        (Array.isArray(message) ? message.join(', ') : message) || 'Login failed',
      );
    } else {
      console.error('❌ [ERROR PATH] Content-Type is not JSON');
      console.error('❌ [ERROR PATH] Actual Content-Type:', contentType);
      console.error('❌ [ERROR PATH] Response text:', errorText);
      throw new Error('Server returned non-JSON error')
    }
  }

  console.log('✅ [SUCCESS PATH] Response OK, processing success response...');

  const contentType = response.headers.get('content-type')
  console.log('📋 [SUCCESS PATH] Content-Type:', contentType);

  let responseText: string

  try {
    console.log('📖 [SUCCESS PATH] Reading success response text...');
    responseText = await response.text()
    console.log('📖 [SUCCESS PATH] Success response text:', responseText);
    console.log('📖 [SUCCESS PATH] Response text length:', responseText.length);
  } catch (textError: any) {
    console.error('❌ [SUCCESS PATH] Failed to read success response text');
    console.error('❌ [SUCCESS PATH] Text read error:', textError);
    throw new Error('Failed to read success response')
  }

  if (contentType && contentType.includes('application/json')) {
    console.log('🔍 [SUCCESS PATH] Content-Type is JSON, attempting to parse...');
    try {
      const data = JSON.parse(responseText)
      console.log('✅ [SUCCESS PATH] Successfully parsed JSON response');
      console.log('📦 [SUCCESS PATH] Parsed data:', JSON.stringify(data, null, 2));
      console.log('👤 [SUCCESS PATH] Doctor info:', {
        doctorId: data.doctor?.doctorId,
        name: data.doctor?.name,
        email: data.doctor?.email,
        role: data.doctor?.role
      });
      console.log('🎉 [AUTH API] ========== DOCTOR LOGIN API CALL SUCCESS ==========');
      // Keep the token for `Authorization: Bearer`. The cookie is still set, but
      // it shares a name with the member portal's on localhost, so the header is
      // what keeps the two sessions apart. See lib/api/session.ts.
      storeDoctorToken(data?.token);
      return data
    } catch (parseError: any) {
      console.error('❌ [SUCCESS PATH] JSON parse failed');
      console.error('❌ [SUCCESS PATH] Parse error:', parseError);
      console.error('❌ [SUCCESS PATH] Raw text that failed to parse:', responseText);
      throw new Error('Invalid JSON in success response')
    }
  } else {
    console.error('❌ [SUCCESS PATH] Content-Type is not JSON');
    console.error('❌ [SUCCESS PATH] Actual Content-Type:', contentType);
    console.error('❌ [SUCCESS PATH] Response text:', responseText);
    throw new Error('Server returned non-JSON response')
  }
}

export async function logoutDoctor(): Promise<void> {
  // Call backend logout endpoint - backend will clear HttpOnly cookies
  try {
    const response = await fetch('/doctor/api/auth/doctor/logout', {
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
  console.group('🔍 [API] getDoctorProfile')
  console.log('🌐 Window location:', window.location.href)
  console.log('🍪 Document cookies:', document.cookie || 'NONE')

  const url = '/doctor/api/auth/doctor/profile'
  console.log('🎯 Target URL:', url)
  console.log('🎯 Full URL will be:', window.location.origin + url)

  console.log('📡 Making fetch request...')
  const fetchStart = Date.now()
  const response = await fetch(url, {
    credentials: 'include',
  });
  const fetchDuration = Date.now() - fetchStart

  console.log(`📨 Response received in ${fetchDuration}ms`)
  console.log('📨 Response status:', response.status)
  console.log('📨 Response statusText:', response.statusText)
  console.log('📨 Response ok:', response.ok)
  console.log('📨 Response type:', response.type)
  console.log('📨 Response headers:', Object.fromEntries(response.headers.entries()))

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ Response not OK')
    console.error('❌ Response status:', response.status)
    console.error('❌ Response body (first 500 chars):', errorText.substring(0, 500))
    console.groupEnd()
    throw new Error('Failed to fetch profile');
  }

  const data = await response.json();
  console.log('✅ Success! Data:', data)
  console.log('✅ Doctor:', data.doctor)
  console.groupEnd()
  return data.doctor;
}

// ==================== SIGNATURE MANAGEMENT ====================

export interface SignatureStatus {
  hasSignature: boolean;
  uploadedAt?: string;
  previewUrl?: string;
}

export interface UploadSignatureResponse {
  message: string;
  signature: SignatureStatus;
}

export async function uploadSignature(file: File): Promise<UploadSignatureResponse> {
  console.log('[API-AUTH] 📤 uploadSignature called', { fileName: file.name, fileSize: file.size })
  const formData = new FormData();
  formData.append('signature', file);

  console.log('[API-AUTH] 🔄 Sending POST request...')
  const response = await fetch('/doctor/api/auth/doctor/profile/signature', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  console.log('[API-AUTH] 📥 Response received:', { status: response.status, ok: response.ok })

  if (!response.ok) {
    const error = await response.json();
    console.error('[API-AUTH] ❌ Upload failed:', error)
    // Handle nested error message objects
    let errorMessage = 'Failed to upload signature';
    if (typeof error.message === 'string') {
      errorMessage = error.message;
    } else if (typeof error.message === 'object' && error.message?.message) {
      errorMessage = error.message.message;
    } else if (error.error) {
      errorMessage = typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
    }
    throw new Error(errorMessage);
  }

  const result = await response.json();
  console.log('[API-AUTH] ✅ Upload successful:', result)
  return result;
}

export async function getSignatureStatus(): Promise<SignatureStatus> {
  console.log('[API-AUTH] 🔄 getSignatureStatus called')
  const response = await fetch('/doctor/api/auth/doctor/profile/signature/status', {
    credentials: 'include',
  });

  console.log('[API-AUTH] 📥 Status response received:', { status: response.status, ok: response.ok })

  if (!response.ok) {
    console.error('[API-AUTH] ❌ Failed to fetch signature status')
    throw new Error('Failed to fetch signature status');
  }

  const data = await response.json();
  console.log('[API-AUTH] 📦 Raw response data:', data)

  // Backend spreads status fields directly, not nested under 'status'
  const result = {
    hasSignature: data.hasSignature,
    uploadedAt: data.uploadedAt,
    previewUrl: data.previewUrl,
  };

  console.log('[API-AUTH] ✅ Parsed signature status:', result)
  return result;
}

export async function deleteSignature(): Promise<void> {
  const response = await fetch('/doctor/api/auth/doctor/profile/signature', {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete signature');
  }
}
