'use client'

import { useState, useRef, useEffect, memo } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from '@heroicons/react/24/outline'

interface DateInfo {
  date: string // YYYY-MM-DD
  dayName: string // Mon, Tue, etc
  dayNumber: number // 1-31
  month: string // Jan, Feb, etc
  isToday: boolean
  appointmentCount: number
}

interface DateRangePickerProps {
  selectedDate: string // YYYY-MM-DD
  onDateChange: (date: string) => void
  appointmentCounts: { [date: string]: number }
  onFetchMoreCounts?: () => Promise<void>
}

function DateRangePicker({ selectedDate, onDateChange, appointmentCounts, onFetchMoreCounts }: DateRangePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false)
  const [dateOffset, setDateOffset] = useState(0) // Offset in weeks from current week
  const [loadingMore, setLoadingMore] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)

  // Generate date range: 7 days back, today, 6 days ahead (total 14 days) + offset for navigation
  const generateDateRange = () => {
    const dates: DateInfo[] = []
    const today = new Date()

    // Calculate base offset in days (each arrow click moves by 7 days)
    const baseOffset = dateOffset * 7

    // Show 14 days total: 7 back from offset center, 6 ahead
    for (let i = -7; i <= 6; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + baseOffset + i)

      const dateStr = date.toISOString().split('T')[0]
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
      const dayNumber = date.getDate()
      const month = date.toLocaleDateString('en-US', { month: 'short' })

      // Check if this is today (ignore offset for this check)
      const checkToday = new Date()
      const isToday = dateStr === checkToday.toISOString().split('T')[0]

      dates.push({
        date: dateStr,
        dayName,
        dayNumber,
        month,
        isToday,
        appointmentCount: appointmentCounts[dateStr] || 0
      })
    }

    return dates
  }

  const dates = generateDateRange()

  // Scroll to selected date when it changes or when dates regenerate
  useEffect(() => {
    if (selectedRef.current && scrollRef.current) {
      selectedRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [selectedDate, dateOffset])

  // Fetch counts when offset changes (new week loaded)
  useEffect(() => {
    if (dateOffset !== 0 && onFetchMoreCounts) {
      setLoadingMore(true)
      onFetchMoreCounts().finally(() => setLoadingMore(false))
    }
  }, [dateOffset])

  const scrollLeft = async () => {
    // Navigate to previous week
    setDateOffset(prev => prev - 1)
  }

  const scrollRight = async () => {
    // Navigate to next week
    setDateOffset(prev => prev + 1)
  }

  const handleManualDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value
    if (date) {
      onDateChange(date)
      setShowCalendar(false)
    }
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Select Date</h3>
        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium"
        >
          <CalendarIcon className="h-4 w-4" />
          Pick Date
        </button>
      </div>

      {showCalendar && (
        <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select a date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={handleManualDateSelect}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
      )}

      <div className="relative">
        {/* Left scroll button */}
        <button
          onClick={scrollLeft}
          disabled={loadingMore}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-2 hover:bg-gray-50 border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous week"
        >
          {loadingMore ? (
            <div className="h-4 w-4 rounded-full border-2 border-gray-300 border-t-brand-600 animate-spin" />
          ) : (
            <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
          )}
        </button>

        {/* Scrollable date container */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-10 py-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {dates.map((dateInfo) => {
            const isSelected = dateInfo.date === selectedDate

            return (
              <button
                key={dateInfo.date}
                ref={isSelected ? selectedRef : null}
                onClick={() => onDateChange(dateInfo.date)}
                className={`
                  flex-shrink-0 w-24 p-3 rounded-xl border-2 transition-all
                  ${isSelected
                    ? 'border-brand-600 bg-brand-50 shadow-md'
                    : dateInfo.isToday
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }
                `}
              >
                <div className="text-center">
                  <p className={`text-xs font-medium mb-1 ${
                    isSelected ? 'text-brand-700' : dateInfo.isToday ? 'text-blue-700' : 'text-gray-500'
                  }`}>
                    {dateInfo.dayName}
                  </p>
                  <p className={`text-2xl font-bold mb-1 ${
                    isSelected ? 'text-brand-600' : dateInfo.isToday ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {dateInfo.dayNumber}
                  </p>
                  <p className={`text-xs mb-2 ${
                    isSelected ? 'text-brand-600' : dateInfo.isToday ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {dateInfo.month}
                  </p>

                  {/* Appointment count badge */}
                  {dateInfo.appointmentCount > 0 && (
                    <div className={`
                      inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium
                      ${isSelected
                        ? 'bg-brand-600 text-white'
                        : dateInfo.isToday
                        ? 'bg-blue-600 text-white'
                        : 'bg-green-100 text-green-700'
                      }
                    `}>
                      {dateInfo.appointmentCount} apt{dateInfo.appointmentCount !== 1 ? 's' : ''}
                    </div>
                  )}

                  {dateInfo.isToday && (
                    <p className="text-xs text-blue-600 font-medium mt-1">Today</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Right scroll button */}
        <button
          onClick={scrollRight}
          disabled={loadingMore}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-2 hover:bg-gray-50 border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next week"
        >
          {loadingMore ? (
            <div className="h-4 w-4 rounded-full border-2 border-gray-300 border-t-brand-600 animate-spin" />
          ) : (
            <ChevronRightIcon className="h-4 w-4 text-gray-600" />
          )}
        </button>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}

export default memo(DateRangePicker)
