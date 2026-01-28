'use client'

import { useUser } from '@/lib/providers/user-provider'
import {
  isOpsAdmin,
  canActivateDeactivate,
  canManageDoctors,
  canManageClinics,
} from '@/lib/rbac'

/**
 * Hook that provides permission flags based on current user's role
 * Usage: const { canActivateDeactivate } = usePermissions()
 */
export function usePermissions() {
  const { user, loading } = useUser()

  return {
    isOpsAdmin: isOpsAdmin(user?.role),
    canActivateDeactivate: canActivateDeactivate(user?.role),
    canManageDoctors: canManageDoctors(user?.role),
    canManageClinics: canManageClinics(user?.role),
    loading,
  }
}
