'use client'

import { useState, useEffect } from 'react'
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

type ClaimStatus = 'submitted' | 'under_review' | 'approved' | 'rejected' | 'processing'
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

  const itemsPerPage = 10

  // Mock data - in real app, this would come from API
  const mockClaims: Claim[] = [
    {
      id: '1',
      claimNumber: 'CLM-2024-001',
      date: '2024-01-15',
      type: 'Consultation',
      provider: 'Dr. Sharma - Cardiology',
      amount: 2500,
      status: 'approved',
      description: 'Cardiac consultation and ECG',
      category: 'consultation',
      submittedDate: '2024-01-16',
      processedDate: '2024-01-18',
      documents: 3
    },
    {
      id: '2',
      claimNumber: 'CLM-2024-002',
      date: '2024-01-12',
      type: 'Pharmacy',
      provider: 'Apollo Pharmacy',
      amount: 850,
      status: 'processing',
      description: 'Prescribed medications',
      category: 'pharmacy',
      submittedDate: '2024-01-13',
      documents: 2
    },
    {
      id: '3',
      claimNumber: 'CLM-2024-003',
      date: '2024-01-10',
      type: 'Diagnostic',
      provider: 'PathLab Diagnostics',
      amount: 3200,
      status: 'under_review',
      description: 'Comprehensive blood panel',
      category: 'diagnostic',
      submittedDate: '2024-01-11',
      documents: 4
    },
    {
      id: '4',
      claimNumber: 'CLM-2024-004',
      date: '2024-01-08',
      type: 'Consultation',
      provider: 'Dr. Patel - Dermatology',
      amount: 1800,
      status: 'rejected',
      description: 'Skin consultation',
      category: 'consultation',
      submittedDate: '2024-01-09',
      processedDate: '2024-01-12',
      documents: 1
    },
    {
      id: '5',
      claimNumber: 'CLM-2024-005',
      date: '2024-01-05',
      type: 'Preventive',
      provider: 'City Health Center',
      amount: 5000,
      status: 'approved',
      description: 'Annual health checkup',
      category: 'preventive',
      submittedDate: '2024-01-06',
      processedDate: '2024-01-08',
      documents: 5
    },
    {
      id: '6',
      claimNumber: 'CLM-2024-006',
      date: '2024-01-03',
      type: 'Pharmacy',
      provider: 'MedPlus',
      amount: 1200,
      status: 'submitted',
      description: 'Over-the-counter medications',
      category: 'pharmacy',
      submittedDate: '2024-01-03',
      documents: 2
    }
  ]

  // Filter and sort claims
  const filteredAndSortedClaims = mockClaims
    .filter(claim => {
      const matchesSearch = claim.claimNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           claim.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           claim.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || claim.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      let aValue: any, bValue: any
      switch (sortField) {
        case 'date':
          aValue = new Date(a.date)
          bValue = new Date(b.date)
          break
        case 'amount':
          aValue = a.amount
          bValue = b.amount
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'type':
          aValue = a.type
          bValue = b.type
          break
        default:
          return 0
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
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
      case 'processing':
        return <ClockIcon className="h-4 w-4" />
      case 'under_review':
        return <ExclamationCircleIcon className="h-4 w-4" />
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
      case 'processing':
        return 'bg-blue-100 text-blue-700'
      case 'under_review':
        return 'bg-amber-100 text-amber-700'
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-green-700">12</p>
                <p className="text-xs text-green-600">Approved</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="p-4">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-blue-700">3</p>
                <p className="text-xs text-blue-600">Processing</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="p-4">
            <div className="flex items-center">
              <ExclamationCircleIcon className="h-8 w-8 text-amber-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-amber-700">2</p>
                <p className="text-xs text-amber-600">Under Review</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-brand-50 to-brand-100 border-brand-200">
          <div className="p-4">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-brand-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-brand-700">₹45,000</p>
                <p className="text-xs text-brand-600">Total Claims</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

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
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="processing">Processing</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
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

      {/* Content */}
      {viewMode === 'table' ? (
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
                  ].map((column) => (
                    <th
                      key={column.key}
                      className={`px-6 ${
                        dataView === 'compact' ? 'py-2' : dataView === 'spacious' ? 'py-5' : 'py-3'
                      } text-left text-xs font-semibold text-ink-600 uppercase tracking-wider ${
                        column.sortable ? 'cursor-pointer hover:bg-surface' : ''
                      }`}
                      onClick={() => column.sortable && column.key !== 'claimNumber' && column.key !== 'provider' && column.key !== 'actions' && handleSort(column.key as SortField)}
                    >
                      <div className="flex items-center">
                        {column.label}
                        {column.sortable && column.key !== 'claimNumber' && column.key !== 'provider' && column.key !== 'actions' && (
                          <ChevronUpDownIcon className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {paginatedClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-surface-alt transition-colors">
                    <td className={`px-6 ${dataView === 'compact' ? 'py-2' : dataView === 'spacious' ? 'py-5' : 'py-3'} text-sm`}>
                      <div>
                        <p className="font-medium text-ink-900">{new Date(claim.date).toLocaleDateString()}</p>
                        <p className="text-xs text-ink-500">Submitted: {new Date(claim.submittedDate).toLocaleDateString()}</p>
                      </div>
                    </td>
                    <td className={`px-6 ${dataView === 'compact' ? 'py-2' : dataView === 'spacious' ? 'py-5' : 'py-3'} text-sm`}>
                      <p className="font-medium text-ink-900">{claim.claimNumber}</p>
                    </td>
                    <td className={`px-6 ${dataView === 'compact' ? 'py-2' : dataView === 'spacious' ? 'py-5' : 'py-3'} text-sm`}>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {claim.type}
                      </span>
                    </td>
                    <td className={`px-6 ${dataView === 'compact' ? 'py-2' : dataView === 'spacious' ? 'py-5' : 'py-3'} text-sm`}>
                      <div>
                        <p className="font-medium text-ink-900">{claim.provider}</p>
                        <p className="text-xs text-ink-500 truncate max-w-xs">{claim.description}</p>
                      </div>
                    </td>
                    <td className={`px-6 ${dataView === 'compact' ? 'py-2' : dataView === 'spacious' ? 'py-5' : 'py-3'} text-sm`}>
                      <p className="font-semibold text-ink-900">₹{claim.amount.toLocaleString()}</p>
                    </td>
                    <td className={`px-6 ${dataView === 'compact' ? 'py-2' : dataView === 'spacious' ? 'py-5' : 'py-3'} text-sm`}>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(claim.status)}`}>
                        {getStatusIcon(claim.status)}
                        <span className="ml-1 capitalize">{claim.status.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className={`px-6 ${dataView === 'compact' ? 'py-2' : dataView === 'spacious' ? 'py-5' : 'py-3'} text-sm`}>
                      <button className="text-brand-600 hover:text-brand-700 font-medium">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
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
                  <button className="text-brand-600 hover:text-brand-700 text-sm font-medium">
                    View Details
                  </button>
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
      {filteredAndSortedClaims.length === 0 && (
        <Card className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-ink-400 mb-4" />
          <h3 className="text-lg font-medium text-ink-900 mb-2">No claims found</h3>
          <p className="text-ink-500 mb-6">Try adjusting your search or filters, or create your first claim.</p>
          <Link href="/member/claims/new" className="btn-primary">
            Create First Claim
          </Link>
        </Card>
      )}
    </div>
  )
}