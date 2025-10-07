'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  UserGroupIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline'

interface AnalyticsSummary {
  totalClaims: number
  unassignedClaims: number
  assignedClaims: number
  underReviewClaims: number
  approvedClaims: number
  partiallyApprovedClaims: number
  rejectedClaims: number
  documentsRequiredClaims: number
  totalClaimedAmount: number
  totalApprovedAmount: number
  totalRejectedAmount: number
  avgProcessingTime: number
  approvalRate: number
  rejectionRate: number
}

interface CategoryBreakdown {
  category: string
  count: number
  totalAmount: number
  approvedAmount: number
}

export default function TPAAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()

      if (dateRange !== 'all') {
        const days = parseInt(dateRange)
        const toDate = new Date()
        const fromDate = new Date()
        fromDate.setDate(fromDate.getDate() - days)

        params.append('fromDate', fromDate.toISOString())
        params.append('toDate', toDate.toISOString())
      }

      const response = await fetch(`/api/tpa/analytics/summary?${params.toString()}`, {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.summary)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getProcessingEfficiency = () => {
    if (!analytics) return 0
    const processed = analytics.approvedClaims + analytics.partiallyApprovedClaims + analytics.rejectedClaims
    return analytics.totalClaims > 0 ? Math.round((processed / analytics.totalClaims) * 100) : 0
  }

  const getApprovalPercentage = () => {
    if (!analytics) return 0
    const total = analytics.approvedClaims + analytics.partiallyApprovedClaims + analytics.rejectedClaims
    return total > 0 ? Math.round((analytics.approvalRate || 0) * 10) / 10 : 0
  }

  const getRejectionPercentage = () => {
    if (!analytics) return 0
    const total = analytics.approvedClaims + analytics.partiallyApprovedClaims + analytics.rejectedClaims
    return total > 0 ? Math.round((analytics.rejectionRate || 0) * 10) / 10 : 0
  }

  const getPendingPercentage = () => {
    if (!analytics) return 0
    const pending = analytics.unassignedClaims + analytics.assignedClaims + analytics.underReviewClaims
    return analytics.totalClaims > 0 ? Math.round((pending / analytics.totalClaims) * 100) : 0
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/tpa"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">TPA Analytics Dashboard</h1>
            <p className="text-gray-500 mt-1">
              Comprehensive insights and performance metrics
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
          <button
            onClick={fetchAnalytics}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <ClipboardDocumentListIcon className="h-8 w-8 opacity-80" />
            <ChartBarIcon className="h-6 w-6 opacity-50" />
          </div>
          <p className="text-sm opacity-90">Total Claims</p>
          <p className="text-3xl font-bold mt-1">{analytics?.totalClaims || 0}</p>
          <div className="mt-4 flex items-center text-sm">
            <span className="opacity-80">Processing Efficiency</span>
            <span className="ml-auto font-semibold">{getProcessingEfficiency()}%</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <CheckCircleIcon className="h-8 w-8 opacity-80" />
            <ArrowTrendingUpIcon className="h-6 w-6 opacity-50" />
          </div>
          <p className="text-sm opacity-90">Approved Claims</p>
          <p className="text-3xl font-bold mt-1">
            {(analytics?.approvedClaims || 0) + (analytics?.partiallyApprovedClaims || 0)}
          </p>
          <div className="mt-4 flex items-center text-sm">
            <span className="opacity-80">Approval Rate</span>
            <span className="ml-auto font-semibold">{getApprovalPercentage()}%</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <XCircleIcon className="h-8 w-8 opacity-80" />
            <ArrowTrendingDownIcon className="h-6 w-6 opacity-50" />
          </div>
          <p className="text-sm opacity-90">Rejected Claims</p>
          <p className="text-3xl font-bold mt-1">{analytics?.rejectedClaims || 0}</p>
          <div className="mt-4 flex items-center text-sm">
            <span className="opacity-80">Rejection Rate</span>
            <span className="ml-auto font-semibold">{getRejectionPercentage()}%</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <ClockIcon className="h-8 w-8 opacity-80" />
            <CalendarIcon className="h-6 w-6 opacity-50" />
          </div>
          <p className="text-sm opacity-90">Avg Processing Time</p>
          <p className="text-3xl font-bold mt-1">
            {analytics?.avgProcessingTime?.toFixed(1) || 0}h
          </p>
          <div className="mt-4 flex items-center text-sm">
            <span className="opacity-80">Pending</span>
            <span className="ml-auto font-semibold">{getPendingPercentage()}%</span>
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Total Claimed Amount</h3>
            <CurrencyRupeeIcon className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ₹{(analytics?.totalClaimedAmount || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            From {analytics?.totalClaims || 0} claims
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Total Approved Amount</h3>
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">
            ₹{(analytics?.totalApprovedAmount || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {analytics?.totalClaimedAmount > 0
              ? Math.round((analytics.totalApprovedAmount / analytics.totalClaimedAmount) * 100)
              : 0}% of total claimed
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Total Rejected Amount</h3>
            <XCircleIcon className="h-5 w-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-600">
            ₹{(analytics?.totalRejectedAmount || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {analytics?.totalClaimedAmount > 0
              ? Math.round((analytics.totalRejectedAmount / analytics.totalClaimedAmount) * 100)
              : 0}% of total claimed
          </p>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Claims by Status</h3>
          <div className="space-y-4">
            {[
              { label: 'Unassigned', value: analytics?.unassignedClaims || 0, color: 'bg-red-500' },
              { label: 'Assigned', value: analytics?.assignedClaims || 0, color: 'bg-yellow-500' },
              { label: 'Under Review', value: analytics?.underReviewClaims || 0, color: 'bg-orange-500' },
              { label: 'Documents Required', value: analytics?.documentsRequiredClaims || 0, color: 'bg-purple-500' },
              { label: 'Approved', value: (analytics?.approvedClaims || 0) + (analytics?.partiallyApprovedClaims || 0), color: 'bg-green-500' },
              { label: 'Rejected', value: analytics?.rejectedClaims || 0, color: 'bg-gray-500' },
            ].map((status) => {
              const percentage = analytics?.totalClaims
                ? Math.round((status.value / analytics.totalClaims) * 100)
                : 0

              return (
                <div key={status.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{status.label}</span>
                    <span className="text-sm text-gray-900 font-semibold">
                      {status.value} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`${status.color} h-2.5 rounded-full transition-all duration-300`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Metrics</h3>
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Processing Efficiency</span>
                <span className="text-2xl font-bold text-blue-600">{getProcessingEfficiency()}%</span>
              </div>
              <p className="text-xs text-gray-500">
                Claims fully processed out of total
              </p>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Approval Rate</span>
                <span className="text-2xl font-bold text-green-600">{getApprovalPercentage()}%</span>
              </div>
              <p className="text-xs text-gray-500">
                Claims approved out of processed
              </p>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Rejection Rate</span>
                <span className="text-2xl font-bold text-red-600">{getRejectionPercentage()}%</span>
              </div>
              <p className="text-xs text-gray-500">
                Claims rejected out of processed
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Avg Processing Time</span>
                <span className="text-2xl font-bold text-yellow-600">
                  {analytics?.avgProcessingTime?.toFixed(1) || 0}h
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Time from submission to decision
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/tpa/claims/unassigned"
            className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <ClipboardDocumentListIcon className="h-5 w-5 text-red-600" />
              </div>
              <span className="font-medium text-gray-900">View Unassigned</span>
            </div>
            <span className="text-2xl font-bold text-red-600">
              {analytics?.unassignedClaims || 0}
            </span>
          </Link>

          <Link
            href="/admin/tpa/claims/assigned"
            className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <UserGroupIcon className="h-5 w-5 text-yellow-600" />
              </div>
              <span className="font-medium text-gray-900">View Assigned</span>
            </div>
            <span className="text-2xl font-bold text-yellow-600">
              {analytics?.assignedClaims || 0}
            </span>
          </Link>

          <Link
            href="/admin/tpa/users"
            className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserGroupIcon className="h-5 w-5 text-blue-600" />
              </div>
              <span className="font-medium text-gray-900">Manage Users</span>
            </div>
            <ArrowLeftIcon className="h-5 w-5 text-gray-400 rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  )
}
