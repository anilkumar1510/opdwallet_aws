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
    <div className="space-y-4 bg-white p-4 rounded-lg shadow-sm">
      {/* Search and Primary Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by policy number, name, or sponsor..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search policies"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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
            className="input"
            value={`${params.sortBy || 'updatedAt'}-${params.sortDir || 'desc'}`}
            onChange={handleSortChange}
            aria-label="Sort by"
          >
            <option value="updatedAt-desc">Last Updated (Newest)</option>
            <option value="updatedAt-asc">Last Updated (Oldest)</option>
            <option value="effectiveFrom-desc">Effective Date (Newest)</option>
            <option value="effectiveFrom-asc">Effective Date (Oldest)</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="policyNumber-asc">Policy Number (Asc)</option>
            <option value="policyNumber-desc">Policy Number (Desc)</option>
          </select>

          <select
            className="input"
            value={params.pageSize || 20}
            onChange={handlePageSizeChange}
            aria-label="Page size"
          >
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="btn-ghost text-sm"
              aria-label="Clear all filters"
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700 self-center mr-2">Status:</span>
          {Object.values(PolicyStatus).map(status => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              className={`chip ${currentStatuses.includes(status) ? 'chip-active' : ''}`}
              aria-pressed={currentStatuses.includes(status)}
              aria-label={`Filter by ${status} status`}
            >
              {status === PolicyStatus.ACTIVE && (
                <span className="status-dot status-active mr-1.5" />
              )}
              {status === PolicyStatus.DRAFT && (
                <span className="status-dot status-pending mr-1.5" />
              )}
              {(status === PolicyStatus.INACTIVE || status === PolicyStatus.EXPIRED) && (
                <span className="status-dot status-inactive mr-1.5" />
              )}
              {status}
            </button>
          ))}
        </div>

        {/* Owner/Payer Filters */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700 self-center mx-2">|</span>
          <span className="text-sm font-medium text-gray-700 self-center mr-2">Owner:</span>
          {Object.values(OwnerPayerType).map(payer => (
            <button
              key={payer}
              onClick={() => handleOwnerPayerChange(payer)}
              className={`chip ${currentPayers.includes(payer) ? 'chip-active' : ''}`}
              aria-pressed={currentPayers.includes(payer)}
              aria-label={`Filter by ${payer} owner type`}
            >
              {payer}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="dateFrom" className="text-sm font-medium text-gray-700">From:</label>
          <input
            id="dateFrom"
            type="date"
            className="input text-sm"
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
            className="input text-sm"
            value={params.dateTo || ''}
            onChange={(e) => onParamsChange({ ...params, dateTo: e.target.value || undefined, page: 1 })}
            aria-label="Filter to date"
          />
        </div>
      </div>
    </div>
  )
}