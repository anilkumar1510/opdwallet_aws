'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline'
import PageHeader from '@/components/ui/PageHeader'
import DetailCard from '@/components/ui/DetailCard'
import CTAButton from '@/components/ui/CTAButton'

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
        return { background: '#FEF1E7', color: '#E67E22' }
      case 'CONFIRMED':
        return { background: '#EFF4FF', color: '#0F5FDC' }
      case 'SAMPLE_COLLECTED':
        return { background: '#F3E8FF', color: '#9333EA' }
      case 'PROCESSING':
        return { background: '#FEF1E7', color: '#F97316' }
      case 'COMPLETED':
        return { background: '#E8F5E9', color: '#25A425' }
      case 'CANCELLED':
        return { background: '#FFEBEE', color: '#E53535' }
      default:
        return { background: '#f3f4f6', color: '#6b7280' }
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
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f7f7fc' }}>
        <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f7f7fc' }}>
        <p className="text-sm lg:text-base text-gray-500">Order not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f7fc' }}>
      <div className="bg-white shadow-sm">
        <div className="px-4 lg:px-6 py-4 flex items-center">
          <div className="flex-1">
            <h1 className="text-lg lg:text-xl font-semibold" style={{ color: '#0E51A2' }}>Order Details</h1>
            <p className="text-xs lg:text-sm font-mono" style={{ color: '#0F5FDC' }}>{order.orderId}</p>
          </div>
          <span
            className="px-2 lg:px-3 py-1 rounded-full text-xs font-medium"
            style={getStatusColor(order.status)}
          >
            {order.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="max-w-[480px] mx-auto lg:max-w-4xl px-4 lg:px-6 py-6 lg:py-8 space-y-4 lg:space-y-5">
        {/* Status Timeline */}
        <DetailCard variant="primary">
          <h3 className="text-base lg:text-lg font-semibold mb-4 lg:mb-6" style={{ color: '#0E51A2' }}>Order Status</h3>
          <div className="space-y-4">
            {statusSteps.map((step, index) => {
              const completed = isStepCompleted(step.key)
              const current = isStepCurrent(step.key)
              const Icon = step.icon

              return (
                <div key={step.key} className="flex items-start">
                  <div className="flex flex-col items-center mr-4">
                    <div
                      className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 rounded-full"
                      style={{
                        background: completed ? '#25A425' : current ? '#0F5FDC' : '#e5e7eb'
                      }}
                    >
                      <Icon className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                    </div>
                    {index < statusSteps.length - 1 && (
                      <div
                        className="w-0.5 h-12"
                        style={{ background: completed ? '#25A425' : '#e5e7eb' }}
                      />
                    )}
                  </div>
                  <div className="flex-1 pb-8">
                    <p
                      className={`text-sm lg:text-base font-medium ${
                        completed || current ? '' : 'text-gray-500'
                      }`}
                      style={completed || current ? { color: '#0E51A2' } : {}}
                    >
                      {step.label}
                    </p>
                    {completed && step.key === 'PLACED' && order.placedAt && (
                      <p className="text-xs lg:text-sm text-gray-600 mt-1">
                        {formatDateTime(order.placedAt)}
                      </p>
                    )}
                    {completed && step.key === 'CONFIRMED' && order.confirmedAt && (
                      <p className="text-xs lg:text-sm text-gray-600 mt-1">
                        {formatDateTime(order.confirmedAt)}
                      </p>
                    )}
                    {completed && step.key === 'SAMPLE_COLLECTED' && order.collectedAt && (
                      <p className="text-xs lg:text-sm text-gray-600 mt-1">
                        {formatDateTime(order.collectedAt)}
                      </p>
                    )}
                    {completed && step.key === 'COMPLETED' && order.completedAt && (
                      <p className="text-xs lg:text-sm text-gray-600 mt-1">
                        {formatDateTime(order.completedAt)}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </DetailCard>

        {/* Lab Partner Info */}
        <DetailCard variant="primary">
          <h3 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4" style={{ color: '#0E51A2' }}>Lab Partner</h3>
          <p className="text-base lg:text-lg font-medium" style={{ color: '#0E51A2' }}>{order.vendorName}</p>
        </DetailCard>

        {/* Tests Ordered */}
        <DetailCard variant="primary">
          <h3 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4" style={{ color: '#0E51A2' }}>Tests Ordered</h3>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <DetailCard
                key={index}
                variant="secondary"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm lg:text-base font-medium" style={{ color: '#0E51A2' }}>{item.serviceName}</p>
                    <p className="text-xs lg:text-sm text-gray-600">{item.serviceCode}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs lg:text-sm text-gray-500 line-through">₹{item.actualPrice}</p>
                    <p className="text-sm lg:text-base font-bold" style={{ color: '#0E51A2' }}>₹{item.discountedPrice}</p>
                  </div>
                </div>
              </DetailCard>
            ))}
          </div>
        </DetailCard>

        {/* Collection Details */}
        <DetailCard variant="primary">
          <h3 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4" style={{ color: '#0E51A2' }}>Collection Details</h3>
          <div className="space-y-2 lg:space-y-3">
            <div className="flex items-center justify-between text-xs lg:text-sm">
              <span className="text-gray-600">Type</span>
              <span className="font-medium" style={{ color: '#0E51A2' }}>
                {order.collectionType === 'HOME_COLLECTION' ? 'Home Collection' : 'Center Visit'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs lg:text-sm">
              <span className="text-gray-600">Date</span>
              <span className="font-medium" style={{ color: '#0E51A2' }}>{order.collectionDate}</span>
            </div>
            <div className="flex items-center justify-between text-xs lg:text-sm">
              <span className="text-gray-600">Time</span>
              <span className="font-medium" style={{ color: '#0E51A2' }}>{order.collectionTime}</span>
            </div>
            {order.collectionAddress && (
              <div className="pt-2 lg:pt-3 border-t" style={{ borderColor: '#86ACD8' }}>
                <p className="text-xs lg:text-sm text-gray-600 mb-1">Address</p>
                <p className="text-xs lg:text-sm" style={{ color: '#0E51A2' }}>
                  {order.collectionAddress.line1}
                  {order.collectionAddress.line2 && `, ${order.collectionAddress.line2}`}
                </p>
                <p className="text-xs lg:text-sm" style={{ color: '#0E51A2' }}>
                  {order.collectionAddress.city}, {order.collectionAddress.state} -{' '}
                  {order.collectionAddress.pincode}
                </p>
              </div>
            )}
          </div>
        </DetailCard>

        {/* Payment Summary */}
        <DetailCard variant="primary">
          <h3 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4" style={{ color: '#0E51A2' }}>Payment Summary</h3>
          <div className="space-y-2 lg:space-y-3">
            <div className="flex items-center justify-between text-xs lg:text-sm">
              <span className="text-gray-600">Tests Subtotal</span>
              <span className="font-medium" style={{ color: '#0E51A2' }}>₹{order.totalDiscountedPrice}</span>
            </div>
            {order.homeCollectionCharges > 0 && (
              <div className="flex items-center justify-between text-xs lg:text-sm">
                <span className="text-gray-600">Home Collection Charges</span>
                <span className="font-medium" style={{ color: '#0E51A2' }}>₹{order.homeCollectionCharges}</span>
              </div>
            )}
            <div className="pt-2 lg:pt-3 border-t" style={{ borderColor: '#86ACD8' }}>
              <div className="flex items-center justify-between">
                <span className="text-sm lg:text-base font-semibold" style={{ color: '#0E51A2' }}>Total Paid</span>
                <span className="text-lg lg:text-xl font-bold" style={{ color: '#0E51A2' }}>₹{order.finalAmount}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs lg:text-sm pt-2">
              <span className="text-gray-600">Payment Status</span>
              <span
                className="px-2 py-1 rounded-full text-xs font-medium"
                style={order.paymentStatus === 'PAID' ? { background: '#E8F5E9', color: '#25A425' } : { background: '#FEF1E7', color: '#E67E22' }}
              >
                {order.paymentStatus}
              </span>
            </div>
          </div>
        </DetailCard>

        {/* Reports Section */}
        {order.reports && order.reports.length > 0 && (
          <DetailCard variant="primary">
            <h3 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4" style={{ color: '#0E51A2' }}>Lab Reports</h3>
            <div className="space-y-3">
              {order.reports.map((report, index) => (
                <DetailCard
                  key={index}
                  variant="secondary"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div
                        className="w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center mr-3"
                        style={{ background: '#EFF4FF' }}
                      >
                        <DocumentArrowDownIcon className="h-5 w-5 lg:h-6 lg:w-6" style={{ color: '#0F5FDC' }} />
                      </div>
                      <div>
                        <p className="text-sm lg:text-base font-medium" style={{ color: '#0E51A2' }}>{report.originalName}</p>
                        <p className="text-xs lg:text-sm text-gray-600">
                          Uploaded on {formatDate(report.uploadedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="ml-3">
                      <CTAButton
                        onClick={() => handleDownloadReport(report)}
                        variant="primary"
                      >
                        Download
                      </CTAButton>
                    </div>
                  </div>
                </DetailCard>
              ))}
            </div>
          </DetailCard>
        )}

        {/* Empty Reports State */}
        {order.status === 'COMPLETED' && (!order.reports || order.reports.length === 0) && (
          <DetailCard variant="primary">
            <div className="text-center py-6 lg:py-8">
              <div
                className="w-16 h-16 lg:w-20 lg:h-20 mx-auto rounded-full flex items-center justify-center mb-4"
                style={{ background: '#EFF4FF' }}
              >
                <DocumentArrowDownIcon className="h-8 w-8 lg:h-10 lg:w-10" style={{ color: '#0F5FDC' }} />
              </div>
              <p className="text-base lg:text-lg font-semibold mb-2" style={{ color: '#0E51A2' }}>Reports will be available soon</p>
              <p className="text-sm lg:text-base text-gray-600">
                Your lab reports are being processed and will be uploaded shortly
              </p>
            </div>
          </DetailCard>
        )}

        {/* Help Section */}
        <DetailCard variant="secondary">
          <p className="text-sm lg:text-base text-gray-600 text-center">
            Need help with your order? Contact support
          </p>
        </DetailCard>
      </div>
    </div>
  )
}
