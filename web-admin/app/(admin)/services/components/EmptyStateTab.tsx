'use client'

interface EmptyStateTabProps {
  categoryName: string
  categoryId: string
}

export function EmptyStateTab({ categoryName, categoryId }: EmptyStateTabProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="rounded-full bg-gray-100 p-3 mb-4">
          <svg
            className="h-8 w-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {categoryName} Services
        </h3>
        <p className="text-sm text-gray-600 text-center max-w-md">
          Services for this category are coming soon. Check back later for updates.
        </p>
        <p className="text-xs text-gray-500 mt-4">
          Category ID: {categoryId}
        </p>
      </div>
    </div>
  )
}
