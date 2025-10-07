'use client'

import { useEffect, useState } from 'react'
import { getTodayAppointments } from '@/lib/api/appointments'
import { Appointment } from '@/lib/api/appointments'
import { getDoctorProfile } from '@/lib/api/auth'
import AppointmentCard from '@/components/AppointmentCard'
import {
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [doctorName, setDoctorName] = useState('Doctor')

  useEffect(() => {
    fetchDoctorProfile()
    fetchAppointments()
  }, [])

  const fetchDoctorProfile = async () => {
    try {
      const doctor = await getDoctorProfile()
      setDoctorName(doctor.name)
    } catch (err) {
      // Silently fail - keep default "Doctor"
      console.error('Failed to fetch doctor profile:', err)
    }
  }

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const response = await getTodayAppointments()
      setAppointments(response.appointments)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch appointments')
    } finally {
      setLoading(false)
    }
  }

  const stats = {
    total: appointments.length,
    confirmed: appointments.filter(a => a.status === 'CONFIRMED').length,
    completed: appointments.filter(a => a.status === 'COMPLETED').length,
    withPrescription: appointments.filter(a => a.hasPrescription).length,
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {doctorName}
        </h1>
        <div className="flex items-center text-gray-600">
          <CalendarDaysIcon className="h-5 w-5 mr-2" />
          <span>{today}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Appointments</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="h-12 w-12 bg-brand-100 rounded-lg flex items-center justify-center">
              <CalendarDaysIcon className="h-6 w-6 text-brand-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Confirmed</p>
              <p className="text-3xl font-bold text-blue-600">{stats.confirmed}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">With Prescription</p>
              <p className="text-3xl font-bold text-purple-600">{stats.withPrescription}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <UserGroupIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Today's Appointments
        </h2>
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointments.map((appointment) => (
            <AppointmentCard key={appointment._id} appointment={appointment} />
          ))}
        </div>
      )}
    </div>
  )
}
