import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/providers/user-provider'

/**
 * Redirect users without required roles
 */
export function useRoleGuard(allowedRoles: string[], redirectTo: string = '/claims') {
  const { user } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (user && !allowedRoles.includes(user.role)) {
      router.push(redirectTo)
    }
  }, [user, router, allowedRoles, redirectTo])
}
