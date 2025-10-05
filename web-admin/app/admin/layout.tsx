'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { apiFetch } from '@/lib/api'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Auth check moved to middleware - fetch user data only
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
    if (pathname === '/admin') return 'Dashboard'
    if (pathname.startsWith('/admin/users')) return 'Users'
    if (pathname.startsWith('/admin/policies')) return 'Policies'
    if (pathname.startsWith('/admin/categories')) return 'Categories'
    if (pathname.startsWith('/admin/services')) return 'Service Types'
    if (pathname.startsWith('/admin/lab')) return 'Lab Diagnostics'
    if (pathname.startsWith('/admin/tpa')) return 'TPA Portal'
    if (pathname.startsWith('/admin/finance')) return 'Finance Portal'
    return 'Admin'
  }

  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/admin',
      current: pathname === '/admin'
    },
    {
      name: 'Users',
      path: '/admin/users',
      current: pathname.startsWith('/admin/users')
    },
    {
      name: 'Policies',
      path: '/admin/policies',
      current: pathname.startsWith('/admin/policies')
    },
    {
      name: 'Categories',
      path: '/admin/categories',
      current: pathname.startsWith('/admin/categories')
    },
    {
      name: 'Services',
      path: '/admin/services',
      current: pathname.startsWith('/admin/services')
    },
    {
      name: 'Lab',
      path: '/admin/lab',
      current: pathname.startsWith('/admin/lab')
    },
    {
      name: 'TPA Portal',
      path: '/admin/tpa',
      current: pathname.startsWith('/admin/tpa')
    },
    {
      name: 'Finance',
      path: '/admin/finance',
      current: pathname.startsWith('/admin/finance')
    },
  ]

  // Remove loading state since auth is handled by middleware
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="header">
        <div className="page-container">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">OPD Wallet Admin</h1>
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
                Manage your OPD Wallet {getPageTitle().toLowerCase()}
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