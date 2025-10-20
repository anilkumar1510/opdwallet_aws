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
      setUserId(data._id)
      await fetchAppointments(data._id)
    } catch (error) {
      console.error('[OnlineConsult] Error fetching user data:', error)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    console.log('[OnlineConsult] Fetching user data')
    fetchUserData()
  }, [fetchUserData])

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
    console.log('[OnlineConsult] Consult Now clicked')
    router.push('/member/online-consult/specialties')
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
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Online Consultation</h1>
              <p className="text-sm text-gray-600">Consult with doctors on call</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <div className="bg-gradient-to-br rounded-2xl p-6 text-white" style={{ backgroundImage: 'linear-gradient(to bottom right, #0a529f, #084080)' }}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-white/20 p-3 rounded-full">
              <VideoCameraIcon className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Consult Doctor on Call</h2>
              <p className="text-sm text-blue-100">Connect with top doctors instantly</p>
            </div>
          </div>

          <div className="space-y-2 mb-6 text-sm text-blue-100">
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-5 w-5" />
              <span>Available 24/7 for immediate consultation</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-5 w-5" />
              <span>Voice or video call support</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-5 w-5" />
              <span>Get prescriptions digitally</span>
            </div>
          </div>

          <button
            onClick={handleConsultNow}
            className="w-full bg-white text-blue-600 py-3 px-6 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
          >
            Consult Now
          </button>
        </div>

        {appointments.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="mb-4">
              <VideoCameraIcon className="h-16 w-16 text-gray-300 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No online consultations yet</h3>
            <p className="text-gray-600 mb-4">Book your first online consultation to get started</p>
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
                      <VideoCameraIcon className="h-5 w-5 text-blue-600" />
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

                  {appointment.contactNumber && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span className="font-medium">Contact:</span> {appointment.contactNumber}
                    </div>
                  )}

                  {appointment.callPreference && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span className="font-medium">Preferred Mode:</span> {appointment.callPreference}
                    </div>
                  )}
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

                  {/* Join Call Button - Only for confirmed online appointments */}
                  {appointment.status === 'CONFIRMED' && (
                    <div className="mb-3">
                      <button
                        onClick={() => handleJoinAppointment(appointment)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                      >
                        Join Call
                      </button>
                    </div>
                  )}

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

                    const canCancel = (appointment.status === 'PENDING_CONFIRMATION' || appointment.status === 'CONFIRMED') && isFuture

                    return canCancel
                  })() && (
                    <button
                      onClick={() => handleCancelAppointment(appointment.appointmentId)}
                      className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancel Consultation
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <h3 className="font-semibold text-gray-900 mb-2">How it works</h3>
          <ol className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="font-semibold mr-2" style={{ color: '#0a529f' }}>1.</span>
              <span>Select your medical specialty</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2" style={{ color: '#0a529f' }}>2.</span>
              <span>Choose an available doctor</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2" style={{ color: '#0a529f' }}>3.</span>
              <span>Consult now or schedule for later</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2" style={{ color: '#0a529f' }}>4.</span>
              <span>Connect via voice or video call</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}