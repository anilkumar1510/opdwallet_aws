import Link from 'next/link'

interface SectionHeaderProps {
  title: string
  showSeeAll?: boolean
  seeAllHref?: string
  onSeeAllClick?: () => void
}

export default function SectionHeader({
  title,
  showSeeAll = false,
  seeAllHref,
  onSeeAllClick
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {showSeeAll && (
        seeAllHref ? (
          <Link
            href={seeAllHref}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            See All
          </Link>
        ) : (
          <button
            onClick={onSeeAllClick}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            See All
          </button>
        )
      )}
    </div>
  )
}
