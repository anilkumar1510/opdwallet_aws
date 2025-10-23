'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { joinVideoConsultation } from '@/lib/api/video-consultations'
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

  const initializeConsultation = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      // Join the consultation - appointmentId is already the MongoDB _id from the route
      console.log('[VideoConsultation] Joining consultation with appointmentId:', appointmentId)
      const consultationData = await joinVideoConsultation(appointmentId)
      setConsultation(consultationData)
    } catch (err: any) {
      console.error('[VideoConsultationPage] Error:', err)
      setError(err.message || 'Failed to join consultation')
    } finally {
      setLoading(false)
    }
  }, [appointmentId])

  useEffect(() => {
    initializeConsultation()
  }, [appointmentId, initializeConsultation])

  const handleEndConsultation = () => {
    // Redirect back to online consultation page
    router.push('/member/online-consult')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Joining video consultation...</p>
        </div>
      </div>
    )
  }

  if (error || !consultation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="card max-w-md w-full bg-red-50 border-red-200">
          <h2 className="text-xl font-bold text-red-900 mb-4">
            Unable to Join Consultation
          </h2>
          <p className="text-red-700 mb-6">{error || 'Failed to join consultation'}</p>
          <Link
            href="/member/online-consult"
            className="btn-secondary w-full text-center"
          >
            <ArrowLeftIcon className="h-4 w-4 inline mr-2" />
            Back to Appointments
          </Link>
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
              Dr. {consultation.doctorName}
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
          patientName={consultation.patientName}
          doctorName={consultation.doctorName}
          consultationId={consultation.consultationId}
          onEnd={handleEndConsultation}
        />
      </div>
    </div>
  )
}
