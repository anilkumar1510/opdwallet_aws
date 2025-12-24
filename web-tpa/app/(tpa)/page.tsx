'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ClipboardDocumentListIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline'
import { apiFetch } from '@/lib/api'

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

interface RecentActivity {
  id: string
  action: string
  claimId: string
  actor: string
  timestamp: string
}

export default function TPADashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await apiFetch('/api/tpa/analytics/summary')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.summary)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchRecentActivity = useCallback(async () => {
    try {
      const response = await apiFetch('/api/tpa/recent-activity?limit=5')
      if (response.ok) {
        const data = await response.json()
        // Transform the data to match the expected format
        const formattedActivities = data.activities?.map((activity: any) => ({
          id: activity.id,
          action: activity.action,
          claimId: activity.claimId,
          actor: activity.actor,
          timestamp: formatTimestamp(activity.timestamp),
        })) || []
        setRecentActivity(formattedActivities)
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error)
    }
  }, [])

  useEffect(() => {
    fetchAnalytics()
    fetchRecentActivity()
  }, [fetchAnalytics, fetchRecentActivity])

  const formatTimestamp = (timestamp: string) => {
    const now = new Date()
    const activityTime = new Date(timestamp)
    const diffMs = now.getTime() - activityTime.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return activityTime.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  }

  const statCards = [
    {
      title: 'Unassigned',
      value: analytics?.unassignedClaims || 0,
      icon: ClipboardDocumentListIcon,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
      link: '/claims/unassigned',
    },
    {
      title: 'Assigned',
      value: analytics?.assignedClaims || 0,
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      link: '/claims/assigned',
    },
    {
      title: 'Under Review',
      value: analytics?.underReviewClaims || 0,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      link: '/claims?status=UNDER_REVIEW',
    },
    {
      title: 'Approved',
      value: analytics?.approvedClaims || 0,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      link: '/claims?status=APPROVED',
    },
    {
      title: 'Rejected',
      value: analytics?.rejectedClaims || 0,
      icon: XCircleIcon,
      color: 'bg-gray-500',
      textColor: 'text-gray-600',
      bgColor: 'bg-gray-50',
      link: '/claims?status=REJECTED',
    },
    {
      title: 'Docs Required',
      value: analytics?.documentsRequiredClaims || 0,
      icon: DocumentTextIcon,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      link: '/claims?status=DOCUMENTS_REQUIRED',
    },
  ]

  const financialMetrics = [
    {
      title: 'Total Claimed',
      value: `₹${(analytics?.totalClaimedAmount || 0).toLocaleString()}`,
      change: '+12%',
      trend: 'up',
    },
    {
      title: 'Total Approved',
      value: `₹${(analytics?.totalApprovedAmount || 0).toLocaleString()}`,
      change: '+8%',
      trend: 'up',
    },
    {
      title: 'Approval Rate',
      value: `${analytics?.approvalRate?.toFixed(1) || 0}%`,
      change: '+5%',
      trend: 'up',
    },
    {
      title: 'Avg Processing Time',
      value: `${analytics?.avgProcessingTime?.toFixed(1) || 0}h`,
      change: '-10%',
      trend: 'down',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">TPA Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage and review claims efficiently</p>
        </div>
        <Link
          href="/analytics"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <ChartBarIcon className="h-5 w-5" />
          <span>View Analytics</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.title}
              href={stat.link}
              className={`${stat.bgColor} rounded-xl p-4 hover:shadow-md transition-all cursor-pointer border border-gray-100`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    {stat.title}
                  </p>
                  <p className={`text-2xl font-bold ${stat.textColor} mt-1`}>
                    {stat.value}
                  </p>
                </div>
                <Icon className={`h-8 w-8 ${stat.textColor} opacity-80`} />
              </div>
            </Link>
          )
        })}
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {financialMetrics.map((metric) => (
          <div
            key={metric.title}
            className="bg-white rounded-xl p-4 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{metric.title}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {metric.value}
                </p>
              </div>
              <div className={`flex items-center space-x-1 ${
                metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                <ArrowTrendingUpIcon className={`h-4 w-4 ${
                  metric.trend === 'down' ? 'rotate-180' : ''
                }`} />
                <span className="text-sm font-medium">{metric.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Feed */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-4 space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
              >
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <ClipboardDocumentListIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {activity.claimId} • {activity.actor}
                  </p>
                </div>
                <span className="text-xs text-gray-400">{activity.timestamp}</span>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-200">
            <Link
              href="/claims"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all claims →
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-4 space-y-3">
            <Link
              href="/claims/unassigned"
              className="block p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <ClipboardDocumentListIcon className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Review Unassigned Claims
                    </p>
                    <p className="text-xs text-gray-500">
                      {analytics?.unassignedClaims || 0} claims waiting
                    </p>
                  </div>
                </div>
                <span className="text-red-600 text-xs font-medium">Action Required</span>
              </div>
            </Link>

            <Link
              href="/claims/assigned"
              className="block p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <UserGroupIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">View Assigned Claims</p>
                    <p className="text-xs text-gray-500">
                      {analytics?.assignedClaims || 0} currently assigned
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link
              href="/analytics"
              className="block p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <ChartBarIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">View Full Analytics</p>
                    <p className="text-xs text-gray-500">Detailed reports & insights</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link
              href="/users"
              className="block p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <UserGroupIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Manage TPA Users</p>
                    <p className="text-xs text-gray-500">View workload & performance</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
