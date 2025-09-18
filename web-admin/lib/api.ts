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
  console.log('[DEBUG API] Fetching:', url, 'Method:', options?.method || 'GET');

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  console.log('[DEBUG API] Response:', url, 'Status:', response.status);
  return response;
}