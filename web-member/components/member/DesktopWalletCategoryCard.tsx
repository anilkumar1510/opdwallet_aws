import { memo } from 'react'
import type { WalletCategory } from '@/lib/api/types'

interface DesktopWalletCategoryCardProps {
  category: WalletCategory
  icon: React.ComponentType<{ className?: string }>
}

const DesktopWalletCategoryCard = memo(({
  category,
  icon: Icon
}: DesktopWalletCategoryCardProps) => {
  const percentageUsed = typeof category.total === 'number' && category.total > 0
    ? ((category.total - category.available) / category.total) * 100
    : 0

  return (
    <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 border border-white/20 shadow-md hover:shadow-lg hover:scale-[1.005] transition-all duration-300">
      {/* Subtle background bubbles */}
      <div className="absolute -top-5 -right-5 w-20 h-20 bg-gradient-to-br from-cyan-300/15 to-blue-400/10 rounded-full blur-2xl"></div>
      <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-tr from-indigo-300/12 to-purple-400/8 rounded-full blur-xl"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-400/20 rounded-lg blur-md"></div>
              <div className="relative bg-white/90 backdrop-blur-sm p-2.5 rounded-lg shadow-md">
                <Icon className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <span className="font-medium text-gray-900">{category.name}</span>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">
              ₹{typeof category.available === 'number' ? category.available.toLocaleString() : category.available}
            </div>
            {typeof category.total === 'number' && (
              <p className="text-xs text-gray-500">of ₹{category.total.toLocaleString()}</p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {typeof category.total === 'number' && category.total > 0 && (
          <div className="mt-2.5 w-full bg-gray-200/50 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 via-green-500 to-emerald-500 rounded-full shadow-sm transition-all duration-500"
              style={{ width: `${100 - percentageUsed}%` }}
            ></div>
          </div>
        )}

        {typeof category.total === 'number' && category.total > 0 && (
          <div className="mt-1.5 flex justify-between text-xs">
            <span className="text-gray-600 font-medium">{(100 - percentageUsed).toFixed(0)}% Available</span>
            <span className="text-gray-500">Used: ₹{(category.total - category.available).toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  )
})

DesktopWalletCategoryCard.displayName = 'DesktopWalletCategoryCard'

export default DesktopWalletCategoryCard
