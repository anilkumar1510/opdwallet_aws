'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { SpecialtiesProvider } from '@/lib/providers/specialties-provider'
import { UserProvider, useUser } from '@/lib/providers/user-provider'
import { QueryProvider } from '@/lib/providers/query-provider'
import { handleLogout } from '@/lib/auth-utils'
import { Logo } from '@/components/ui/Logo'

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useUser()

  const getPageTitle = () => {
    if (pathname === '/admin' || pathname === '/') return 'Dashboard'
    if (pathname.startsWith('/users') || pathname.startsWith('/admin/users')) return 'Users'
    if (pathname.startsWith('/policies') || pathname.startsWith('/admin/policies')) return 'Policies'
    if (pathname.startsWith('/categories') || pathname.startsWith('/admin/categories')) return 'Categories'
    if (pathname.startsWith('/services') || pathname.startsWith('/admin/services')) return 'Service Types'
    if (pathname.startsWith('/lab') || pathname.startsWith('/admin/lab')) return 'Lab Diagnostics'
    if (pathname.startsWith('/diagnostics') || pathname.startsWith('/admin/diagnostics')) return 'Diagnostics'
    if (pathname.startsWith('/cugs') || pathname.startsWith('/admin/cugs')) return 'CUG Management'
    if (pathname.startsWith('/ahc') || pathname.startsWith('/admin/ahc')) return 'AHC Master'
    if (pathname.startsWith('/masters') || pathname.startsWith('/admin/masters')) return 'Masters'
    if (pathname.startsWith('/network-management') || pathname.startsWith('/admin/network-management')) return 'Network Management'
    return 'Admin'
  }

  const getPageSubtitle = () => {
    if (pathname.startsWith('/network-management') || pathname.startsWith('/admin/network-management')) {
      return 'Manage your healthcare network including clinics, hospitals, and diagnostic centers'
    }
    return `Manage your OPD Wallet ${getPageTitle().toLowerCase()}`
  }

  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/',
      current: pathname === '/admin' || pathname === '/'
    },
    {
      name: 'Users',
      path: '/users',
      current: pathname.startsWith('/users') || pathname.startsWith('/admin/users')
    },
    {
      name: 'Policies',
      path: '/policies',
      current: pathname.startsWith('/policies') || pathname.startsWith('/admin/policies')
    },
    {
      name: 'Categories',
      path: '/categories',
      current: pathname.startsWith('/categories') || pathname.startsWith('/admin/categories')
    },
    {
      name: 'Services',
      path: '/services',
      current: pathname.startsWith('/services') || pathname.startsWith('/admin/services')
    },
    {
      name: 'Lab',
      path: '/lab',
      current: pathname.startsWith('/lab') || pathname.startsWith('/admin/lab')
    },
    {
      name: 'Diagnostics',
      path: '/diagnostics',
      current: pathname.startsWith('/diagnostics') || pathname.startsWith('/admin/diagnostics')
    },
    {
      name: 'CUGs',
      path: '/cugs',
      current: pathname.startsWith('/cugs') || pathname.startsWith('/admin/cugs')
    },
    {
      name: 'AHC Master',
      path: '/ahc',
      current: pathname.startsWith('/ahc') || pathname.startsWith('/admin/ahc')
    },
    {
      name: 'Masters',
      path: '/masters',
      current: pathname.startsWith('/masters') || pathname.startsWith('/admin/masters')
    },
    {
      name: 'Network Management',
      path: '/network-management',
      current: pathname.startsWith('/network-management') || pathname.startsWith('/admin/network-management')
    },
  ]

  // Check if on Auth routes - hide admin header if so
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/admin/login') ||
                      pathname.startsWith('/forgot-password') || pathname.startsWith('/admin/forgot-password') ||
                      pathname.startsWith('/reset-password') || pathname.startsWith('/admin/reset-password')
  const hideAdminNav = isAuthRoute

  // Check if user has admin role - redirect non-admins to login
  React.useEffect(() => {
    if (!isAuthRoute && user && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      handleLogout()
    }
  }, [user, isAuthRoute])

  // Show nothing while redirecting non-admin users
  if (!isAuthRoute && user && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
    return null
  }

  // Auth is handled by middleware, user data loaded via UserProvider
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header - Hidden on auth routes */}
      {!hideAdminNav && (
        <nav className="header-dark">
          <div className="page-container">
            {/* Large screens (lg+): Natural wrapping layout */}
            <div className="hidden lg:block py-3">
              <div style={{
                display: 'grid',
                gridTemplateColumns: '20rem 1fr auto',
                gap: '0.75rem 1rem',
                alignItems: 'center'
              }}>
                {/* Logo - Takes column 1, row 1 */}
                <div style={{ gridColumn: '1', gridRow: '1' }}>
                  <Logo variant="white" size="full" href="/admin" />
                </div>

                {/* Navigation items - Column 2, can span multiple rows */}
                <div style={{
                  gridColumn: '2',
                  gridRow: 'span 2',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  alignItems: 'center'
                }}>
                  {navigationItems.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => router.push(item.path)}
                      className={item.current ? 'nav-item-dark nav-item-dark-active' : 'nav-item-dark'}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>

                {/* User menu - Column 3, row 2 */}
                <div style={{
                  gridColumn: '3',
                  gridRow: '2',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  paddingRight: '1rem'
                }}>
                  <span className="text-sm text-white/90 font-medium">
                    {user?.name?.fullName || user?.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="btn-ghost-dark text-sm"
                    style={{
                      backgroundColor: '#ef4444',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontWeight: '600'
                    }}
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>

            {/* Medium screens (md to lg): 3-row responsive layout */}
            <div className="hidden md:flex lg:hidden flex-col gap-3 py-3">
              {/* Row 1: Logo + First 5 nav items */}
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0" style={{ width: '20rem' }}>
                  <Logo variant="white" size="full" href="/admin" />
                </div>
                <div className="flex items-center gap-2 flex-1">
                  {navigationItems.slice(0, 5).map((item) => (
                    <button
                      key={item.name}
                      onClick={() => router.push(item.path)}
                      className={item.current ? 'nav-item-dark nav-item-dark-active' : 'nav-item-dark'}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 2: Remaining 6 nav items (including Network Management) */}
              <div className="flex items-center gap-2" style={{ paddingLeft: 'calc(20rem + 1rem)' }}>
                {navigationItems.slice(5).map((item) => (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.path)}
                    className={item.current ? 'nav-item-dark nav-item-dark-active' : 'nav-item-dark'}
                  >
                    {item.name}
                  </button>
                ))}
              </div>

              {/* Row 3: Username + Logout (right-aligned) */}
              <div className="flex items-center justify-end gap-4 pr-4">
                <span className="text-sm text-white/90 font-medium">
                  {user?.name?.fullName || user?.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="btn-ghost-dark text-sm"
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: '600'
                  }}
                >
                  Logout
                </button>
              </div>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden border-t border-white/10 pt-4 pb-2">
              <div className="flex space-x-1 overflow-x-auto">
                {navigationItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.path)}
                    className={`${item.current ? 'nav-item-dark nav-item-dark-active' : 'nav-item-dark'} whitespace-nowrap flex-shrink-0`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Page Content */}
      <main className={hideAdminNav ? '' : 'content-container'}>
        <div className={hideAdminNav ? '' : 'page-container'}>
          {/* Page Header - Hidden on auth routes */}
          {!hideAdminNav && (
            <div className="section-header">
              <div>
                <h2 className="section-title">{getPageTitle()}</h2>
                <p className="section-subtitle">
                  {getPageSubtitle()}
                </p>
              </div>
            </div>
          )}

          {/* Page Content */}
          {children}
        </div>
      </main>
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <QueryProvider>
      <UserProvider>
        <SpecialtiesProvider>
          <AdminLayoutContent>
            {children}
          </AdminLayoutContent>
        </SpecialtiesProvider>
      </UserProvider>
    </QueryProvider>
  )
}