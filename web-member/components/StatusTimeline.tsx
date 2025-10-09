'use client'

import { useState, useEffect } from 'react'
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  DocumentTextIcon,
  CurrencyRupeeIcon,
  UserIcon,
} from '@heroicons/react/24/solid'

interface TimelineEntry {
  status: string
  changedAt: string
  changedBy: string
  changedByRole: string
  reason?: string
}

interface StatusTimelineProps {
  claimId: string
}

export default function StatusTimeline({ claimId }: StatusTimelineProps) {
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [currentStatus, setCurrentStatus] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTimeline()
  }, [claimId])

  const fetchTimeline = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/member/claims/${claimId}/timeline`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setTimeline(data.timeline || [])
        setCurrentStatus(data.currentStatus)
      }
    } catch (error) {
      console.error('Error fetching timeline:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <DocumentTextIcon className="h-6 w-6 text-blue-600" />
      case 'ASSIGNED':
        return <UserIcon className="h-6 w-6 text-indigo-600" />
      case 'UNDER_REVIEW':
        return <ClockIcon className="h-6 w-6 text-yellow-600" />
      case 'DOCUMENTS_REQUIRED':
        return <DocumentTextIcon className="h-6 w-6 text-orange-600" />
      case 'APPROVED':
      case 'PARTIALLY_APPROVED':
        return <CheckCircleIcon className="h-6 w-6 text-green-600" />
      case 'REJECTED':
        return <XCircleIcon className="h-6 w-6 text-red-600" />
      case 'PAYMENT_PENDING':
      case 'PAYMENT_PROCESSING':
        return <CurrencyRupeeIcon className="h-6 w-6 text-purple-600" />
      case 'PAYMENT_COMPLETED':
        return <CheckCircleIcon className="h-6 w-6 text-green-600" />
      default:
        return <ClockIcon className="h-6 w-6 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 'border-blue-600 bg-blue-50'
      case 'ASSIGNED':
        return 'border-indigo-600 bg-indigo-50'
      case 'UNDER_REVIEW':
        return 'border-yellow-600 bg-yellow-50'
      case 'DOCUMENTS_REQUIRED':
        return 'border-orange-600 bg-orange-50'
      case 'APPROVED':
      case 'PARTIALLY_APPROVED':
        return 'border-green-600 bg-green-50'
      case 'REJECTED':
        return 'border-red-600 bg-red-50'
      case 'PAYMENT_PENDING':
      case 'PAYMENT_PROCESSING':
        return 'border-purple-600 bg-purple-50'
      case 'PAYMENT_COMPLETED':
        return 'border-green-600 bg-green-50'
      default:
        return 'border-gray-600 bg-gray-50'
    }
  }

  const formatStatusName = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ')
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (timeline.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No status history available
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Claim Status Timeline</h3>
        <p className="text-sm text-gray-500 mt-1">
          Track your claim&apos;s progress from submission to payment
        </p>
      </div>

      <div className="p-6">
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

          {/* Timeline Items */}
          <div className="space-y-6">
            {timeline.map((entry, index) => {
              const isLatest = index === 0
              const isCurrent = entry.status === currentStatus

              return (
                <div key={index} className="relative flex items-start">
                  {/* Icon */}
                  <div
                    className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${getStatusColor(
                      entry.status
                    )}`}
                  >
                    {getStatusIcon(entry.status)}
                  </div>

                  {/* Content */}
                  <div className="ml-4 flex-1">
                    <div
                      className={`p-4 rounded-lg border-2 ${
                        isLatest || isCurrent
                          ? getStatusColor(entry.status)
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-900">
                          {formatStatusName(entry.status)}
                        </h4>
                        {isCurrent && (
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                            Current
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 text-sm">
                        <p className="text-gray-600">
                          <span className="font-medium">By:</span> {entry.changedBy}
                          {entry.changedByRole && (
                            <span className="text-gray-400 ml-1">
                              ({entry.changedByRole})
                            </span>
                          )}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">When:</span>{' '}
                          {formatDateTime(entry.changedAt)}
                        </p>
                        {entry.reason && (
                          <p className="text-gray-700 mt-2">
                            <span className="font-medium">Note:</span> {entry.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
