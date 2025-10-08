'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  ChevronLeftIcon,
  BeakerIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline'
import ViewPrescriptionButton, { PrescriptionBadge } from '@/components/ViewPrescriptionButton'

interface Appointment {
  _id: string
  appointmentId: string
  appointmentNumber: string
  patientName: string
  patientId: string
  doctorId: string
  doctorName: string
  specialty: string
  clinicName: string
  clinicAddress: string
  appointmentType: string
  appointmentDate: string
  timeSlot: string
  consultationFee: number
  status: string
  requestedAt: string
  createdAt: string
  hasPrescription?: boolean
  prescriptionId?: string
}

export default function BookingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('doctors')
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([])
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([])

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      console.log('[Bookings] Fetching user data')
      const userResponse = await fetch('/api/auth/me', {
        credentials: 'include',
      })

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data')
      }

      const userData = await userResponse.json()
      console.log('[Bookings] User ID:', userData._id)

      // Fetch all appointments (both IN_CLINIC and ONLINE)
      console.log('[Bookings] Fetching all appointments')
      const response = await fetch(`/api/appointments/user/${userData._id}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch appointments')
      }

      const data = await response.json()
      console.log('[Bookings] Appointments received:', data.length)

      // Sort appointments by date (newest first)
      const sortedAppointments = data.sort((a: Appointment, b: Appointment) => {
        const dateA = new Date(`${a.appointmentDate} ${a.timeSlot}`)
        const dateB = new Date(`${b.appointmentDate} ${b.timeSlot}`)
        return dateB.getTime() - dateA.getTime()
      })

      // Split into upcoming and past
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const upcoming: Appointment[] = []
      const past: Appointment[] = []

      sortedAppointments.forEach((appointment: Appointment) => {
        const appointmentDate = new Date(appointment.appointmentDate)
        appointmentDate.setHours(0, 0, 0, 0)

        if (appointmentDate >= today) {
          upcoming.push(appointment)
        } else {
          past.push(appointment)
        }
      })

      // Sort upcoming appointments in ascending order (earliest first)
      upcoming.sort((a, b) => {
        const dateA = new Date(`${a.appointmentDate} ${a.timeSlot}`)
        const dateB = new Date(`${b.appointmentDate} ${b.timeSlot}`)
        return dateA.getTime() - dateB.getTime()
      })

      setAppointments(sortedAppointments)
      setUpcomingAppointments(upcoming)
      setPastAppointments(past)
    } catch (error) {
      console.error('[Bookings] Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const day = date.getDate()
    const month = date.toLocaleString('default', { month: 'short' })
    const year = date.getFullYear()
    return `${day} ${month} ${year}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_CONFIRMATION':
        return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800'
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING_CONFIRMATION':
        return 'Pending'
      case 'CONFIRMED':
        return 'Confirmed'
      case 'COMPLETED':
        return 'Completed'
      case 'CANCELLED':
        return 'Cancelled'
      default:
        return status
    }
  }

  const getAppointmentTypeText = (type: string) => {
    return type === 'ONLINE' ? 'Online Consultation' : 'In-Clinic Visit'
  }

  const handleCancelAppointment = async (appointmentId: string, doctorName: string) => {
    if (!confirm(`Are you sure you want to cancel your appointment with ${doctorName}? Your wallet will be refunded.`)) {
      return
    }

    try {
      console.log('[Bookings] Cancelling appointment:', appointmentId)
      const response = await fetch(`/api/appointments/${appointmentId}/user-cancel`, {
        method: 'PATCH',
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to cancel appointment')
      }

      console.log('[Bookings] Appointment cancelled successfully')
      alert('Appointment cancelled successfully. Your wallet has been refunded.')

      // Refresh appointments
      await fetchAppointments()
    } catch (error) {
      console.error('[Bookings] Error cancelling appointment:', error)
      alert('Failed to cancel appointment: ' + (error as Error).message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0a529f', borderTopColor: 'transparent' }}></div>
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
            <h1 className="text-xl font-semibold text-gray-900">My Bookings</h1>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white px-4 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('doctors')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'doctors'
                ? 'border-transparent text-gray-500 hover:text-gray-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            style={activeTab === 'doctors' ? { borderColor: '#0a529f', color: '#0a529f' } : undefined}
          >
            <div className="flex items-center space-x-2">
              <UserIcon className="h-5 w-5" />
              <span>Doctors</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('lab')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'lab'
                ? 'border-transparent text-gray-500 hover:text-gray-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            style={activeTab === 'lab' ? { borderColor: '#0a529f', color: '#0a529f' } : undefined}
          >
            <div className="flex items-center space-x-2">
              <BeakerIcon className="h-5 w-5" />
              <span>Lab</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('pharmacy')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'pharmacy'
                ? 'border-transparent text-gray-500 hover:text-gray-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            style={activeTab === 'pharmacy' ? { borderColor: '#0a529f', color: '#0a529f' } : undefined}
          >
            <div className="flex items-center space-x-2">
              <BuildingStorefrontIcon className="h-5 w-5" />
              <span>Pharmacy</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="p-4 max-w-4xl mx-auto">
        {activeTab === 'doctors' && (
          <div className="space-y-4">
            {appointments.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <div className="mb-4">
                  <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No appointments yet</h3>
                <p className="text-gray-600 mb-4">Book your first appointment to get started</p>
                <button
                  onClick={() => router.push('/member/appointments')}
                  className="px-6 py-2 text-white rounded-lg"
                  style={{ backgroundColor: '#0a529f' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#084080'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0a529f'}
                >
                  Book Appointment
                </button>
              </div>
            ) : (
              <>
                {/* Upcoming Appointments */}
                {upcomingAppointments.length > 0 && (
                  <>
                    {upcomingAppointments.map((appointment) => (
                      <div
                        key={appointment._id}
                        className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-full" style={{ backgroundColor: '#e6f0fa' }}>
                              <UserIcon className="h-5 w-5" style={{ color: '#0a529f' }} />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{appointment.doctorName}</div>
                              <div className="text-sm text-gray-600">{appointment.specialty}</div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                              {getStatusText(appointment.status)}
                            </span>
                            <PrescriptionBadge hasPrescription={appointment.hasPrescription} />
                            <span className="text-xs text-gray-500">
                              {getAppointmentTypeText(appointment.appointmentType)}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <UserIcon className="h-4 w-4" />
                            <span>Patient: {appointment.patientName}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{formatDate(appointment.appointmentDate)}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <ClockIcon className="h-4 w-4" />
                            <span>{appointment.timeSlot}</span>
                          </div>

                          {appointment.appointmentType === 'IN_CLINIC' && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <MapPinIcon className="h-4 w-4" />
                              <span className="line-clamp-1">{appointment.clinicName}</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm text-gray-600">
                              ID: <span className="font-medium text-gray-900">{appointment.appointmentId}</span>
                            </div>
                            <div className="text-sm font-semibold" style={{ color: '#0a529f' }}>
                              ₹{appointment.consultationFee}
                            </div>
                          </div>

                          {/* View Prescription Button */}
                          {appointment.hasPrescription && appointment.prescriptionId && (
                            <div className="mb-3">
                              <ViewPrescriptionButton
                                prescriptionId={appointment.prescriptionId}
                                hasPrescription={appointment.hasPrescription}
                              />
                            </div>
                          )}

                          {(() => {
                            // Parse appointment date and time
                            const [year, month, day] = appointment.appointmentDate.split('-').map(Number);
                            const appointmentDateObj = new Date(year, month - 1, day); // month is 0-indexed

                            // Parse time slot (e.g., "1:30 PM" or "10:00 AM")
                            const timeParts = appointment.timeSlot.match(/(\d+):(\d+)\s*(AM|PM)/i);
                            if (timeParts) {
                              let hours = parseInt(timeParts[1]);
                              const minutes = parseInt(timeParts[2]);
                              const period = timeParts[3].toUpperCase();

                              if (period === 'PM' && hours !== 12) {
                                hours += 12;
                              } else if (period === 'AM' && hours === 12) {
                                hours = 0;
                              }

                              appointmentDateObj.setHours(hours, minutes, 0, 0);
                            }

                            const now = new Date();
                            const isFuture = appointmentDateObj > now;
                            const canCancel = (appointment.status === 'PENDING_CONFIRMATION' || appointment.status === 'CONFIRMED') && isFuture;

                            return canCancel;
                          })() && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleCancelAppointment(appointment.appointmentId, appointment.doctorName)}
                                className="flex-1 py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                className="flex-1 py-2 px-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                                disabled
                              >
                                Reschedule
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Separator */}
                {upcomingAppointments.length > 0 && pastAppointments.length > 0 && (
                  <div className="flex items-center my-6">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="px-4 text-sm font-medium text-gray-500">Past Appointments</span>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>
                )}

                {/* Past Appointments */}
                {pastAppointments.length > 0 && (
                  <>
                    {upcomingAppointments.length === 0 && (
                      <div className="text-sm font-medium text-gray-500 mb-3">Past Appointments</div>
                    )}
                    {pastAppointments.map((appointment) => (
                      <div
                        key={appointment._id}
                        className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow opacity-75"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="bg-gray-100 p-2 rounded-full">
                              <UserIcon className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{appointment.doctorName}</div>
                              <div className="text-sm text-gray-600">{appointment.specialty}</div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                              {getStatusText(appointment.status)}
                            </span>
                            <PrescriptionBadge hasPrescription={appointment.hasPrescription} />
                            <span className="text-xs text-gray-500">
                              {getAppointmentTypeText(appointment.appointmentType)}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <UserIcon className="h-4 w-4" />
                            <span>Patient: {appointment.patientName}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{formatDate(appointment.appointmentDate)}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <ClockIcon className="h-4 w-4" />
                            <span>{appointment.timeSlot}</span>
                          </div>

                          {appointment.appointmentType === 'IN_CLINIC' && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <MapPinIcon className="h-4 w-4" />
                              <span className="line-clamp-1">{appointment.clinicName}</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm text-gray-600">
                              ID: <span className="font-medium text-gray-900">{appointment.appointmentId}</span>
                            </div>
                            <div className="text-sm font-semibold text-gray-600">
                              ₹{appointment.consultationFee}
                            </div>
                          </div>

                          {/* View Prescription Button */}
                          {appointment.hasPrescription && appointment.prescriptionId && (
                            <ViewPrescriptionButton
                              prescriptionId={appointment.prescriptionId}
                              hasPrescription={appointment.hasPrescription}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'lab' && (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="mb-4">
              <BeakerIcon className="h-16 w-16 text-gray-300 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Lab Tests</h3>
            <p className="text-gray-600">Lab test bookings will appear here</p>
          </div>
        )}

        {activeTab === 'pharmacy' && (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="mb-4">
              <BuildingStorefrontIcon className="h-16 w-16 text-gray-300 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Pharmacy Orders</h3>
            <p className="text-gray-600">Pharmacy orders will appear here</p>
          </div>
        )}
      </div>
    </div>
  )
}