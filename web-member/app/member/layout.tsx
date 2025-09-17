'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { pageTransitions } from '@/lib/animations'
import { LoadingSpinner, PageLoader } from '@/components/LoadingSpinner'
import { useToast } from '@/components/ui/Toast'
import BottomNavigation from '@/components/BottomNavigation'
import {
  HomeIcon,
  WalletIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  DocumentTextIcon,
  BellIcon,
  UsersIcon,
  QuestionMarkCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

// Sidebar navigation - items not in bottom nav
const sidebarNavigation = [
  { name: 'Dashboard', href: '/member', icon: HomeIcon, showInSidebar: 'desktop' }, // Only show in sidebar on desktop
  { name: 'Wallet', href: '/member/wallet', icon: WalletIcon },
  { name: 'Benefits', href: '/member/benefits', icon: SparklesIcon, showInSidebar: 'desktop' }, // Only show in sidebar on desktop
  { name: 'Reimbursements', href: '/member/reimbursements', icon: CurrencyDollarIcon, showInSidebar: 'desktop' },
  { name: 'Bookings', href: '/member/bookings', icon: CalendarIcon, showInSidebar: 'desktop' },
  { name: 'Records', href: '/member/records', icon: DocumentTextIcon },
  { name: 'Family Hub', href: '/member/family', icon: UsersIcon },
  { name: 'Transactions', href: '/member/transactions', icon: CurrencyDollarIcon },
  { name: 'Notifications', href: '/member/notifications', icon: BellIcon },
  { name: 'Help & Support', href: '/member/help', icon: QuestionMarkCircleIcon },
  { name: 'Settings', href: '/member/settings', icon: Cog6ToothIcon },
]

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  useEffect(() => {
    checkAuth()
  }, [])

  // Listen for sidebar toggle events from child components
  useEffect(() => {
    const handleToggleSidebar = () => {
      setSidebarOpen(prev => !prev)
    }

    window.addEventListener('toggleSidebar', handleToggleSidebar)
    return () => window.removeEventListener('toggleSidebar', handleToggleSidebar)
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      })
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/')
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
    router.push('/')
  }

  const toggleExpanded = (name: string) => {
    setExpandedItems(prev =>
      prev.includes(name)
        ? prev.filter(item => item !== name)
        : [...prev, name]
    )
  }

  if (!user) {
    return <PageLoader />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:z-0`}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500"></div>
              <span className="ml-3 text-xl font-bold text-gray-900">OPD Wallet</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* User info */}
          <div className="px-6 py-4 border-b bg-gradient-to-r from-green-50 to-blue-50">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-400 to-blue-400 flex items-center justify-center text-white font-semibold">
                {user?.name?.fullName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user?.name?.fullName || 'Member'}</p>
                <p className="text-xs text-gray-500">{user?.memberId}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {sidebarNavigation.map((item) => {
              const isActive = pathname === item.href

              // Hide items that are in bottom nav on mobile
              const hideOnMobile = item.showInSidebar === 'desktop'

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    isActive
                      ? 'bg-green-50 text-green-700 border-l-4 border-green-500'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${
                    hideOnMobile ? 'hidden lg:flex' : 'flex'
                  } group items-center px-3 py-2 text-sm font-medium rounded-md transition-colors`}
                >
                  <item.icon className={`${
                    isActive ? 'text-green-500' : 'text-gray-400 group-hover:text-gray-500'
                  } mr-3 h-5 w-5 flex-shrink-0`} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Logout button */}
          <div className="border-t px-3 py-4">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Page content - removed top bar */}
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0" role="main">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              variants={pageTransitions}
              initial="initial"
              animate="animate"
              exit="exit"
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Bottom Navigation for Mobile */}
      <BottomNavigation />
    </div>
  )
}