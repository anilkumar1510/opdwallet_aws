'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  CurrencyRupeeIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import { apiFetch } from '@/lib/api'

interface AnalyticsSummary {
  pendingPayments: number
  processingPayments: number
  completedPayments: number
  totalApprovedAmount: number
  totalPaidAmount: number
  totalPendingAmount: number
  paymentModeDistribution: Array<{
    _id: string
    count: number
    totalAmount: number
  }>
}

export default function FinanceDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const response = await apiFetch('/api/finance/analytics/summary')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.summary)
      }
    } catch (error) {
      console.error('Error fetching finance analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Pending Payments',
      value: analytics?.pendingPayments || 0,
      amount: analytics?.totalPendingAmount || 0,
      icon: ClockIcon,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      link: '/payments/pending',
      badge: 'Action Required',
    },
    {
      title: 'Processing',
      value: analytics?.processingPayments || 0,
      icon: BanknotesIcon,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Completed',
      value: analytics?.completedPayments || 0,
      amount: analytics?.totalPaidAmount || 0,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      link: '/payments/history',
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
          <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage payments and track financial metrics</p>
        </div>
        <Link
          href="/payments/pending"
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
        >
          <ClockIcon className="h-5 w-5" />
          <span>Process Payments</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.title}
              href={stat.link || '#'}
              className={`${stat.bgColor} rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer border border-gray-100 block`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 uppercase tracking-wider">
                    {stat.title}
                  </p>
                  <p className={`text-3xl font-bold ${stat.textColor} mt-2`}>
                    {stat.value}
                  </p>
                  {stat.amount !== undefined && (
                    <p className="text-sm text-gray-600 mt-1">
                      ₹{stat.amount.toLocaleString()}
                    </p>
                  )}
                </div>
                <Icon className={`h-12 w-12 ${stat.textColor} opacity-80`} />
              </div>
              {stat.badge && (
                <div className="mt-2">
                  <span className="px-2 py-1 text-xs font-medium bg-orange-200 text-orange-800 rounded">
                    {stat.badge}
                  </span>
                </div>
              )}
            </Link>
          )
        })}
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Approved</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ₹{(analytics?.totalApprovedAmount || 0).toLocaleString()}
              </p>
            </div>
            <CurrencyRupeeIcon className="h-10 w-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Paid</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                ₹{(analytics?.totalPaidAmount || 0).toLocaleString()}
              </p>
            </div>
            <CheckCircleIcon className="h-10 w-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Amount</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                ₹{(analytics?.totalPendingAmount || 0).toLocaleString()}
              </p>
            </div>
            <ClockIcon className="h-10 w-10 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Payment Mode Distribution */}
      {analytics?.paymentModeDistribution && analytics.paymentModeDistribution.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Payment Mode Distribution</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {analytics.paymentModeDistribution.map((mode) => {
                const total = analytics.paymentModeDistribution.reduce((sum, m) => sum + m.totalAmount, 0)
                const percentage = ((mode.totalAmount / total) * 100).toFixed(1)

                return (
                  <div key={mode._id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {mode._id || 'Other'}
                        </span>
                        <span className="text-sm text-gray-600">
                          {mode.count} payments • ₹{mode.totalAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/payments/pending"
          className="block p-6 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors border border-orange-200"
        >
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
              <ClockIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">Process Pending Payments</p>
              <p className="text-sm text-gray-600 mt-1">
                {analytics?.pendingPayments || 0} payments awaiting processing
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/payments/history"
          className="block p-6 bg-green-50 rounded-xl hover:bg-green-100 transition-colors border border-green-200"
        >
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
              <ChartBarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">View Payment History</p>
              <p className="text-sm text-gray-600 mt-1">
                {analytics?.completedPayments || 0} payments completed
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
