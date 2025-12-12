'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useUser } from '@/lib/providers/user-provider'
import { handleLogout } from '@/lib/auth-utils'
import { Logo } from '@/components/ui/Logo'

export default function TPALayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useUser()

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
      <nav className="header-dark">
        <div className="page-container">
          <div className="flex items-center h-16 gap-8">
            {/* Logo */}
            <div className="flex-shrink-0" style={{ width: '20rem' }}>
              <Logo variant="white" size="full" href="/admin/tpa" />
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
