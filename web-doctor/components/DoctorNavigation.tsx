'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  HomeIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  CalendarDaysIcon as CalendarDaysIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
} from '@heroicons/react/24/solid'
import { logoutDoctor } from '@/lib/api/auth'
import { Logo } from '@/components/ui/Logo'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  activeIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/doctorview',
    icon: HomeIcon,
    activeIcon: HomeIconSolid,
  },
  {
    name: 'Appointments',
    href: '/doctorview/appointments',
    icon: CalendarDaysIcon,
    activeIcon: CalendarDaysIconSolid,
  },
  {
    name: 'Prescriptions',
    href: '/doctorview/prescriptions',
    icon: DocumentTextIcon,
    activeIcon: DocumentTextIconSolid,
  },
]

export default function DoctorNavigation() {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string) => {
    if (href === '/doctorview') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const handleLogout = async () => {
    try {
      await logoutDoctor()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-[#2B4D8C] border-b border-white/10 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center" style={{ width: '20rem' }}>
            <Logo variant="white" size="full" />
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
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

          {/* Logout Button */}
          <div className="flex items-center">
            <button
              onClick={handleLogout}
              className="relative p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              aria-label="Sign Out"
            >
              <ArrowRightOnRectangleIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-white/10">
        <div className="grid grid-cols-3">
          {navItems.map((item) => {
            const active = isActive(item.href)
            const Icon = active ? item.activeIcon : item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center py-3
                  transition-colors duration-200
                  ${active
                    ? 'text-white bg-white/15'
                    : 'text-white/70 hover:text-white'
                  }
                `}
              >
                <Icon className="h-6 w-6 mb-1" />
                <span className="text-xs font-medium">
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
