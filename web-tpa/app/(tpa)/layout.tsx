'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { SpecialtiesProvider } from '@/lib/providers/specialties-provider'
import { UserProvider, useUser } from '@/lib/providers/user-provider'
import { QueryProvider } from '@/lib/providers/query-provider'
import { handleLogout } from '@/lib/auth-utils'
import { Logo } from '@/components/ui/Logo'
import { isTpaAdmin } from '@/lib/utils/rbac'

function TPALayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useUser()

  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard'
    if (pathname.startsWith('/claims/unassigned')) return 'Unassigned Claims'
    if (pathname.startsWith('/claims/assigned')) return 'Assigned Claims'
    if (pathname.startsWith('/claims')) {
      // Show "My Claims" for TPA_USER, "Claims Management" for TPA_ADMIN
      return user?.role === 'TPA_USER' ? 'My Claims' : 'Claims Management'
    }
    if (pathname.startsWith('/analytics')) return 'Analytics & Reports'
    if (pathname.startsWith('/users')) return 'Member Management'
    return 'TPA Portal'
  }

  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/',
      current: pathname === '/',
      allowedRoles: ['TPA_ADMIN', 'TPA_USER', 'SUPER_ADMIN']
    },
    {
      name: user?.role === 'TPA_USER' ? 'My Claims' : 'All Claims',
      path: '/claims',
      current: pathname === '/claims',
      allowedRoles: ['TPA_ADMIN', 'TPA_USER', 'SUPER_ADMIN']
    },
    {
      name: 'Unassigned',
      path: '/claims/unassigned',
      current: pathname.startsWith('/claims/unassigned'),
      allowedRoles: ['TPA_ADMIN', 'SUPER_ADMIN']
    },
    {
      name: 'Assigned',
      path: '/claims/assigned',
      current: pathname.startsWith('/claims/assigned'),
      allowedRoles: ['TPA_ADMIN', 'SUPER_ADMIN']
    },
    {
      name: 'Analytics',
      path: '/analytics',
      current: pathname.startsWith('/analytics'),
      allowedRoles: ['TPA_ADMIN', 'SUPER_ADMIN']
    },
    {
      name: 'Members',
      path: '/users',
      current: pathname.startsWith('/users'),
      allowedRoles: ['TPA_ADMIN', 'SUPER_ADMIN']
    },
  ]

  // Remove loading state - auth handled by middleware
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="header-dark">
        <div className="page-container">
          <div className="flex items-center h-16 gap-8">
            {/* Logo */}
            <div className="flex-shrink-0" style={{ width: '20rem' }}>
              <Logo variant="white" size="full" href="/" />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2 flex-1">
              {navigationItems
                .filter(item => !item.allowedRoles || item.allowedRoles.includes(user?.role || ''))
                .map((item) => (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.path)}
                    className={item.current ? 'nav-item-dark nav-item-dark-active' : 'nav-item-dark'}
                  >
                    {item.name}
                  </button>
                ))
              }
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="hidden sm:block">
                <span className="text-sm text-white/90 font-medium">
                  {user?.name?.fullName || user?.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="btn-ghost-dark text-sm"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="md:hidden border-t border-white/10 pt-4 pb-2">
            <div className="flex space-x-1 overflow-x-auto">
              {navigationItems
                .filter(item => !item.allowedRoles || item.allowedRoles.includes(user?.role || ''))
                .map((item) => (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.path)}
                    className={`${item.current ? 'nav-item-dark nav-item-dark-active' : 'nav-item-dark'} whitespace-nowrap flex-shrink-0`}
                  >
                    {item.name}
                  </button>
                ))
              }
            </div>
          </div>
        </div>
      </nav>

      <main className="content-container">
        <div className="page-container">
          <div className="section-header">
            <div>
              <h2 className="section-title">{getPageTitle()}</h2>
              <p className="section-subtitle">
                {pathname === '/' ? 'TPA dashboard and overview' : `Manage ${getPageTitle().toLowerCase()}`}
              </p>
            </div>
          </div>

          {children}
        </div>
      </main>
    </div>
  )
}

export default function TPALayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <QueryProvider>
      <UserProvider>
        <SpecialtiesProvider>
          <TPALayoutContent>
            {children}
          </TPALayoutContent>
        </SpecialtiesProvider>
      </UserProvider>
    </QueryProvider>
  )
}
