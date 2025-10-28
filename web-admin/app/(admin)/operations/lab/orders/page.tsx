'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircleIcon, TruckIcon, DocumentArrowUpIcon, EyeIcon } from '@heroicons/react/24/outline'
import { toast } from 'sonner'

interface LabOrder {
  _id: string
  orderId: string
  userId: {
    name: string
    phone: string
  }
  vendorName: string
  items: Array<{
    serviceName: string
    serviceCode: string
    discountedPrice: number
  }>
  status: string
  collectionType: string
  collectionDate?: string
  collectionTime?: string
  totalAmount: number
  createdAt: string
}

export default function OpsLabOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<LabOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/ops/lab/orders?${params}`, {
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Failed to fetch orders')

      const data = await response.json()
      setOrders(data.data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to fetch orders')
    } finally{
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchOrders()
  }, [statusFilter, fetchOrders])

  const handleConfirm = async (orderId: string) => {
    if (!confirm('Confirm this order?')) return

    try {
      const response = await fetch(`/api/ops/lab/orders/${orderId}/confirm`, {
        method: 'PATCH',
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Failed to confirm order')

      const data = await response.json()
      toast.success(data.message)
      fetchOrders()
    } catch (error) {
      console.error('Error confirming order:', error)
      toast.error('Failed to confirm order')
    }
  }

  const handleMarkCollected = async (orderId: string) => {
    if (!confirm('Mark sample as collected?')) return

    try {
      const response = await fetch(`/api/ops/lab/orders/${orderId}/collect`, {
        method: 'PATCH',
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Failed to mark collected')

      const data = await response.json()
      toast.success(data.message)
      fetchOrders()
    } catch (error) {
      console.error('Error marking collected:', error)
      toast.error('Failed to mark collected')
    }
  }

  const handleUploadReport = (orderId: string) => {
    router.push(`/operations/lab/orders/${orderId}/upload-report`)
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
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lab Orders</h1>
          <p className="text-sm text-gray-600 mt-1">Manage lab test orders</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Status</option>
          <option value="PLACED">Placed</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="SAMPLE_COLLECTED">Sample Collected</option>
          <option value="PROCESSING">Processing</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No orders found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {order.orderId}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>
                        <p className="font-medium">{order.userId?.name || 'N/A'}</p>
                        <p className="text-gray-500 text-xs">{order.userId?.phone || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {order.vendorName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.items.length} test{order.items.length > 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ₹{order.totalAmount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setSelectedOrder(order)
                          setShowDetailsModal(true)
                        }}
                        className="inline-flex items-center px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                        title="View details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>

                      {order.status === 'PLACED' && (
                        <button
                          onClick={() => handleConfirm(order.orderId)}
                          className="inline-flex items-center px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                          title="Confirm order"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                        </button>
                      )}

                      {order.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleMarkCollected(order.orderId)}
                          className="inline-flex items-center px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                          title="Mark collected"
                        >
                          <TruckIcon className="h-4 w-4" />
                        </button>
                      )}

                      {['SAMPLE_COLLECTED', 'PROCESSING'].includes(order.status) && (
                        <button
                          onClick={() => handleUploadReport(order.orderId)}
                          className="inline-flex items-center px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                          title="Upload report"
                        >
                          <DocumentArrowUpIcon className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">Order Details</h3>
                  <p className="text-sm text-gray-600 mt-1 font-mono">{selectedOrder.orderId}</p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailsModal(false)
                    setSelectedOrder(null)
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Tests Ordered</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.serviceName}</p>
                        <p className="text-sm text-gray-600">{item.serviceCode}</p>
                      </div>
                      <p className="font-semibold">₹{item.discountedPrice}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount</span>
                  <span>₹{selectedOrder.totalAmount}</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Collection Details</h4>
                <p className="text-sm">Type: {selectedOrder.collectionType.replace('_', ' ')}</p>
                {selectedOrder.collectionDate && (
                  <p className="text-sm">Date: {selectedOrder.collectionDate}</p>
                )}
                {selectedOrder.collectionTime && (
                  <p className="text-sm">Time: {selectedOrder.collectionTime}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
