'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeftIcon, ClockIcon, CheckCircleIcon, TruckIcon } from '@heroicons/react/24/outline'

interface LabOrder {
  _id: string
  orderId: string
  vendorName: string
  items: Array<{
    serviceName: string
    serviceCode: string
  }>
  status: string
  collectionType: string
  collectionDate?: string
  collectionTime?: string
  totalAmount: number
  createdAt: string
  reportUrl?: string
}

export default function LabOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<LabOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/member/lab/orders', {
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Failed to fetch orders')

      const data = await response.json()
      setOrders(data.data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      alert('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLACED':
        return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800'
      case 'SAMPLE_COLLECTED':
        return 'bg-purple-100 text-purple-800'
      case 'PROCESSING':
        return 'bg-orange-100 text-orange-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PLACED':
      case 'CONFIRMED':
        return <ClockIcon className="h-5 w-5" />
      case 'SAMPLE_COLLECTED':
      case 'PROCESSING':
        return <TruckIcon className="h-5 w-5" />
      case 'COMPLETED':
        return <CheckCircleIcon className="h-5 w-5" />
      default:
        return <ClockIcon className="h-5 w-5" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0a529f', borderTopColor: 'transparent' }}></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4 flex items-center">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg mr-3"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">My Lab Orders</h1>
            <p className="text-sm text-gray-600">Track your diagnostic test orders</p>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg
                className="h-24 w-24 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">No orders yet</p>
            <button
              onClick={() => router.push('/member/diagnostics')}
              className="px-6 py-2 text-white rounded-lg font-medium transition-colors"
              style={{ backgroundColor: '#0a529f' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#084080'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0a529f'}
            >
              Book Diagnostic Services
            </button>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              {/* Order Header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-mono text-sm text-gray-600">{order.orderId}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Ordered on {formatDate(order.createdAt)}
                  </p>
                </div>
                <span
                  className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    order.status
                  )}`}
                >
                  {getStatusIcon(order.status)}
                  <span>{order.status.replace('_', ' ')}</span>
                </span>
              </div>

              {/* Vendor & Tests */}
              <div className="mb-3">
                <p className="font-semibold text-gray-900">{order.vendorName}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {order.items.length} test{order.items.length > 1 ? 's' : ''}:{' '}
                  {order.items.slice(0, 2).map((item) => item.serviceName).join(', ')}
                  {order.items.length > 2 && ` +${order.items.length - 2} more`}
                </p>
              </div>

              {/* Collection Info */}
              {order.collectionDate && (
                <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: '#e6f0fa' }}>
                  <p className="text-sm" style={{ color: '#084080' }}>
                    <span className="font-medium">{order.collectionType.replace('_', ' ')}</span>
                    {order.collectionDate && ` • ${order.collectionDate}`}
                    {order.collectionTime && ` • ${order.collectionTime}`}
                  </p>
                </div>
              )}

              {/* Amount */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <span className="text-gray-600">Total Amount</span>
                <span className="text-lg font-bold text-gray-900">₹{order.totalAmount}</span>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => router.push(`/member/diagnostics/orders/${order.orderId}`)}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  View Details
                </button>
                {order.status === 'COMPLETED' && order.reportUrl && (
                  <button
                    onClick={() => window.open(order.reportUrl, '_blank')}
                    className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Download Report
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
