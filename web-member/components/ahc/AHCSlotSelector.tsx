'use client'

import { useState, useEffect } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { toast } from 'sonner'

interface Slot {
  _id: string
  slotId: string
  timeSlot: string
  startTime: string
  endTime: string
  maxBookings: number
  currentBookings: number
  isAvailable: boolean
}

interface AHCSlotSelectorProps {
  vendorId: string
  vendorType: 'lab' | 'diagnostic'
  pincode: string
  onSlotSelect: (slotId: string, date: string, time: string) => void
  selectedSlotId?: string
}

export function AHCSlotSelector({ vendorId, vendorType, pincode, onSlotSelect, selectedSlotId }: AHCSlotSelectorProps) {
  const [dates, setDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)
  const [dateIndex, setDateIndex] = useState(0)

  useEffect(() => {
    // Generate next 7 days
    const nextDates: string[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      nextDates.push(date.toISOString().split('T')[0])
    }
    setDates(nextDates)
    setSelectedDate(nextDates[0])
  }, [])

  useEffect(() => {
    if (selectedDate && vendorId) {
      fetchSlots(selectedDate)
    }
  }, [selectedDate, vendorId])

  const fetchSlots = async (date: string) => {
    try {
      setLoading(true)
      const endpoint = vendorType === 'lab'
        ? `/api/member/lab/vendors/${vendorId}/slots?pincode=${pincode}&date=${date}`
        : `/api/member/diagnostics/vendors/${vendorId}/slots?pincode=${pincode}&date=${date}`

      const response = await fetch(endpoint, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch slots')
      }

      const data = await response.json()
      setSlots(data.data || [])
    } catch (error) {
      console.error('Error fetching slots:', error)
      toast.error('Failed to load available slots')
      setSlots([])
    } finally {
      setLoading(false)
    }
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
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    }
  }

  const handlePrevDates = () => {
    if (dateIndex > 0) {
      setDateIndex(dateIndex - 1)
    }
  }

  const handleNextDates = () => {
    if (dateIndex < dates.length - 3) {
      setDateIndex(dateIndex + 1)
    }
  }

  const visibleDates = dates.slice(dateIndex, dateIndex + 3)

  return (
    <div className="space-y-4">
      {/* Date Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <CalendarIcon className="w-4 h-4 inline mr-1" />
          Select Date
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDates}
            disabled={dateIndex === 0}
            className="p-2 rounded-lg border border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>

          <div className="flex-1 grid grid-cols-3 gap-2">
            {visibleDates.map((date) => (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`
                  py-3 px-2 rounded-lg border-2 transition-all text-sm font-medium
                  ${selectedDate === date
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <div className="text-xs">{formatDate(date)}</div>
                <div className="text-xs opacity-70">
                  {new Date(date).toLocaleDateString('en-IN', { weekday: 'short' })}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleNextDates}
            disabled={dateIndex >= dates.length - 3}
            className="p-2 rounded-lg border border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Time Slots */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Time Slot
        </label>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No slots available for this date
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {slots.map((slot) => {
              const isSelected = selectedSlotId === slot.slotId
              const isAvailable = slot.currentBookings < slot.maxBookings

              return (
                <button
                  key={slot.slotId}
                  onClick={() => {
                    if (isAvailable) {
                      onSlotSelect(slot.slotId, selectedDate, slot.timeSlot)
                    }
                  }}
                  disabled={!isAvailable}
                  className={`
                    py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all
                    ${isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : isAvailable
                      ? 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  <div>{slot.timeSlot}</div>
                  {!isAvailable && (
                    <div className="text-xs mt-1 text-red-500">Full</div>
                  )}
                  {isAvailable && slot.maxBookings - slot.currentBookings <= 3 && (
                    <div className="text-xs mt-1 text-orange-500">
                      {slot.maxBookings - slot.currentBookings} left
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
