'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeftIcon,
  VideoCameraIcon,
  ClockIcon,
  CheckCircleIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import ViewPrescriptionButton, { PrescriptionBadge } from '@/components/ViewPrescriptionButton'
import { useFamily } from '@/contexts/FamilyContext'

interface Appointment {
  _id: string
  appointmentId: string
  appointmentNumber: string
  patientName: string
  patientId: string
  doctorName: string
  specialty: string
  appointmentType: string
  appointmentDate: string
  timeSlot: string
  status: string
  consultationFee: number
  contactNumber?: string
  callPreference?: string
  hasPrescription?: boolean
  prescriptionId?: string
}

export default function OnlineConsultPage() {
  const router = useRouter()
  const { viewingUserId } = useFamily()
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [userId, setUserId] = useState<string>('')

  const fetchUserData = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user data')
      }

      const data = await response.json()
      console.log('[OnlineConsult] User ID received:', data._id)

      // PRIVACY: Use viewingUserId to fetch appointments for the active profile
      const targetUserId = viewingUserId || data._id
      console.log('[OnlineConsult] Fetching appointments for profile:', { targetUserId, viewingUserId })
      setUserId(targetUserId)
      await fetchAppointments(targetUserId)
    } catch (error) {
      console.error('[OnlineConsult] Error fetching user data:', error)
      setLoading(false)
    }
  }, [viewingUserId])

  useEffect(() => {
    console.log('[OnlineConsult] Fetching user data')
    fetchUserData()
  }, [fetchUserData, viewingUserId])

  const fetchAppointments = async (userId: string) => {
    try {
      console.log('[OnlineConsult] Fetching ONLINE appointments for user:', userId)
      const response = await fetch(`/api/appointments/user/${userId}?type=ONLINE`, {
        credentials: 'include',
      })

      if (!response.ok) {
        console.error('[OnlineConsult] API response not OK:', response.status, response.statusText)
        throw new Error('Failed to fetch appointments')
      }

      const data = await response.json()
      console.log('[OnlineConsult] ONLINE appointments received:', data.length)
      setAppointments(data)
    } catch (error) {
      console.error('[OnlineConsult] Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConsultNow = () => {
    console.log('[OnlineConsult] Consult Now clicked', { viewingUserId })
    const url = viewingUserId
      ? `/member/online-consult/specialties?defaultPatient=${viewingUserId}`
      : '/member/online-consult/specialties'
    router.push(url)
  }

  const handleJoinAppointment = (appointment: Appointment) => {
    console.log('[OnlineConsult] Join appointment:', appointment.appointmentId)
    router.push(`/member/consultations/${appointment._id}`)
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
    if (!confirm('Are you sure you want to cancel this online consultation? Your wallet will be refunded.')) {
      return
    }

    try {
      console.log('[OnlineConsult] Cancelling appointment:', appointmentId)
      const response = await fetch(`/api/appointments/${appointmentId}/user-cancel`, {
        method: 'PATCH',
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to cancel appointment')
      }

      console.log('[OnlineConsult] Appointment cancelled successfully')
      alert('Online consultation cancelled successfully. Your wallet has been refunded.')

      // Refresh appointments
      await fetchAppointments(userId)
    } catch (error) {
      console.error('[OnlineConsult] Error cancelling appointment:', error)
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
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm" style={{ borderColor: '#e5e7eb' }}>
        <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-xl transition-all"
            >
              <ChevronLeftIcon className="h-6 w-6" style={{ color: '#0E51A2' }} />
            </button>
            <div className="flex-1">
              <h1 className="text-lg lg:text-xl font-bold" style={{ color: '#0E51A2' }}>Online Consultation</h1>
              <p className="text-xs lg:text-sm text-gray-600">Consult with doctors on call</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-6 lg:py-8">
        {/* Consult Doctor Card */}
        <div
          className="rounded-2xl p-6 lg:p-8 border-2 shadow-lg mb-6"
          style={{
            background: 'linear-gradient(169.98deg, #EFF4FF 19.71%, #FEF3E9 66.63%, #FEF3E9 108.92%)',
            borderColor: '#F7DCAF'
          }}
        >
          <div className="flex items-center gap-4 mb-5">
            <div
              className="w-14 h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                border: '1px solid #A4BFFE7A',
                boxShadow: '-2px 11px 46.1px 0px #0000000D'
              }}
            >
              <VideoCameraIcon className="h-7 w-7 lg:h-8 lg:w-8" style={{ color: '#0F5FDC' }} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg lg:text-xl font-bold mb-1" style={{ color: '#0E51A2' }}>Consult Doctor on Call</h2>
              <p className="text-xs lg:text-sm text-gray-600">Connect with top doctors instantly</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-sm lg:text-base text-gray-700">
              <CheckCircleIcon className="h-5 w-5 flex-shrink-0" style={{ color: '#25A425' }} />
              <span>Available 24/7 for immediate consultation</span>
            </div>
            <div className="flex items-center gap-2 text-sm lg:text-base text-gray-700">
              <CheckCircleIcon className="h-5 w-5 flex-shrink-0" style={{ color: '#25A425' }} />
              <span>Voice or video call support</span>
            </div>
            <div className="flex items-center gap-2 text-sm lg:text-base text-gray-700">
              <CheckCircleIcon className="h-5 w-5 flex-shrink-0" style={{ color: '#25A425' }} />
              <span>Get prescriptions digitally</span>
            </div>
          </div>

          <button
            onClick={handleConsultNow}
            className="w-full py-3 lg:py-4 px-6 text-white rounded-xl font-semibold transition-all hover:shadow-lg"
            style={{ background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)' }}
          >
            Consult Now
          </button>
        </div>

        {appointments.length === 0 ? (
          <div
            className="rounded-2xl p-8 lg:p-12 text-center border-2 shadow-md"
            style={{
              background: 'linear-gradient(169.98deg, #EFF4FF 19.71%, #FEF3E9 66.63%, #FEF3E9 108.92%)',
              borderColor: '#F7DCAF'
            }}
          >
            <div
              className="w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{
                background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                border: '1px solid #A4BFFE7A',
                boxShadow: '-2px 11px 46.1px 0px #0000000D'
              }}
            >
              <VideoCameraIcon className="h-8 w-8 lg:h-10 lg:w-10" style={{ color: '#0F5FDC' }} />
            </div>
            <h3 className="text-lg lg:text-xl font-bold mb-2" style={{ color: '#0E51A2' }}>No online consultations yet</h3>
            <p className="text-sm lg:text-base text-gray-600">Book your first online consultation to get started</p>
          </div>
        ) : (
          <div className="space-y-4 lg:space-y-5">
            <h2 className="text-sm lg:text-base font-bold uppercase tracking-wide" style={{ color: '#0E51A2' }}>
              Your Appointments ({appointments.length})
            </h2>

            {appointments.map((appointment) => (
              <div
                key={appointment._id}
                className="rounded-2xl p-5 lg:p-6 border-2 shadow-md hover:shadow-lg transition-all"
                style={{
                  background: 'linear-gradient(169.98deg, #EFF4FF 19.71%, #FEF3E9 66.63%, #FEF3E9 108.92%)',
                  borderColor: '#F7DCAF'
                }}
              >
                {/* Doctor Info and Status */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 lg:gap-4 flex-1">
                    <div
                      className="w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                        border: '1px solid #A4BFFE7A',
                        boxShadow: '-2px 11px 46.1px 0px #0000000D'
                      }}
                    >
                      <VideoCameraIcon className="h-6 w-6 lg:h-7 lg:w-7" style={{ color: '#0F5FDC' }} />
                    </div>
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
                <div
                  className="rounded-xl p-4 mb-4 border-2"
                  style={{
                    background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
                    borderColor: '#86ACD8'
                  }}
                >
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

                    {appointment.contactNumber && (
                      <div className="flex items-center gap-2 text-sm lg:text-base text-gray-700">
                        <span className="font-medium">Contact:</span>
                        <span>{appointment.contactNumber}</span>
                      </div>
                    )}

                    {appointment.callPreference && (
                      <div className="flex items-center gap-2 text-sm lg:text-base text-gray-700">
                        <span className="font-medium">Preferred Mode:</span>
                        <span>{appointment.callPreference}</span>
                      </div>
                    )}
                  </div>
                </div>

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

                {/* Join Call Button - Only for confirmed online appointments without prescription */}
                {appointment.status === 'CONFIRMED' && !appointment.hasPrescription && (
                  <div className="mb-3">
                    <button
                      onClick={() => handleJoinAppointment(appointment)}
                      className="w-full py-3 px-4 text-white rounded-xl text-sm lg:text-base font-semibold transition-all hover:shadow-lg"
                      style={{ background: '#25A425' }}
                    >
                      Join Call
                    </button>
                  </div>
                )}

                {/* Cancel Button */}
                {(() => {
                  // Check if appointment is in the future
                  const isFuture = (() => {
                    if (appointment.timeSlot === 'Immediate') {
                      return true // Allow cancellation for immediate appointments
                    }

                    // Parse appointment date and time
                    const [year, month, day] = appointment.appointmentDate.split('-').map(Number)
                    const appointmentDateObj = new Date(year, month - 1, day)

                    // Parse time slot (e.g., "1:30 PM" or "10:00 AM")
                    const timeParts = appointment.timeSlot.match(/(\d+):(\d+)\s*(AM|PM)/i)
                    if (timeParts) {
                      let hours = parseInt(timeParts[1])
                      const minutes = parseInt(timeParts[2])
                      const period = timeParts[3].toUpperCase()

                      if (period === 'PM' && hours !== 12) {
                        hours += 12
                      } else if (period === 'AM' && hours === 12) {
                        hours = 0
                      }

                      appointmentDateObj.setHours(hours, minutes, 0, 0)
                    }

                    const now = new Date()
                    return appointmentDateObj > now
                  })()

                  const canCancel = (appointment.status === 'PENDING_CONFIRMATION' || appointment.status === 'CONFIRMED') && isFuture && !appointment.hasPrescription

                  return canCancel
                })() && (
                  <button
                    onClick={() => handleCancelAppointment(appointment.appointmentId)}
                    className="w-full py-3 px-4 text-white rounded-xl text-sm lg:text-base font-semibold transition-all hover:shadow-lg"
                    style={{ background: '#E53535' }}
                  >
                    Cancel Consultation
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* How it Works */}
        <div
          className="rounded-2xl p-5 lg:p-6 border-2 mt-6"
          style={{
            background: '#FEF1E7',
            borderColor: '#F9B376'
          }}
        >
          <h3 className="font-bold text-base lg:text-lg mb-4" style={{ color: '#0E51A2' }}>How it works</h3>
          <ol className="space-y-3 text-sm lg:text-base text-gray-700">
            <li className="flex items-start gap-2">
              <span className="font-bold flex-shrink-0" style={{ color: '#0F5FDC' }}>1.</span>
              <span>Select your medical specialty</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold flex-shrink-0" style={{ color: '#0F5FDC' }}>2.</span>
              <span>Choose an available doctor</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold flex-shrink-0" style={{ color: '#0F5FDC' }}>3.</span>
              <span>Consult now or schedule for later</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold flex-shrink-0" style={{ color: '#0F5FDC' }}>4.</span>
              <span>Connect via voice or video call</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
