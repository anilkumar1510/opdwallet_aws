import { apiFetch } from './api'

/**
 * Shared logout handler for TPA portal
 * Logs out the user and redirects to login page
 */
export async function handleLogout(): Promise<void> {
  try {
    await apiFetch('/api/auth/logout', {
      method: 'POST',
    })
    // Redirect to login page after logout (manual basePath since window.location doesn't respect Next.js basePath)
    window.location.href = '/tpa/login'
  } catch (error) {
    console.error('Logout failed:', error)
    // Even if logout API fails, redirect to login
    window.location.href = '/tpa/login'
  }
}
