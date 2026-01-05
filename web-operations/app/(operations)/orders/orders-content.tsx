'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircleIcon, TruckIcon, DocumentArrowUpIcon, EyeIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'

interface Order {
  _id: string
  orderId: string
  userId: {
    name: string | { fullName: string; firstName: string; lastName: string }
    phone: string
  }
  patientName?: string
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
  finalAmount: number
  createdAt: string
}

export default function OpsOrdersContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'lab' | 'diagnostic'>(
    (searchParams.get('tab') as 'lab' | 'diagnostic') || 'lab'
  )

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)

      const apiPath = activeTab === 'lab'
        ? `/api/ops/lab/orders?${params}`
        : `/api/ops/diagnostics/orders?${params}`

      const response = await apiFetch(apiPath)

      if (!response.ok) throw new Error('Failed to fetch orders')

      const data = await response.json()
      setOrders(data.data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, activeTab])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  useEffect(() => {
    // Update URL when tab changes
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', activeTab)
    router.push(`/orders?${params.toString()}`, { scroll: false })
  }, [activeTab])

  const handleConfirm = async (orderId: string) => {
    if (!confirm('Confirm this order?')) return

    try {
      const apiPath = activeTab === 'lab'
        ? `/api/ops/lab/orders/${orderId}/confirm`
        : `/api/ops/diagnostics/orders/${orderId}/confirm`

      const response = await apiFetch(apiPath, {
        method: 'PATCH',
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
      const apiPath = activeTab === 'lab'
        ? `/api/ops/lab/orders/${orderId}/collect`
        : `/api/ops/diagnostics/orders/${orderId}/collect`

      const response = await apiFetch(apiPath, {
        method: 'PATCH',
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

  const handleUploadReport = (order: Order) => {
    setSelectedOrder(order)
    setShowUploadModal(true)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleConfirmUpload = async () => {
    if (!selectedOrder || !selectedFile) {
      toast.error('Please select a file to upload')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const apiPath = activeTab === 'lab'
        ? `/api/ops/lab/orders/${selectedOrder.orderId}/reports/upload`
        : `/api/ops/diagnostics/orders/${selectedOrder.orderId}/report`

      const response = await apiFetch(apiPath, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Failed to upload report')

      const data = await response.json()
      toast.success(data.message || 'Report uploaded successfully')
      setShowUploadModal(false)
      setSelectedFile(null)
      setSelectedOrder(null)
      fetchOrders()
    } catch (error) {
      console.error('Error uploading report:', error)
      toast.error('Failed to upload report')
    } finally {
      setUploading(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!selectedOrder || !cancelReason.trim()) {
      toast.error('Please enter a cancellation reason')
      return
    }

    setCancelling(true)

    try {
      const apiPath = activeTab === 'lab'
        ? `/api/ops/lab/orders/${selectedOrder.orderId}/cancel`
        : `/api/ops/diagnostics/orders/${selectedOrder.orderId}/cancel`

      const response = await apiFetch(apiPath, {
        method: 'POST',
        body: JSON.stringify({ reason: cancelReason }),
      })

      if (!response.ok) throw new Error('Failed to cancel order')

      const data = await response.json()
      toast.success(data.message || 'Order cancelled successfully')
      setShowCancelModal(false)
      setCancelReason('')
      setSelectedOrder(null)
      fetchOrders()
    } catch (error) {
      console.error('Error cancelling order:', error)
      toast.error('Failed to cancel order')
    } finally {
      setCancelling(false)
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
      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('lab')}
              className={`${
                activeTab === 'lab'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Lab Orders
            </button>
            <button
              onClick={() => setActiveTab('diagnostic')}
              className={`${
                activeTab === 'diagnostic'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Diagnostic Orders
            </button>
          </nav>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {activeTab === 'lab' ? 'Lab' : 'Diagnostic'} Orders
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage {activeTab === 'lab' ? 'lab test' : 'diagnostic service'} orders
          </p>
        </div>
        <div>
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
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
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
                        <p className="font-medium">
                          {order.patientName ||
                           (typeof order.userId?.name === 'object' ? order.userId?.name?.fullName : order.userId?.name) ||
                           'N/A'}
                        </p>
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
                      ₹{order.finalAmount || order.totalAmount || 0}
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

                      {/* For Lab orders only: Show Mark Collected button */}
                      {order.status === 'CONFIRMED' && activeTab === 'lab' && (
                        <button
                          onClick={() => handleMarkCollected(order.orderId)}
                          className="inline-flex items-center px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                          title="Mark collected"
                        >
                          <TruckIcon className="h-4 w-4" />
                        </button>
                      )}

                      {/* For Lab orders: Show upload after sample collected */}
                      {['SAMPLE_COLLECTED', 'PROCESSING'].includes(order.status) && activeTab === 'lab' && (
                        <button
                          onClick={() => handleUploadReport(order)}
                          className="inline-flex items-center px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                          title="Upload report"
                        >
                          <DocumentArrowUpIcon className="h-4 w-4" />
                        </button>
                      )}

                      {/* For Diagnostic orders: Show upload directly after confirmed */}
                      {['CONFIRMED', 'SCHEDULED', 'PROCESSING'].includes(order.status) && activeTab === 'diagnostic' && (
                        <button
                          onClick={() => handleUploadReport(order)}
                          className="inline-flex items-center px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                          title="Upload report"
                        >
                          <DocumentArrowUpIcon className="h-4 w-4" />
                        </button>
                      )}

                      {/* Cancel button - show for both order types */}
                      {(activeTab === 'lab'
                        ? ['PLACED', 'CONFIRMED'].includes(order.status)
                        : ['PLACED', 'CONFIRMED', 'SCHEDULED'].includes(order.status)
                      ) && (
                        <button
                          onClick={() => {
                            setSelectedOrder(order)
                            setShowCancelModal(true)
                          }}
                          className="inline-flex items-center px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                          title="Cancel order"
                        >
                          <XMarkIcon className="h-4 w-4" />
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
                  <span>₹{selectedOrder.finalAmount || selectedOrder.totalAmount || 0}</span>
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

      {/* Cancel Modal */}
      {showCancelModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Cancel Order</h3>
                  <p className="text-sm text-gray-600 mt-1 font-mono">{selectedOrder.orderId}</p>
                </div>
                <button
                  onClick={() => {
                    setShowCancelModal(false)
                    setSelectedOrder(null)
                    setCancelReason('')
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                  disabled={cancelling}
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-700 mb-4">
                Are you sure you want to cancel this order? This action cannot be undone.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cancellation Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Enter reason for cancellation..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={cancelling}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false)
                    setSelectedOrder(null)
                    setCancelReason('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={cancelling}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCancelOrder}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={cancelling || !cancelReason.trim()}
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Report Modal */}
      {showUploadModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Upload Report</h3>
                  <p className="text-sm text-gray-600 mt-1 font-mono">{selectedOrder.orderId}</p>
                </div>
                <button
                  onClick={() => {
                    setShowUploadModal(false)
                    setSelectedOrder(null)
                    setSelectedFile(null)
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                  disabled={uploading}
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Report File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={uploading}
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected: <span className="font-medium">{selectedFile.name}</span> ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowUploadModal(false)
                    setSelectedOrder(null)
                    setSelectedFile(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmUpload}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={uploading || !selectedFile}
                >
                  {uploading ? 'Uploading...' : 'Confirm Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
