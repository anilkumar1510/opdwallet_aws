// API utility to handle base path correctly
export function apiUrl(path: string): string {
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // No longer need /admin prefix since we removed basePath
  const fullUrl = cleanPath;
  // PERFORMANCE: Removed console.log for production
  return fullUrl;
}

// Wrapper for fetch with correct base path
export async function apiFetch(path: string, options?: RequestInit) {
  const url = apiUrl(path);
  // PERFORMANCE: Removed 20+ console.log statements that were blocking execution

  // Don't set Content-Type for FormData - browser will set it with boundary
  const isFormData = options?.body instanceof FormData;

  const requestHeaders: HeadersInit = isFormData
    ? { ...options?.headers }
    : {
        'Content-Type': 'application/json',
        ...options?.headers,
      };

  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: requestHeaders,
    });

    return response;
  } catch (error: any) {
    // PERFORMANCE: Only log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[API Error]:', error?.message);
    }
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