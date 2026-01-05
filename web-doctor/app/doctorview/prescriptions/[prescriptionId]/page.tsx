'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeftIcon,
  UserIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  BeakerIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface MedicineItem {
  medicineName: string
  genericName?: string
  dosage: string
  frequency: string
  duration: string
  route: string
  instructions?: string
}

interface LabTestItem {
  testName: string
  instructions?: string
}

interface DigitalPrescription {
  _id: string
  prescriptionId: string
  doctorName: string
  doctorQualification?: string
  doctorSpecialty?: string
  doctorSignatureUrl?: string
  patientName: string
  createdAt: string
  chiefComplaint?: string
  clinicalFindings?: string
  diagnosis?: string
  medicines: MedicineItem[]
  labTests: LabTestItem[]
  generalInstructions?: string
  dietaryAdvice?: string
  precautions?: string
  followUpDate?: string
  followUpInstructions?: string
  pdfGenerated: boolean
  pdfPath?: string
  pdfFileName?: string
}

interface UploadedPrescription {
  _id: string
  prescriptionId: string
  doctorName: string
  patientName: string
  uploadDate: string
  diagnosis?: string
  notes?: string
  fileName: string
  filePath: string
  fileSize: number
}

type PrescriptionData = {
  type: 'digital'
  data: DigitalPrescription
} | {
  type: 'uploaded'
  data: UploadedPrescription
}

export default function PrescriptionDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const prescriptionId = params.prescriptionId as string

  const [prescription, setPrescription] = useState<PrescriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPrescription()
  }, [prescriptionId])

  const fetchPrescription = async () => {
    try {
      setLoading(true)

      // Try digital prescription first
      const digitalResponse = await fetch(`/doctor/api/doctor/digital-prescriptions/${prescriptionId}`, {
        credentials: 'include',
      })

      if (digitalResponse.ok) {
        const result = await digitalResponse.json()
        setPrescription({
          type: 'digital',
          data: result.prescription,
        })
        return
      }

      // If not found, try uploaded prescription
      const uploadedResponse = await fetch(`/doctor/api/doctor/prescriptions/${prescriptionId}`, {
        credentials: 'include',
      })

      if (uploadedResponse.ok) {
        const result = await uploadedResponse.json()
        setPrescription({
          type: 'uploaded',
          data: result.prescription,
        })
        return
      }

      setError('Prescription not found')
    } catch (err: any) {
      setError(err.message || 'Failed to fetch prescription')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
        </div>
      </div>
    )
  }

  if (error || !prescription) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card bg-red-50 border-red-200">
          <p className="text-red-600">{error || 'Prescription not found'}</p>
          <Link
            href="/doctorview/prescriptions"
            className="mt-4 inline-flex items-center text-brand-600 hover:text-brand-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Prescriptions
          </Link>
        </div>
      </div>
    )
  }

  if (prescription.type === 'digital') {
    const data = prescription.data

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/doctorview/prescriptions"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Prescriptions
        </Link>

        {/* Header */}
        <div className="card mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  Digital Prescription
                </h1>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  Digital
                </span>
              </div>
              <p className="text-sm text-gray-600">ID: {data.prescriptionId}</p>
            </div>
            {data.pdfGenerated && (
              <a
                href={`/doctor/api/doctor/digital-prescriptions/${data.prescriptionId}/download-pdf`}
                className="btn-primary inline-flex items-center"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Download PDF
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="flex items-start space-x-3">
              <UserIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Patient</p>
                <p className="font-medium text-gray-900">{data.patientName}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <UserIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Doctor</p>
                {data.doctorSignatureUrl && (
                  <div className="mb-2">
                    <img
                      src={`/doctor${data.doctorSignatureUrl}`}
                      alt="Doctor Signature"
                      className="h-12 w-auto object-contain"
                      onError={(e) => {
                        // Hide if image fails to load
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}
                <p className="font-medium text-gray-900">{data.doctorName}</p>
                {data.doctorQualification && (
                  <p className="text-sm text-gray-600">{data.doctorQualification}</p>
                )}
                {data.doctorSpecialty && (
                  <p className="text-xs text-gray-500">{data.doctorSpecialty}</p>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CalendarDaysIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-medium text-gray-900">{formatDate(data.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Information */}
        {(data.chiefComplaint || data.clinicalFindings || data.diagnosis) && (
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Clinical Information</h2>
            <div className="space-y-4">
              {data.chiefComplaint && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Chief Complaint</p>
                  <p className="text-gray-900 mt-1">{data.chiefComplaint}</p>
                </div>
              )}
              {data.clinicalFindings && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Clinical Findings</p>
                  <p className="text-gray-900 mt-1">{data.clinicalFindings}</p>
                </div>
              )}
              {data.diagnosis && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Diagnosis</p>
                  <p className="text-gray-900 mt-1">{data.diagnosis}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Medicines */}
        {data.medicines && data.medicines.length > 0 && (
          <div className="card mb-6">
            <div className="flex items-center gap-2 mb-4">
              <DocumentTextIcon className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-semibold text-gray-900">Medicines</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Medicine
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dosage
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Frequency
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Instructions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.medicines.map((med, index) => (
                    <tr key={index}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{med.medicineName}</div>
                        {med.genericName && (
                          <div className="text-xs text-gray-500">{med.genericName}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {med.dosage}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {med.frequency}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {med.duration}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {med.route}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {med.instructions || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Lab Tests */}
        {data.labTests && data.labTests.length > 0 && (
          <div className="card mb-6">
            <div className="flex items-center gap-2 mb-4">
              <BeakerIcon className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-semibold text-gray-900">Lab Tests</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Test Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Instructions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.labTests.map((test, index) => (
                    <tr key={index}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {test.testName}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {test.instructions || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Instructions & Advice */}
        {(data.generalInstructions || data.dietaryAdvice || data.precautions) && (
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Instructions & Advice</h2>
            <div className="space-y-4">
              {data.generalInstructions && (
                <div>
                  <p className="text-sm font-medium text-gray-700">General Instructions</p>
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap">{data.generalInstructions}</p>
                </div>
              )}
              {data.dietaryAdvice && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Dietary Advice</p>
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap">{data.dietaryAdvice}</p>
                </div>
              )}
              {data.precautions && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Precautions</p>
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap">{data.precautions}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Follow-up */}
        {(data.followUpDate || data.followUpInstructions) && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Follow-up</h2>
            <div className="space-y-4">
              {data.followUpDate && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Follow-up Date</p>
                  <p className="text-gray-900 mt-1">{formatDate(data.followUpDate)}</p>
                </div>
              )}
              {data.followUpInstructions && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Follow-up Instructions</p>
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap">{data.followUpInstructions}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Uploaded Prescription
  const data = prescription.data as UploadedPrescription

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <Link
        href="/doctorview/prescriptions"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-2" />
        Back to Prescriptions
      </Link>

      {/* Header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                Uploaded Prescription
              </h1>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                PDF Upload
              </span>
            </div>
            <p className="text-sm text-gray-600">ID: {data.prescriptionId}</p>
          </div>
          <a
            href={`/doctor/api/doctor/prescriptions/${data.prescriptionId}/download`}
            className="btn-primary inline-flex items-center"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Download PDF
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="flex items-start space-x-3">
            <UserIcon className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Patient</p>
              <p className="font-medium text-gray-900">{data.patientName}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <UserIcon className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Doctor</p>
              <p className="font-medium text-gray-900">{data.doctorName}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <CalendarDaysIcon className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Upload Date</p>
              <p className="font-medium text-gray-900">{formatDate(data.uploadDate)}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <div>
              <span className="font-medium">File:</span> {data.fileName}
            </div>
            <div>
              <span className="font-medium">Size:</span> {formatFileSize(data.fileSize)}
            </div>
          </div>
        </div>
      </div>

      {/* Prescription Details */}
      {(data.diagnosis || data.notes) && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Prescription Details</h2>
          <div className="space-y-4">
            {data.diagnosis && (
              <div>
                <p className="text-sm font-medium text-gray-700">Diagnosis</p>
                <p className="text-gray-900 mt-1">{data.diagnosis}</p>
              </div>
            )}
            {data.notes && (
              <div>
                <p className="text-sm font-medium text-gray-700">Notes</p>
                <p className="text-gray-900 mt-1 whitespace-pre-wrap">{data.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PDF Viewer */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Prescription Document</h2>
        <div className="bg-gray-100 rounded-lg overflow-hidden" style={{ height: '800px' }}>
          <iframe
            src={`/doctor/api/doctor/prescriptions/${data.prescriptionId}/download`}
            className="w-full h-full"
            title="Prescription PDF"
          />
        </div>
      </div>
    </div>
  )
}
