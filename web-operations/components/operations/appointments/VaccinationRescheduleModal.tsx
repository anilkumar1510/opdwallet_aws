'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { operationsApi } from '@/lib/api/operations'

interface VaccinationRescheduleModalProps {
  isOpen: boolean
  onClose: () => void
  booking: {
    bookingId: string
    vendorId: string
    vendorName: string
    pincode: string
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
  slotId: string
  startTime: string
  endTime: string
  maxAppointments: number
  currentBookings: number
  isAvailable: boolean
}

export default function VaccinationRescheduleModal({ isOpen, onClose, booking, onReschedule }: VaccinationRescheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlotId, setSelectedSlotId] = useState('')
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
      console.log('[VaccinationRescheduleModal] Fetching slots for vendor:', booking.vendorId, 'pincode:', booking.pincode, 'Date:', selectedDate)
      setLoadingSlots(true)

      const data = await operationsApi.getVaccinationSlots(booking.vendorId, booking.pincode, selectedDate)
      console.log('[VaccinationRescheduleModal] Fetched slots:', data.slots?.length || 0)
      setSlots(data.slots || [])
    } catch (error) {
      console.error('[VaccinationRescheduleModal] Error fetching slots:', error)
      alert('Failed to fetch available slots')
      setSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlotId(slot.slotId)
    setSelectedTime(slot.startTime)
  }

  const handleSubmit = async () => {
    if (!booking || !selectedDate || !selectedSlotId || !selectedTime || !reason.trim()) {
      alert('Please fill in all fields')
      return
    }

    try {
      setSubmitting(true)
      console.log('[VaccinationRescheduleModal] Rescheduling booking:', booking.bookingId)

      await onReschedule(booking.bookingId, {
        slotId: selectedSlotId,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        reason: reason.trim(),
      })

      onClose()
    } catch (error) {
      console.error('[VaccinationRescheduleModal] Error rescheduling:', error)
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
            <h2 className="text-xl font-bold text-gray-900">Reschedule Vaccination Booking</h2>
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
              <div><span className="font-medium">Vendor:</span> {booking.vendorName}</div>
              <div><span className="font-medium">Current Date:</span> {new Date(booking.appointmentDate).toLocaleDateString('en-IN')}</div>
              <div><span className="font-medium">Current Time:</span> {booking.appointmentTime}</div>
            </div>
          </div>

          {/* New Date Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select New Date
            </label>
            <input
              type="date"
              min={getTodayDate()}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input w-full"
            />
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select New Time Slot
              </label>

              {loadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-500 border-t-transparent"></div>
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  No available slots for this date
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.slotId}
                      onClick={() => slot.isAvailable && handleSlotSelect(slot)}
                      disabled={!slot.isAvailable}
                      className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                        selectedSlotId === slot.slotId
                          ? 'bg-green-600 text-white'
                          : slot.isAvailable
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {slot.startTime}
                      {!slot.isAvailable && (
                        <span className="block text-xs">Booked</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Reason for Rescheduling
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason for rescheduling..."
              rows={3}
              className="input w-full"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedDate || !selectedSlotId || !reason.trim() || submitting}
              className="btn-primary"
            >
              {submitting ? 'Rescheduling...' : 'Reschedule Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
