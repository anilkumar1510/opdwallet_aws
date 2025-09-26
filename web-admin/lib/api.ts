// API utility to handle base path correctly
export function apiUrl(path: string): string {
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // No longer need /admin prefix since we removed basePath
  const fullUrl = cleanPath;
  console.log('[DEBUG API] Converting path:', path, '→', fullUrl);
  return fullUrl;
}

// Wrapper for fetch with correct base path
export async function apiFetch(path: string, options?: RequestInit) {
  const url = apiUrl(path);
  console.log('\n\n=== 📡 [API DEBUG] STARTING REQUEST ===');
  console.log('🔗 [API DEBUG] URL:', url);
  console.log('📝 [API DEBUG] Method:', options?.method || 'GET');
  console.log('🕒 [API DEBUG] Timestamp:', new Date().toISOString());
  console.log('🌐 [API DEBUG] User Agent:', navigator.userAgent);
  console.log('📍 [API DEBUG] Current Location:', window.location.href);

  if (options?.body) {
    console.log('📦 [API DEBUG] Request body:', options.body);
  }

  const requestHeaders = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };
  console.log('📄 [API DEBUG] Request headers:', requestHeaders);
  console.log('🍪 [API DEBUG] Credentials mode: include');

  try {
    console.log('📡 [API DEBUG] Making fetch request...');

    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: requestHeaders,
    });

    console.log('📨 [API DEBUG] Response received!');
    console.log('📨 [API DEBUG] Status:', response.status, response.statusText);
    console.log('📨 [API DEBUG] Response OK:', response.ok);
    console.log('📨 [API DEBUG] Response type:', response.type);
    console.log('📨 [API DEBUG] Response redirected:', response.redirected);
    console.log('📨 [API DEBUG] Response URL:', response.url);

    const responseHeaders = Object.fromEntries(response.headers.entries());
    console.log('📄 [API DEBUG] Response headers:', responseHeaders);

    if (response.headers.get('set-cookie')) {
      console.log('🍪 [API DEBUG] Cookies being set:', response.headers.get('set-cookie'));
    }

    console.log('=== 🏁 [API DEBUG] REQUEST COMPLETE ===\n\n');

    return response;
  } catch (error: any) {
    console.log('\n\n=== 💥 [API DEBUG] FETCH ERROR ===');
    console.log('💥 [API DEBUG] Error name:', error?.constructor?.name);
    console.log('💥 [API DEBUG] Error message:', error?.message);
    console.log('💥 [API DEBUG] Error stack:', error?.stack);
    console.log('💥 [API DEBUG] Full error:', error);
    console.log('=== 💥 [API DEBUG] ERROR END ===\n\n');
    throw error;
  }
}

// CUG Master API functions
export interface CugMaster {
  _id: string;
  cugId: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function getCugs(params?: {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}): Promise<{ data: CugMaster[]; total: number; page: number; limit: number }> {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());
  if (params?.search) searchParams.append('search', params.search);

  const response = await apiFetch(`/api/cugs?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch CUGs: ${response.statusText}`);
  }

  return response.json();
}

export async function getActiveCugs(): Promise<CugMaster[]> {
  const response = await apiFetch('/api/cugs/active');

  if (!response.ok) {
    throw new Error(`Failed to fetch active CUGs: ${response.statusText}`);
  }

  return response.json();
}