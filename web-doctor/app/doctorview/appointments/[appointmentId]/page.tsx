'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getAppointmentDetails, markAppointmentComplete } from '@/lib/api/appointments'
import { Appointment } from '@/lib/api/appointments'
import { getStatusColor, getAppointmentTypeText } from '@/lib/utils/appointment-helpers'
import PrescriptionUpload from '@/components/PrescriptionUpload'
import DigitalPrescriptionWriter from '@/components/DigitalPrescriptionWriter'
import ErrorBoundary from '@/components/ErrorBoundary'
import {
  ArrowLeftIcon,
  UserIcon,
  CalendarDaysIcon,
  ClockIcon,
  PhoneIcon,
  VideoCameraIcon,
  MapPinIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  DocumentArrowUpIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function AppointmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const appointmentId = params.appointmentId as string

  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [completing, setCompleting] = useState(false)
  const [prescriptionMode, setPrescriptionMode] = useState<'write' | 'upload'>('write')

  const fetchAppointment = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getAppointmentDetails(appointmentId)
      setAppointment(response.appointment)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch appointment details')
    } finally {
      setLoading(false)
    }
  }, [appointmentId])

  useEffect(() => {
    fetchAppointment()
  }, [fetchAppointment])

  const handleComplete = async () => {
    if (!appointment || !confirm('Mark this appointment as completed?')) return

    try {
      setCompleting(true)
      await markAppointmentComplete(appointmentId)
      await fetchAppointment()
    } catch (err: any) {
      alert(err.message || 'Failed to mark appointment as complete')
    } finally {
      setCompleting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
        </div>
      </div>
    )
  }

  if (error || !appointment) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card bg-red-50 border-red-200">
          <p className="text-red-600">{error || 'Appointment not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <Link
        href="/doctorview"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Link>

      {/* Appointment Header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {appointment.patientName}
            </h1>
            <p className="text-gray-600">
              Appointment #{appointment.appointmentNumber}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
            {appointment.status.replace('_', ' ')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="flex items-start space-x-3">
            <CalendarDaysIcon className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-medium text-gray-900">{appointment.appointmentDate}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <ClockIcon className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Time</p>
              <p className="font-medium text-gray-900">{appointment.timeSlot}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            {appointment.appointmentType === 'ONLINE' ? (
              <VideoCameraIcon className="h-5 w-5 text-gray-400 mt-0.5" />
            ) : (
              <UserIcon className="h-5 w-5 text-gray-400 mt-0.5" />
            )}
            <div>
              <p className="text-sm text-gray-600">Type</p>
              <p className="font-medium text-gray-900">
                {getAppointmentTypeText(appointment.appointmentType)}
              </p>
            </div>
          </div>

          {appointment.contactNumber && (
            <div className="flex items-start space-x-3">
              <PhoneIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Contact</p>
                <p className="font-medium text-gray-900">{appointment.contactNumber}</p>
              </div>
            </div>
          )}

          {appointment.clinicName && (
            <div className="flex items-start space-x-3 md:col-span-2">
              <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Clinic</p>
                <p className="font-medium text-gray-900">{appointment.clinicName}</p>
                {appointment.clinicAddress && (
                  <p className="text-sm text-gray-600">{appointment.clinicAddress}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {(appointment.status === 'CONFIRMED' || appointment.status === 'COMPLETED') && (
          <div className="mt-6 pt-6 border-t border-gray-200 flex flex-wrap gap-3">
            {appointment.appointmentType === 'ONLINE' && (
              <Link
                href={`/doctorview/consultations/${appointmentId}`}
                className="btn-primary inline-flex items-center"
              >
                <VideoCameraIcon className="h-5 w-5 mr-2" />
                {appointment.status === 'COMPLETED' ? 'Restart Video Consultation' : 'Start Video Consultation'}
              </Link>
            )}
            {appointment.status === 'CONFIRMED' && (
              <button
                onClick={handleComplete}
                disabled={completing}
                className="btn-primary"
              >
                {completing ? 'Completing...' : 'Mark as Completed'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Prescription Section */}
      {appointment.hasPrescription ? (
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center space-x-3">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900">
                Prescription Already Created
              </h3>
              <p className="text-sm text-green-700">
                You have already created a prescription for this appointment.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Mode Toggle */}
          <div className="mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-2 inline-flex space-x-2">
              <button
                onClick={() => setPrescriptionMode('write')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  prescriptionMode === 'write'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <PencilSquareIcon className="h-5 w-5" />
                Write Digital Prescription
              </button>
              <button
                onClick={() => setPrescriptionMode('upload')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  prescriptionMode === 'upload'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <DocumentArrowUpIcon className="h-5 w-5" />
                Upload PDF
              </button>
            </div>
          </div>

          {/* Conditional Rendering based on mode */}
          {prescriptionMode === 'write' ? (
            <DigitalPrescriptionWriter
              appointmentId={appointment._id}
              onSuccess={fetchAppointment}
            />
          ) : (
            <PrescriptionUpload
              appointmentId={appointment._id}
              onSuccess={fetchAppointment}
            />
          )}
        </>
      )}
    </div>
    </ErrorBoundary>
  )
}
