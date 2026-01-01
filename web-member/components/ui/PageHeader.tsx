'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'

interface PageHeaderProps {
  title: string
  subtitle?: string
  onBack?: () => void
  backHref?: string
  showBack?: boolean
  sticky?: boolean
}

export default function PageHeader({
  title,
  subtitle,
  onBack,
  backHref,
  showBack = true,
  sticky = true,
}: PageHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else if (backHref) {
      router.push(backHref)
    } else {
      router.back()
    }
  }

  return (
    <div
      className={`bg-white ${
        sticky ? 'sticky top-0 z-10' : ''
      } shadow-sm`}
    >
      <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-4">
        <div className="flex items-center gap-3 lg:gap-4">
          {showBack && (
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ChevronLeftIcon className="h-5 w-5 lg:h-6 lg:w-6 text-gray-700" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h1
              className="text-lg lg:text-xl font-bold truncate"
              style={{ color: '#0E51A2' }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs lg:text-sm text-gray-600 truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
