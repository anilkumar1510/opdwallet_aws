/**
 * Role-Based Access Control (RBAC) utilities for Operations Portal
 * Defines roles and permission checking functions
 *
 * IMPORTANT: Operations portal UI is for OPS_ADMIN and OPS_USER roles only.
 * However, ADMIN and SUPER_ADMIN can call the backend API endpoints from the
 * admin portal's Network Management page.
 */

export const ROLES = {
  OPS_ADMIN: 'OPS_ADMIN',
  OPS_USER: 'OPS_USER',
} as const

export type UserRole = (typeof ROLES)[keyof typeof ROLES]

/**
 * Check if user is OPS_ADMIN
 */
export function isOpsAdmin(role: string | undefined): boolean {
  return role === ROLES.OPS_ADMIN
}

/**
 * Check if user can activate/deactivate doctors and clinics in the operations portal UI
 * Only OPS_ADMIN can see and use activate/deactivate buttons in operations portal
 *
 * Note: This is for UI permissions only. Backend allows ADMIN and SUPER_ADMIN
 * to call activate/deactivate endpoints from the admin portal's Network Management page.
 */
export function canActivateDeactivate(role: string | undefined): boolean {
  return role === ROLES.OPS_ADMIN
}

/**
 * Check if user can create/edit doctors
 * Both OPS_ADMIN and OPS_USER can create/edit
 */
export function canManageDoctors(role: string | undefined): boolean {
  return role === ROLES.OPS_ADMIN || role === ROLES.OPS_USER
}

/**
 * Check if user can create/edit clinics
 * Both OPS_ADMIN and OPS_USER can create/edit
 */
export function canManageClinics(role: string | undefined): boolean {
  return role === ROLES.OPS_ADMIN || role === ROLES.OPS_USER
}
