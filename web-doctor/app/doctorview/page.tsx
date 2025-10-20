'use client'

import { useEffect, useState, useCallback } from 'react'
import { getTodayAppointments, getAppointmentsByDate, getAppointmentCounts } from '@/lib/api/appointments'
import { Appointment } from '@/lib/api/appointments'
import { getDoctorProfile } from '@/lib/api/auth'
import AppointmentCard from '@/components/AppointmentCard'
import DateRangePicker from '@/components/DateRangePicker'
import ErrorBoundary from '@/components/ErrorBoundary'
import {
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline'

type StatusFilter = 'ALL' | 'CONFIRMED' | 'COMPLETED' | 'PENDING_CONFIRMATION' | 'CANCELLED'

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [doctorName, setDoctorName] = useState('Doctor')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [appointmentCounts, setAppointmentCounts] = useState<{ [date: string]: number }>({})

  const fetchDoctorProfile = useCallback(async () => {
    console.group('👤 [DOCTOR PROFILE] Fetch Started')
    console.log('⏰ Timestamp:', new Date().toISOString())
    console.log('🌐 Current URL:', window.location.href)
    console.log('🍪 Document cookies:', document.cookie || 'NONE')

    try {
      console.log('📡 [DOCTOR PROFILE] Calling getDoctorProfile API...')
      const doctor = await getDoctorProfile()
      console.log('✅ [DOCTOR PROFILE] Success! Doctor data:', JSON.stringify(doctor, null, 2))
      setDoctorName(doctor.name)
      console.groupEnd()
    } catch (err: any) {
      console.error('❌ [DOCTOR PROFILE] Failed to fetch profile')
      console.error('❌ Error type:', err?.constructor?.name)
      console.error('❌ Error message:', err?.message)
      console.error('❌ Error stack:', err?.stack)
      console.error('❌ Full error object:', err)
      console.groupEnd()
    }
  }, [])

  const fetchAppointmentCounts = useCallback(async () => {
    console.group('📊 [APPOINTMENT COUNTS] Fetch Started')
    console.log('⏰ Timestamp:', new Date().toISOString())
    console.log('🌐 Current URL:', window.location.href)

    try {
      console.log('📡 [APPOINTMENT COUNTS] Calling getAppointmentCounts API...')
      const fetchStartTime = Date.now()
      const response = await getAppointmentCounts()
      const fetchDuration = Date.now() - fetchStartTime
      console.log(`✅ [APPOINTMENT COUNTS] Success! Took ${fetchDuration}ms`)
      console.log('📦 [APPOINTMENT COUNTS] Response:', JSON.stringify(response, null, 2))
      console.log('📦 [APPOINTMENT COUNTS] Counts:', response.counts)
      setAppointmentCounts(response.counts)
      console.groupEnd()
    } catch (err: any) {
      console.error('❌ [APPOINTMENT COUNTS] Failed to fetch')
      console.error('❌ Error type:', err?.constructor?.name)
      console.error('❌ Error message:', err?.message)
      console.error('❌ Error stack:', err?.stack)
      console.error('❌ Full error object:', err)
      console.groupEnd()
    }
  }, [])

  const fetchAppointments = useCallback(async (retryCount = 0) => {
    console.group('📅 [APPOINTMENTS] Fetch Started')
    console.log('⏰ Timestamp:', new Date().toISOString())
    console.log('📆 Selected Date:', selectedDate)
    console.log('🔄 Retry Count:', retryCount)
    console.log('🌐 Current URL:', window.location.href)
    console.log('🍪 Document cookies:', document.cookie || 'NONE')

    try {
      setLoading(true)
      setError('')
      console.log('📡 [APPOINTMENTS] Calling getAppointmentsByDate API...')
      const fetchStartTime = Date.now()
      const response = await getAppointmentsByDate(selectedDate)
      const fetchDuration = Date.now() - fetchStartTime
      console.log(`✅ [APPOINTMENTS] Success! Took ${fetchDuration}ms`)
      console.log('📦 [APPOINTMENTS] Response:', JSON.stringify(response, null, 2))
      console.log('📦 [APPOINTMENTS] Appointments count:', response.appointments?.length || 0)
      setAppointments(response.appointments)

      // Refresh counts after fetching appointments
      console.log('🔄 [APPOINTMENTS] Refreshing appointment counts...')
      await fetchAppointmentCounts()
      console.groupEnd()
    } catch (err: any) {
      console.error('❌ [APPOINTMENTS] Failed to fetch')
      console.error('❌ Error type:', err?.constructor?.name)
      console.error('❌ Error message:', err?.message)
      console.error('❌ Error stack:', err?.stack)
      console.error('❌ Full error object:', err)

      // Retry once if it's a network/timeout error
      if (retryCount === 0 && (err.message.includes('timeout') || err.message.includes('fetch'))) {
        console.log('🔄 [APPOINTMENTS] Retrying fetch after error:', err.message)
        console.groupEnd()
        setTimeout(() => fetchAppointments(1), 1000)
        return
      }
      setError(err.message || 'Failed to fetch appointments')
      console.groupEnd()
    } finally {
      setLoading(false)
    }
  }, [selectedDate, fetchAppointmentCounts])

  useEffect(() => {
    fetchDoctorProfile()
    fetchAppointmentCounts()
  }, [fetchDoctorProfile, fetchAppointmentCounts])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
  }

  const filteredAppointments = appointments.filter(apt => {
    if (statusFilter === 'ALL') return true
    return apt.status === statusFilter
  })

  const stats = {
    total: appointments.length,
    confirmed: appointments.filter(a => a.status === 'CONFIRMED').length,
    completed: appointments.filter(a => a.status === 'COMPLETED').length,
    pending: appointments.filter(a => a.status === 'PENDING_CONFIRMATION').length,
    cancelled: appointments.filter(a => a.status === 'CANCELLED').length,
    withPrescription: appointments.filter(a => a.hasPrescription).length,
  }

  const filterButtons = [
    { label: 'All', value: 'ALL' as StatusFilter, count: stats.total, color: 'gray' },
    { label: 'Confirmed', value: 'CONFIRMED' as StatusFilter, count: stats.confirmed, color: 'blue' },
    { label: 'Completed', value: 'COMPLETED' as StatusFilter, count: stats.completed, color: 'green' },
    { label: 'Pending', value: 'PENDING_CONFIRMATION' as StatusFilter, count: stats.pending, color: 'yellow' },
    { label: 'Cancelled', value: 'CANCELLED' as StatusFilter, count: stats.cancelled, color: 'red' },
  ]

  const selectedDateFormatted = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <ErrorBoundary>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {doctorName}
        </h1>
      </div>

      {/* Date Range Picker */}
      <DateRangePicker
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        appointmentCounts={appointmentCounts}
        onFetchMoreCounts={fetchAppointmentCounts}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <CalendarDaysIcon className="h-5 w-5 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Confirmed</p>
              <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
            </div>
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <ExclamationCircleIcon className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Cancelled</p>
              <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
            </div>
            <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircleIcon className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Appointments
            </h2>
            <p className="text-sm text-gray-600 mt-1">{selectedDateFormatted}</p>
          </div>
          <button
            onClick={fetchAppointments}
            className="text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            Refresh
          </button>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {filterButtons.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all
                ${statusFilter === filter.value
                  ? filter.color === 'gray' ? 'bg-gray-900 text-white'
                  : filter.color === 'blue' ? 'bg-blue-600 text-white'
                  : filter.color === 'green' ? 'bg-green-600 text-white'
                  : filter.color === 'yellow' ? 'bg-yellow-600 text-white'
                  : filter.color === 'red' ? 'bg-red-600 text-white'
                  : 'bg-gray-900 text-white'
                  : filter.color === 'gray' ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : filter.color === 'blue' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  : filter.color === 'green' ? 'bg-green-50 text-green-700 hover:bg-green-100'
                  : filter.color === 'yellow' ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                  : filter.color === 'red' ? 'bg-red-50 text-red-700 hover:bg-red-100'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-12 card">
          <CalendarDaysIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No appointments today
          </h3>
          <p className="text-gray-600">
            You have no scheduled appointments for today.
          </p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="text-center py-12 card">
          <CalendarDaysIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No {statusFilter.toLowerCase().replace('_', ' ')} appointments
          </h3>
          <p className="text-gray-600">
            You have no {statusFilter.toLowerCase().replace('_', ' ')} appointments for today.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment._id}
              appointment={appointment}
              onUpdate={fetchAppointments}
            />
          ))}
        </div>
      )}
    </div>
    </ErrorBoundary>
  )
}
