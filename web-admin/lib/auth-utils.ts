import { apiFetch } from './api'

/**
 * Shared logout handler for all admin portal layouts
 * Logs out the user and redirects to login page
 */
export async function handleLogout(): Promise<void> {
  try {
    await apiFetch('/api/auth/logout', {
      method: 'POST',
    })
    // Redirect to login page after logout (respects basePath)
    window.location.href = '/admin/login'
  } catch (error) {
    console.error('Logout failed:', error)
    // Even if logout API fails, redirect to login
    window.location.href = '/admin/login'
  }
}
