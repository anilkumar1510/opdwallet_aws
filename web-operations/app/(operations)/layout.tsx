'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { SpecialtiesProvider } from '@/lib/providers/specialties-provider'
import { UserProvider, useUser } from '@/lib/providers/user-provider'
import { QueryProvider } from '@/lib/providers/query-provider'
import { handleLogout } from '@/lib/auth-utils'
import { Logo } from '@/components/ui/Logo'

function OperationsLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useUser()

  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard'
    if (pathname.startsWith('/members')) return 'Members'
    if (pathname.startsWith('/doctors')) return 'Doctors'
    if (pathname.startsWith('/clinics')) return 'Clinics'
    if (pathname.startsWith('/appointments')) return 'Appointments'
    if (pathname.startsWith('/dental-services')) return 'Dental Services'
    if (pathname.startsWith('/vision-services')) return 'Vision Services'
    if (pathname.startsWith('/prescriptions')) return 'Prescriptions'
    if (pathname.startsWith('/orders')) return 'Orders'
    if (pathname.startsWith('/diagnostics')) return 'Diagnostics'
    if (pathname.startsWith('/lab')) return 'Lab'
    return 'Operations'
  }

  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/',
      current: pathname === '/'
    },
    {
      name: 'Members',
      path: '/members',
      current: pathname.startsWith('/members')
    },
    {
      name: 'Doctors',
      path: '/doctors',
      current: pathname.startsWith('/doctors')
    },
    {
      name: 'Clinics',
      path: '/clinics',
      current: pathname.startsWith('/clinics')
    },
    {
      name: 'Appointments',
      path: '/appointments',
      current: pathname.startsWith('/appointments')
    },
    {
      name: 'Dental Services',
      path: '/dental-services',
      current: pathname.startsWith('/dental-services')
    },
    {
      name: 'Vision Services',
      path: '/vision-services',
      current: pathname.startsWith('/vision-services')
    },
    {
      name: 'Prescriptions',
      path: '/prescriptions',
      current: pathname.startsWith('/prescriptions')
    },
    {
      name: 'Orders',
      path: '/orders',
      current: pathname.startsWith('/orders')
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
            <div className="hidden md:flex items-start gap-2 flex-1 flex-wrap">
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
                {pathname.startsWith('/doctors')
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

export default function OperationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <QueryProvider>
      <UserProvider>
        <SpecialtiesProvider>
          <OperationsLayoutContent>
            {children}
          </OperationsLayoutContent>
        </SpecialtiesProvider>
      </UserProvider>
    </QueryProvider>
  )
}