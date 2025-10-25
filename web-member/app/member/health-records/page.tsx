'use client'

import { useState, useEffect } from 'react'
import { ArrowLeftIcon, DocumentTextIcon, CloudArrowDownIcon, MagnifyingGlassIcon, CalendarIcon, ClockIcon, MapPinIcon, VideoCameraIcon, EyeIcon, UserIcon, BeakerIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { Card } from '@/components/Card'

interface AppointmentInfo {
  appointmentId: string
  appointmentNumber: string
  appointmentType: string
  appointmentDate: string
  timeSlot: string
  clinicName?: string
  clinicAddress?: string
  specialty: string
  consultationFee: number
  status: string
}

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

interface Prescription {
  _id: string
  prescriptionId: string
  doctorName: string
  patientName: string
  uploadDate: string
  diagnosis?: string
  notes?: string
  fileName: string
  fileSize: number
  appointmentId?: AppointmentInfo
}

interface DigitalPrescription {
  _id: string
  prescriptionId: string
  doctorName: string
  doctorQualification?: string
  patientName: string
  createdDate: string
  chiefComplaint?: string
  clinicalFindings?: string
  diagnosis?: string
  medicines: MedicineItem[]
  labTests: LabTestItem[]
  generalInstructions?: string
  dietaryAdvice?: string
  followUpDate?: string
  followUpInstructions?: string
  prescriptionType: 'DIGITAL' | 'UPLOADED_PDF'
  pdfGenerated: boolean
  appointmentId?: AppointmentInfo
}

export default function HealthRecordsPage() {
  const [activeTab, setActiveTab] = useState('prescriptions')
  const [searchTerm, setSearchTerm] = useState('')
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [digitalPrescriptions, setDigitalPrescriptions] = useState<DigitalPrescription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (activeTab === 'prescriptions') {
      fetchAllPrescriptions()
    }
  }, [activeTab])

  const fetchAllPrescriptions = async () => {
    try {
      setLoading(true)

      // Fetch both PDF and digital prescriptions in parallel
      const [pdfResponse, digitalResponse] = await Promise.all([
        fetch('/api/member/prescriptions', { credentials: 'include' }),
        fetch('/api/member/digital-prescriptions', { credentials: 'include' })
      ])

      if (pdfResponse.ok) {
        const pdfData = await pdfResponse.json()
        setPrescriptions(pdfData.prescriptions || [])
      }

      if (digitalResponse.ok) {
        const digitalData = await digitalResponse.json()
        setDigitalPrescriptions(digitalData.prescriptions || [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const viewPrescription = async (prescriptionId: string) => {
    try {
      const response = await fetch(`/api/member/prescriptions/${prescriptionId}/download`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to view prescription')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (err: any) {
      alert(err.message || 'Failed to view prescription')
    }
  }

  const downloadPrescription = async (prescriptionId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/member/prescriptions/${prescriptionId}/download`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to download prescription')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(err.message || 'Failed to download prescription')
    }
  }

  const downloadDigitalPrescriptionPDF = async (prescriptionId: string) => {
    try {
      const response = await fetch(`/api/member/digital-prescriptions/${prescriptionId}/download-pdf`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to download prescription PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `prescription-${prescriptionId}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(err.message || 'Failed to download prescription PDF')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredPrescriptions = prescriptions.filter(p =>
    p.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.diagnosis && p.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())) ||
    p.patientName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredDigitalPrescriptions = digitalPrescriptions.filter(p =>
    p.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.diagnosis && p.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())) ||
    p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.medicines && p.medicines.some(m =>
      m.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.genericName && m.genericName.toLowerCase().includes(searchTerm.toLowerCase()))
    ))
  )

  const totalPrescriptions = filteredPrescriptions.length + filteredDigitalPrescriptions.length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/member" className="mr-4">
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Health Records</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search prescriptions by doctor, diagnosis, or patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'prescriptions'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Prescriptions
          </button>
          <button
            onClick={() => setActiveTab('bills')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'bills'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Bills & Invoices
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Content */}
        {activeTab === 'prescriptions' ? (
          loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Digital Prescriptions */}
              {filteredDigitalPrescriptions.map((prescription) => {
                const appointment = prescription.appointmentId
                return (
                  <Card key={prescription._id} className="hover:shadow-md transition-shadow overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                          <h3 className="text-lg font-bold text-blue-900">Digital Prescription</h3>
                        </div>
                        <span className="text-xs px-3 py-1 rounded-full bg-blue-600 text-white font-medium">
                          {prescription.prescriptionType}
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Appointment Details */}
                      {appointment && (
                        <div className="mb-6 pb-6 border-b border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Appointment Details</h4>
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <UserIcon className="h-5 w-5 text-brand-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-base font-semibold text-gray-900">{prescription.doctorName}</p>
                                {prescription.doctorQualification && (
                                  <p className="text-sm text-gray-600">{prescription.doctorQualification}</p>
                                )}
                                <p className="text-sm text-gray-600">{appointment.specialty}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <CalendarIcon className="h-5 w-5 text-brand-600 flex-shrink-0" />
                              <span className="text-sm font-medium text-gray-900">{formatDate(appointment.appointmentDate)}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Clinical Information */}
                      {(prescription.chiefComplaint || prescription.diagnosis) && (
                        <div className="mb-6 pb-6 border-b border-gray-200 space-y-3">
                          {prescription.chiefComplaint && (
                            <div>
                              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Chief Complaint</p>
                              <p className="text-base text-gray-900">{prescription.chiefComplaint}</p>
                            </div>
                          )}
                          {prescription.diagnosis && (
                            <div>
                              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Diagnosis</p>
                              <p className="text-base text-gray-900">{prescription.diagnosis}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Medicines */}
                      {prescription.medicines && prescription.medicines.length > 0 && (
                        <div className="mb-6 pb-6 border-b border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Prescribed Medicines (Rx)</h4>
                          <div className="space-y-3">
                            {prescription.medicines.map((medicine, idx) => (
                              <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-start justify-between mb-2">
                                  <p className="font-semibold text-gray-900">{medicine.medicineName}</p>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                  <div>
                                    <span className="text-gray-500">Dosage:</span>
                                    <p className="text-gray-900 font-medium">{medicine.dosage}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Frequency:</span>
                                    <p className="text-gray-900 font-medium">{medicine.frequency}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Duration:</span>
                                    <p className="text-gray-900 font-medium">{medicine.duration}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Route:</span>
                                    <p className="text-gray-900 font-medium">{medicine.route}</p>
                                  </div>
                                </div>
                                {medicine.instructions && (
                                  <p className="text-sm text-gray-600 mt-2 italic">{medicine.instructions}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Lab Tests */}
                      {prescription.labTests && prescription.labTests.length > 0 && (
                        <div className="mb-6 pb-6 border-b border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                            <BeakerIcon className="h-4 w-4" />
                            Lab Tests / Investigations
                          </h4>
                          <div className="space-y-2">
                            {prescription.labTests.map((test, idx) => (
                              <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                                <p className="font-medium text-gray-900">{idx + 1}. {test.testName}</p>
                                {test.instructions && (
                                  <p className="text-sm text-gray-600 mt-1">{test.instructions}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Instructions */}
                      {(prescription.generalInstructions || prescription.dietaryAdvice) && (
                        <div className="mb-6 pb-6 border-b border-gray-200 space-y-3">
                          {prescription.generalInstructions && (
                            <div>
                              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">General Instructions</p>
                              <p className="text-sm text-gray-700 leading-relaxed">{prescription.generalInstructions}</p>
                            </div>
                          )}
                          {prescription.dietaryAdvice && (
                            <div>
                              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Dietary Advice</p>
                              <p className="text-sm text-gray-700 leading-relaxed">{prescription.dietaryAdvice}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Follow-up */}
                      {(prescription.followUpDate || prescription.followUpInstructions) && (
                        <div className="mb-6 pb-6 border-b border-gray-200">
                          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Follow-up</p>
                          {prescription.followUpDate && (
                            <p className="text-sm text-gray-900">Date: {formatDate(prescription.followUpDate)}</p>
                          )}
                          {prescription.followUpInstructions && (
                            <p className="text-sm text-gray-700 mt-1">{prescription.followUpInstructions}</p>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        {prescription.pdfGenerated && (
                          <button
                            onClick={() => downloadDigitalPrescriptionPDF(prescription.prescriptionId)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
                          >
                            <CloudArrowDownIcon className="h-5 w-5" />
                            Download PDF
                          </button>
                        )}
                      </div>

                      {/* Prescription ID & Date */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-400 text-center">
                          ID: {prescription.prescriptionId} • Created: {formatDate(prescription.createdDate)}
                        </p>
                      </div>
                    </div>
                  </Card>
                )
              })}

              {/* PDF Prescriptions */}
              {filteredPrescriptions.map((prescription) => {
                const appointment = prescription.appointmentId
                return (
                  <Card key={prescription._id} className="hover:shadow-md transition-shadow overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-brand-50 to-brand-100 px-6 py-4 border-b border-brand-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DocumentTextIcon className="h-5 w-5 text-brand-600" />
                          <h3 className="text-lg font-bold text-brand-900">Prescription</h3>
                        </div>
                        <span className="text-xs px-3 py-1 rounded-full bg-green-600 text-white font-medium">
                          Active
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Appointment Details Section */}
                      {appointment && (
                        <div className="mb-6 pb-6 border-b border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Appointment Details</h4>

                          <div className="space-y-3">
                            {/* Doctor & Specialty */}
                            <div className="flex items-start gap-3">
                              <UserIcon className="h-5 w-5 text-brand-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-base font-semibold text-gray-900">{appointment.doctorName || prescription.doctorName}</p>
                                <p className="text-sm text-gray-600">{appointment.specialty}</p>
                              </div>
                            </div>

                            {/* Date & Time */}
                            <div className="flex items-center gap-3">
                              <CalendarIcon className="h-5 w-5 text-brand-600 flex-shrink-0" />
                              <div className="flex items-center gap-4">
                                <span className="text-sm font-medium text-gray-900">{formatDate(appointment.appointmentDate)}</span>
                                <div className="flex items-center gap-1">
                                  <ClockIcon className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm text-gray-600">{appointment.timeSlot}</span>
                                </div>
                              </div>
                            </div>

                            {/* Location/Type */}
                            <div className="flex items-start gap-3">
                              {appointment.appointmentType === 'ONLINE' ? (
                                <>
                                  <VideoCameraIcon className="h-5 w-5 text-brand-600 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">Online Consultation</p>
                                    <p className="text-xs text-gray-500">Video Call</p>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <MapPinIcon className="h-5 w-5 text-brand-600 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{appointment.clinicName || "In-Clinic Visit"}</p>
                                    {appointment.clinicAddress && (
                                      <p className="text-xs text-gray-500">{appointment.clinicAddress}</p>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Patient */}
                            <div className="flex items-center gap-3">
                              <UserIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-600">Patient: <span className="font-medium text-gray-900">{prescription.patientName}</span></span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Clinical Information */}
                      {(prescription.diagnosis || prescription.notes) && (
                        <div className="mb-6 pb-6 border-b border-gray-200 space-y-3">
                          {prescription.diagnosis && (
                            <div>
                              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Diagnosis</p>
                              <p className="text-base text-gray-900">{prescription.diagnosis}</p>
                            </div>
                          )}

                          {prescription.notes && (
                            <div>
                              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Doctor&apos;s Notes</p>
                              <p className="text-sm text-gray-700 leading-relaxed">{prescription.notes}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* File Information */}
                      <div className="mb-6 pb-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-red-50 p-2 rounded-lg">
                              <DocumentTextIcon className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{prescription.fileName}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(prescription.fileSize)} • PDF Document</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          <p>Uploaded: {formatDate(prescription.uploadDate)} • {formatTime(prescription.uploadDate)}</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => viewPrescription(prescription.prescriptionId)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
                        >
                          <EyeIcon className="h-5 w-5" />
                          View PDF
                        </button>
                        <button
                          onClick={() => downloadPrescription(prescription.prescriptionId, prescription.fileName)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                          <CloudArrowDownIcon className="h-5 w-5" />
                          Download
                        </button>
                      </div>

                      {/* Prescription ID */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-400 text-center">
                          ID: {prescription.prescriptionId}
                        </p>
                      </div>
                    </div>
                  </Card>
                )
              })}

              {totalPrescriptions === 0 && !loading && (
                <div className="text-center py-12">
                  <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No prescriptions found</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Prescriptions from your doctor will appear here
                  </p>
                </div>
              )}
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Bills & Invoices coming soon</p>
          </div>
        )}
      </div>
    </div>
  )
}
