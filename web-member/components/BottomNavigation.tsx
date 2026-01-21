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

        {/* Frosted glass pill container - H:63, auto width with padding */}
        <div
          className="absolute left-1/2 flex items-center justify-center gap-[4px] px-[4px] py-[4px]"
          style={{
            bottom: '20px',
            transform: 'translateX(-50%)',
            height: '63px',
            background: 'rgba(255, 255, 255, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            borderRadius: '49px',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
            pointerEvents: 'auto'
          }}
        >
          {/* Home - Always in blue circle (First position) */}
          <Link
            href="/member"
            className="flex flex-col items-center justify-center gap-[3px] px-5 h-[55px] no-underline"
            style={{
              background: 'linear-gradient(180deg, #1a6fd4 0%, #034da2 100%)',
              borderRadius: '46px',
              boxShadow: '0px 4px 12px rgba(3, 77, 162, 0.3)'
            }}
          >
            <img
              src="/images/icons/home-icon.svg"
              alt="Home"
              width={18}
              height={18}
              className="object-contain brightness-0 invert"
            />
            <span
              className="text-[12px] font-semibold capitalize whitespace-nowrap"
              style={{ color: 'white', fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
            >
              Home
            </span>
          </Link>

          {/* Fixed items container (Claims, Bookings, Wallet) */}
          <div
            className="flex items-center justify-center gap-2 px-2 h-full"
            style={{
              background: 'rgba(255, 255, 255, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '26.5px',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)'
            }}
          >
            {bottomNavItems.filter(item => item.name !== 'Home').map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex flex-col items-center gap-[3px] no-underline px-3 py-1 rounded-full transition-all"
                  style={active ? {
                    background: 'rgba(3, 77, 162, 0.15)',
                  } : {}}
                >
                  <img
                    src={item.mobileIconSrc}
                    alt={item.name}
                    width={18}
                    height={18}
                    className="object-contain"
                  />
                  <span
                    className="text-[12px] capitalize whitespace-nowrap"
                    style={{
                      color: active ? '#0a3f93' : '#034da2',
                      fontFamily: 'SF Pro Display, system-ui, sans-serif',
                      fontWeight: active ? 700 : 600
                    }}
                  >
                    {item.name}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Safe area for devices with home indicator (iPhone X+) */}
        <div className="absolute bottom-0 w-full h-safe-area-bottom" style={{ pointerEvents: 'none' }} />
      </div>
    </>
  )
}