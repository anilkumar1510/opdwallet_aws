'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  HomeIcon,
  WalletIcon,
  SparklesIcon,
  DocumentTextIcon,
  CalendarIcon,
  DocumentDuplicateIcon,
  BellIcon,
  UsersIcon,
  QuestionMarkCircleIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/member', icon: HomeIcon },
  { name: 'Wallet', href: '/member/wallet', icon: WalletIcon },
  {
    name: 'Benefits',
    href: '/member/benefits',
    icon: SparklesIcon,
    children: [
      { name: 'Consultations', href: '/member/benefits/consultations' },
      { name: 'Pharmacy', href: '/member/benefits/pharmacy' },
      { name: 'Labs', href: '/member/benefits/labs' },
      { name: 'Preventive', href: '/member/benefits/preventive' },
      { name: 'Vision & Dental', href: '/member/benefits/vision-dental' },
      { name: 'Wellness', href: '/member/benefits/wellness' },
    ]
  },
  { name: 'Claims', href: '/member/claims', icon: DocumentTextIcon },
  { name: 'Bookings & Orders', href: '/member/bookings', icon: CalendarIcon },
  { name: 'Records', href: '/member/records', icon: DocumentDuplicateIcon },
  { name: 'Notifications', href: '/member/notifications', icon: BellIcon },
  { name: 'Family Hub', href: '/member/family', icon: UsersIcon },
  { name: 'Help', href: '/member/help', icon: QuestionMarkCircleIcon },
  { name: 'Settings', href: '/member/settings', icon: Cog6ToothIcon },
]

interface SidebarProps {
  user?: any
  onLogout?: () => void
}

export function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>(['Benefits'])

  const toggleExpanded = (name: string) => {
    setExpandedItems(prev =>
      prev.includes(name)
        ? prev.filter(item => item !== name)
        : [...prev, name]
    )
  }

  return (
    <div className="hidden md:flex md:fixed md:inset-y-0 md:z-40 md:w-64 lg:w-72">
      <div className="flex flex-col flex-grow bg-surface border-r border-surface-border">
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b border-surface-border">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700"></div>
            <span className="ml-3 text-xl font-bold text-ink-900">OPD Wallet</span>
          </div>
        </div>

        {/* User info */}
        {user && (
          <div className="px-6 py-4 border-b border-surface-border bg-surface-alt">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-white font-semibold">
                {user.name?.fullName?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-ink-900">{user.name?.fullName || 'Member'}</p>
                <p className="text-xs text-ink-500">{user.memberId}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href ||
                (item.children && pathname.startsWith(item.href))
              const isExpanded = expandedItems.includes(item.name)

              return (
                <div key={item.name}>
                  {item.children ? (
                    <>
                      <button
                        onClick={() => toggleExpanded(item.name)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-xl transition-all ${
                          isActive
                            ? 'bg-brand-50 text-brand-700'
                            : 'text-ink-700 hover:bg-surface-alt hover:text-ink-900'
                        }`}
                      >
                        <div className="flex items-center">
                          <item.icon className={`mr-3 h-5 w-5 ${
                            isActive ? 'text-brand-600' : 'text-ink-500'
                          }`} />
                          {item.name}
                        </div>
                        <ChevronDownIcon className={`h-4 w-4 text-ink-500 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`} />
                      </button>
                      {isExpanded && (
                        <div className="ml-8 mt-1 space-y-1">
                          {item.children.map((child) => {
                            const isChildActive = pathname === child.href
                            return (
                              <Link
                                key={child.name}
                                href={child.href}
                                className={`block px-3 py-2 text-sm rounded-xl transition-all ${
                                  isChildActive
                                    ? 'bg-brand-50 text-brand-700 font-medium'
                                    : 'text-ink-700 hover:bg-surface-alt hover:text-ink-900'
                                }`}
                              >
                                {child.name}
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-all ${
                        isActive
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-ink-700 hover:bg-surface-alt hover:text-ink-900'
                      }`}
                    >
                      <item.icon className={`mr-3 h-5 w-5 ${
                        isActive ? 'text-brand-600' : 'text-ink-500'
                      }`} />
                      {item.name}
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </nav>

        {/* Logout button */}
        {onLogout && (
          <div className="p-3 border-t border-surface-border">
            <button
              onClick={onLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-danger-700 hover:bg-danger-50 rounded-xl transition-all"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}