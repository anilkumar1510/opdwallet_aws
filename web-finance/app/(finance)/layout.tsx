'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BanknotesIcon,
  ClockIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { SpecialtiesProvider } from '@/lib/providers/specialties-provider'
import { UserProvider, useUser } from '@/lib/providers/user-provider'
import { QueryProvider } from '@/lib/providers/query-provider'
import { handleLogout } from '@/lib/auth-utils'
import { Logo } from '@/components/ui/Logo'

function FinanceLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user } = useUser()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: BanknotesIcon,
      current: pathname === '/',
    },
    {
      name: 'Pending Payments',
      path: '/payments/pending',
      icon: ClockIcon,
      current: pathname.startsWith('/payments/pending'),
    },
    {
      name: 'Payment History',
      path: '/payments/history',
      icon: ChartBarIcon,
      current: pathname.startsWith('/payments/history'),
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-[#2B4D8C] border-b border-white/10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-8">
            {/* Logo */}
            <div className="flex-shrink-0" style={{ width: '20rem' }}>
              <Logo variant="white" size="full" href="/" />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2 flex-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.path}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      item.current
                        ? 'bg-white/15 text-white'
                        : 'text-white/80 hover:bg-white/8 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>

            {/* User Menu */}
            <div className="hidden md:flex items-center gap-4 flex-shrink-0">
              {user && (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">
                      {user.name?.fullName || user.email}
                    </p>
                    <p className="text-xs text-white/70">{user.role}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-white/70 hover:text-white transition-colors"
                    title="Logout"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-white hover:bg-white/10"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-lg text-base font-medium flex items-center space-x-2 ${
                      item.current
                        ? 'bg-white/15 text-white'
                        : 'text-white/80 hover:bg-white/8 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-lg text-base font-medium text-white/80 hover:bg-white/8 hover:text-white flex items-center space-x-2"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">{children}</main>
    </div>
  )
}

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <QueryProvider>
      <UserProvider>
        <SpecialtiesProvider>
          <FinanceLayoutContent>
            {children}
          </FinanceLayoutContent>
        </SpecialtiesProvider>
      </UserProvider>
    </QueryProvider>
  )
}
