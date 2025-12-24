'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  EyeIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

interface Claim {
  _id: string
  claimId: string
  userId: {
    name: { fullName: string }
    memberId: string
  }
  memberName: string
  category: string
  providerName: string
  billAmount: number
  status: string
  assignedAt: string
  submittedAt: string
  createdAt: string
}

const statusColors: Record<string, { bg: string; text: string }> = {
  ASSIGNED: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  UNDER_REVIEW: { bg: 'bg-orange-100', text: 'text-orange-700' },
  DOCUMENTS_REQUIRED: { bg: 'bg-purple-100', text: 'text-purple-700' },
  APPROVED: { bg: 'bg-green-100', text: 'text-green-700' },
  PARTIALLY_APPROVED: { bg: 'bg-teal-100', text: 'text-teal-700' },
  REJECTED: { bg: 'bg-red-100', text: 'text-red-700' },
}

export default function AssignedClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('assignedAt')

  const fetchAssignedClaims = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()

      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      params.append('sortBy', sortBy)

      const response = await fetch(`/api/tpa/claims/assigned?${params.toString()}`, {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setClaims(data.claims || [])
      }
    } catch (error) {
      console.error('Error fetching assigned claims:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, sortBy])

  useEffect(() => {
    fetchAssignedClaims()
  }, [statusFilter, sortBy, fetchAssignedClaims])

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

  const getUrgencyColor = (assignedAt: string) => {
    const daysSinceAssignment = Math.floor(
      (Date.now() - new Date(assignedAt).getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSinceAssignment > 7) return 'text-red-600'
    if (daysSinceAssignment > 3) return 'text-orange-600'
    return 'text-gray-600'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/claims"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Assigned Claims</h1>
            <p className="text-gray-500 mt-1">
              {claims.length} claims assigned to you
            </p>
          </div>
        </div>
        <button
          onClick={fetchAssignedClaims}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
        >
          <ArrowPathIcon className="h-5 w-5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ClockIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Your Active Claims</h3>
            <p className="text-sm text-blue-700 mt-1">
              Review and process claims assigned to you. Click on any claim to view details and take action.
            </p>
          </div>
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
            <option value="ASSIGNED">Assigned</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="DOCUMENTS_REQUIRED">Documents Required</option>
            <option value="APPROVED">Approved</option>
            <option value="PARTIALLY_APPROVED">Partially Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="assignedAt">Sort by Assignment Date</option>
            <option value="submittedAt">Sort by Submission Date</option>
            <option value="billAmount">Sort by Amount</option>
          </select>
        </div>
      </div>

      {/* Claims Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredClaims.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Assigned Claims</h3>
          <p className="text-gray-500">
            {searchQuery || statusFilter !== 'all'
              ? 'No claims match your search or filters'
              : 'You have no claims assigned at the moment'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClaims.map((claim) => {
            const daysSinceAssignment = Math.floor(
              (Date.now() - new Date(claim.assignedAt).getTime()) / (1000 * 60 * 60 * 24)
            )

            return (
              <div
                key={claim._id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Link
                      href={`/tpa/claims/${claim.claimId}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      {claim.claimId}
                    </Link>
                    <p className="text-xs text-gray-500 mt-1">
                      Assigned {formatDate(claim.assignedAt)}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      statusColors[claim.status]?.bg || 'bg-gray-100'
                    } ${statusColors[claim.status]?.text || 'text-gray-700'}`}
                  >
                    {formatStatus(claim.status)}
                  </span>
                </div>

                {/* Urgency Indicator */}
                {daysSinceAssignment > 3 && (
                  <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded">
                    <p className={`text-xs font-medium ${getUrgencyColor(claim.assignedAt)}`}>
                      {daysSinceAssignment > 7
                        ? `⚠️ Overdue: ${daysSinceAssignment} days old`
                        : `⏰ Pending: ${daysSinceAssignment} days old`}
                    </p>
                  </div>
                )}

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Member</p>
                    <p className="text-sm font-medium text-gray-900">{claim.memberName}</p>
                    <p className="text-xs text-gray-500">{claim.userId?.memberId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Provider</p>
                    <p className="text-sm text-gray-900 truncate">{claim.providerName}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Category</p>
                      <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                        {claim.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Amount</p>
                      <p className="text-lg font-bold text-gray-900">
                        ₹{claim.billAmount?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <Link
                  href={`/tpa/claims/${claim.claimId}`}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <EyeIcon className="h-4 w-4" />
                  <span>Review Claim</span>
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
