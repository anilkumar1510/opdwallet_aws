'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ChevronLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline'

interface OrderItem {
  serviceId: string
  serviceName: string
  serviceCode: string
  actualPrice: number
  discountedPrice: number
}

interface CollectionAddress {
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
}

interface Report {
  fileName: string
  originalName: string
  filePath: string
  uploadedAt: string
  uploadedBy: string
}

interface Order {
  _id: string
  orderId: string
  vendorName: string
  items: OrderItem[]
  status: string
  collectionType: string
  collectionAddress?: CollectionAddress
  collectionDate: string
  collectionTime: string
  totalActualPrice: number
  totalDiscountedPrice: number
  homeCollectionCharges: number
  finalAmount: number
  paymentStatus: string
  placedAt: string
  confirmedAt?: string
  collectedAt?: string
  completedAt?: string
  reports: Report[]
}

const statusSteps = [
  { key: 'PLACED', label: 'Order Placed', icon: CheckCircleIcon },
  { key: 'CONFIRMED', label: 'Confirmed by Lab', icon: CheckCircleIcon },
  { key: 'SAMPLE_COLLECTED', label: 'Sample Collected', icon: TruckIcon },
  { key: 'PROCESSING', label: 'Processing', icon: ClockIcon },
  { key: 'COMPLETED', label: 'Reports Ready', icon: CheckCircleIcon },
]

const statusOrder = ['PLACED', 'CONFIRMED', 'SAMPLE_COLLECTED', 'PROCESSING', 'COMPLETED']

export default function OrderDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.orderId as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/member/lab/orders/${orderId}`, {
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Failed to fetch order')

      const data = await response.json()
      setOrder(data.data)
    } catch (error) {
      console.error('Error fetching order:', error)
      alert('Failed to fetch order details')
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  const getStatusIndex = (status: string) => {
    return statusOrder.indexOf(status)
  }

  const isStepCompleted = (stepKey: string) => {
    if (!order) return false
    const currentIndex = getStatusIndex(order.status)
    const stepIndex = getStatusIndex(stepKey)
    return stepIndex <= currentIndex
  }

  const isStepCurrent = (stepKey: string) => {
    if (!order) return false
    return order.status === stepKey
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleDownloadReport = (report: Report) => {
    window.open(`/uploads/lab-reports/${report.filePath}`, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0a529f', borderTopColor: 'transparent' }}></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Order not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4 flex items-center">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg mr-3"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900">Order Details</h1>
            <p className="text-sm text-gray-600 font-mono">{order.orderId}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
          >
            {order.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto space-y-4">
        {/* Status Timeline */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Order Status</h3>
          <div className="space-y-4">
            {statusSteps.map((step, index) => {
              const completed = isStepCompleted(step.key)
              const current = isStepCurrent(step.key)
              const Icon = step.icon

              return (
                <div key={step.key} className="flex items-start">
                  <div className="flex flex-col items-center mr-4">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full ${
                        completed
                          ? 'bg-green-500'
                          : current
                          ? 'bg-blue-500'
                          : 'bg-gray-300'
                      }`}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    {index < statusSteps.length - 1 && (
                      <div
                        className={`w-0.5 h-12 ${
                          completed ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1 pb-8">
                    <p
                      className={`font-medium ${
                        completed || current ? 'text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </p>
                    {completed && step.key === 'PLACED' && order.placedAt && (
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDateTime(order.placedAt)}
                      </p>
                    )}
                    {completed && step.key === 'CONFIRMED' && order.confirmedAt && (
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDateTime(order.confirmedAt)}
                      </p>
                    )}
                    {completed && step.key === 'SAMPLE_COLLECTED' && order.collectedAt && (
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDateTime(order.collectedAt)}
                      </p>
                    )}
                    {completed && step.key === 'COMPLETED' && order.completedAt && (
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDateTime(order.completedAt)}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Lab Partner Info */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Lab Partner</h3>
          <p className="text-lg font-medium text-gray-900">{order.vendorName}</p>
        </div>

        {/* Tests Ordered */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Tests Ordered</h3>
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-xl"
              >
                <div>
                  <p className="font-medium text-gray-900">{item.serviceName}</p>
                  <p className="text-sm text-gray-600">{item.serviceCode}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 line-through">₹{item.actualPrice}</p>
                  <p className="font-bold text-gray-900">₹{item.discountedPrice}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Collection Details */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Collection Details</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Type</span>
              <span className="font-medium text-gray-900">
                {order.collectionType === 'HOME_COLLECTION' ? 'Home Collection' : 'Center Visit'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Date</span>
              <span className="font-medium text-gray-900">{order.collectionDate}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Time</span>
              <span className="font-medium text-gray-900">{order.collectionTime}</span>
            </div>
            {order.collectionAddress && (
              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Address</p>
                <p className="text-sm text-gray-900">
                  {order.collectionAddress.line1}
                  {order.collectionAddress.line2 && `, ${order.collectionAddress.line2}`}
                </p>
                <p className="text-sm text-gray-900">
                  {order.collectionAddress.city}, {order.collectionAddress.state} -{' '}
                  {order.collectionAddress.pincode}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Payment Summary</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Tests Subtotal</span>
              <span className="text-gray-900">₹{order.totalDiscountedPrice}</span>
            </div>
            {order.homeCollectionCharges > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Home Collection Charges</span>
                <span className="text-gray-900">₹{order.homeCollectionCharges}</span>
              </div>
            )}
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Total Paid</span>
                <span className="text-xl font-bold text-gray-900">₹{order.finalAmount}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm pt-2">
              <span className="text-gray-600">Payment Status</span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  order.paymentStatus === 'PAID'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {order.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Reports Section */}
        {order.reports && order.reports.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Lab Reports</h3>
            <div className="space-y-2">
              {order.reports.map((report, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <DocumentArrowDownIcon className="h-5 w-5 text-blue-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">{report.originalName}</p>
                      <p className="text-xs text-gray-600">
                        Uploaded on {formatDate(report.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadReport(report)}
                    className="px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors"
                    style={{ backgroundColor: '#0a529f' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#084080'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0a529f'}
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty Reports State */}
        {order.status === 'COMPLETED' && (!order.reports || order.reports.length === 0) && (
          <div className="rounded-2xl p-6 text-center border" style={{ backgroundColor: '#e6f0fa', borderColor: '#b3d4f0' }}>
            <DocumentArrowDownIcon className="h-12 w-12 mx-auto mb-3" style={{ color: '#0a529f' }} />
            <p className="font-medium" style={{ color: '#084080' }}>Reports will be available soon</p>
            <p className="text-sm mt-1" style={{ color: '#0a529f' }}>
              Your lab reports are being processed and will be uploaded shortly
            </p>
          </div>
        )}

        {/* Help Section */}
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Need help with your order? Contact support
          </p>
        </div>
      </div>
    </div>
  )
}
