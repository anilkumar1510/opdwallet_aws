'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
// framer-motion removed for TypeScript compatibility
import { cn } from '@/lib/utils'

interface TabItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

interface BottomTabBarProps {
  tabs: TabItem[]
  className?: string
}

export function BottomTabBar({ tabs, className }: BottomTabBarProps) {
  const pathname = usePathname()

  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 md:hidden',
      className
    )}>
      <div className="grid grid-cols-4 h-16">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href
          const Icon = tab.icon

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center py-2 px-1 transition-colors',
                isActive ? 'text-brand-600' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <div className="relative">
                <Icon className="w-6 h-6" />
                {tab.badge && tab.badge > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </div>
                )}
              </div>
              <span className="text-xs mt-1 font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}