'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  PlusIcon,
  ClockIcon,
  CalendarIcon,
  MapPinIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import ViewPrescriptionButton, { PrescriptionBadge } from '@/components/ViewPrescriptionButton'
import { appointmentsApi, usersApi, type Appointment } from '@/lib/api'
import { useFamily } from '@/contexts/FamilyContext'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import DetailCard from '@/components/ui/DetailCard'
import IconCircle from '@/components/ui/IconCircle'
import CTAButton from '@/components/ui/CTAButton'

export default function AppointmentsPage() {
  const router = useRouter()
  const { viewingUserId } = useFamily()
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [user, setUser] = useState<any>(null)

  const fetchUserData = useCallback(async () => {
    try {
      console.log('[Appointments] Fetching user data')
      const data = await usersApi.getCurrentUser()
      console.log('[Appointments] User data received:', { userId: data._id, name: data.fullName })
      setUser(data)

      // PRIVACY: Use viewingUserId to fetch appointments for the active profile
      const targetUserId = viewingUserId || data._id
      console.log('[Appointments] Fetching appointments for profile:', { targetUserId, viewingUserId })
      await fetchAppointments(targetUserId)
    } catch (error) {
      console.error('[Appointments] Error fetching user data:', error)
      setLoading(false)
    }
  }, [viewingUserId])

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData, viewingUserId])

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
    console.log('[Appointments] Book new appointment clicked', { viewingUserId })
    const url = viewingUserId
      ? `/member/appointments/specialties?defaultPatient=${viewingUserId}`
      : '/member/appointments/specialties'
    router.push(url)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const day = date.getDate()
    const month = date.toLocaleString('default', { month: 'short' })
    const year = date.getFullYear()
    return `${day} ${month} ${year}`
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

      // PRIVACY: Refresh appointments for the active profile
      const targetUserId = viewingUserId || user._id
      await fetchAppointments(targetUserId)
    } catch (error) {
      console.error('[Appointments] Error cancelling appointment:', error)
      alert('Failed to cancel appointment: ' + (error as Error).message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f7f7fc' }}>
        <div className="h-12 w-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: '#f7f7fc' }}>
      <PageHeader
        title="In-Clinic Appointments"
        subtitle="View and manage your appointments"
        backHref="/member"
      />

      <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-6 lg:py-8">
        {/* Book New Appointment CTA */}
        <CTAButton
          variant="primary"
          fullWidth
          onClick={handleBookAppointment}
          leftIcon={PlusIcon}
          className="mb-6"
        >
          Book New Appointment
        </CTAButton>

        {appointments.length === 0 ? (
          <EmptyState
            icon={CalendarIcon}
            title="No appointments yet"
            message="Book your first appointment to get started"
          />
        ) : (
          <div className="space-y-4 lg:space-y-5">
            <h2 className="text-sm lg:text-base font-bold uppercase tracking-wide" style={{ color: '#0E51A2' }}>
              Your Appointments ({appointments.length})
            </h2>

            {appointments.map((appointment) => (
              <DetailCard
                key={appointment._id}
                variant="primary"
                className="shadow-md hover:shadow-lg transition-all"
              >
                {/* Doctor Info and Status */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 lg:gap-4 flex-1">
                    <IconCircle icon={UserIcon} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-base lg:text-lg mb-1 truncate" style={{ color: '#0E51A2' }}>
                        {appointment.doctorName}
                      </div>
                      <div className="text-xs lg:text-sm text-gray-600">{appointment.specialty}</div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end ml-3">
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                        appointment.status === 'CONFIRMED' ? 'text-white' :
                        appointment.status === 'COMPLETED' ? 'text-white' :
                        appointment.status === 'CANCELLED' ? 'text-white' :
                        'bg-yellow-100 text-yellow-800'
                      }`}
                      style={
                        appointment.status === 'CONFIRMED' ? { background: '#25A425' } :
                        appointment.status === 'COMPLETED' ? { background: '#6b7280' } :
                        appointment.status === 'CANCELLED' ? { background: '#E53535' } :
                        {}
                      }
                    >
                      {getStatusText(appointment.status)}
                    </span>
                    <PrescriptionBadge hasPrescription={appointment.hasPrescription} />
                  </div>
                </div>

                {/* Appointment Details */}
                <DetailCard variant="secondary" className="mb-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm lg:text-base text-gray-700">
                      <UserIcon className="h-4 w-4 lg:h-5 lg:w-5" style={{ color: '#0F5FDC' }} />
                      <span className="font-medium">Patient:</span>
                      <span>{appointment.patientName}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm lg:text-base text-gray-700">
                      <CalendarIcon className="h-4 w-4 lg:h-5 lg:w-5" style={{ color: '#0F5FDC' }} />
                      <span className="font-medium">Date:</span>
                      <span>{formatDate(appointment.appointmentDate)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm lg:text-base text-gray-700">
                      <ClockIcon className="h-4 w-4 lg:h-5 lg:w-5" style={{ color: '#0F5FDC' }} />
                      <span className="font-medium">Time:</span>
                      <span>{appointment.timeSlot}</span>
                    </div>

                    <div className="flex items-start gap-2 text-sm lg:text-base text-gray-700">
                      <MapPinIcon className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0 mt-0.5" style={{ color: '#0F5FDC' }} />
                      <span className="font-medium">Clinic:</span>
                      <span className="flex-1">{appointment.clinicName}</span>
                    </div>
                  </div>
                </DetailCard>

                {/* Appointment ID and Fee */}
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="text-xs lg:text-sm text-gray-600">
                    ID: <span className="font-semibold" style={{ color: '#0E51A2' }}>{appointment.appointmentId}</span>
                  </div>
                  <div className="text-base lg:text-lg font-bold" style={{ color: '#25A425' }}>
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

                {/* Cancel Button */}
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
                    className="w-full py-3 px-4 text-white rounded-xl text-sm lg:text-base font-semibold transition-all hover:shadow-lg"
                    style={{ background: '#E53535' }}
                  >
                    Cancel Appointment
                  </button>
                )}
              </DetailCard>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
