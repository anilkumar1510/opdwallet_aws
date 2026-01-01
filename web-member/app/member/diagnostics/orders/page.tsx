'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ClockIcon, CheckCircleIcon, TruckIcon, BeakerIcon } from '@heroicons/react/24/outline'
import PageHeader from '@/components/ui/PageHeader'
import DetailCard from '@/components/ui/DetailCard'
import CTAButton from '@/components/ui/CTAButton'
import EmptyState from '@/components/ui/EmptyState'

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
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f7f7fc' }}>
        <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f7fc' }}>
      <PageHeader
        title="My Diagnostic Orders"
        subtitle="Track your diagnostic test orders"
        onBack={() => router.back()}
      />

      <div className="max-w-[480px] mx-auto lg:max-w-4xl px-4 lg:px-6 py-6 lg:py-8 space-y-4 lg:space-y-5">
        {orders.length === 0 ? (
          <EmptyState
            icon={BeakerIcon}
            title="No orders yet"
            message="You haven't booked any diagnostic tests yet"
            ctaText="Book Diagnostic Services"
            onCtaClick={() => router.push('/member/diagnostics')}
          />
        ) : (
          orders.map((order) => (
            <DetailCard
              key={order._id}
              variant="primary"
            >
              {/* Order Header */}
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <div>
                  <p className="font-mono text-xs lg:text-sm font-medium" style={{ color: '#0F5FDC' }}>{order.orderId}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Ordered on {formatDate(order.createdAt)}
                  </p>
                </div>
                <span
                  className="flex items-center space-x-1 px-2 lg:px-3 py-1 rounded-full text-xs font-medium"
                  style={getStatusColor(order.status)}
                >
                  {getStatusIcon(order.status)}
                  <span>{order.status.replace('_', ' ')}</span>
                </span>
              </div>

              {/* Vendor & Tests */}
              <div className="mb-3 lg:mb-4">
                <p className="text-sm lg:text-base font-semibold" style={{ color: '#0E51A2' }}>{order.vendorName}</p>
                <p className="text-xs lg:text-sm text-gray-600 mt-1">
                  {order.items.length} test{order.items.length > 1 ? 's' : ''}:{' '}
                  {order.items.slice(0, 2).map((item) => item.serviceName).join(', ')}
                  {order.items.length > 2 && ` +${order.items.length - 2} more`}
                </p>
              </div>

              {/* Collection Info */}
              {order.collectionDate && (
                <DetailCard variant="secondary" className="mb-3 lg:mb-4">
                  <p className="text-xs lg:text-sm" style={{ color: '#0E51A2' }}>
                    <span className="font-medium">{order.collectionType.replace('_', ' ')}</span>
                    {order.collectionDate && ` • ${order.collectionDate}`}
                    {order.collectionTime && ` • ${order.collectionTime}`}
                  </p>
                </DetailCard>
              )}

              {/* Amount */}
              <div className="flex items-center justify-between pt-3 lg:pt-4 border-t" style={{ borderColor: '#86ACD8' }}>
                <span className="text-xs lg:text-sm text-gray-600">Total Amount</span>
                <span className="text-base lg:text-lg font-bold" style={{ color: '#0E51A2' }}>₹{order.totalAmount}</span>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 lg:mt-5 flex flex-col lg:flex-row space-y-2 lg:space-y-0 lg:space-x-3">
                <div className="flex-1">
                  <CTAButton
                    onClick={() => router.push(`/member/diagnostics/orders/${order.orderId}`)}
                    variant="primary"
                    fullWidth
                  >
                    View Details
                  </CTAButton>
                </div>
                {order.status === 'COMPLETED' && order.reportUrl && (
                  <div className="flex-1">
                    <CTAButton
                      onClick={() => window.open(order.reportUrl, '_blank')}
                      variant="success"
                      fullWidth
                    >
                      Download Report
                    </CTAButton>
                  </div>
                )}
              </div>
            </DetailCard>
          ))
        )}
      </div>
    </div>
  )
}
