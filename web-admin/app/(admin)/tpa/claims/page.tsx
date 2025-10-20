'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline'

interface Claim {
  _id: string
  claimId: string
  userId: {
    name: { fullName: string }
    email: string
    memberId: string
  }
  memberName: string
  category: string
  treatmentDate: string
  providerName: string
  billAmount: number
  status: string
  assignedTo?: {
    name: { fullName: string }
  }
  assignedToName?: string
  submittedAt: string
  createdAt: string
}

const statusColors: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700' },
  SUBMITTED: { bg: 'bg-blue-100', text: 'text-blue-700' },
  UNASSIGNED: { bg: 'bg-red-100', text: 'text-red-700' },
  ASSIGNED: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  UNDER_REVIEW: { bg: 'bg-orange-100', text: 'text-orange-700' },
  DOCUMENTS_REQUIRED: { bg: 'bg-purple-100', text: 'text-purple-700' },
  APPROVED: { bg: 'bg-green-100', text: 'text-green-700' },
  PARTIALLY_APPROVED: { bg: 'bg-teal-100', text: 'text-teal-700' },
  REJECTED: { bg: 'bg-red-100', text: 'text-red-700' },
  PAYMENT_PENDING: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  PAYMENT_PROCESSING: { bg: 'bg-blue-100', text: 'text-blue-700' },
  PAYMENT_COMPLETED: { bg: 'bg-green-100', text: 'text-green-700' },
}

export default function TPAClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [unassignedCount, setUnassignedCount] = useState(0)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [assignedToFilter, setAssignedToFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  const fetchClaims = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      })

      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      if (assignedToFilter && assignedToFilter !== 'all') {
        params.append('assignedTo', assignedToFilter)
      }

      const response = await fetch(`/api/tpa/claims?${params.toString()}`, {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setClaims(data.claims || [])
        setTotal(data.total || 0)
        setTotalPages(data.totalPages || 1)
        setUnassignedCount(data.unassignedCount || 0)
      }
    } catch (error) {
      console.error('Error fetching claims:', error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, statusFilter, assignedToFilter])

  useEffect(() => {
    fetchClaims()
  }, [currentPage, statusFilter, assignedToFilter, fetchClaims])

  const filteredClaims = claims.filter((claim) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        claim.claimId.toLowerCase().includes(query) ||
        claim.memberName.toLowerCase().includes(query) ||
        claim.providerName.toLowerCase().includes(query)
      )
    }
    return true
  })

  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ')
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Claims</h1>
          <p className="text-gray-500 mt-1">
            {total} total claims • {unassignedCount} unassigned
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/tpa/claims/unassigned"
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
          >
            <UserPlusIcon className="h-5 w-5" />
            <span>Unassigned ({unassignedCount})</span>
          </Link>
          <button
            onClick={fetchClaims}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <ArrowPathIcon className="h-5 w-5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by claim ID, member, or provider..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="UNASSIGNED">Unassigned</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="DOCUMENTS_REQUIRED">Documents Required</option>
            <option value="APPROVED">Approved</option>
            <option value="PARTIALLY_APPROVED">Partially Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="PAYMENT_PENDING">Payment Pending</option>
          </select>

          {/* Show Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg transition-colors flex items-center space-x-2 ${
              showFilters
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <FunnelIcon className="h-5 w-5" />
            <span>Filters</span>
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                  <option>All time</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option>All Categories</option>
                  <option>CONSULTATION</option>
                  <option>DIAGNOSTICS</option>
                  <option>PHARMACY</option>
                  <option>DENTAL</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount Range
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option>All Amounts</option>
                  <option>Under ₹1,000</option>
                  <option>₹1,000 - ₹5,000</option>
                  <option>Above ₹5,000</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Claims Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No claims found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Claim ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredClaims.map((claim) => (
                  <tr key={claim._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/tpa/claims/${claim.claimId}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        {claim.claimId}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{claim.memberName}</div>
                      <div className="text-xs text-gray-500">
                        {claim.userId?.memberId || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {claim.providerName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                        {claim.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{claim.billAmount?.toLocaleString() || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          statusColors[claim.status]?.bg || 'bg-gray-100'
                        } ${statusColors[claim.status]?.text || 'text-gray-700'}`}
                      >
                        {formatStatus(claim.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {claim.assignedToName || claim.assignedTo?.name?.fullName || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(claim.submittedAt || claim.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link
                        href={`/tpa/claims/${claim.claimId}`}
                        className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing page {currentPage} of {totalPages} ({total} total claims)
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + Math.max(1, currentPage - 2)
                return page <= totalPages ? (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ) : null
              })}
            </div>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
