'use client'

import { useUser } from '@/lib/providers/user-provider'
import { canDelete, canViewInternalUsers, canDeactivate, isSuperAdmin } from '@/lib/rbac'

/**
 * Hook that provides permission flags based on current user's role
 * Usage: const { canDelete, canViewInternalUsers } = usePermissions()
 */
export function usePermissions() {
  const { user, loading } = useUser()

  return {
    isSuperAdmin: isSuperAdmin(user?.role),
    canDelete: canDelete(user?.role),
    canViewInternalUsers: canViewInternalUsers(user?.role),
    canDeactivate: canDeactivate(user?.role),
    loading,
  }
}
