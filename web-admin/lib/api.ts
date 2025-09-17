// API utility to handle base path correctly
export function apiUrl(path: string): string {
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // Add /admin prefix for API calls
  return `/admin${cleanPath}`;
}

// Wrapper for fetch with correct base path
export async function apiFetch(path: string, options?: RequestInit) {
  return fetch(apiUrl(path), {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
}