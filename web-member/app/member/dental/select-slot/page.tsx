'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CalendarIcon, ClockIcon } from '@heroicons/react/24/outline'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import DetailCard from '@/components/ui/DetailCard'
import CTAButton from '@/components/ui/CTAButton'

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
      router.push('/member/dental')
    }
  }, [clinicId, serviceCode, patientId, router])

  useEffect(() => {
    if (selectedDate) {
      fetchSlots(selectedDate)
    }
  }, [selectedDate])

  const fetchSlots = async (date: Date) => {
    console.log('[DentalSlotSelection] Fetching slots for date:', date.toISOString().split('T')[0])
    setLoading(true)
    setError('')
    setSelectedSlot(null)

    try {
      const dateString = date.toISOString().split('T')[0]
      const response = await fetch(
        `/api/dental-bookings/slots?clinicId=${clinicId}&date=${dateString}`,
        { credentials: 'include' }
      )

      if (response.ok) {
        const data = await response.json()
        console.log('[DentalSlotSelection] Slots fetched:', data.slots?.length || 0)
        setSlots(data.slots || [])

        if (data.slots.length === 0) {
          setError('No slots available for this date')
        }
      } else {
        console.error('[DentalSlotSelection] Failed to fetch slots:', response.status)
        setError('Failed to load slots. Please try again.')
      }
    } catch (err) {
      console.error('[DentalSlotSelection] Error fetching slots:', err)
      setError('Failed to load slots. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    if (!selectedSlot || !selectedDate) return

    console.log('[DentalSlotSelection] Selected slot:', {
      slotId: selectedSlot.slotId,
      date: selectedDate.toISOString().split('T')[0],
      time: selectedSlot.startTime
    })

    router.push(
      `/member/dental/confirm?clinicId=${clinicId}&serviceCode=${serviceCode}&patientId=${patientId}&slotId=${selectedSlot.slotId}&appointmentDate=${selectedDate.toISOString().split('T')[0]}&appointmentTime=${selectedSlot.startTime}`
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
    <div className="min-h-screen" style={{ background: '#f7f7fc' }}>
      <PageHeader
        title="Select Date & Time"
        subtitle="Choose a convenient slot for your appointment"
      />

      <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-6 lg:py-8">
        <div className="grid grid-cols-1 gap-4 lg:gap-5">
          {/* Calendar */}
          <DetailCard variant="primary">
            <h2
              className="text-base lg:text-lg font-semibold mb-4 flex items-center gap-2"
              style={{ color: '#0E51A2' }}
            >
              <CalendarIcon className="h-5 w-5 lg:h-6 lg:w-6" style={{ color: '#0F5FDC' }} />
              Select Date
            </h2>
            <div className="grid grid-cols-7 gap-1 lg:gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs lg:text-sm font-medium text-gray-500 py-1">
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
                    className="p-2 text-xs lg:text-sm rounded-lg transition-colors font-medium"
                    style={
                      isSelected
                        ? { background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)', color: 'white' }
                        : isToday
                        ? { background: '#EFF4FF', color: '#0F5FDC' }
                        : {}
                    }
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>
          </DetailCard>

          {/* Time Slots */}
          {!selectedDate ? (
            <EmptyState
              icon={CalendarIcon}
              title="Select a Date"
              message="Choose a date from the calendar to see available time slots"
            />
          ) : loading ? (
            <div className="flex items-center justify-center py-16">
              <div
                className="animate-spin rounded-full h-12 w-12 lg:h-14 lg:w-14 border-4 border-t-transparent"
                style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}
              ></div>
            </div>
          ) : error ? (
            <div
              className="p-4 lg:p-5 rounded-xl text-center text-sm lg:text-base"
              style={{ background: '#FEF1E7', border: '1px solid #F9B376' }}
            >
              <p style={{ color: '#E53535' }}>{error}</p>
            </div>
          ) : (
            <DetailCard variant="secondary">
              <h2
                className="text-base lg:text-lg font-semibold mb-4 flex items-center gap-2"
                style={{ color: '#0E51A2' }}
              >
                <ClockIcon className="h-5 w-5 lg:h-6 lg:w-6" style={{ color: '#0F5FDC' }} />
                {formatDate(selectedDate)}
              </h2>

              <div className="space-y-4 lg:space-y-5">
                {/* Morning Slots */}
                {morning.length > 0 && (
                  <div>
                    <h3 className="text-sm lg:text-base font-medium text-gray-700 mb-3">Morning</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3">
                      {morning.map((slot) => {
                        const isSelected = selectedSlot?.startTime === slot.startTime
                        return (
                          <button
                            key={slot.startTime}
                            onClick={() => slot.isAvailable && setSelectedSlot(slot)}
                            disabled={!slot.isAvailable}
                            className="p-2 lg:p-3 rounded-xl text-xs lg:text-sm font-semibold transition-all disabled:cursor-not-allowed"
                            style={
                              isSelected
                                ? { background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)', color: 'white', border: '2px solid #0F5FDC' }
                                : slot.isAvailable
                                ? { background: 'white', border: '2px solid #86ACD8', color: '#0E51A2' }
                                : { background: '#f3f4f6', border: '2px solid #e5e7eb', color: '#9ca3af' }
                            }
                          >
                            {slot.startTime}
                            {!slot.isAvailable && <div className="text-xs mt-1">Full</div>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Afternoon Slots */}
                {afternoon.length > 0 && (
                  <div>
                    <h3 className="text-sm lg:text-base font-medium text-gray-700 mb-3">Afternoon</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3">
                      {afternoon.map((slot) => {
                        const isSelected = selectedSlot?.startTime === slot.startTime
                        return (
                          <button
                            key={slot.startTime}
                            onClick={() => slot.isAvailable && setSelectedSlot(slot)}
                            disabled={!slot.isAvailable}
                            className="p-2 lg:p-3 rounded-xl text-xs lg:text-sm font-semibold transition-all disabled:cursor-not-allowed"
                            style={
                              isSelected
                                ? { background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)', color: 'white', border: '2px solid #0F5FDC' }
                                : slot.isAvailable
                                ? { background: 'white', border: '2px solid #86ACD8', color: '#0E51A2' }
                                : { background: '#f3f4f6', border: '2px solid #e5e7eb', color: '#9ca3af' }
                            }
                          >
                            {slot.startTime}
                            {!slot.isAvailable && <div className="text-xs mt-1">Full</div>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Evening Slots */}
                {evening.length > 0 && (
                  <div>
                    <h3 className="text-sm lg:text-base font-medium text-gray-700 mb-3">Evening</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3">
                      {evening.map((slot) => {
                        const isSelected = selectedSlot?.startTime === slot.startTime
                        return (
                          <button
                            key={slot.startTime}
                            onClick={() => slot.isAvailable && setSelectedSlot(slot)}
                            disabled={!slot.isAvailable}
                            className="p-2 lg:p-3 rounded-xl text-xs lg:text-sm font-semibold transition-all disabled:cursor-not-allowed"
                            style={
                              isSelected
                                ? { background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)', color: 'white', border: '2px solid #0F5FDC' }
                                : slot.isAvailable
                                ? { background: 'white', border: '2px solid #86ACD8', color: '#0E51A2' }
                                : { background: '#f3f4f6', border: '2px solid #e5e7eb', color: '#9ca3af' }
                            }
                          >
                            {slot.startTime}
                            {!slot.isAvailable && <div className="text-xs mt-1">Full</div>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </DetailCard>
          )}
        </div>

        {/* Continue Button */}
        <div className="mt-6">
          <CTAButton
            variant="primary"
            fullWidth
            onClick={handleContinue}
            disabled={!selectedSlot}
          >
            Continue
          </CTAButton>
        </div>
      </div>
    </div>
  )
}

export default function SelectSlotPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f7f7fc' }}>
        <div
          className="animate-spin rounded-full h-12 w-12 lg:h-14 lg:w-14 border-4 border-t-transparent"
          style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}
        ></div>
      </div>
    }>
      <SelectSlotContent />
    </Suspense>
  )
}
