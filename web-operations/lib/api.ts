// API utility to handle base path correctly
export function apiUrl(path: string): string {
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // With basePath: '/operations', we need to prepend it to API calls for rewrites to work
  // In browser, window.location will include /operations, so we extract and prepend it
  if (typeof window !== 'undefined') {
    const basePath = '/operations'; // Match next.config.js basePath
    // If the current URL includes the basePath, prepend it to API calls
    if (window.location.pathname.startsWith(basePath)) {
      return `${basePath}${cleanPath}`;
    }
  }

  return cleanPath;
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
  shortCode?: string;
  companyName: string;
  employeeCount: string;
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

export async function createCug(data: Omit<CugMaster, '_id' | 'createdAt' | 'updatedAt'>): Promise<CugMaster> {
  const response = await apiFetch('/api/cugs', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Failed to create CUG: ${response.statusText}`);
  }

  return response.json();
}

export async function updateCug(id: string, data: Partial<Omit<CugMaster, '_id' | 'cugId' | 'createdAt' | 'updatedAt'>>): Promise<CugMaster> {
  const response = await apiFetch(`/api/cugs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Failed to update CUG: ${response.statusText}`);
  }

  return response.json();
}

export async function toggleCugActive(id: string): Promise<CugMaster> {
  const response = await apiFetch(`/api/cugs/${id}/toggle-active`, {
    method: 'PUT',
  });

  if (!response.ok) {
    throw new Error(`Failed to toggle CUG status: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteCug(id: string): Promise<void> {
  const response = await apiFetch(`/api/cugs/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete CUG: ${response.statusText}`);
  }
}