'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { apiFetch } from '@/lib/api'

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)

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
      router.push('/')
    } catch (error) {
      console.error('Logout failed')
    }
  }

  const getPageTitle = () => {
    if (pathname === '/finance') return 'Finance Dashboard'
    if (pathname.startsWith('/finance/payments')) return 'Payments Management'
    return 'Finance Portal'
  }

  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/finance',
      current: pathname === '/finance'
    },
    {
      name: 'Payments',
      path: '/finance/payments',
      current: pathname.startsWith('/finance/payments')
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="header">
        <div className="page-container">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Finance Portal</h1>
              </div>

              {/* Desktop Navigation */}
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

            {/* User Menu */}
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

          {/* Mobile Navigation */}
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

      {/* Page Content */}
      <main className="content-container">
        <div className="page-container">
          {/* Page Header */}
          <div className="section-header">
            <div>
              <h2 className="section-title">{getPageTitle()}</h2>
              <p className="section-subtitle">
                Manage payments and financial operations
              </p>
            </div>
          </div>

          {/* Page Content */}
          {children}
        </div>
      </main>
    </div>
  )
}
