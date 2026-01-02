'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getAppointmentDetails, markAppointmentComplete } from '@/lib/api/appointments'
import { Appointment } from '@/lib/api/appointments'
import { getStatusColor, getAppointmentTypeText } from '@/lib/utils/appointment-helpers'
import { getDigitalPrescription } from '@/lib/api/digital-prescriptions'
import PrescriptionUpload from '@/components/PrescriptionUpload'
import DigitalPrescriptionWriter from '@/components/DigitalPrescriptionWriter'
import ConsultationNoteEditor from '@/components/ConsultationNoteEditor'
import PatientHealthRecords from '@/components/PatientHealthRecords'
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
  ClipboardDocumentListIcon,
  EyeIcon,
  ArrowDownTrayIcon,
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
  const [prescription, setPrescription] = useState<any | null>(null)
  const [prescriptionLoading, setPrescriptionLoading] = useState(false)

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

  // Fetch prescription if appointment has one
  useEffect(() => {
    const fetchPrescription = async () => {
      if (appointment?.hasPrescription && appointment?.prescriptionId) {
        try {
          setPrescriptionLoading(true)
          const data = await getDigitalPrescription(appointment.prescriptionId)
          // Extract prescription object from API response
          setPrescription(data.prescription)
        } catch (err: any) {
          console.error('Failed to fetch prescription:', err)
        } finally {
          setPrescriptionLoading(false)
        }
      }
    }

    fetchPrescription()
  }, [appointment?.hasPrescription, appointment?.prescriptionId])

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (timeSlot: string) => {
    if (!timeSlot) return ''
    const [hours, minutes] = timeSlot.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
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

      {/* Patient Health Records Section */}
      {(appointment.status === 'CONFIRMED' || appointment.status === 'COMPLETED') && (
        <div className="mb-6">
          <PatientHealthRecords patientId={appointment.userId} />
        </div>
      )}

      {/* Consultation Notes Section */}
      {(appointment.status === 'CONFIRMED' || appointment.status === 'COMPLETED') && (
        <div className="mb-6">
          <ConsultationNoteEditor
            appointmentId={appointment._id}
            patientId={appointment.userId}
            clinicId={appointment.clinicId}
            consultationDate={new Date(appointment.appointmentDate)}
          />
        </div>
      )}

      {/* Prescription Section */}
      {appointment.hasPrescription ? (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Prescription</h2>
          {prescriptionLoading ? (
            <div className="card">
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
              </div>
            </div>
          ) : prescription ? (
            <div className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-green-100">
                      <ClipboardDocumentListIcon className="h-6 w-6 text-green-600" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        {prescription.prescriptionId}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        Digital
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <UserIcon className="h-4 w-4 mr-2" />
                        <span>{prescription.patientName}</span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarDaysIcon className="h-4 w-4 mr-2" />
                        <span>
                          {formatDate(prescription.createdAt)}
                          {appointment.timeSlot && (
                            <span className="text-gray-500"> • {formatTime(appointment.timeSlot)}</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {prescription.diagnosis && (
                      <div className="mb-2">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Diagnosis:</span> {prescription.diagnosis}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Medicines:</span> {prescription.medicines?.length || 0}
                      </div>
                      <div>
                        <span className="font-medium">Lab Tests:</span> {prescription.labTests?.length || 0}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Link
                    href={`/doctorview/prescriptions/${prescription.prescriptionId}`}
                    className="p-2 text-gray-600 hover:text-brand-600 transition-colors"
                    title="View Details"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </Link>

                  {prescription.pdfGenerated && (
                    <a
                      href={`/api/doctor/digital-prescriptions/${prescription.prescriptionId}/download-pdf`}
                      className="p-2 text-gray-600 hover:text-brand-600 transition-colors"
                      title="Download PDF"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="card bg-yellow-50 border-yellow-200">
              <p className="text-sm text-yellow-700">
                Prescription exists but could not be loaded. Please try refreshing the page.
              </p>
            </div>
          )}
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
