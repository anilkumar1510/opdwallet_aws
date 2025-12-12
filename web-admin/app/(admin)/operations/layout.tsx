'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useUser } from '@/lib/providers/user-provider'
import { handleLogout } from '@/lib/auth-utils'
import { Logo } from '@/components/ui/Logo'

export default function OperationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useUser()

  const getPageTitle = () => {
    if (pathname === '/operations') return 'Dashboard'
    if (pathname.startsWith('/operations/members')) return 'Members'
    if (pathname.startsWith('/operations/doctors')) return 'Doctors'
    if (pathname.startsWith('/operations/clinics')) return 'Clinics'
    if (pathname.startsWith('/operations/appointments')) return 'Appointments'
    if (pathname.startsWith('/operations/lab/prescriptions')) return 'Lab Prescriptions'
    if (pathname.startsWith('/operations/lab/orders')) return 'Lab Orders'
    if (pathname.startsWith('/operations/lab')) return 'Lab Diagnostics'
    return 'Operations'
  }

  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/operations',
      current: pathname === '/operations'
    },
    {
      name: 'Members',
      path: '/operations/members',
      current: pathname.startsWith('/operations/members')
    },
    {
      name: 'Doctors',
      path: '/operations/doctors',
      current: pathname.startsWith('/operations/doctors')
    },
    {
      name: 'Clinics',
      path: '/operations/clinics',
      current: pathname.startsWith('/operations/clinics')
    },
    {
      name: 'Appointments',
      path: '/operations/appointments',
      current: pathname.startsWith('/operations/appointments')
    },
    {
      name: 'Prescriptions',
      path: '/operations/lab/prescriptions',
      current: pathname.startsWith('/operations/lab/prescriptions')
    },
    {
      name: 'Lab Orders',
      path: '/operations/lab/orders',
      current: pathname.startsWith('/operations/lab/orders')
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
              <Logo variant="white" size="full" href="/admin/operations" />
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
              >
                Logout
              </button>
            </div>
          </div>

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

      <main className="content-container">
        <div className="page-container">
          <div className="section-header">
            <div>
              <h2 className="section-title">{getPageTitle()}</h2>
              <p className="section-subtitle">
                {pathname.startsWith('/operations/doctors')
                  ? 'Manage your doctor network and schedules ✓ Latest'
                  : `Manage ${getPageTitle().toLowerCase()}`}
              </p>
            </div>
          </div>

          {children}
        </div>
      </main>
    </div>
  )
}