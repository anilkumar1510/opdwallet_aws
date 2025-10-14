'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { useSpecialties } from '@/lib/providers/specialties-provider'

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([])
  const { specialties } = useSpecialties() // Use cached specialties
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    specialty: '',
    includeOld: false,
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  })

  // PERFORMANCE: Debounce filters to avoid API spam
  const debouncedFilters = useDebounce(filters, 300)

  useEffect(() => {
    fetchAppointments()
  }, [debouncedFilters, pagination.page]) // Use debounced filters and page

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.specialty) params.append('specialty', filters.specialty)
      if (filters.includeOld) params.append('includeOld', 'true')
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())

      const response = await apiFetch(`/api/appointments?${params.toString()}`)
      if (response.ok) {
        const result = await response.json()
        setAppointments(result.data || [])
        setPagination({
          page: result.page || 1,
          limit: result.limit || 20,
          total: result.total || 0,
          pages: result.pages || 0,
        })
      } else {
        console.error('Failed to fetch appointments: HTTP', response.status)
        setAppointments([])
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error)
      setAppointments([])
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

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage })
  }

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    setPagination({ ...pagination, page: 1 }) // Reset to page 1 when filters change
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange({ ...filters, status: e.target.value })}
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
          onChange={(e) => handleFilterChange({ ...filters, specialty: e.target.value })}
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
            onChange={(e) => handleFilterChange({ ...filters, includeOld: e.target.checked })}
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

      {/* Pagination */}
      {!loading && appointments.length > 0 && (
        <div className="card">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} appointments
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let pageNumber;
                  if (pagination.pages <= 5) {
                    pageNumber = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNumber = i + 1;
                  } else if (pagination.page >= pagination.pages - 2) {
                    pageNumber = pagination.pages - 4 + i;
                  } else {
                    pageNumber = pagination.page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`px-3 py-2 border rounded-md text-sm font-medium ${
                        pagination.page === pageNumber
                          ? 'bg-green-600 text-white border-green-600'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}