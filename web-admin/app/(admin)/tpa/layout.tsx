'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { apiFetch } from '@/lib/api'

export default function TPALayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)

  // Auth check moved to middleware - only fetch user data
  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await apiFetch('/api/auth/me')
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', {
        method: 'POST',
      })
      // Redirect to login page after logout (respects basePath)
      window.location.href = '/admin/login'
    } catch (error) {
      console.error('Logout failed:', error)
      // Even if logout API fails, redirect to login
      window.location.href = '/admin/login'
    }
  }

  const getPageTitle = () => {
    if (pathname === '/tpa') return 'Dashboard'
    if (pathname.startsWith('/tpa/claims/unassigned')) return 'Unassigned Claims'
    if (pathname.startsWith('/tpa/claims/assigned')) return 'Assigned Claims'
    if (pathname.startsWith('/tpa/claims')) return 'Claims Management'
    if (pathname.startsWith('/tpa/analytics')) return 'Analytics & Reports'
    if (pathname.startsWith('/tpa/users')) return 'Member Management'
    return 'TPA Portal'
  }

  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/tpa',
      current: pathname === '/tpa'
    },
    {
      name: 'All Claims',
      path: '/tpa/claims',
      current: pathname === '/tpa/claims'
    },
    {
      name: 'Unassigned',
      path: '/tpa/claims/unassigned',
      current: pathname.startsWith('/tpa/claims/unassigned')
    },
    {
      name: 'Assigned',
      path: '/tpa/claims/assigned',
      current: pathname.startsWith('/tpa/claims/assigned')
    },
    {
      name: 'Analytics',
      path: '/tpa/analytics',
      current: pathname.startsWith('/tpa/analytics')
    },
    {
      name: 'Members',
      path: '/tpa/users',
      current: pathname.startsWith('/tpa/users')
    },
  ]

  // Remove loading state - auth handled by middleware
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="header">
        <div className="page-container">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">TPA Portal</h1>
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
                {pathname === '/tpa' ? 'TPA dashboard and overview' : `Manage ${getPageTitle().toLowerCase()}`}
              </p>
            </div>
          </div>

          {children}
        </div>
      </main>
    </div>
  )
}
