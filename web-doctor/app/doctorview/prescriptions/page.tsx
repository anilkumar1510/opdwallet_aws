'use client'

import { useEffect, useState, useCallback } from 'react'
import { getDoctorPrescriptions, deletePrescription, Prescription } from '@/lib/api/prescriptions'
import {
  DocumentTextIcon,
  CalendarDaysIcon,
  UserIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentListIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface DigitalPrescription {
  _id: string
  prescriptionId: string
  appointmentId: {
    _id: string
    appointmentId: string
    appointmentNumber: string
    appointmentDate: string
    timeSlot: string
    status: string
  } | string
  doctorId: string
  doctorName: string
  userId: string
  patientName: string
  diagnosis: string
  medicines: any[]
  labTests: any[]
  advice: string
  followUpDate?: string
  createdAt: string
  updatedAt: string
  pdfGenerated: boolean
  pdfPath?: string
  pdfFileName?: string
}

type CombinedPrescription = (Prescription & { type: 'upload' }) | (DigitalPrescription & { type: 'digital' })

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<CombinedPrescription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchPrescriptions = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch both types of prescriptions in parallel
      const [uploadedResponse, digitalResponse] = await Promise.all([
        getDoctorPrescriptions(currentPage, 20).catch(() => ({ prescriptions: [], total: 0, totalPages: 0 })),
        fetch(`/doctor/api/doctor/digital-prescriptions?page=${currentPage}&limit=20`, {
          credentials: 'include',
        }).then(res => res.ok ? res.json() : { prescriptions: [], total: 0, totalPages: 0 })
      ])

      // Combine and sort by date
      const uploadedPrescriptions = uploadedResponse.prescriptions.map((p: Prescription) => ({
        ...p,
        type: 'upload' as const,
        sortDate: new Date(p.uploadDate)
      }))

      const digitalPrescriptions = digitalResponse.prescriptions.map((p: DigitalPrescription) => ({
        ...p,
        type: 'digital' as const,
        sortDate: new Date(p.createdAt)
      }))

      const combined = [...uploadedPrescriptions, ...digitalPrescriptions].sort((a, b) =>
        b.sortDate.getTime() - a.sortDate.getTime()
      )

      setPrescriptions(combined)
      setTotalPages(Math.max(uploadedResponse.totalPages, digitalResponse.totalPages))
    } catch (err: any) {
      setError(err.message || 'Failed to fetch prescriptions')
    } finally {
      setLoading(false)
    }
  }, [currentPage])

  useEffect(() => {
    fetchPrescriptions()
  }, [fetchPrescriptions])

  const handleDelete = async (prescriptionId: string) => {
    if (!confirm('Are you sure you want to delete this prescription?')) return

    try {
      setDeleting(prescriptionId)
      await deletePrescription(prescriptionId)
      await fetchPrescriptions()
    } catch (err: any) {
      alert(err.message || 'Failed to delete prescription')
    } finally {
      setDeleting(null)
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
    // timeSlot format is typically like "09:00", "14:30", etc.
    const [hours, minutes] = timeSlot.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Prescriptions
          </h1>
          <p className="text-gray-600">
            View and manage all prescriptions (digital and uploaded)
          </p>
        </div>

        <button
          onClick={fetchPrescriptions}
          className="text-sm text-brand-600 hover:text-brand-700 font-medium"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="text-center py-12 card">
          <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No prescriptions found
          </h3>
          <p className="text-gray-600">
            You haven't uploaded any prescriptions yet.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {prescriptions.map((prescription) => (
              <div key={prescription._id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                        prescription.type === 'digital' ? 'bg-green-100' : 'bg-brand-100'
                      }`}>
                        {prescription.type === 'digital' ? (
                          <ClipboardDocumentListIcon className="h-6 w-6 text-green-600" />
                        ) : (
                          <DocumentTextIcon className="h-6 w-6 text-brand-600" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {prescription.type === 'digital'
                            ? prescription.prescriptionId
                            : (prescription as any).fileName}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          prescription.type === 'digital'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {prescription.type === 'digital' ? 'Digital' : 'Uploaded'}
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
                            {formatDate(prescription.type === 'digital' ? prescription.createdAt : (prescription as any).uploadDate)}
                            {prescription.type === 'digital' &&
                             typeof prescription.appointmentId === 'object' &&
                             prescription.appointmentId?.timeSlot && (
                              <span className="text-gray-500"> • {formatTime(prescription.appointmentId.timeSlot)}</span>
                            )}
                          </span>
                        </div>

                        {prescription.type === 'upload' && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Size:</span> {formatFileSize((prescription as any).fileSize)}
                          </div>
                        )}
                      </div>

                      {prescription.diagnosis && (
                        <div className="mb-2">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Diagnosis:</span> {prescription.diagnosis}
                          </p>
                        </div>
                      )}

                      {prescription.type === 'digital' && (
                        <div className="flex gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Medicines:</span> {prescription.medicines?.length || 0}
                          </div>
                          <div>
                            <span className="font-medium">Lab Tests:</span> {prescription.labTests?.length || 0}
                          </div>
                        </div>
                      )}

                      {prescription.type === 'upload' && (prescription as any).notes && (
                        <div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Notes:</span> {(prescription as any).notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {/* View Details button for all prescriptions */}
                    <Link
                      href={`/doctorview/prescriptions/${prescription.prescriptionId}`}
                      className="p-2 text-gray-600 hover:text-brand-600 transition-colors"
                      title="View Details"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </Link>

                    {prescription.type === 'digital' ? (
                      <>
                        {prescription.pdfGenerated && (
                          <a
                            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/doctor/digital-prescriptions/${prescription.prescriptionId}/download-pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-600 hover:text-brand-600 transition-colors"
                            title="Download PDF"
                          >
                            <ArrowDownTrayIcon className="h-5 w-5" />
                          </a>
                        )}
                      </>
                    ) : (
                      <>
                        <a
                          href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/doctor/prescriptions/${prescription.prescriptionId}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-600 hover:text-brand-600 transition-colors"
                          title="Download PDF"
                        >
                          <ArrowDownTrayIcon className="h-5 w-5" />
                        </a>
                        <button
                          onClick={() => handleDelete(prescription.prescriptionId)}
                          disabled={deleting === prescription.prescriptionId}
                          className="p-2 text-gray-600 hover:text-red-600 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>

              <span className="px-4 py-2 text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
