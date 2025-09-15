'use client'

import { usePathname } from 'next/navigation'
import { BellIcon, QrCodeIcon, UsersIcon } from '@heroicons/react/24/outline'
import { MemberSwitcher } from '@/components/family/MemberSwitcher'
import { useFamily } from '@/contexts/FamilyContext'

interface MobileHeaderProps {
  user?: any
}

const pageTitle: Record<string, string> = {
  '/member': 'Dashboard',
  '/member/wallet': 'Wallet',
  '/member/benefits': 'Benefits',
  '/member/claims': 'Claims',
  '/member/bookings': 'Bookings & Orders',
  '/member/records': 'Records',
  '/member/notifications': 'Notifications',
  '/member/family': 'Family Hub',
  '/member/help': 'Help & Support',
  '/member/settings': 'Settings',
  '/member/more': 'More',
}

// Pages that should show member switcher
const memberContextPages = [
  '/member',
  '/member/wallet',
  '/member/benefits',
  '/member/claims',
  '/member/bookings',
  '/member/records'
]

export function MobileHeader({ user }: MobileHeaderProps) {
  const pathname = usePathname()
  const title = pageTitle[pathname] || 'OPD Wallet'
  const { familyMembers, activeMember, isLoading } = useFamily()

  const showMemberSwitcher = memberContextPages.includes(pathname)
  const isMultiMemberFamily = familyMembers.length > 1

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-surface-border md:hidden">
      <div className="px-4">
        {/* Main Header */}
        <div className="flex h-14 items-center justify-between">
          {/* Left Section - Profile or Member Switcher */}
          <div className="flex items-center">
            {showMemberSwitcher && isMultiMemberFamily && !isLoading ? (
              <MemberSwitcher variant="compact" showWalletBalance={false} />
            ) : (
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-white text-sm font-semibold">
                {user?.name?.fullName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
          </div>

          {/* Page Title */}
          <h1 className="text-base font-semibold text-ink-900">{title}</h1>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <button className="relative p-1.5">
              <BellIcon className="h-5 w-5 text-ink-500" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-danger"></span>
            </button>
            <button className="p-1.5">
              <QrCodeIcon className="h-5 w-5 text-ink-500" />
            </button>
          </div>
        </div>

        {/* Active Member Info Bar - Show when member switcher is active */}
        {showMemberSwitcher && isMultiMemberFamily && !isLoading && (
          <div className="pb-3 border-b border-surface-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm">
                <UsersIcon className="h-4 w-4 text-ink-400 mr-2" />
                <span className="text-ink-600">
                  Viewing as <span className="font-medium text-ink-900">{activeMember.name}</span>
                </span>
                <span className="mx-2 text-ink-300">•</span>
                <span className="text-teal-600 font-medium">
                  ₹{activeMember.walletBalance?.toLocaleString() || '0'}
                </span>
              </div>
              <div className="text-xs text-ink-400">
                {activeMember.relationship}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}