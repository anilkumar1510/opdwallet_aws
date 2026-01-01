'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ChevronRightIcon,
  ChevronLeftIcon as ChevronLeftSmallIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import PageHeader from '@/components/ui/PageHeader'
import DetailCard from '@/components/ui/DetailCard'
import CTAButton from '@/components/ui/CTAButton'
import EmptyState from '@/components/ui/EmptyState'

interface TimeSlot {
  time: string
  available: boolean
  slotId?: string
}

interface DaySlot {
  date: Date
  dateStr: string
  dayName: string
  slots: TimeSlot[]
}

function SelectSlotContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const doctorId = searchParams.get('doctorId')
  const doctorName = searchParams.get('doctorName')
  const specialty = searchParams.get('specialty')
  const clinicId = searchParams.get('clinicId')
  const clinicName = searchParams.get('clinicName')
  const clinicAddress = searchParams.get('clinicAddress')
  const consultationFee = searchParams.get('consultationFee')
  const patientId = searchParams.get('patientId')
  const patientName = searchParams.get('patientName')

  const [loading, setLoading] = useState(true)
  const [daySlots, setDaySlots] = useState<DaySlot[]>([])
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [selectedSlotId, setSelectedSlotId] = useState<string>('')
  const [currentWeekStart, setCurrentWeekStart] = useState(0)

  const formatDate = (date: Date) => {
    const day = date.getDate()
    const month = date.toLocaleString('default', { month: 'short' })
    return `${day} ${month}`
  }

  const getDayName = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const compareDate = new Date(date)
    compareDate.setHours(0, 0, 0, 0)

    if (compareDate.getTime() === today.getTime()) return 'Today'

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (compareDate.getTime() === tomorrow.getTime()) return 'Tomorrow'

    return date.toLocaleString('default', { weekday: 'short' })
  }

  const fetchSlots = useCallback(async () => {
    try {
      console.log('[SelectSlot] Fetching slots for doctor:', { doctorId, clinicId })
      const response = await fetch(`/api/doctors/${doctorId}/slots?clinicId=${clinicId}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch slots')
      }

      const data = await response.json()
      console.log('[SelectSlot] Slots received:', { daysCount: data.length })

      const processedSlots: DaySlot[] = data.map((day: any) => ({
        date: new Date(day.date),
        dateStr: day.date,
        dayName: getDayName(new Date(day.date)),
        slots: day.slots
      }))

      setDaySlots(processedSlots)

      if (processedSlots.length > 0) {
        setSelectedDate(processedSlots[0].dateStr)
      }
    } catch (error) {
      console.error('[SelectSlot] Error fetching slots:', error)
    } finally {
      setLoading(false)
    }
  }, [doctorId, clinicId])

  useEffect(() => {
    fetchSlots()
  }, [doctorId, clinicId, fetchSlots])

  const handleDateSelect = (dateStr: string) => {
    console.log('[SelectSlot] Date selected:', dateStr)
    setSelectedDate(dateStr)
    setSelectedSlot('')
  }

  const handleSlotSelect = (time: string, slotId?: string) => {
    console.log('[SelectSlot] Time slot selected:', time, 'SlotId:', slotId)
    setSelectedSlot(time)
    // Generate slotId if not provided
    const generatedSlotId = slotId || `${doctorId}_${clinicId}_${selectedDate}_${time}`
    setSelectedSlotId(generatedSlotId)
  }

  const handleContinue = () => {
    if (!selectedDate || !selectedSlot) return

    console.log('[SelectSlot] Continuing to confirmation', {
      selectedDate,
      selectedSlot,
      selectedSlotId,
      doctorId,
      patientId
    })

    const params = new URLSearchParams({
      doctorId: doctorId || '',
      doctorName: doctorName || '',
      specialty: specialty || '',
      clinicId: clinicId || '',
      clinicName: clinicName || '',
      clinicAddress: clinicAddress || '',
      consultationFee: consultationFee || '',
      patientId: patientId || '',
      patientName: patientName || '',
      appointmentDate: selectedDate,
      timeSlot: selectedSlot,
      slotId: selectedSlotId || `${doctorId}_${clinicId}_${selectedDate}_${selectedSlot}`
    })

    router.push(`/member/appointments/confirm?${params.toString()}`)
  }

  const getVisibleDays = () => {
    return daySlots.slice(currentWeekStart, currentWeekStart + 5)
  }

  const handlePrevWeek = () => {
    if (currentWeekStart > 0) {
      setCurrentWeekStart(Math.max(0, currentWeekStart - 5))
    }
  }

  const handleNextWeek = () => {
    if (currentWeekStart + 5 < daySlots.length) {
      setCurrentWeekStart(currentWeekStart + 5)
    }
  }

  const selectedDaySlots = daySlots.find(day => day.dateStr === selectedDate)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f7f7fc' }}>
        <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f7fc' }}>
      <PageHeader
        title="Select Date & Time"
        subtitle={doctorName || 'Choose your appointment slot'}
      />

      <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-6 lg:py-8">
        <DetailCard variant="primary" className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2" style={{ color: '#0E51A2' }}>
              <CalendarIcon className="h-5 w-5 lg:h-6 lg:w-6" style={{ color: '#0F5FDC' }} />
              <span className="font-medium text-sm lg:text-base">Select Date</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrevWeek}
                disabled={currentWeekStart === 0}
                className={`p-1 rounded-lg transition-colors ${
                  currentWeekStart === 0
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'hover:bg-gray-100'
                }`}
                style={currentWeekStart === 0 ? {} : { color: '#0E51A2' }}
              >
                <ChevronLeftSmallIcon className="h-5 w-5" />
              </button>
              <button
                onClick={handleNextWeek}
                disabled={currentWeekStart + 5 >= daySlots.length}
                className={`p-1 rounded-lg transition-colors ${
                  currentWeekStart + 5 >= daySlots.length
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'hover:bg-gray-100'
                }`}
                style={currentWeekStart + 5 >= daySlots.length ? {} : { color: '#0E51A2' }}
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {getVisibleDays().map((day) => (
              <button
                key={day.dateStr}
                onClick={() => handleDateSelect(day.dateStr)}
                className={`flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-xl transition-all ${
                  selectedDate === day.dateStr
                    ? 'text-white shadow-md'
                    : 'hover:shadow-md'
                }`}
                style={
                  selectedDate === day.dateStr
                    ? { background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)' }
                    : { background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)', color: '#0E51A2' }
                }
              >
                <span className="text-xs lg:text-sm font-medium mb-1">{day.dayName}</span>
                <span className="text-sm lg:text-base font-semibold">{formatDate(day.date)}</span>
              </button>
            ))}
          </div>
        </DetailCard>

        {selectedDaySlots && (
          <DetailCard variant="secondary" className="mb-6">
            <h3 className="font-medium text-sm lg:text-base mb-4" style={{ color: '#0E51A2' }}>Available Time Slots</h3>

            {selectedDaySlots.slots.filter(s => s.available).length === 0 ? (
              <div className="text-center py-8">
                <EmptyState
                  icon={CalendarIcon}
                  title="No slots available"
                  message="Please select a different date"
                />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 lg:gap-3">
                {selectedDaySlots.slots.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => slot.available && handleSlotSelect(slot.time, slot.slotId)}
                    disabled={!slot.available}
                    className={`py-2 lg:py-3 px-3 rounded-xl text-xs lg:text-sm font-medium transition-all ${
                      selectedSlot === slot.time
                        ? 'text-white shadow-md'
                        : slot.available
                        ? 'hover:shadow-md'
                        : 'cursor-not-allowed opacity-50'
                    }`}
                    style={
                      selectedSlot === slot.time
                        ? { background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)' }
                        : slot.available
                        ? { background: 'linear-gradient(169.98deg, #EFF4FF 19.71%, #FEF3E9 66.63%, #FEF3E9 108.92%)', border: '1px solid #F7DCAF', color: '#0E51A2' }
                        : { background: '#f3f4f6', color: '#9ca3af' }
                    }
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}
          </DetailCard>
        )}

        <CTAButton
          onClick={handleContinue}
          disabled={!selectedDate || !selectedSlot}
          variant="primary"
          fullWidth
        >
          Continue
        </CTAButton>
      </div>
    </div>
  )
}

export default function SelectSlotPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f7f7fc' }}>
        <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}></div>
      </div>
    }>
      <SelectSlotContent />
    </Suspense>
  )
}