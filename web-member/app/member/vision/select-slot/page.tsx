'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeftIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline'
import { Card } from '@/components/ui/Card'

interface TimeSlot {
  slotId: string
  date: string
  startTime: string
  endTime: string
  isAvailable: boolean
  currentBookings: number
  maxAppointments: number
}

function SelectSlotContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const clinicId = searchParams.get('clinicId')
  const serviceCode = searchParams.get('serviceCode')
  const patientId = searchParams.get('patientId')

  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Generate next 30 days for calendar
  const generateCalendarDates = () => {
    const dates: Date[] = []
    const today = new Date()
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const [calendarDates] = useState(generateCalendarDates())

  useEffect(() => {
    if (!clinicId || !serviceCode || !patientId) {
      router.push('/member/vision')
    }
  }, [clinicId, serviceCode, patientId, router])

  useEffect(() => {
    if (selectedDate) {
      fetchSlots(selectedDate)
    }
  }, [selectedDate])

  const fetchSlots = async (date: Date) => {
    console.log('[VisionSlotSelection] Fetching slots for date:', date.toISOString().split('T')[0])
    setLoading(true)
    setError('')
    setSelectedSlot(null)

    try {
      const dateString = date.toISOString().split('T')[0]
      const response = await fetch(
        `/api/vision-bookings/slots?clinicId=${clinicId}&date=${dateString}`,
        { credentials: 'include' }
      )

      if (response.ok) {
        const data = await response.json()
        console.log('[VisionSlotSelection] Slots fetched:', data.slots?.length || 0)
        setSlots(data.slots || [])

        if (data.slots.length === 0) {
          setError('No slots available for this date')
        }
      } else {
        console.error('[VisionSlotSelection] Failed to fetch slots:', response.status)
        setError('Failed to load slots. Please try again.')
      }
    } catch (err) {
      console.error('[VisionSlotSelection] Error fetching slots:', err)
      setError('Failed to load slots. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    if (!selectedSlot || !selectedDate) return

    console.log('[VisionSlotSelection] Selected slot:', {
      slotId: selectedSlot.slotId,
      date: selectedDate.toISOString().split('T')[0],
      time: selectedSlot.startTime
    })

    router.push(
      `/member/vision/confirm?clinicId=${clinicId}&serviceCode=${serviceCode}&patientId=${patientId}&slotId=${selectedSlot.slotId}&appointmentDate=${selectedDate.toISOString().split('T')[0]}&appointmentTime=${selectedSlot.startTime}`
    )
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const groupSlotsByTime = (slots: TimeSlot[]) => {
    const morning: TimeSlot[] = []
    const afternoon: TimeSlot[] = []
    const evening: TimeSlot[] = []

    slots.forEach(slot => {
      const hour = parseInt(slot.startTime.split(':')[0])
      if (hour < 12) {
        morning.push(slot)
      } else if (hour < 17) {
        afternoon.push(slot)
      } else {
        evening.push(slot)
      }
    })

    return { morning, afternoon, evening }
  }

  const { morning, afternoon, evening } = groupSlotsByTime(slots)

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-flex items-center gap-1"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Select Date & Time</h1>
          <p className="text-gray-600 mt-2">Choose a convenient slot for your appointment</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-1">
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Select Date
                </h2>
                <div className="grid grid-cols-7 gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                      {day}
                    </div>
                  ))}
                  {/* Add empty cells for calendar alignment */}
                  {Array.from({ length: calendarDates[0].getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {calendarDates.map((date, index) => {
                    const isSelected = selectedDate?.toDateString() === date.toDateString()
                    const isToday = new Date().toDateString() === date.toDateString()
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedDate(date)}
                        className={`p-2 text-sm rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : isToday
                            ? 'bg-blue-100 text-blue-600'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {date.getDate()}
                      </button>
                    )
                  })}
                </div>
              </div>
            </Card>
          </div>

          {/* Time Slots */}
          <div className="lg:col-span-2">
            {!selectedDate ? (
              <Card className="text-center py-16">
                <div className="flex flex-col items-center">
                  <CalendarIcon className="h-16 w-16 text-gray-400 mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Select a Date</h2>
                  <p className="text-gray-600">
                    Choose a date from the calendar to see available time slots
                  </p>
                </div>
              </Card>
            ) : loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              </div>
            ) : error ? (
              <Card className="p-6">
                <div className="text-center py-8">
                  <p className="text-red-600">{error}</p>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <ClockIcon className="h-5 w-5" />
                    {formatDate(selectedDate)}
                  </h2>

                  <div className="space-y-6">
                    {/* Morning Slots */}
                    {morning.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Morning</h3>
                        <div className="grid grid-cols-3 gap-3">
                          {morning.map((slot) => (
                            <button
                              key={slot.startTime}
                              onClick={() => slot.isAvailable && setSelectedSlot(slot)}
                              disabled={!slot.isAvailable}
                              className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                                selectedSlot?.startTime === slot.startTime
                                  ? 'border-blue-600 bg-blue-50 text-blue-600'
                                  : slot.isAvailable
                                  ? 'border-gray-200 hover:border-blue-400'
                                  : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              {slot.startTime}
                              {!slot.isAvailable && <div className="text-xs mt-1">Full</div>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Afternoon Slots */}
                    {afternoon.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Afternoon</h3>
                        <div className="grid grid-cols-3 gap-3">
                          {afternoon.map((slot) => (
                            <button
                              key={slot.startTime}
                              onClick={() => slot.isAvailable && setSelectedSlot(slot)}
                              disabled={!slot.isAvailable}
                              className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                                selectedSlot?.startTime === slot.startTime
                                  ? 'border-blue-600 bg-blue-50 text-blue-600'
                                  : slot.isAvailable
                                  ? 'border-gray-200 hover:border-blue-400'
                                  : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              {slot.startTime}
                              {!slot.isAvailable && <div className="text-xs mt-1">Full</div>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Evening Slots */}
                    {evening.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Evening</h3>
                        <div className="grid grid-cols-3 gap-3">
                          {evening.map((slot) => (
                            <button
                              key={slot.startTime}
                              onClick={() => slot.isAvailable && setSelectedSlot(slot)}
                              disabled={!slot.isAvailable}
                              className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                                selectedSlot?.startTime === slot.startTime
                                  ? 'border-blue-600 bg-blue-50 text-blue-600'
                                  : slot.isAvailable
                                  ? 'border-gray-200 hover:border-blue-400'
                                  : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              {slot.startTime}
                              {!slot.isAvailable && <div className="text-xs mt-1">Full</div>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Continue Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleContinue}
            disabled={!selectedSlot}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-lg"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SelectSlotPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    }>
      <SelectSlotContent />
    </Suspense>
  )
}
