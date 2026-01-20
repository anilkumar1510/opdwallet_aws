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
  mobileIconSrc: string
}

const bottomNavItems: NavItem[] = [
  {
    name: 'Home',
    href: '/member',
    icon: HomeIcon,
    activeIcon: HomeIconSolid,
    mobileIconSrc: '/images/icons/home-icon.svg',
  },
  {
    name: 'Claims',
    href: '/member/claims',
    icon: DocumentTextIcon,
    activeIcon: DocumentTextIconSolid,
    mobileIconSrc: '/images/icons/claim-icon.svg',
  },
  {
    name: 'Bookings',
    href: '/member/bookings',
    icon: CalendarDaysIcon,
    activeIcon: CalendarDaysIconSolid,
    mobileIconSrc: '/images/icons/bookings-icon.svg',
  },
  {
    name: 'Wallet',
    href: '/member/wallet',
    icon: WalletIcon,
    activeIcon: WalletIconSolid,
    mobileIconSrc: '/images/icons/wallet-icon.svg',
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

      {/* Bottom Navigation for Mobile - Figma Design */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden" style={{ height: '159px', pointerEvents: 'none' }}>
        {/* Gradient fade effect */}
        <div
          className="absolute top-0 left-0 w-full h-full scale-y-[-1]"
          style={{
            background: 'linear-gradient(to bottom, #b8c4d0, rgba(184, 196, 208, 0))',
            pointerEvents: 'none'
          }}
        />

        {/* Frosted glass pill container - W:246 H:63 */}
        <div
          className="absolute left-1/2 flex items-center justify-center gap-[4px] p-[4px]"
          style={{
            bottom: '20px',
            transform: 'translateX(-50%)',
            width: '246px',
            height: '63px',
            background: 'rgba(255, 255, 255, 0.46)',
            border: '1px solid white',
            borderRadius: '49px',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            pointerEvents: 'auto'
          }}
        >
          {/* Non-active items container */}
          <div
            className="flex items-center justify-center gap-3 px-3 h-full"
            style={{
              background: 'rgba(184, 196, 208, 0.31)',
              border: '1px solid rgba(184, 196, 208, 0.09)',
              borderRadius: '26.5px',
              flex: 1
            }}
          >
            {bottomNavItems.filter(item => !isActive(item.href)).map((item) => {
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex flex-col items-center gap-[2px] no-underline"
                >
                  <img
                    src={item.mobileIconSrc}
                    alt={item.name}
                    width={18}
                    height={18}
                    className="object-contain"
                  />
                  <span
                    className="text-[11px] font-semibold capitalize"
                    style={{ color: '#034da2', fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
                  >
                    {item.name}
                  </span>
                </Link>
              )
            })}
          </div>

          {/* Active item */}
          {bottomNavItems.filter(item => isActive(item.href)).map((item) => {
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center justify-center gap-[2px] px-4 h-[55px] no-underline"
                style={{
                  background: '#034da2',
                  borderRadius: '46px',
                  boxShadow: '0px 1px 8px rgba(0, 0, 0, 0.1)'
                }}
              >
                <img
                  src={item.mobileIconSrc}
                  alt={item.name}
                  width={18}
                  height={18}
                  className="object-contain brightness-0 invert"
                />
                <span
                  className="text-[11px] font-semibold capitalize"
                  style={{ color: 'white', fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
                >
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Safe area for devices with home indicator (iPhone X+) */}
        <div className="absolute bottom-0 w-full h-safe-area-bottom" style={{ pointerEvents: 'none' }} />
      </div>
    </>
  )
}