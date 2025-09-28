'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { apiFetch } from '@/lib/api'

export default function OperationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await apiFetch('/api/auth/me')
      if (response.ok) {
        const userData = await response.json()
        if (!['OPS', 'ADMIN', 'SUPER_ADMIN'].includes(userData.role)) {
          router.push('/')
          return
        }
        setUser(userData)
      } else {
        router.push('/')
        return
      }
    } catch (error) {
      router.push('/')
      return
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', {
        method: 'POST',
      })
      router.push('/')
    } catch (error) {
      console.error('Logout failed')
    }
  }

  const getPageTitle = () => {
    if (pathname === '/operations') return 'Dashboard'
    if (pathname.startsWith('/operations/doctors')) return 'Doctors'
    if (pathname.startsWith('/operations/clinics')) return 'Clinics'
    if (pathname.startsWith('/operations/appointments')) return 'Appointments'
    return 'Operations'
  }

  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/operations',
      current: pathname === '/operations'
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
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="header">
        <div className="page-container">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">OPD Wallet Operations</h1>
              </div>

              <div className="hidden md:flex space-x-1">
                {navigationItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.path)}
                    className={item.current ? 'nav-item nav-item-active' : 'nav-item'}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:block">
                <span className="text-sm text-gray-600">
                  {user?.name?.fullName || user?.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="btn-ghost text-sm"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="md:hidden border-t border-gray-200 pt-4 pb-2">
            <div className="flex space-x-1 overflow-x-auto">
              {navigationItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => router.push(item.path)}
                  className={`${item.current ? 'nav-item nav-item-active' : 'nav-item'} whitespace-nowrap flex-shrink-0`}
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
                Manage {getPageTitle().toLowerCase()}
              </p>
            </div>
          </div>

          {children}
        </div>
      </main>
    </div>
  )
}