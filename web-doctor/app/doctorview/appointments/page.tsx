'use client'

import { useEffect, useState } from 'react'
import { getUpcomingAppointments } from '@/lib/api/appointments'
import { Appointment } from '@/lib/api/appointments'
import AppointmentCard from '@/components/AppointmentCard'
import {
  CalendarDaysIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline'

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    console.group('📅 [AppointmentsPage] Fetch Appointments')
    console.log('⏰ Timestamp:', new Date().toISOString())
    console.log('🌐 Current URL:', window.location.href)
    console.log('🍪 Document cookies:', document.cookie || 'NONE')

    try {
      setLoading(true)
      setError('')

      console.log('📡 [AppointmentsPage] Calling getUpcomingAppointments(50)...')
      const fetchStart = Date.now()
      const response = await getUpcomingAppointments(50)
      const fetchDuration = Date.now() - fetchStart

      console.log(`✅ [AppointmentsPage] Success! Took ${fetchDuration}ms`)
      console.log('📦 [AppointmentsPage] Response:', JSON.stringify(response, null, 2))
      console.log('📊 [AppointmentsPage] Appointments count:', response.appointments?.length || 0)
      console.log('📊 [AppointmentsPage] Total from API:', response.total)

      if (response.appointments && response.appointments.length > 0) {
        console.log('👥 [AppointmentsPage] First appointment:', JSON.stringify(response.appointments[0], null, 2))
      } else {
        console.warn('⚠️ [AppointmentsPage] No appointments received!')
      }

      setAppointments(response.appointments)
      console.groupEnd()
    } catch (err: any) {
      console.error('❌ [AppointmentsPage] Failed to fetch appointments')
      console.error('❌ Error type:', err?.constructor?.name)
      console.error('❌ Error message:', err?.message)
      console.error('❌ Error stack:', err?.stack)
      console.error('❌ Full error object:', err)
      console.groupEnd()

      setError(err.message || 'Failed to fetch appointments')
    } finally {
      setLoading(false)
    }
  }

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'all') return true
    if (filter === 'confirmed') return apt.status === 'CONFIRMED'
    if (filter === 'completed') return apt.status === 'COMPLETED'
    if (filter === 'pending') return apt.status === 'PENDING_CONFIRMATION'
    return true
  })

  const stats = {
    total: appointments.length,
    confirmed: appointments.filter(a => a.status === 'CONFIRMED').length,
    completed: appointments.filter(a => a.status === 'COMPLETED').length,
    pending: appointments.filter(a => a.status === 'PENDING_CONFIRMATION').length,
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          All Appointments
        </h1>
        <p className="text-gray-600">
          View and manage all your upcoming appointments
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Total</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>

        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Confirmed</p>
          <p className="text-3xl font-bold text-blue-600">{stats.confirmed}</p>
        </div>

        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Completed</p>
          <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
        </div>

        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Pending</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Appointments</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <button
          onClick={fetchAppointments}
          className="text-sm text-brand-600 hover:text-brand-700 font-medium"
        >
          Refresh
        </button>
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
      ) : filteredAppointments.length === 0 ? (
        <div className="text-center py-12 card">
          <CalendarDaysIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No appointments found
          </h3>
          <p className="text-gray-600">
            {filter === 'all'
              ? 'You have no upcoming appointments.'
              : `You have no ${filter} appointments.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAppointments.map((appointment) => (
            <AppointmentCard key={appointment._id} appointment={appointment} />
          ))}
        </div>
      )}
    </div>
  )
}
