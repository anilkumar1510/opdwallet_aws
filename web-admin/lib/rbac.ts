/**
 * Role-Based Access Control (RBAC) utilities for Admin Portal
 * Defines roles and permission checking functions
 */

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
} as const

export type UserRole = (typeof ROLES)[keyof typeof ROLES]

/**
 * Check if user is SUPER_ADMIN
 */
export function isSuperAdmin(role: string | undefined): boolean {
  return role === ROLES.SUPER_ADMIN
}

/**
 * Check if user can delete resources (CUGs, AHC, Masters, Services)
 * Only SUPER_ADMIN can delete
 */
export function canDelete(role: string | undefined): boolean {
  return role === ROLES.SUPER_ADMIN
}

/**
 * Check if user can view internal users
 * Only SUPER_ADMIN can view internal users
 */
export function canViewInternalUsers(role: string | undefined): boolean {
  return role === ROLES.SUPER_ADMIN
}

/**
 * Check if user can deactivate resources (CUGs, AHC)
 * Only SUPER_ADMIN can deactivate
 */
export function canDeactivate(role: string | undefined): boolean {
  return role === ROLES.SUPER_ADMIN
}
