'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeftIcon,
  VideoCameraIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface Appointment {
  _id: string
  appointmentId: string
  appointmentNumber: string
  doctorName: string
  specialty: string
  appointmentType: string
  appointmentDate: string
  timeSlot: string
  status: string
  consultationFee: number
  contactNumber?: string
  callPreference?: string
}

export default function OnlineConsultPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [ongoingAppointments, setOngoingAppointments] = useState<Appointment[]>([])
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    console.log('[OnlineConsult] Fetching user data')
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
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
      await fetchOngoingAppointments(data._id)
    } catch (error) {
      console.error('[OnlineConsult] Error fetching user data:', error)
      setLoading(false)
    }
  }

  const fetchOngoingAppointments = async (userId: string) => {
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

      const ongoingOnline = data.filter((apt: Appointment) =>
        apt.status === 'CONFIRMED' || apt.status === 'PENDING_CONFIRMATION'
      )

      console.log('[OnlineConsult] Filtered ongoing appointments:', ongoingOnline.length)
      setOngoingAppointments(ongoingOnline)
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
      await fetchOngoingAppointments(userId)
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

        {ongoingAppointments.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Ongoing Appointments</h3>
            <div className="space-y-3">
              {ongoingAppointments.map((appointment) => (
                <div key={appointment._id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm text-gray-600">#{appointment.appointmentNumber}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          appointment.status === 'CONFIRMED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {appointment.status === 'CONFIRMED' ? 'Confirmed' : 'Pending'}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-900">{appointment.doctorName}</h4>
                      <p className="text-sm text-gray-600">{appointment.specialty}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                    <ClockIcon className="h-4 w-4" />
                    <span>{appointment.appointmentDate} at {appointment.timeSlot}</span>
                  </div>

                  {appointment.contactNumber && (
                    <div className="text-sm text-gray-600 mb-3">
                      <span className="font-medium">Contact:</span> {appointment.contactNumber}
                    </div>
                  )}

                  {appointment.callPreference && (
                    <div className="text-sm text-gray-600 mb-3">
                      <span className="font-medium">Preferred Mode:</span> {appointment.callPreference}
                    </div>
                  )}

                  <div className="space-y-2">
                    {appointment.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleJoinAppointment(appointment)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                      >
                        Join Call
                      </button>
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