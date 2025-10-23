'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { startVideoConsultation, endVideoConsultation } from '@/lib/api/video-consultations'
import { getAppointmentDetails } from '@/lib/api/appointments'
import DailyVideoCall from '@/components/DailyVideoCall'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

interface ConsultationData {
  consultationId: string
  roomName: string
  roomUrl: string
  doctorName: string
  patientName: string
  status: string
}

export default function VideoConsultationPage() {
  const params = useParams()
  const router = useRouter()
  const appointmentId = params.appointmentId as string

  const [consultation, setConsultation] = useState<ConsultationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ending, setEnding] = useState(false)

  const initializeConsultation = useCallback(async () => {
    console.log('\n========================================')
    console.log('[DEBUG] 🎬 INITIALIZING VIDEO CONSULTATION')
    console.log('[DEBUG] Timestamp:', new Date().toISOString())
    console.log('[DEBUG] Appointment ID:', appointmentId)
    console.log('[DEBUG] Current URL:', window.location.href)
    console.log('========================================\n')

    try {
      setLoading(true)
      setError('')

      console.log('[DEBUG] 📞 Fetching appointment details...')
      const fetchStart = Date.now()

      // Get appointment details first to verify it's ONLINE
      const appointmentResponse = await getAppointmentDetails(appointmentId)
      const appointment = appointmentResponse.appointment

      console.log('[DEBUG] ✅ Appointment details received in', Date.now() - fetchStart, 'ms')
      console.log('[DEBUG] Appointment data:', JSON.stringify(appointment, null, 2))
      console.log('[DEBUG] Appointment Type:', appointment.appointmentType)
      console.log('[DEBUG] Appointment MongoDB _id:', appointment._id)

      if (appointment.appointmentType !== 'ONLINE') {
        console.error('[DEBUG] ❌ Not an online consultation')
        throw new Error('This is not an online consultation appointment')
      }

      console.log('\n[DEBUG] 🚀 Starting video consultation...')
      console.log('[DEBUG] Using MongoDB _id:', appointment._id)
      const consultStart = Date.now()

      // Start the consultation using the MongoDB _id
      const consultationData = await startVideoConsultation(appointment._id)

      console.log('[DEBUG] ✅ Consultation started in', Date.now() - consultStart, 'ms')
      console.log('[DEBUG] Consultation data:', JSON.stringify(consultationData, null, 2))
      console.log('[DEBUG] Room URL:', consultationData.roomUrl)
      console.log('[DEBUG] Consultation ID:', consultationData.consultationId)

      setConsultation(consultationData)

      console.log('\n[DEBUG] ✅ CONSULTATION INITIALIZATION COMPLETE')
    } catch (err: any) {
      console.error('\n========================================')
      console.error('[DEBUG] ❌ CONSULTATION INITIALIZATION FAILED')
      console.error('[DEBUG] Error type:', err?.constructor?.name)
      console.error('[DEBUG] Error message:', err?.message)
      console.error('[DEBUG] Error stack:', err?.stack)
      console.error('[DEBUG] Full error object:', JSON.stringify(err, null, 2))
      console.error('========================================\n')

      setError(err.message || 'Failed to start consultation')
    } finally {
      setLoading(false)
    }
  }, [appointmentId])

  useEffect(() => {
    initializeConsultation()
  }, [initializeConsultation])

  const handleEndConsultation = async () => {
    if (!consultation) return

    try {
      setEnding(true)
      await endVideoConsultation(consultation.consultationId, { endedBy: 'DOCTOR' })

      // Redirect back to appointment detail page
      router.push(`/doctorview/appointments/${appointmentId}`)
    } catch (err: any) {
      // Even if the API call fails, redirect back
      router.push(`/doctorview/appointments/${appointmentId}`)
    } finally {
      setEnding(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Starting video consultation...</p>
        </div>
      </div>
    )
  }

  if (error || !consultation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="card max-w-md w-full bg-red-50 border-red-200">
          <h2 className="text-xl font-bold text-red-900 mb-4">
            Unable to Start Consultation
          </h2>
          <p className="text-red-700 mb-6">{error || 'Failed to initialize consultation'}</p>
          <Link
            href={`/doctorview/appointments/${appointmentId}`}
            className="btn-secondary w-full text-center"
          >
            <ArrowLeftIcon className="h-4 w-4 inline mr-2" />
            Back to Appointment
          </Link>
        </div>
      </div>
    )
  }

  if (ending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Ending consultation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-900">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gray-800 text-white p-4 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Video Consultation</h1>
            <p className="text-sm text-gray-300">
              {consultation.patientName}
            </p>
          </div>
          <div className="text-sm text-gray-300">
            Consultation ID: {consultation.consultationId}
          </div>
        </div>
      </div>

      {/* Video Container */}
      <div className="absolute top-16 bottom-0 left-0 right-0">
        <DailyVideoCall
          roomUrl={consultation.roomUrl}
          doctorName={consultation.doctorName}
          patientName={consultation.patientName}
          consultationId={consultation.consultationId}
          onEnd={handleEndConsultation}
        />
      </div>
    </div>
  )
}
