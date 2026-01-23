'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarIcon, ClockIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { onAppointmentEvent, AppointmentEvents } from '@/lib/appointmentEvents'

interface Appointment {
  _id: string
  appointmentId: string
  appointmentNumber: string
  doctorName: string
  specialty: string
  appointmentDate: string
  timeSlot: string
  status: 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  appointmentType: string
  clinicName: string
  hasPrescription: boolean
  prescriptionId?: string
}

interface ActiveAppointmentNudgeProps {
  variant: 'mobile' | 'desktop' | 'section'
  userId: string
}

export default function ActiveAppointmentNudge({ variant, userId }: ActiveAppointmentNudgeProps) {
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchActiveAppointment = useCallback(async () => {
    try {
      const res = await fetch(`/api/appointments/user/${userId}/ongoing`, {
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error('Failed to fetch active appointment')
      }

      // Backend returns array directly (not wrapped in object)
      const appointments = await res.json()

      // Backend returns array with 0 or 1 appointment
      setAppointment(appointments.length > 0 ? appointments[0] : null)
    } catch (error) {
      console.error('[ActiveAppointmentNudge] Error fetching appointment:', error)
      setAppointment(null)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    // Initial fetch
    fetchActiveAppointment()

    // Listen for appointment-related events
    const unsubscribeCreated = onAppointmentEvent(AppointmentEvents.BOOKING_CREATED, fetchActiveAppointment)
    const unsubscribeUpdated = onAppointmentEvent(AppointmentEvents.BOOKING_UPDATED, fetchActiveAppointment)
    const unsubscribeCancelled = onAppointmentEvent(AppointmentEvents.BOOKING_CANCELLED, fetchActiveAppointment)
    const unsubscribePrescription = onAppointmentEvent(AppointmentEvents.PRESCRIPTION_AVAILABLE, fetchActiveAppointment)

    // Listen for tab visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchActiveAppointment()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup
    return () => {
      unsubscribeCreated()
      unsubscribeUpdated()
      unsubscribeCancelled()
      unsubscribePrescription()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchActiveAppointment])

  const handleClick = () => {
    if (!appointment) return

    // If completed with prescription, open prescription directly
    if (appointment.status === 'COMPLETED' && appointment.hasPrescription && appointment.prescriptionId) {
      window.open(`/api/member/prescriptions/${appointment.prescriptionId}/download`, '_blank')
    } else {
      // Navigate to bookings page (doctors tab)
      router.push('/member/bookings?tab=doctors')
    }
  }

  // Don't show anything if loading or no appointment
  if (loading || !appointment) {
    return null
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getCTAText = () => {
    if (appointment.status === 'COMPLETED' && appointment.hasPrescription) {
      return 'View Prescription'
    }
    return 'View Details'
  }

  const getStatusColor = () => {
    switch (appointment.status) {
      case 'PENDING_CONFIRMATION':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'CONFIRMED':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'COMPLETED':
        return 'bg-green-50 border-green-200 text-green-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  // Mobile variant - compact banner above bottom nav
  if (variant === 'mobile') {
    return (
      <div className={`fixed bottom-16 left-0 right-0 z-40 px-4 py-2 border-t ${getStatusColor()}`}>
        <button
          onClick={handleClick}
          className="w-full flex items-center justify-between gap-3 text-left"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CalendarIcon className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm font-semibold truncate">
                {appointment.doctorName}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <ClockIcon className="h-3 w-3" />
                {formatDate(appointment.appointmentDate)} • {appointment.timeSlot}
              </span>
            </div>
          </div>
          <div className="flex-shrink-0">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/80 whitespace-nowrap">
              {getCTAText()} →
            </span>
          </div>
        </button>
      </div>
    )
  }

  // Section variant - inline section for desktop page flow
  if (variant === 'section') {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Appointment</h2>

        <button
          onClick={handleClick}
          className={`w-full rounded-xl p-4 border-2 ${getStatusColor()} hover:shadow-md transition-all text-left`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CalendarIcon className="h-5 w-5" />
                <span className="font-semibold text-gray-900">{appointment.doctorName}</span>
              </div>

              <div className="space-y-1 text-sm">
                <p className="text-gray-600">{appointment.specialty}</p>
                <div className="flex items-center gap-4 text-sm mt-2">
                  <span className="flex items-center gap-1">
                    <ClockIcon className="h-4 w-4" />
                    {formatDate(appointment.appointmentDate)} • {appointment.timeSlot}
                  </span>
                  {appointment.status === 'COMPLETED' && appointment.hasPrescription && (
                    <span className="flex items-center gap-1">
                      <DocumentTextIcon className="h-4 w-4" />
                      Prescription Available
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <span className="text-xs px-3 py-1 rounded-full bg-white/80 font-medium">
                    {appointment.status === 'PENDING_CONFIRMATION' ? 'Pending Confirmation' :
                     appointment.status === 'CONFIRMED' ? 'Confirmed' :
                     appointment.status === 'COMPLETED' ? 'Completed' : appointment.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0">
              <span className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors">
                {getCTAText()} →
              </span>
            </div>
          </div>
        </button>
      </div>
    )
  }

  // Desktop variant - fixed widget in bottom-right corner (legacy)
  return (
    <div className={`fixed bottom-6 right-6 z-40 max-w-md rounded-lg border-2 ${getStatusColor()} p-4 shadow-lg`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Active Appointment
          </h3>
          <div className="space-y-1 text-sm">
            <p className="font-medium">{appointment.doctorName}</p>
            <p className="text-xs opacity-80">{appointment.specialty}</p>
            <div className="flex items-center gap-4 text-xs mt-2">
              <span className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                {formatDate(appointment.appointmentDate)} • {appointment.timeSlot}
              </span>
              {appointment.status === 'COMPLETED' && appointment.hasPrescription && (
                <span className="flex items-center gap-1">
                  <DocumentTextIcon className="h-4 w-4" />
                  Prescription Available
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleClick}
          className="flex-shrink-0 px-4 py-2 bg-white rounded-lg font-semibold text-sm shadow-sm hover:shadow transition-shadow"
        >
          {getCTAText()}
        </button>
      </div>
    </div>
  )
}
