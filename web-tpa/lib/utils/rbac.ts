/**
 * Role-based access control utilities for TPA Portal
 */

export const UserRole = {
  TPA_ADMIN: 'TPA_ADMIN',
  TPA_USER: 'TPA_USER',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const

export type UserRoleType = typeof UserRole[keyof typeof UserRole]

/**
 * Check if user is TPA Admin (or higher)
 */
export function isTpaAdmin(role?: string): boolean {
  if (!role) return false
  return ['TPA_ADMIN', 'SUPER_ADMIN'].includes(role)
}

/**
 * Check if user is TPA User
 */
export function isTpaUser(role?: string): boolean {
  return role === 'TPA_USER'
}

/**
 * Check if user can access admin-only features
 */
export function canAccessAdminFeatures(role?: string): boolean {
  return isTpaAdmin(role)
}
