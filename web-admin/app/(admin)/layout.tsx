'use client'

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
    if (pathname.startsWith('/cugs') || pathname.startsWith('/admin/cugs')) return 'CUG Management'
    if (pathname.startsWith('/masters') || pathname.startsWith('/admin/masters')) return 'Masters'
    return 'Admin'
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
      name: 'CUGs',
      path: '/cugs',
      current: pathname.startsWith('/cugs') || pathname.startsWith('/admin/cugs')
    },
    {
      name: 'Masters',
      path: '/masters',
      current: pathname.startsWith('/masters') || pathname.startsWith('/admin/masters')
    },
  ]

  // Check if on operations, TPA, Finance, or Auth routes - hide admin header if so
  const isOperationsRoute = pathname.startsWith('/operations') || pathname.startsWith('/admin/operations')
  const isTPARoute = pathname.startsWith('/tpa') || pathname.startsWith('/admin/tpa')
  const isFinanceRoute = pathname.startsWith('/finance') || pathname.startsWith('/admin/finance')
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/admin/login') ||
                      pathname.startsWith('/forgot-password') || pathname.startsWith('/admin/forgot-password') ||
                      pathname.startsWith('/reset-password') || pathname.startsWith('/admin/reset-password')
  const hideAdminNav = isOperationsRoute || isTPARoute || isFinanceRoute || isAuthRoute

  // Auth is handled by middleware, user data loaded via UserProvider
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header - Hidden on operations, TPA, and Finance routes */}
      {!hideAdminNav && (
        <nav className="header-dark">
          <div className="page-container">
            <div className="flex items-center h-16 gap-8">
              {/* Logo */}
              <div className="flex-shrink-0" style={{ width: '20rem' }}>
                <Logo variant="white" size="full" href="/admin" />
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-2 flex-1">
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
          {/* Page Header - Hidden on operations, TPA, and Finance routes */}
          {!hideAdminNav && (
            <div className="section-header">
              <div>
                <h2 className="section-title">{getPageTitle()}</h2>
                <p className="section-subtitle">
                  Manage your OPD Wallet {getPageTitle().toLowerCase()}
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