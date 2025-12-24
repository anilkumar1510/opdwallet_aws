'use client'

import { useEffect, useState, useCallback } from 'react'
import { operationsApi } from '@/lib/api/operations'
import RescheduleModal from './RescheduleModal'
import GenerateBillModal from './GenerateBillModal'

interface VisionBooking {
  _id: string
  bookingId: string
  userId: string
  patientId: string
  patientName: string
  patientRelationship: string
  clinicId: string
  clinicName: string
  clinicAddress: {
    street: string
    city: string
    state: string
    pincode: string
  }
  clinicContact?: string
  serviceCode: string
  serviceName: string
  slotId: string
  appointmentDate: string
  appointmentTime: string
  duration: number
  servicePrice: number
  billAmount: number
  billGenerated?: boolean
  billGeneratedAt?: string
  billGeneratedBy?: string
  copayAmount: number
  insurancePayment: number
  excessAmount: number
  totalMemberPayment: number
  walletDebitAmount: number
  paymentMethod: string
  paymentStatus: string
  status: string
  transactionId?: string
  createdAt: string
  invoiceGenerated?: boolean
  invoiceId?: string
}

export default function VisionBookingsTab() {
  const [bookings, setBookings] = useState<VisionBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    searchTerm: '',
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  })
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null)
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false)
  const [generateBillModalOpen, setGenerateBillModalOpen] = useState(false)
  const [selectedBookingForReschedule, setSelectedBookingForReschedule] = useState<VisionBooking | null>(null)
  const [selectedBookingForBill, setSelectedBookingForBill] = useState<VisionBooking | null>(null)

  const fetchBookings = useCallback(async () => {
    try {
      console.log('[VisionBookingsTab] Fetching bookings with filters:', filters)
      setLoading(true)

      const result = await operationsApi.getVisionBookings({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      })

      setBookings(result.data || [])
      setPagination({
        page: result.page || 1,
        limit: result.limit || 20,
        total: result.total || 0,
        pages: result.pages || 0,
      })

      console.log('[VisionBookingsTab] Fetched', result.data?.length || 0, 'bookings')
    } catch (error) {
      console.error('[VisionBookingsTab] Failed to fetch bookings:', error)
      setBookings([])
    } finally {
      setLoading(false)
    }
  }, [filters, pagination.page, pagination.limit])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const handleConfirm = async (bookingId: string) => {
    if (!confirm('Are you sure you want to confirm this booking?')) return

    try {
      console.log('[VisionBookingsTab] Confirming booking:', bookingId)
      await operationsApi.confirmVisionBooking(bookingId)
      alert('Booking confirmed successfully')
      await fetchBookings()
    } catch (error: any) {
      console.error('[VisionBookingsTab] Failed to confirm booking:', error)
      alert(error.message || 'Failed to confirm booking')
    }
  }

  const handleGenerateBill = (booking: VisionBooking) => {
    console.log('[VisionBookingsTab] Opening generate bill modal for:', booking.bookingId)
    setSelectedBookingForBill(booking)
    setGenerateBillModalOpen(true)
  }

  const handleBillGenerated = async () => {
    console.log('[VisionBookingsTab] Bill generated successfully')
    setGenerateBillModalOpen(false)
    setSelectedBookingForBill(null)
    await fetchBookings()
  }

  const handleReschedule = (booking: VisionBooking) => {
    console.log('[VisionBookingsTab] Opening reschedule modal for:', booking.bookingId)
    setSelectedBookingForReschedule(booking)
    setRescheduleModalOpen(true)
  }

  const handleRescheduleSuccess = async () => {
    console.log('[VisionBookingsTab] Booking rescheduled successfully')
    setRescheduleModalOpen(false)
    setSelectedBookingForReschedule(null)
    await fetchBookings()
  }

  const handleCancel = async (bookingId: string) => {
    const reason = prompt('Please provide a cancellation reason:')
    if (!reason) return

    try {
      console.log('[VisionBookingsTab] Cancelling booking:', bookingId, 'Reason:', reason)
      await operationsApi.cancelVisionBooking(bookingId, reason)
      alert('Booking cancelled successfully')
      await fetchBookings()
    } catch (error: any) {
      console.error('[VisionBookingsTab] Failed to cancel booking:', error)
      alert(error.message || 'Failed to cancel booking')
    }
  }

  const handleMarkNoShow = async (bookingId: string) => {
    if (!confirm('Are you sure you want to mark this booking as no-show?')) return

    try {
      console.log('[VisionBookingsTab] Marking as no-show:', bookingId)
      await operationsApi.markVisionBookingNoShow(bookingId)
      alert('Booking marked as no-show')
      await fetchBookings()
    } catch (error: any) {
      console.error('[VisionBookingsTab] Failed to mark as no-show:', error)
      alert(error.message || 'Failed to mark as no-show')
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING_CONFIRMATION':
        return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'NO_SHOW':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const renderActionButtons = (booking: VisionBooking) => {
    if (booking.status === 'PENDING_CONFIRMATION') {
      return (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => handleConfirm(booking.bookingId)}
            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Confirm
          </button>
          <button
            onClick={() => handleReschedule(booking)}
            className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Reschedule
          </button>
          <button
            onClick={() => handleCancel(booking.bookingId)}
            className="flex-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      )
    }

    if (booking.status === 'CONFIRMED') {
      if (!booking.billGenerated) {
        return (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => handleGenerateBill(booking)}
              className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Generate Bill
            </button>
            <button
              onClick={() => handleMarkNoShow(booking.bookingId)}
              className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Mark No Show
            </button>
            <button
              onClick={() => handleCancel(booking.bookingId)}
              className="flex-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        )
      } else {
        // Bill already generated
        return (
          <div className="flex gap-2 mt-3">
            <div className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium text-center">
              Bill Generated
            </div>
            <button
              onClick={() => handleMarkNoShow(booking.bookingId)}
              className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Mark No Show
            </button>
            <button
              onClick={() => handleCancel(booking.bookingId)}
              className="flex-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        )
      }
    }

    if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED' || booking.status === 'NO_SHOW') {
      return null
    }

    return null
  }

  return (
    <div className="p-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="PENDING_CONFIRMATION">Pending Confirmation</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No Show</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Patient name or booking ID"
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500">No vision bookings found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking._id}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{booking.serviceName}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(booking.status)}`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusBadgeColor(booking.paymentStatus)}`}>
                      Payment: {booking.paymentStatus}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Booking ID: {booking.bookingId}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">₹{booking.billAmount}</p>
                  {booking.billGenerated && (
                    <p className="text-xs text-green-600 mt-1">Bill Generated</p>
                  )}
                </div>
              </div>

              {/* Booking Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Patient Information</h4>
                  <p className="text-sm text-gray-600">Name: {booking.patientName}</p>
                  <p className="text-sm text-gray-600">Relationship: {booking.patientRelationship}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Appointment Details</h4>
                  <p className="text-sm text-gray-600">
                    Date: {new Date(booking.appointmentDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">Time: {booking.appointmentTime}</p>
                  <p className="text-sm text-gray-600">Duration: {booking.duration} mins</p>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Clinic Information</h4>
                <p className="text-sm text-gray-600">{booking.clinicName}</p>
                <p className="text-sm text-gray-600">
                  {booking.clinicAddress.city}, {booking.clinicAddress.state} - {booking.clinicAddress.pincode}
                </p>
                {booking.clinicContact && (
                  <p className="text-sm text-gray-600">Contact: {booking.clinicContact}</p>
                )}
              </div>

              {/* Action Buttons */}
              {renderActionButtons(booking)}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            onClick={() => setPagination({ ...pagination, page: Math.max(1, pagination.page - 1) })}
            disabled={pagination.page === 1}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPagination({ ...pagination, page: Math.min(pagination.pages, pagination.page + 1) })}
            disabled={pagination.page === pagination.pages}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Reschedule Modal */}
      <RescheduleModal
        isOpen={rescheduleModalOpen}
        onClose={() => {
          setRescheduleModalOpen(false)
          setSelectedBookingForReschedule(null)
        }}
        booking={selectedBookingForReschedule}
        bookingType="vision"
        onSuccess={handleRescheduleSuccess}
      />

      {/* Generate Bill Modal */}
      <GenerateBillModal
        isOpen={generateBillModalOpen}
        onClose={() => {
          setGenerateBillModalOpen(false)
          setSelectedBookingForBill(null)
        }}
        booking={selectedBookingForBill}
        onBillGenerated={handleBillGenerated}
      />
    </div>
  )
}
