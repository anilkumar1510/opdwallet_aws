'use client'

import { useEffect, useState } from 'react'
import { getDoctorPrescriptions, deletePrescription, Prescription } from '@/lib/api/prescriptions'
import {
  DocumentTextIcon,
  CalendarDaysIcon,
  UserIcon,
  TrashIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline'

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchPrescriptions()
  }, [currentPage])

  const fetchPrescriptions = async () => {
    try {
      setLoading(true)
      const response = await getDoctorPrescriptions(currentPage, 20)
      setPrescriptions(response.prescriptions)
      setTotalPages(response.totalPages)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch prescriptions')
    } finally {
      setLoading(false)
    }
  }

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
            View and manage all uploaded prescriptions
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
                      <div className="h-12 w-12 bg-brand-100 rounded-lg flex items-center justify-center">
                        <DocumentTextIcon className="h-6 w-6 text-brand-600" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {prescription.fileName}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <UserIcon className="h-4 w-4 mr-2" />
                          <span>{prescription.patientName}</span>
                        </div>

                        <div className="flex items-center text-sm text-gray-600">
                          <CalendarDaysIcon className="h-4 w-4 mr-2" />
                          <span>{formatDate(prescription.uploadDate)}</span>
                        </div>

                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Size:</span> {formatFileSize(prescription.fileSize)}
                        </div>
                      </div>

                      {prescription.diagnosis && (
                        <div className="mb-2">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Diagnosis:</span> {prescription.diagnosis}
                          </p>
                        </div>
                      )}

                      {prescription.notes && (
                        <div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Notes:</span> {prescription.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <a
                      href={`/api/doctor/prescriptions/${prescription.prescriptionId}/download`}
                      className="p-2 text-gray-600 hover:text-brand-600 transition-colors"
                      title="Download"
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
