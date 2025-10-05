'use client'

import React, { useState, useEffect } from 'react'
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface TimeSlot {
  time: string
  available: boolean
  slotId?: string
}

interface DaySlot {
  date: string
  slots: TimeSlot[]
}

interface SlotSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  doctorId: string
  doctorName: string
  onSelectSlot: (date: string, time: string) => void
}

export default function SlotSelectionModal({
  isOpen,
  onClose,
  doctorId,
  doctorName,
  onSelectSlot
}: SlotSelectionModalProps) {
  const [loading, setLoading] = useState(true)
  const [availableSlots, setAvailableSlots] = useState<DaySlot[]>([])
  const [selectedDateIndex, setSelectedDateIndex] = useState(0)
  const [selectedTime, setSelectedTime] = useState('')

  useEffect(() => {
    if (isOpen && doctorId) {
      console.log('[SlotModal] Fetching slots for doctor:', doctorId)
      fetchAvailableSlots()
    }
  }, [isOpen, doctorId])

  const fetchAvailableSlots = async () => {
    try {
      const response = await fetch(`/api/doctors/${doctorId}/slots`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch slots')
      }

      const data = await response.json()
      console.log('[SlotModal] Slots received:', data)
      setAvailableSlots(data)
    } catch (error) {
      console.error('[SlotModal] Error fetching slots:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    if (!selectedTime || availableSlots.length === 0) {
      return
    }

    const selectedDate = availableSlots[selectedDateIndex].date
    console.log('[SlotModal] Slot selected:', { date: selectedDate, time: selectedTime })
    onSelectSlot(selectedDate, selectedTime)
    onClose()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center sm:items-center">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Select Time Slot</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-200">
              <p className="text-sm text-gray-600 mb-3">Doctor: {doctorName}</p>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedDateIndex(Math.max(0, selectedDateIndex - 1))}
                  disabled={selectedDateIndex === 0}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>

                <div className="flex-1 overflow-x-auto hide-scrollbar">
                  <div className="flex space-x-2">
                    {availableSlots.map((daySlot, index) => (
                      <button
                        key={daySlot.date}
                        onClick={() => {
                          setSelectedDateIndex(index)
                          setSelectedTime('')
                        }}
                        className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          index === selectedDateIndex
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <div className="text-center">
                          <div className="font-semibold">{formatDate(daySlot.date)}</div>
                          <div className="text-xs opacity-80">{daySlot.slots.length} slots</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedDateIndex(Math.min(availableSlots.length - 1, selectedDateIndex + 1))}
                  disabled={selectedDateIndex === availableSlots.length - 1}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {availableSlots.length > 0 && availableSlots[selectedDateIndex] && (
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots[selectedDateIndex].slots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => setSelectedTime(slot.time)}
                      disabled={!slot.available}
                      className={`py-3 px-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedTime === slot.time
                          ? 'bg-blue-600 text-white'
                          : slot.available
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}

              {availableSlots.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600">No slots available</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleConfirm}
                disabled={!selectedTime}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors"
              >
                Confirm Slot
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}