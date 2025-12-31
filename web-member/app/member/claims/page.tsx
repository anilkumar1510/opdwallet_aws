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
  originalBillAmount?: number
  cappedAmount?: number
  wasAutoCapped?: boolean
  perClaimLimitApplied?: number
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
          originalBillAmount: claim.originalBillAmount,
          cappedAmount: claim.cappedAmount,
          wasAutoCapped: claim.wasAutoCapped,
          perClaimLimitApplied: claim.perClaimLimitApplied,
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
    <div className="min-h-screen" style={{ background: '#f7f7fc' }}>
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm" style={{ borderColor: '#e5e7eb' }}>
        <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/member">
              <button className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                <ChevronLeftIcon className="h-6 w-6" style={{ color: '#0E51A2' }} />
              </button>
            </Link>
            <div className="flex-1 flex items-center justify-between">
              <div>
                <h1 className="text-lg lg:text-xl font-bold" style={{ color: '#0E51A2' }}>Claims History</h1>
                <p className="text-xs lg:text-sm text-gray-600">Track and manage your medical claims</p>
              </div>
              <Link
                href="/member/claims/new"
                className="inline-flex items-center gap-2 px-4 lg:px-5 py-2 lg:py-2.5 text-white rounded-xl font-semibold transition-all hover:shadow-lg text-sm lg:text-base"
                style={{ background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)' }}
              >
                <DocumentTextIcon className="h-4 w-4 lg:h-5 lg:w-5" />
                <span className="hidden sm:inline">New Claim</span>
                <span className="sm:hidden">New</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-6 lg:py-8">

      {/* Quick Stats - Professional Style */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 lg:p-6 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                <div className="flex-1">
                  <div className="h-7 w-16 bg-gray-200 rounded mb-2" />
                  <div className="h-4 w-20 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-6">
          <div
            className="rounded-2xl p-5 lg:p-6 border-2 shadow-md hover:shadow-lg transition-all duration-200"
            style={{
              background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
              borderColor: '#86ACD8'
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex-shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                  border: '1px solid #A4BFFE7A',
                  boxShadow: '-2px 11px 46.1px 0px #0000000D'
                }}
              >
                <CheckCircleIcon className="h-6 w-6 lg:h-7 lg:w-7" style={{ color: '#0F5FDC' }} />
              </div>
              <div>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.approved}</p>
                <p className="text-sm text-gray-600 mt-1">Approved</p>
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl p-5 lg:p-6 border-2 shadow-md hover:shadow-lg transition-all duration-200"
            style={{
              background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
              borderColor: '#86ACD8'
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex-shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                  border: '1px solid #A4BFFE7A',
                  boxShadow: '-2px 11px 46.1px 0px #0000000D'
                }}
              >
                <ClockIcon className="h-6 w-6 lg:h-7 lg:w-7" style={{ color: '#0F5FDC' }} />
              </div>
              <div>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.processing}</p>
                <p className="text-sm text-gray-600 mt-1">Processing</p>
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl p-5 lg:p-6 border-2 shadow-md hover:shadow-lg transition-all duration-200"
            style={{
              background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
              borderColor: '#86ACD8'
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex-shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                  border: '1px solid #A4BFFE7A',
                  boxShadow: '-2px 11px 46.1px 0px #0000000D'
                }}
              >
                <ExclamationCircleIcon className="h-6 w-6 lg:h-7 lg:w-7" style={{ color: '#0F5FDC' }} />
              </div>
              <div>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.underReview}</p>
                <p className="text-sm text-gray-600 mt-1">Under Review</p>
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl p-5 lg:p-6 border-2 shadow-md hover:shadow-lg transition-all duration-200"
            style={{
              background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
              borderColor: '#86ACD8'
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex-shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                  border: '1px solid #A4BFFE7A',
                  boxShadow: '-2px 11px 46.1px 0px #0000000D'
                }}
              >
                <DocumentTextIcon className="h-6 w-6 lg:h-7 lg:w-7" style={{ color: '#0F5FDC' }} />
              </div>
              <div>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900">₹{stats.totalAmount.toLocaleString()}</p>
                <p className="text-sm text-gray-600 mt-1">Total Claims</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls Bar - Professional Style */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="p-4 lg:p-5 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search claims..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ClaimStatus | 'all')}
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm font-medium"
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
                className="hidden lg:flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <FunnelIcon className="h-4 w-4" />
                Filters
              </button>
            </div>

            {/* View Controls */}
            <div className="flex items-center gap-3">
              {/* Data Density - Desktop Only */}
              <div className="hidden xl:flex items-center gap-2">
                <span className="text-xs text-gray-600 font-medium">Density:</span>
                <select
                  value={dataView}
                  onChange={(e) => setDataView(e.target.value as 'compact' | 'comfortable' | 'spacious')}
                  className="px-2 py-1 bg-white border border-gray-200 rounded text-xs"
                >
                  <option value="compact">Compact</option>
                  <option value="comfortable">Comfortable</option>
                  <option value="spacious">Spacious</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-600 hover:bg-white/50'}`}
                >
                  <TableCellsIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-2 rounded transition-all ${viewMode === 'cards' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-600 hover:bg-white/50'}`}
                >
                  <Squares2X2Icon className="h-4 w-4" />
                </button>
              </div>

              {/* Export Button */}
              <button
                onClick={exportData}
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters - Desktop Only */}
        {showFilters && (
          <div className="p-4 lg:p-5 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Date Range</label>
                <select className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
                  <option>All Time</option>
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                  <option>This Year</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Category</label>
                <select className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
                  <option>All Categories</option>
                  <option>Consultation</option>
                  <option>Pharmacy</option>
                  <option>Diagnostic</option>
                  <option>Preventive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Amount Range</label>
                <select className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
                  <option>All Amounts</option>
                  <option>Under ₹1,000</option>
                  <option>₹1,000 - ₹5,000</option>
                  <option>Above ₹5,000</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Provider</label>
                <input
                  type="text"
                  placeholder="Provider name..."
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 lg:p-5">
          <div className="flex items-center gap-3">
            <XCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700 font-medium">Failed to load claims: {error}</p>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        // Loading State
        <div className="rounded-2xl p-8 lg:p-12 text-center border-2 shadow-md" style={{
          background: 'linear-gradient(169.98deg, #EFF4FF 19.71%, #FEF3E9 66.63%, #FEF3E9 108.92%)',
          borderColor: '#86ACD8'
        }}>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto mb-4" style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}></div>
          <p className="text-gray-900 font-semibold">Loading claims...</p>
        </div>
      ) : viewMode === 'table' ? (
        // Desktop Table View
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {[
                    { key: 'date', label: 'Date', sortable: true },
                    { key: 'claimNumber', label: 'Claim #', sortable: false },
                    { key: 'type', label: 'Type', sortable: true },
                    { key: 'provider', label: 'Provider', sortable: false },
                    { key: 'amount', label: 'Bill Amount', sortable: true },
                    { key: 'approvalAmount', label: 'Amount for Approval', sortable: false },
                    { key: 'status', label: 'Status', sortable: true },
                    { key: 'actions', label: 'Actions', sortable: false }
                  ].map((column) => {
                    const headerPadding = dataView === 'compact' ? 'py-2' : dataView === 'spacious' ? 'py-5' : 'py-3'
                    const isSortableField = column.sortable &&
                                           column.key !== 'claimNumber' &&
                                           column.key !== 'provider' &&
                                           column.key !== 'actions'
                    const cursorClass = column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''

                    return (
                      <th
                        key={column.key}
                        className={`px-6 ${headerPadding} text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${cursorClass}`}
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
              <tbody className="divide-y divide-gray-100">
                {paginatedClaims.map((claim) => {
                  const cellPadding = dataView === 'compact' ? 'py-2' : dataView === 'spacious' ? 'py-5' : 'py-3'
                  return (
                    <tr key={claim.id} className="hover:bg-gray-50 transition-colors">
                      <td className={`px-6 ${cellPadding} text-sm`}>
                        <div>
                          <p className="font-medium text-gray-900">{new Date(claim.date).toLocaleDateString()}</p>
                          <p className="text-xs text-gray-500">Submitted: {new Date(claim.submittedDate).toLocaleDateString()}</p>
                        </div>
                      </td>
                      <td className={`px-6 ${cellPadding} text-sm`}>
                        <p className="font-medium text-gray-900">{claim.claimNumber}</p>
                      </td>
                      <td className={`px-6 ${cellPadding} text-sm`}>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {claim.type}
                        </span>
                      </td>
                      <td className={`px-6 ${cellPadding} text-sm`}>
                        <div>
                          <p className="font-medium text-gray-900">{claim.provider}</p>
                          <p className="text-xs text-gray-500 truncate max-w-xs">{claim.description}</p>
                        </div>
                      </td>
                      <td className={`px-6 ${cellPadding} text-sm`}>
                        {claim.wasAutoCapped && claim.originalBillAmount ? (
                          <div>
                            <p className="font-semibold text-gray-900">₹{claim.originalBillAmount.toLocaleString()}</p>
                            <p className="text-xs text-amber-600">Auto-capped to ₹{claim.amount.toLocaleString()}</p>
                          </div>
                        ) : (
                          <p className="font-semibold text-gray-900">₹{claim.amount.toLocaleString()}</p>
                        )}
                      </td>
                      <td className={`px-6 ${cellPadding} text-sm`}>
                        <p className="font-semibold text-green-700">₹{claim.amount.toLocaleString()}</p>
                        {claim.perClaimLimitApplied && (
                          <p className="text-xs text-green-600">Limit: ₹{claim.perClaimLimitApplied.toLocaleString()}</p>
                        )}
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
        </div>
      ) : (
        // Mobile Card View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {paginatedClaims.map((claim) => (
            <div
              key={claim.id}
              className="rounded-2xl border-2 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
              style={{
                background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
                borderColor: '#86ACD8'
              }}
            >
              <div className="p-5 lg:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-bold text-gray-900">{claim.claimNumber}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(claim.date).toLocaleDateString()}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(claim.status)}`}>
                    {getStatusIcon(claim.status)}
                    <span className="ml-1 capitalize">{claim.status.replace('_', ' ')}</span>
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <p className="text-sm font-semibold text-gray-900">{claim.provider}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{claim.description}</p>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {claim.type}
                    </span>
                    <p className="text-lg font-bold text-gray-900">₹{claim.amount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 font-medium">{claim.documents} document{claim.documents !== 1 ? 's' : ''}</p>
                  <Link href={`/member/claims/${claim.id}`} className="text-brand-600 hover:text-brand-700 text-sm font-semibold">
                    View Details →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 lg:mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-600 font-medium">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedClaims.length)} of {filteredAndSortedClaims.length} claims
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + Math.max(1, currentPage - 2)
              return page <= totalPages ? (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ) : null
            })}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredAndSortedClaims.length === 0 && (
        <div className="rounded-2xl p-8 lg:p-12 text-center border-2 shadow-md" style={{
          background: 'linear-gradient(169.98deg, #EFF4FF 19.71%, #FEF3E9 66.63%, #FEF3E9 108.92%)',
          borderColor: '#86ACD8'
        }}>
          <div
            className="w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{
              background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
              border: '1px solid #A4BFFE7A',
              boxShadow: '-2px 11px 46.1px 0px #0000000D'
            }}
          >
            <DocumentTextIcon className="h-8 w-8 lg:h-10 lg:w-10" style={{ color: '#0F5FDC' }} />
          </div>
          <h3 className="text-xl lg:text-2xl font-bold mb-2" style={{ color: '#0E51A2' }}>No claims found</h3>
          <p className="text-gray-600 mb-6 lg:mb-8 max-w-md mx-auto text-sm lg:text-base">
            {claims.length === 0
              ? 'You have not submitted any claims yet. Create your first claim to get started.'
              : 'Try adjusting your search or filters to find claims.'
            }
          </p>
          <Link
            href="/member/claims/new"
            className="inline-flex items-center gap-2 px-6 lg:px-8 py-3 lg:py-4 text-white rounded-xl font-semibold transition-all hover:shadow-lg"
            style={{ background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)' }}
          >
            <DocumentTextIcon className="h-5 w-5" />
            {claims.length === 0 ? 'Create First Claim' : 'New Claim'}
          </Link>
        </div>
      )}
      </div>
    </div>
  )
}
