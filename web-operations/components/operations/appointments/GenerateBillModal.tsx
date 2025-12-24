'use client'

import { useState, useEffect } from 'react'
import { operationsApi } from '@/lib/api/operations'

interface VisionBooking {
  _id: string
  bookingId: string
  patientName: string
  serviceName: string
  clinicName: string
  appointmentDate: string
  appointmentTime: string
  servicePrice?: number
}

interface GenerateBillModalProps {
  isOpen: boolean
  onClose: () => void
  booking: VisionBooking | null
  onBillGenerated: () => Promise<void>
}

export default function GenerateBillModal({
  isOpen,
  onClose,
  booking,
  onBillGenerated,
}: GenerateBillModalProps) {
  const [servicePrice, setServicePrice] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && booking) {
      // Pre-fill with existing price if available
      setServicePrice(booking.servicePrice ? booking.servicePrice.toString() : '')
      setError('')
    }
  }, [isOpen, booking])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const priceNum = parseFloat(servicePrice)
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Please enter a valid service cost (must be 0 or greater)')
      return
    }

    if (!booking) return

    try {
      setLoading(true)
      console.log('[GenerateBillModal] Generating bill with price:', priceNum)

      await operationsApi.generateVisionBill(booking.bookingId, priceNum)

      console.log('[GenerateBillModal] Bill generated successfully')
      alert('Bill generated successfully!')

      // Call the success callback
      await onBillGenerated()

      // Reset form
      setServicePrice('')
      onClose()
    } catch (error: any) {
      console.error('[GenerateBillModal] Failed to generate bill:', error)
      setError(error.message || 'Failed to generate bill')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setServicePrice('')
      setError('')
      onClose()
    }
  }

  if (!isOpen || !booking) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 z-10">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Generate Bill for Vision Booking</h2>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-4">
          {/* Booking Info (Read-only) */}
          <div className="space-y-3 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Patient Name:</span>
                <span className="font-medium text-gray-900">{booking.patientName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Service:</span>
                <span className="font-medium text-gray-900">{booking.serviceName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Clinic:</span>
                <span className="font-medium text-gray-900">{booking.clinicName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Appointment:</span>
                <span className="font-medium text-gray-900">
                  {new Date(booking.appointmentDate).toLocaleDateString()} at {booking.appointmentTime}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Booking ID:</span>
                <span className="font-mono text-xs text-gray-700">{booking.bookingId}</span>
              </div>
            </div>
          </div>

          {/* Service Cost Input */}
          <div className="mb-6">
            <label htmlFor="servicePrice" className="block text-sm font-medium text-gray-700 mb-2">
              Service Cost (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="servicePrice"
              value={servicePrice}
              onChange={(e) => setServicePrice(e.target.value)}
              min="0"
              step="0.01"
              required
              placeholder="Enter service cost"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the actual service cost that the patient needs to pay
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Footer / Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !servicePrice || parseFloat(servicePrice) < 0}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Generating...
                </>
              ) : (
                'Generate Bill'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
