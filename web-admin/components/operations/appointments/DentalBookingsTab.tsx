'use client'

import { useEffect, useState, useCallback } from 'react'
import { operationsApi } from '@/lib/api/operations'
import RescheduleModal from './RescheduleModal'

interface DentalBooking {
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
  billAmount: number
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

export default function DentalBookingsTab() {
  const [bookings, setBookings] = useState<DentalBooking[]>([])
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
  const [selectedBookingForReschedule, setSelectedBookingForReschedule] = useState<DentalBooking | null>(null)

  const fetchBookings = useCallback(async () => {
    try {
      console.log('[DentalBookingsTab] Fetching bookings with filters:', filters)
      setLoading(true)

      const result = await operationsApi.getDentalBookings({
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

      console.log('[DentalBookingsTab] Fetched', result.data?.length || 0, 'bookings')
    } catch (error) {
      console.error('[DentalBookingsTab] Failed to fetch bookings:', error)
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
      console.log('[DentalBookingsTab] Confirming booking:', bookingId)
      await operationsApi.confirmDentalBooking(bookingId)
      fetchBookings()
    } catch (error) {
      console.error('[DentalBookingsTab] Failed to confirm booking:', error)
      alert('Failed to confirm booking. Please try again.')
    }
  }

  const handleCancel = async (bookingId: string) => {
    const reason = prompt('Please provide a reason for cancellation:')
    if (!reason) return

    try {
      console.log('[DentalBookingsTab] Cancelling booking:', bookingId, 'Reason:', reason)
      await operationsApi.cancelDentalBooking(bookingId, reason)
      fetchBookings()
    } catch (error) {
      console.error('[DentalBookingsTab] Failed to cancel booking:', error)
      alert('Failed to cancel booking. Please try again.')
    }
  }

  const handleMarkCompleted = async (bookingId: string) => {
    if (!confirm('Are you sure you want to mark this booking as completed? This will generate an invoice.')) return

    try {
      console.log('[DentalBookingsTab] Marking booking completed:', bookingId)
      await operationsApi.markDentalBookingCompleted(bookingId)
      alert('Booking marked as completed and invoice generated successfully!')
      fetchBookings()
    } catch (error) {
      console.error('[DentalBookingsTab] Failed to mark booking completed:', error)
      alert('Failed to mark booking as completed. Please try again.')
    }
  }

  const handleMarkNoShow = async (bookingId: string) => {
    if (!confirm('Are you sure you want to mark this booking as no-show?')) return

    try {
      console.log('[DentalBookingsTab] Marking booking no-show:', bookingId)
      await operationsApi.markDentalBookingNoShow(bookingId)
      fetchBookings()
    } catch (error) {
      console.error('[DentalBookingsTab] Failed to mark booking no-show:', error)
      alert('Failed to mark booking as no-show. Please try again.')
    }
  }

  const openRescheduleModal = (booking: DentalBooking) => {
    console.log('[DentalBookingsTab] Opening reschedule modal for:', booking.bookingId)
    setSelectedBookingForReschedule(booking)
    setRescheduleModalOpen(true)
  }

  const handleReschedule = async (
    bookingId: string,
    data: { slotId: string; appointmentDate: string; appointmentTime: string; reason: string }
  ) => {
    try {
      console.log('[DentalBookingsTab] Rescheduling booking:', bookingId, data)
      await operationsApi.rescheduleDentalBooking(bookingId, data)
      alert('Booking rescheduled successfully!')
      fetchBookings()
    } catch (error) {
      console.error('[DentalBookingsTab] Failed to reschedule booking:', error)
      alert('Failed to reschedule booking. Please try again.')
      throw error
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_CONFIRMATION':
        return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'NO_SHOW':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ')
  }

  const isAppointmentPast = (appointmentDate: string, appointmentTime: string) => {
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`)
    return appointmentDateTime < new Date()
  }

  const renderActionButtons = (booking: DentalBooking) => {
    if (booking.status === 'PENDING_CONFIRMATION') {
      return (
        <div className="flex gap-2">
          <button
            onClick={() => handleConfirm(booking.bookingId)}
            className="btn-primary text-sm"
          >
            Confirm
          </button>
          <button
            onClick={() => openRescheduleModal(booking)}
            className="btn-secondary text-sm"
          >
            Reschedule
          </button>
          <button
            onClick={() => handleCancel(booking.bookingId)}
            className="btn-secondary text-sm"
          >
            Cancel
          </button>
        </div>
      )
    }

    if (booking.status === 'CONFIRMED') {
      return (
        <div className="flex gap-2">
          <button
            onClick={() => handleMarkCompleted(booking.bookingId)}
            className="btn-primary text-sm"
          >
            Mark Completed
          </button>
          <button
            onClick={() => handleMarkNoShow(booking.bookingId)}
            className="btn-secondary text-sm"
          >
            Mark No-Show
          </button>
          <button
            onClick={() => handleCancel(booking.bookingId)}
            className="btn-secondary text-sm"
          >
            Cancel
          </button>
        </div>
      )
    }

    if (booking.status === 'COMPLETED') {
      return (
        <div className="flex gap-2">
          <button
            className="btn-secondary text-sm opacity-50 cursor-not-allowed"
            disabled
          >
            View Invoice
          </button>
        </div>
      )
    }

    return null
  }

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage })
  }

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    setPagination({ ...pagination, page: 1 })
  }

  const togglePaymentBreakdown = (bookingId: string) => {
    setExpandedBooking(expandedBooking === bookingId ? null : bookingId)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange({ ...filters, status: e.target.value })}
          className="input"
        >
          <option value="">All Statuses</option>
          <option value="PENDING_CONFIRMATION">Pending Confirmation</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="NO_SHOW">No Show</option>
        </select>

        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => handleFilterChange({ ...filters, dateFrom: e.target.value })}
          placeholder="From Date"
          className="input"
        />

        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => handleFilterChange({ ...filters, dateTo: e.target.value })}
          placeholder="To Date"
          className="input"
        />

        <input
          type="text"
          value={filters.searchTerm}
          onChange={(e) => handleFilterChange({ ...filters, searchTerm: e.target.value })}
          placeholder="Search patient name or booking ID"
          className="input"
        />
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent"></div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No dental bookings found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {bookings.map((booking) => (
            <div key={booking.bookingId} className="card">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {booking.bookingId}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                        {getStatusLabel(booking.status)}
                      </span>
                      {booking.invoiceGenerated && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                          Invoice Generated
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Patient:</span> {booking.patientName} ({booking.patientRelationship})
                      </div>
                      <div>
                        <span className="font-medium">Service:</span> {booking.serviceName}
                      </div>
                      <div>
                        <span className="font-medium">Clinic:</span> {booking.clinicName}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span> {new Date(booking.appointmentDate).toLocaleDateString('en-IN')}
                      </div>
                      <div>
                        <span className="font-medium">Time:</span> {booking.appointmentTime}
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span> {booking.duration} minutes
                      </div>
                    </div>
                  </div>

                  {renderActionButtons(booking)}
                </div>

                {/* Payment Breakdown Toggle */}
                <div className="border-t pt-3">
                  <button
                    onClick={() => togglePaymentBreakdown(booking.bookingId)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {expandedBooking === booking.bookingId ? '▼ Hide' : '▶ Show'} Payment Breakdown
                  </button>

                  {expandedBooking === booking.bookingId && (
                    <div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bill Amount:</span>
                        <span className="font-medium">₹{booking.billAmount.toFixed(2)}</span>
                      </div>
                      {booking.copayAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Copay Amount:</span>
                          <span className="font-medium">₹{booking.copayAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Insurance Payment (Wallet):</span>
                        <span className="font-medium">₹{booking.insurancePayment.toFixed(2)}</span>
                      </div>
                      {booking.excessAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Excess Amount:</span>
                          <span className="font-medium">₹{booking.excessAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-gray-300">
                        <span className="font-semibold">Total Member Payment:</span>
                        <span className="font-semibold text-green-600">₹{booking.totalMemberPayment.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 pt-2">
                        <span>Payment Method:</span>
                        <span>{booking.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Payment Status:</span>
                        <span>{booking.paymentStatus}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && bookings.length > 0 && (
        <div className="card">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} bookings
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let pageNumber;
                  if (pagination.pages <= 5) {
                    pageNumber = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNumber = i + 1;
                  } else if (pagination.page >= pagination.pages - 2) {
                    pageNumber = pagination.pages - 4 + i;
                  } else {
                    pageNumber = pagination.page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`px-3 py-2 border rounded-md text-sm font-medium ${
                        pagination.page === pageNumber
                          ? 'bg-green-600 text-white border-green-600'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      <RescheduleModal
        isOpen={rescheduleModalOpen}
        onClose={() => setRescheduleModalOpen(false)}
        booking={selectedBookingForReschedule}
        onReschedule={handleReschedule}
      />
    </div>
  )
}
