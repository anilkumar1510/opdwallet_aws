'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeftIcon,
  PlusIcon,
  ClockIcon,
  CalendarIcon,
  MapPinIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import ViewPrescriptionButton, { PrescriptionBadge } from '@/components/ViewPrescriptionButton'
import { appointmentsApi, usersApi, type Appointment } from '@/lib/api'

export default function AppointmentsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [user, setUser] = useState<any>(null)

  const fetchUserData = useCallback(async () => {
    try {
      console.log('[Appointments] Fetching user data')
      const data = await usersApi.getCurrentUser()
      console.log('[Appointments] User data received:', { userId: data._id, name: data.fullName })
      setUser(data)

      await fetchAppointments(data._id)
    } catch (error) {
      console.error('[Appointments] Error fetching user data:', error)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  const fetchAppointments = async (userId: string) => {
    try {
      console.log('[Appointments] Fetching IN_CLINIC appointments for user:', userId)
      const data = await appointmentsApi.getUserAppointments(userId, 'IN_CLINIC')
      console.log('[Appointments] IN_CLINIC appointments received:', { count: data.length })
      setAppointments(data)
    } catch (error) {
      console.error('[Appointments] Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBookAppointment = () => {
    console.log('[Appointments] Book new appointment clicked')
    router.push('/member/appointments/specialties')
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
        return 'Confirming'
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

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment? Your wallet will be refunded.')) {
      return
    }

    try {
      console.log('[Appointments] Cancelling appointment:', appointmentId)
      await appointmentsApi.cancel(appointmentId)
      console.log('[Appointments] Appointment cancelled successfully')
      alert('Appointment cancelled successfully. Your wallet has been refunded.')

      // Refresh appointments
      await fetchAppointments(user._id)
    } catch (error) {
      console.error('[Appointments] Error cancelling appointment:', error)
      alert('Failed to cancel appointment: ' + (error as Error).message)
    }
  }

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
            <h1 className="text-xl font-semibold text-gray-900">In-Clinic Appointments</h1>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        <button
          onClick={handleBookAppointment}
          className="w-full mb-6 flex items-center justify-center space-x-2 text-white px-4 py-3 rounded-xl font-medium transition-all hover:shadow-lg"
          style={{ backgroundColor: '#0a529f' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#084080'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0a529f'}
        >
          <PlusIcon className="h-5 w-5" />
          <span>Book New Appointment</span>
        </button>

        {appointments.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="mb-4">
              <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No appointments yet</h3>
            <p className="text-gray-600 mb-4">Book your first appointment to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-2">
              Your Appointments ({appointments.length})
            </h2>

            {appointments.map((appointment) => (
              <div
                key={appointment._id}
                className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <UserIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{appointment.doctorName}</div>
                      <div className="text-sm text-gray-600">{appointment.specialty}</div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {getStatusText(appointment.status)}
                    </span>
                    <PrescriptionBadge hasPrescription={appointment.hasPrescription} />
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

                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPinIcon className="h-4 w-4" />
                    <span className="line-clamp-1">{appointment.clinicName}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-gray-600">
                      Appointment ID: <span className="font-medium text-gray-900">{appointment.appointmentId}</span>
                    </div>
                    <div className="text-sm font-semibold text-blue-600">
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

                    console.log('[Appointments] Cancel button check:', {
                      appointmentId: appointment.appointmentId,
                      appointmentDate: appointment.appointmentDate,
                      timeSlot: appointment.timeSlot,
                      parsedDateTime: appointmentDateObj.toString(),
                      now: now.toString(),
                      isFuture,
                      status: appointment.status,
                      canCancel
                    });

                    return canCancel;
                  })() && (
                    <button
                      onClick={() => handleCancelAppointment(appointment.appointmentId)}
                      className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancel Appointment
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}