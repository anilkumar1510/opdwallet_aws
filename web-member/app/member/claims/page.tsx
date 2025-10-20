'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import {
  DocumentTextIcon,
  FunnelIcon,
  TableCellsIcon,
  Squares2X2Icon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

type ClaimStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'processing' | 'cancelled'
type ViewMode = 'table' | 'cards'
type SortField = 'date' | 'amount' | 'status' | 'type'
type SortOrder = 'asc' | 'desc'

interface Claim {
  id: string
  claimNumber: string
  date: string
  type: string
  provider: string
  amount: number
  status: ClaimStatus
  description: string
  category: string
  submittedDate: string
  processedDate?: string
  documents: number
}

export default function ClaimsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | 'all'>('all')
  const [dateRange, setDateRange] = useState('all')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [dataView, setDataView] = useState<'compact' | 'comfortable' | 'spacious'>('comfortable')
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const itemsPerPage = 10

  // Map backend status to frontend status
  const mapStatus = (backendStatus: string): ClaimStatus => {
    const statusMap: Record<string, ClaimStatus> = {
      'DRAFT': 'draft',
      'SUBMITTED': 'submitted',
      'UNDER_REVIEW': 'under_review',
      'APPROVED': 'approved',
      'REJECTED': 'rejected',
      'CANCELLED': 'cancelled',
      'PAYMENT_PENDING': 'processing',
      'PAYMENT_PROCESSING': 'processing',
      'PAYMENT_COMPLETED': 'approved',
      'ASSIGNED': 'under_review',
      'UNASSIGNED': 'submitted'
    }
    return statusMap[backendStatus] || 'submitted'
  }

  // Format category for display
  const formatCategory = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'CONSULTATION': 'Consultation',
      'DIAGNOSTICS': 'Diagnostic',
      'PHARMACY': 'Pharmacy',
      'DENTAL': 'Dental',
      'VISION': 'Vision',
      'WELLNESS': 'Wellness',
      'IPD': 'IPD',
      'OPD': 'OPD'
    }
    return categoryMap[category] || category
  }

  // Fetch claims from API
  const fetchClaims = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/member/claims?limit=100', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch claims')
      }

      const data = await response.json()

      // Map backend claims to frontend format (including drafts)
      const mappedClaims: Claim[] = data.claims
        .map((claim: any) => ({
          id: claim._id,
          claimNumber: claim.claimId,
          date: new Date(claim.treatmentDate).toISOString().split('T')[0],
          type: formatCategory(claim.category),
          provider: claim.providerName || 'N/A',
          amount: claim.billAmount,
          status: mapStatus(claim.status),
          description: claim.treatmentDescription || claim.category,
          category: claim.category.toLowerCase(),
          submittedDate: claim.submittedAt ? new Date(claim.submittedAt).toISOString().split('T')[0] : new Date(claim.createdAt).toISOString().split('T')[0],
          processedDate: claim.processedAt ? new Date(claim.processedAt).toISOString().split('T')[0] : undefined,
          documents: claim.documents?.length || 0
        }))

      setClaims(mappedClaims)
    } catch (err: any) {
      console.error('Error fetching claims:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClaims()

    // Refresh data when user navigates back to this page
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchClaims()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchClaims])

  // Calculate statistics from real data
  const stats = {
    approved: claims.filter(c => c.status === 'approved').length,
    processing: claims.filter(c => c.status === 'processing').length,
    underReview: claims.filter(c => c.status === 'under_review').length,
    totalAmount: claims.reduce((sum, c) => sum + c.amount, 0)
  }

  // Filter helper functions
  const matchesClaimSearch = (claim: Claim): boolean => {
    const query = searchQuery.toLowerCase()
    return claim.claimNumber.toLowerCase().includes(query) ||
           claim.provider.toLowerCase().includes(query) ||
           claim.description.toLowerCase().includes(query)
  }

  const matchesClaimStatus = (claim: Claim): boolean => {
    return statusFilter === 'all' || claim.status === statusFilter
  }

  const getClaimSortValue = (claim: Claim, field: SortField): any => {
    switch (field) {
      case 'date':
        return new Date(claim.date)
      case 'amount':
        return claim.amount
      case 'status':
        return claim.status
      case 'type':
        return claim.type
      default:
        return null
    }
  }

  const compareClaimValues = (aValue: any, bValue: any): number => {
    if (aValue === null || bValue === null) return 0

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  }

  // Filter and sort claims
  const filteredAndSortedClaims = claims
    .filter(claim => matchesClaimSearch(claim) && matchesClaimStatus(claim))
    .sort((a, b) => {
      const aValue = getClaimSortValue(a, sortField)
      const bValue = getClaimSortValue(b, sortField)
      return compareClaimValues(aValue, bValue)
    })

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedClaims.length / itemsPerPage)
  const paginatedClaims = filteredAndSortedClaims.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const getStatusIcon = (status: ClaimStatus) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'rejected':
        return <XCircleIcon className="h-4 w-4" />
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4" />
      case 'processing':
        return <ClockIcon className="h-4 w-4" />
      case 'under_review':
        return <ExclamationCircleIcon className="h-4 w-4" />
      case 'draft':
        return <DocumentTextIcon className="h-4 w-4" />
      default:
        return <DocumentTextIcon className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: ClaimStatus) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700'
      case 'rejected':
        return 'bg-red-100 text-red-700'
      case 'cancelled':
        return 'bg-gray-100 text-gray-700'
      case 'processing':
        return 'bg-blue-100 text-blue-700'
      case 'under_review':
        return 'bg-amber-100 text-amber-700'
      case 'draft':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const exportData = () => {
    // In a real app, this would generate and download a CSV/Excel file
    console.log('Exporting claims data...')
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-ink-900">Claims History</h1>
            <p className="text-ink-500 mt-1">Track and manage your medical claims</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-3">
            <Link
              href="/member/claims/new"
              className="btn-primary"
            >
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              New Claim
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="p-4">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-surface-alt rounded mr-3" />
                  <div>
                    <div className="h-6 w-12 bg-surface-alt rounded mb-2" />
                    <div className="h-3 w-16 bg-surface-alt rounded" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="p-2">
              <div className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{stats.approved}</p>
                  <p className="text-xs text-gray-600">Approved</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-2">
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{stats.processing}</p>
                  <p className="text-xs text-gray-600">Processing</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-2">
              <div className="flex items-center">
                <ExclamationCircleIcon className="h-4 w-4 text-amber-600 mr-2" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{stats.underReview}</p>
                  <p className="text-xs text-gray-600">Under Review</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-2">
              <div className="flex items-center">
                <DocumentTextIcon className="h-4 w-4 text-indigo-600 mr-2" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">₹{stats.totalAmount.toLocaleString()}</p>
                  <p className="text-xs text-gray-600">Total Claims</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Controls Bar */}
      <Card className="mb-6" noPadding>
        <div className="p-4 border-b border-surface-border">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <input
                  type="text"
                  placeholder="Search claims..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-surface border border-surface-border rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent text-sm"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ClaimStatus | 'all')}
                className="px-3 py-2 bg-surface border border-surface-border rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent text-sm"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="processing">Processing</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* Desktop Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="hidden lg:flex items-center px-3 py-2 border border-surface-border rounded-lg text-sm hover:bg-surface-alt"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filters
              </button>
            </div>

            {/* View Controls */}
            <div className="flex items-center gap-3">
              {/* Data Density - Desktop Only */}
              <div className="hidden xl:flex items-center gap-2">
                <span className="text-xs text-ink-500">Density:</span>
                <select
                  value={dataView}
                  onChange={(e) => setDataView(e.target.value as 'compact' | 'comfortable' | 'spacious')}
                  className="px-2 py-1 bg-surface border border-surface-border rounded text-xs"
                >
                  <option value="compact">Compact</option>
                  <option value="comfortable">Comfortable</option>
                  <option value="spacious">Spacious</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-surface-alt rounded-lg p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded ${viewMode === 'table' ? 'bg-surface shadow-sm' : 'hover:bg-surface'}`}
                >
                  <TableCellsIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-2 rounded ${viewMode === 'cards' ? 'bg-surface shadow-sm' : 'hover:bg-surface'}`}
                >
                  <Squares2X2Icon className="h-4 w-4" />
                </button>
              </div>

              {/* Export Button */}
              <button
                onClick={exportData}
                className="hidden sm:flex items-center px-3 py-2 border border-surface-border rounded-lg text-sm hover:bg-surface-alt"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters - Desktop Only */}
        {showFilters && (
          <div className="p-4 bg-surface-alt border-b border-surface-border">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">Date Range</label>
                <select className="w-full px-3 py-2 bg-surface border border-surface-border rounded text-sm">
                  <option>All Time</option>
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                  <option>This Year</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">Category</label>
                <select className="w-full px-3 py-2 bg-surface border border-surface-border rounded text-sm">
                  <option>All Categories</option>
                  <option>Consultation</option>
                  <option>Pharmacy</option>
                  <option>Diagnostic</option>
                  <option>Preventive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">Amount Range</label>
                <select className="w-full px-3 py-2 bg-surface border border-surface-border rounded text-sm">
                  <option>All Amounts</option>
                  <option>Under ₹1,000</option>
                  <option>₹1,000 - ₹5,000</option>
                  <option>Above ₹5,000</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">Provider</label>
                <input
                  type="text"
                  placeholder="Provider name..."
                  className="w-full px-3 py-2 bg-surface border border-surface-border rounded text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Error State */}
      {error && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <div className="p-4">
            <div className="flex items-center">
              <XCircleIcon className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-700">Failed to load claims: {error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Content */}
      {loading ? (
        // Loading State
        <Card noPadding className="overflow-hidden">
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
            <p className="text-ink-500">Loading claims...</p>
          </div>
        </Card>
      ) : viewMode === 'table' ? (
        // Desktop Table View
        <Card noPadding className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-alt border-b border-surface-border">
                <tr>
                  {[
                    { key: 'date', label: 'Date', sortable: true },
                    { key: 'claimNumber', label: 'Claim #', sortable: false },
                    { key: 'type', label: 'Type', sortable: true },
                    { key: 'provider', label: 'Provider', sortable: false },
                    { key: 'amount', label: 'Amount', sortable: true },
                    { key: 'status', label: 'Status', sortable: true },
                    { key: 'actions', label: 'Actions', sortable: false }
                  ].map((column) => {
                    const headerPadding = dataView === 'compact' ? 'py-2' : dataView === 'spacious' ? 'py-5' : 'py-3'
                    const isSortableField = column.sortable &&
                                           column.key !== 'claimNumber' &&
                                           column.key !== 'provider' &&
                                           column.key !== 'actions'
                    const cursorClass = column.sortable ? 'cursor-pointer hover:bg-surface' : ''

                    return (
                      <th
                        key={column.key}
                        className={`px-6 ${headerPadding} text-left text-xs font-semibold text-ink-600 uppercase tracking-wider ${cursorClass}`}
                        onClick={() => isSortableField && handleSort(column.key as SortField)}
                      >
                        <div className="flex items-center">
                          {column.label}
                          {isSortableField && (
                            <ChevronUpDownIcon className="h-4 w-4 ml-1" />
                          )}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {paginatedClaims.map((claim) => {
                  const cellPadding = dataView === 'compact' ? 'py-2' : dataView === 'spacious' ? 'py-5' : 'py-3'
                  return (
                    <tr key={claim.id} className="hover:bg-surface-alt transition-colors">
                      <td className={`px-6 ${cellPadding} text-sm`}>
                        <div>
                          <p className="font-medium text-ink-900">{new Date(claim.date).toLocaleDateString()}</p>
                          <p className="text-xs text-ink-500">Submitted: {new Date(claim.submittedDate).toLocaleDateString()}</p>
                        </div>
                      </td>
                      <td className={`px-6 ${cellPadding} text-sm`}>
                        <p className="font-medium text-ink-900">{claim.claimNumber}</p>
                      </td>
                      <td className={`px-6 ${cellPadding} text-sm`}>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {claim.type}
                        </span>
                      </td>
                      <td className={`px-6 ${cellPadding} text-sm`}>
                        <div>
                          <p className="font-medium text-ink-900">{claim.provider}</p>
                          <p className="text-xs text-ink-500 truncate max-w-xs">{claim.description}</p>
                        </div>
                      </td>
                      <td className={`px-6 ${cellPadding} text-sm`}>
                        <p className="font-semibold text-ink-900">₹{claim.amount.toLocaleString()}</p>
                      </td>
                      <td className={`px-6 ${cellPadding} text-sm`}>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(claim.status)}`}>
                          {getStatusIcon(claim.status)}
                          <span className="ml-1 capitalize">{claim.status.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td className={`px-6 ${cellPadding} text-sm`}>
                        <Link href={`/member/claims/${claim.id}`} className="text-brand-600 hover:text-brand-700 font-medium">
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        // Mobile Card View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedClaims.map((claim) => (
            <Card key={claim.id} className="hover:shadow-soft transition-all cursor-pointer">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-ink-900">{claim.claimNumber}</p>
                    <p className="text-xs text-ink-500">{new Date(claim.date).toLocaleDateString()}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(claim.status)}`}>
                    {getStatusIcon(claim.status)}
                    <span className="ml-1 capitalize">{claim.status.replace('_', ' ')}</span>
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm font-medium text-ink-900">{claim.provider}</p>
                  <p className="text-sm text-ink-600">{claim.description}</p>

                  <div className="flex items-center justify-between pt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {claim.type}
                    </span>
                    <p className="text-lg font-semibold text-ink-900">₹{claim.amount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-surface-border">
                  <p className="text-xs text-ink-500">{claim.documents} document{claim.documents !== 1 ? 's' : ''}</p>
                  <Link href={`/member/claims/${claim.id}`} className="text-brand-600 hover:text-brand-700 text-sm font-medium">
                    View Details
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-ink-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedClaims.length)} of {filteredAndSortedClaims.length} claims
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded border border-surface-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-alt"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + Math.max(1, currentPage - 2)
              return page <= totalPages ? (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded text-sm ${
                    currentPage === page
                      ? 'bg-brand-600 text-white'
                      : 'border border-surface-border hover:bg-surface-alt'
                  }`}
                >
                  {page}
                </button>
              ) : null
            })}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded border border-surface-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-alt"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredAndSortedClaims.length === 0 && (
        <Card className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-ink-400 mb-4" />
          <h3 className="text-lg font-medium text-ink-900 mb-2">No claims found</h3>
          <p className="text-ink-500 mb-6">
            {claims.length === 0
              ? 'You have not submitted any claims yet. Create your first claim to get started.'
              : 'Try adjusting your search or filters to find claims.'
            }
          </p>
          <Link href="/member/claims/new" className="btn-primary">
            {claims.length === 0 ? 'Create First Claim' : 'New Claim'}
          </Link>
        </Card>
      )}
    </div>
  )
}