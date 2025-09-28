'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [specialties, setSpecialties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    specialty: '',
    includeOld: false,
  })

  useEffect(() => {
    fetchSpecialties()
    fetchAppointments()
  }, [])

  useEffect(() => {
    fetchAppointments()
  }, [filters])

  const fetchSpecialties = async () => {
    try {
      const response = await apiFetch('/api/specialties')
      if (response.ok) {
        const data = await response.json()
        setSpecialties(data)
      }
    } catch (error) {
      console.error('Failed to fetch specialties:', error)
    }
  }

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.specialty) params.append('specialty', filters.specialty)
      if (filters.includeOld) params.append('includeOld', 'true')

      const response = await apiFetch(`/api/appointments?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setAppointments(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const confirmAppointment = async (appointmentId: string) => {
    try {
      const response = await apiFetch(`/api/appointments/${appointmentId}/confirm`, {
        method: 'PATCH',
      })

      if (response.ok) {
        fetchAppointments()
      }
    } catch (error) {
      console.error('Failed to confirm appointment:', error)
    }
  }

  const cancelAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return

    try {
      const response = await apiFetch(`/api/appointments/${appointmentId}/cancel`, {
        method: 'PATCH',
      })

      if (response.ok) {
        fetchAppointments()
      }
    } catch (error) {
      console.error('Failed to cancel appointment:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_CONFIRMATION':
        return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="input md:w-64"
        >
          <option value="">All Statuses</option>
          <option value="PENDING_CONFIRMATION">Pending Confirmation</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select
          value={filters.specialty}
          onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
          className="input md:w-64"
        >
          <option value="">All Specialties</option>
          {specialties.map((spec) => (
            <option key={spec.specialtyId} value={spec.specialtyId}>
              {spec.name}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters.includeOld}
            onChange={(e) => setFilters({ ...filters, includeOld: e.target.checked })}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Show old appointments</span>
        </label>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent"></div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No appointments found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {appointments.map((appointment) => (
            <div key={appointment.appointmentId} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {appointment.appointmentId}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                      {getStatusLabel(appointment.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Patient:</span> {appointment.patientName}
                    </div>
                    <div>
                      <span className="font-medium">Doctor:</span> {appointment.doctorName}
                    </div>
                    <div>
                      <span className="font-medium">Specialty:</span> {appointment.specialty}
                    </div>
                    <div>
                      <span className="font-medium">Type:</span> {appointment.appointmentType}
                    </div>
                    <div>
                      <span className="font-medium">Date:</span> {appointment.appointmentDate}
                    </div>
                    <div>
                      <span className="font-medium">Time:</span> {appointment.timeSlot}
                    </div>
                    {appointment.clinicName && (
                      <div className="md:col-span-2">
                        <span className="font-medium">Clinic:</span> {appointment.clinicName}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {appointment.status === 'PENDING_CONFIRMATION' && (
                    <>
                      <button
                        onClick={() => confirmAppointment(appointment.appointmentId)}
                        className="btn-primary text-sm"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => cancelAppointment(appointment.appointmentId)}
                        className="btn-secondary text-sm"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {appointment.status === 'CONFIRMED' && (
                    <button
                      onClick={() => cancelAppointment(appointment.appointmentId)}
                      className="btn-secondary text-sm"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}