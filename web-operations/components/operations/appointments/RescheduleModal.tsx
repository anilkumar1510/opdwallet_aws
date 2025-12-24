'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { apiFetch } from '@/lib/api'

interface RescheduleModalProps {
  isOpen: boolean
  onClose: () => void
  booking: {
    bookingId: string
    clinicId: string
    serviceCode: string
    serviceName: string
    patientName: string
    appointmentDate: string
    appointmentTime: string
  } | null
  onReschedule: (bookingId: string, data: {
    slotId: string
    appointmentDate: string
    appointmentTime: string
    reason: string
  }) => Promise<void>
}

interface TimeSlot {
  _id: string
  slotId: string
  startTime: string
  endTime: string
  maxAppointments: number
  currentBookings: number
  isAvailable: boolean
}

export default function RescheduleModal({ isOpen, onClose, booking, onReschedule }: RescheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlotId, setSelectedSlotId] = useState('') // The actual slot config ID for API
  const [selectedSlotUiId, setSelectedSlotUiId] = useState('') // The UI ID for tracking selection
  const [selectedTime, setSelectedTime] = useState('')
  const [reason, setReason] = useState('')
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen && booking) {
      // Reset form
      setSelectedDate('')
      setSelectedSlotId('')
      setSelectedSlotUiId('')
      setSelectedTime('')
      setReason('')
      setSlots([])
    }
  }, [isOpen, booking])

  useEffect(() => {
    if (selectedDate && booking) {
      fetchAvailableSlots()
    }
  }, [selectedDate, booking])

  const fetchAvailableSlots = async () => {
    if (!booking) return

    try {
      console.log('[RescheduleModal] Fetching slots for clinic:', booking.clinicId, 'Date:', selectedDate)
      setLoadingSlots(true)

      const response = await apiFetch(
        `/api/dental-bookings/slots?clinicId=${booking.clinicId}&date=${selectedDate}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch slots')
      }

      const data = await response.json()
      console.log('[RescheduleModal] Fetched slots:', data.slots?.length || 0)
      setSlots(data.slots || [])
    } catch (error) {
      console.error('[RescheduleModal] Error fetching slots:', error)
      alert('Failed to fetch available slots')
      setSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleSubmit = async () => {
    if (!booking || !selectedDate || !selectedSlotId || !selectedTime || !reason.trim()) {
      alert('Please fill in all fields')
      return
    }

    try {
      setSubmitting(true)
      console.log('[RescheduleModal] Rescheduling booking:', booking.bookingId)

      await onReschedule(booking.bookingId, {
        slotId: selectedSlotId,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        reason: reason.trim(),
      })

      onClose()
    } catch (error) {
      console.error('[RescheduleModal] Error rescheduling:', error)
      // Error already handled by parent
    } finally {
      setSubmitting(false)
    }
  }

  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  if (!isOpen || !booking) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Reschedule Booking</h2>
            <p className="text-sm text-gray-600 mt-1">Booking ID: {booking.bookingId}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Booking Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm font-semibold text-gray-700 mb-2">Current Booking</div>
            <div className="space-y-1 text-sm text-gray-600">
              <div><span className="font-medium">Patient:</span> {booking.patientName}</div>
              <div><span className="font-medium">Service:</span> {booking.serviceName}</div>
              <div><span className="font-medium">Current Date:</span> {new Date(booking.appointmentDate).toLocaleDateString('en-IN')}</div>
              <div><span className="font-medium">Current Time:</span> {booking.appointmentTime}</div>
            </div>
          </div>

          {/* New Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value)
                setSelectedSlotId('')
                setSelectedSlotUiId('')
                setSelectedTime('')
              }}
              min={getTodayDate()}
              className="input w-full"
            />
          </div>

          {/* Available Slots */}
          {selectedDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Time Slots <span className="text-red-500">*</span>
              </label>
              {loadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent"></div>
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No available slots for this date
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {slots.map((slot) => (
                    <button
                      key={slot._id}
                      onClick={() => {
                        setSelectedSlotId(slot.slotId) // Use the actual slot config ID for API
                        setSelectedSlotUiId(slot._id) // Use the UI ID for tracking selection
                        setSelectedTime(slot.startTime)
                      }}
                      disabled={!slot.isAvailable}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                        selectedSlotUiId === slot._id
                          ? 'border-green-600 bg-green-50 text-green-700'
                          : slot.isAvailable
                          ? 'border-gray-300 hover:border-green-400 text-gray-700'
                          : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <div>{slot.startTime} - {slot.endTime}</div>
                      <div className="text-xs mt-1">
                        {slot.isAvailable
                          ? `${slot.maxAppointments - slot.currentBookings} available`
                          : 'Fully booked'}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Rescheduling <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Enter reason for rescheduling..."
              className="input w-full"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 rounded-b-lg border-t border-gray-200">
          <button
            onClick={handleSubmit}
            disabled={!selectedDate || !selectedSlotId || !reason.trim() || submitting}
            className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {submitting ? 'Rescheduling...' : 'Confirm Reschedule'}
          </button>
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-6 py-3 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
