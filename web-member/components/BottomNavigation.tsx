'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  CalendarDaysIcon as CalendarDaysIconSolid,
  Squares2X2Icon as Squares2X2IconSolid,
} from '@heroicons/react/24/solid'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  activeIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const bottomNavItems: NavItem[] = [
  {
    name: 'Home',
    href: '/member',
    icon: HomeIcon,
    activeIcon: HomeIconSolid,
  },
  {
    name: 'Claims',
    href: '/member/reimbursements',
    icon: DocumentTextIcon,
    activeIcon: DocumentTextIconSolid,
  },
  {
    name: 'Bookings',
    href: '/member/bookings',
    icon: CalendarDaysIcon,
    activeIcon: CalendarDaysIconSolid,
  },
  {
    name: 'Services',
    href: '/member/services',
    icon: Squares2X2Icon,
    activeIcon: Squares2X2IconSolid,
  },
]

export default function BottomNavigation() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/member') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Top Navigation for Desktop */}
      <div className="hidden lg:block fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 mr-3"></div>
              <span className="text-xl font-bold text-gray-900">OPD Wallet</span>
            </div>

            {/* Navigation Items */}
            <div className="flex items-center space-x-1">
              {bottomNavItems.map((item) => {
                const active = isActive(item.href)
                const Icon = active ? item.activeIcon : item.icon

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center px-4 py-2 rounded-lg
                      transition-all duration-200
                      ${active
                        ? 'bg-brand-50 text-brand-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon
                      className={`
                        h-5 w-5 mr-2
                        ${active ? 'text-brand-600' : 'text-gray-400'}
                      `}
                    />
                    <span className="font-medium">
                      {item.name}
                    </span>
                  </Link>
                )
              })}
            </div>

            {/* Right side - can add user menu, notifications, etc. */}
            <div className="flex items-center space-x-4">
              {/* Placeholder for additional items */}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden bottom-nav-shadow">
        <div className="grid grid-cols-4 h-16 safe-area-pb">
          {bottomNavItems.map((item) => {
            const active = isActive(item.href)
            const Icon = active ? item.activeIcon : item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center py-2 px-1
                  transition-colors duration-200
                  ${active
                    ? 'text-brand-600'
                    : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                <Icon
                  className={`
                    h-6 w-6 mb-0.5
                    ${active ? 'text-brand-600' : 'text-gray-400'}
                  `}
                />
                <span className="text-xs font-medium">
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Safe area for devices with home indicator (iPhone X+) */}
        <div className="h-safe-area-bottom bg-white" />
      </div>
    </>
  )
}