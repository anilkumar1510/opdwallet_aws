import { memo } from 'react'
import type { WalletCategory } from '@/lib/api/types'

interface WalletCategoryCardProps {
  category: WalletCategory
  icon: React.ComponentType<{ className?: string }>
}

const WalletCategoryCard = memo(({
  category,
  icon: Icon
}: WalletCategoryCardProps) => {
  const percentageUsed = typeof category.total === 'number' && category.total > 0
    ? ((category.total - category.available) / category.total) * 100
    : 0

  return (
    <div className="relative overflow-hidden rounded-xl p-3 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 border border-white/20 shadow-md hover:shadow-lg hover:scale-[1.01] transition-all duration-300">
      {/* Subtle background bubble */}
      <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-cyan-300/15 to-blue-400/10 rounded-full blur-xl"></div>
      <div className="absolute -bottom-3 -left-3 w-14 h-14 bg-gradient-to-tr from-indigo-300/12 to-purple-400/8 rounded-full blur-lg"></div>

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-400/20 rounded-lg blur-sm"></div>
            <div className="relative bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-sm">
              <Icon className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate" style={{ color: '#0E51A2' }}>{category.name}</p>
            {typeof category.total === 'number' && category.total > 0 && (
              <div className="mt-1 w-full bg-gray-200/50 rounded-full h-1 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${100 - percentageUsed}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>
        <div className="text-right ml-2">
          <div className="font-bold whitespace-nowrap" style={{ color: '#303030' }}>
            ₹{typeof category.available === 'number' ? category.available.toLocaleString() : category.available}
          </div>
          {typeof category.total === 'number' && (
            <p className="text-xs text-gray-500">of ₹{category.total.toLocaleString()}</p>
          )}
        </div>
      </div>
    </div>
  )
})

WalletCategoryCard.displayName = 'WalletCategoryCard'

export default WalletCategoryCard
