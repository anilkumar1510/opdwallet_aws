'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  HomeIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  WalletIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  CalendarDaysIcon as CalendarDaysIconSolid,
  WalletIcon as WalletIconSolid,
} from '@heroicons/react/24/solid'
import NotificationBell from '@/components/NotificationBell'
import ProfileDropdown from '@/components/ProfileDropdown'
import { Logo } from '@/components/ui/Logo'

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
    href: '/member/claims',
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
    name: 'Wallet',
    href: '/member/wallet',
    icon: WalletIcon,
    activeIcon: WalletIconSolid,
  },
]

export default function BottomNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/member/profile', {
        credentials: 'include',
      })
      if (response.ok) {
        const profileData = await response.json()
        setUser({
          ...profileData.user,
          dependents: profileData.dependents || [],
        })
      } else {
        const authResponse = await fetch('/api/auth/me', {
          credentials: 'include',
        })
        if (authResponse.ok) {
          const userData = await authResponse.json()
          setUser(userData)
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const isActive = (href: string) => {
    if (href === '/member') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <>
      {/* Top Navigation for Desktop */}
      <div className="hidden lg:block fixed top-0 left-0 right-0 z-50 bg-[#2B4D8C] shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Profile and Logo */}
            <div className="flex items-center space-x-6">
              <ProfileDropdown user={user} theme="dark" />
              <div style={{ width: '20rem' }}>
                <Logo variant="white" size="full" />
              </div>
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
                        ? 'bg-white/15 text-white'
                        : 'text-white/80 hover:bg-white/8 hover:text-white'
                      }
                    `}
                  >
                    <Icon
                      className={`
                        h-5 w-5 mr-2
                        ${active ? 'text-white' : 'text-white/70'}
                      `}
                    />
                    <span className="font-medium">
                      {item.name}
                    </span>
                  </Link>
                )
              })}
            </div>

            {/* Right side - notifications */}
            <div className="flex items-center space-x-2">
              <NotificationBell theme="dark" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#2B4D8C] border-t border-white/10 lg:hidden bottom-nav-shadow">
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
                    ? 'text-white bg-white/15'
                    : 'text-white/70 hover:text-white'
                  }
                `}
              >
                <Icon
                  className={`
                    h-6 w-6 mb-0.5
                    ${active ? 'text-white' : 'text-white/70'}
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
        <div className="h-safe-area-bottom bg-[#2B4D8C]" />
      </div>
    </>
  )
}