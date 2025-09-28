'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

interface TimeSlot {
  time: string
  available: boolean
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
  const [currentWeekStart, setCurrentWeekStart] = useState(0)

  useEffect(() => {
    fetchSlots()
  }, [doctorId, clinicId])

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

  const fetchSlots = async () => {
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
  }

  const handleDateSelect = (dateStr: string) => {
    console.log('[SelectSlot] Date selected:', dateStr)
    setSelectedDate(dateStr)
    setSelectedSlot('')
  }

  const handleSlotSelect = (time: string) => {
    console.log('[SelectSlot] Time slot selected:', time)
    setSelectedSlot(time)
  }

  const handleContinue = () => {
    if (!selectedDate || !selectedSlot) return

    console.log('[SelectSlot] Continuing to confirmation', {
      selectedDate,
      selectedSlot,
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
      timeSlot: selectedSlot
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Select Date & Time</h1>
              <p className="text-sm text-gray-600">{doctorName}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 text-gray-900">
              <CalendarIcon className="h-5 w-5" />
              <span className="font-medium">Select Date</span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handlePrevWeek}
                disabled={currentWeekStart === 0}
                className={`p-1 rounded-lg ${
                  currentWeekStart === 0
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button
                onClick={handleNextWeek}
                disabled={currentWeekStart + 5 >= daySlots.length}
                className={`p-1 rounded-lg ${
                  currentWeekStart + 5 >= daySlots.length
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex space-x-2 overflow-x-auto">
            {getVisibleDays().map((day) => (
              <button
                key={day.dateStr}
                onClick={() => handleDateSelect(day.dateStr)}
                className={`flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-xl transition-all ${
                  selectedDate === day.dateStr
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="text-xs font-medium mb-1">{day.dayName}</span>
                <span className="text-sm font-semibold">{formatDate(day.date)}</span>
              </button>
            ))}
          </div>
        </div>

        {selectedDaySlots && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
            <h3 className="font-medium text-gray-900 mb-4">Available Time Slots</h3>

            {selectedDaySlots.slots.filter(s => s.available).length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                No slots available for this date
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {selectedDaySlots.slots.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => slot.available && handleSlotSelect(slot.time)}
                    disabled={!slot.available}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      selectedSlot === slot.time
                        ? 'bg-blue-600 text-white shadow-md'
                        : slot.available
                        ? 'bg-gray-50 text-gray-900 hover:bg-gray-100 border border-gray-200'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleContinue}
          disabled={!selectedDate || !selectedSlot}
          className={`w-full py-3 px-4 rounded-xl font-medium transition-colors ${
            selectedDate && selectedSlot
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  )
}

export default function SelectSlotPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
      </div>
    }>
      <SelectSlotContent />
    </Suspense>
  )
}