'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { PolicyStatus, OwnerPayerType, PolicyQueryParams } from '../_lib/types'

interface PolicyFiltersProps {
  params: PolicyQueryParams
  onParamsChange: (params: PolicyQueryParams) => void
}

export default function PolicyFilters({ params, onParamsChange }: PolicyFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [searchTerm, setSearchTerm] = useState(params.q || '')
  const searchDebounceRef = useRef<NodeJS.Timeout>()

  // Debounced search
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
    }

    searchDebounceRef.current = setTimeout(() => {
      if (searchTerm !== params.q) {
        onParamsChange({ ...params, q: searchTerm || undefined, page: 1 })
      }
    }, 300)

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current)
      }
    }
  }, [searchTerm, params, onParamsChange])

  const handleStatusChange = (status: PolicyStatus) => {
    const currentStatuses = Array.isArray(params.status) ? params.status : params.status ? [params.status] : []
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status]

    onParamsChange({
      ...params,
      status: newStatuses.length > 0 ? newStatuses : undefined,
      page: 1
    })
  }

  const handleOwnerPayerChange = (payer: OwnerPayerType) => {
    const currentPayers = Array.isArray(params.ownerPayer) ? params.ownerPayer : params.ownerPayer ? [params.ownerPayer] : []
    const newPayers = currentPayers.includes(payer)
      ? currentPayers.filter(p => p !== payer)
      : [...currentPayers, payer]

    onParamsChange({
      ...params,
      ownerPayer: newPayers.length > 0 ? newPayers : undefined,
      page: 1
    })
  }

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [sortBy, sortDir] = e.target.value.split('-') as [PolicyQueryParams['sortBy'], PolicyQueryParams['sortDir']]
    onParamsChange({ ...params, sortBy, sortDir })
  }

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onParamsChange({ ...params, pageSize: parseInt(e.target.value, 10), page: 1 })
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    onParamsChange({
      page: 1,
      pageSize: params.pageSize || 20,
      sortBy: 'updatedAt',
      sortDir: 'desc'
    })
  }

  const currentStatuses = Array.isArray(params.status) ? params.status : params.status ? [params.status] : []
  const currentPayers = Array.isArray(params.ownerPayer) ? params.ownerPayer : params.ownerPayer ? [params.ownerPayer] : []
  const hasActiveFilters = !!(params.q || currentStatuses.length > 0 || currentPayers.length > 0 || params.dateFrom || params.dateTo)

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Search and Primary Controls */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by policy number, name, or sponsor..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search policies"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 bg-white"
              value={`${params.sortBy || 'updatedAt'}-${params.sortDir || 'desc'}`}
              onChange={handleSortChange}
              aria-label="Sort by"
            >
              <option value="updatedAt-desc">Last Updated ↓</option>
              <option value="updatedAt-asc">Last Updated ↑</option>
              <option value="effectiveFrom-desc">Effective Date ↓</option>
              <option value="effectiveFrom-asc">Effective Date ↑</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="policyNumber-asc">Policy # ↑</option>
              <option value="policyNumber-desc">Policy # ↓</option>
            </select>

            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 bg-white"
              value={params.pageSize || 20}
              onChange={handlePageSizeChange}
              aria-label="Page size"
            >
              <option value="10">10 / page</option>
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                aria-label="Clear all filters"
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="p-4 space-y-3">
        {/* Status Filters */}
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-sm font-semibold text-gray-800 min-w-[80px]">Status:</span>
          <div className="flex flex-wrap gap-2">
            {Object.values(PolicyStatus).map(status => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  currentStatuses.includes(status)
                    ? status === PolicyStatus.ACTIVE ? 'bg-green-100 text-green-800 border border-green-300' :
                      status === PolicyStatus.DRAFT ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                      'bg-gray-100 text-gray-800 border border-gray-400'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
                aria-pressed={currentStatuses.includes(status)}
                aria-label={`Filter by ${status} status`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Owner/Payer Filters */}
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-sm font-semibold text-gray-800 min-w-[80px]">Owner:</span>
          <div className="flex flex-wrap gap-2">
            {Object.values(OwnerPayerType).map(payer => (
              <button
                key={payer}
                onClick={() => handleOwnerPayerChange(payer)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  currentPayers.includes(payer)
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
                aria-pressed={currentPayers.includes(payer)}
                aria-label={`Filter by ${payer} owner type`}
              >
                {payer}
              </button>
            ))}
          </div>
        </div>

        {/* Date Range Filters */}
        <div className="flex items-center flex-wrap gap-4">
          <span className="text-sm font-semibold text-gray-800 min-w-[80px]">Date Range:</span>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="dateFrom" className="text-sm font-medium text-gray-700">From:</label>
              <input
                id="dateFrom"
                type="date"
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={params.dateFrom || ''}
                onChange={(e) => onParamsChange({ ...params, dateFrom: e.target.value || undefined, page: 1 })}
                aria-label="Filter from date"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="dateTo" className="text-sm font-medium text-gray-700">To:</label>
              <input
                id="dateTo"
                type="date"
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={params.dateTo || ''}
                onChange={(e) => onParamsChange({ ...params, dateTo: e.target.value || undefined, page: 1 })}
                aria-label="Filter to date"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}