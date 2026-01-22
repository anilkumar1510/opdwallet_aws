'use client'

import { useState, useEffect } from 'react'
import { useFamily } from '@/contexts/FamilyContext'
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
  const { viewingUserId } = useFamily()
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
  }, [activeTab, viewingUserId])

  const fetchAllPrescriptions = async () => {
    try {
      setLoading(true)

      // Build query params with userId if viewing dependent
      const params = new URLSearchParams()
      if (viewingUserId) {
        params.append('userId', viewingUserId)
      }
      const queryString = params.toString() ? `?${params}` : ''

      // Fetch both PDF and digital prescriptions in parallel
      const [pdfResponse, digitalResponse] = await Promise.all([
        fetch(`/api/member/prescriptions${queryString}`, { credentials: 'include' }),
        fetch(`/api/member/digital-prescriptions${queryString}`, { credentials: 'include' })
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
    <div className="min-h-screen" style={{ background: '#f7f7fc' }}>
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm" style={{ borderColor: '#e5e7eb' }}>
        <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/member">
              <button className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                <ArrowLeftIcon className="h-6 w-6" style={{ color: '#0E51A2' }} />
              </button>
            </Link>
            <div className="flex-1">
              <h1 className="text-lg lg:text-xl font-bold" style={{ color: '#0E51A2' }}>Health Records</h1>
              <p className="text-xs lg:text-sm text-gray-600">View your prescriptions and medical records</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-6 lg:py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search prescriptions by doctor, diagnosis, or patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all"
              style={{
                borderColor: '#e5e7eb',
                backgroundColor: '#ffffff'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#0F5FDC'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(15, 95, 220, 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b-2 mb-6 overflow-x-auto" style={{ borderColor: '#e5e7eb' }}>
          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`py-4 px-4 font-semibold text-sm lg:text-base transition-all whitespace-nowrap ${
              activeTab === 'prescriptions' ? 'border-b-4' : 'border-transparent'
            }`}
            style={activeTab === 'prescriptions' ? { borderColor: '#0F5FDC', color: '#0E51A2' } : { color: '#6b7280' }}
          >
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5" />
              <span>Prescriptions</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('bills')}
            className={`py-4 px-4 font-semibold text-sm lg:text-base transition-all whitespace-nowrap ${
              activeTab === 'bills' ? 'border-b-4' : 'border-transparent'
            }`}
            style={activeTab === 'bills' ? { borderColor: '#0F5FDC', color: '#0E51A2' } : { color: '#6b7280' }}
          >
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5" />
              <span>Bills & Invoices</span>
            </div>
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
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Digital Prescriptions */}
              {filteredDigitalPrescriptions.map((prescription) => {
                const appointment = prescription.appointmentId
                return (
                  <div
                    key={prescription._id}
                    className="rounded-2xl p-5 lg:p-6 border-2 shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden"
                    style={{
                      background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
                      borderColor: '#86ACD8'
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                          style={{
                            background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                            border: '1px solid #A4BFFE7A',
                            boxShadow: '-2px 11px 46.1px 0px #0000000D'
                          }}
                        >
                          <DocumentTextIcon className="h-6 w-6" style={{ color: '#0F5FDC' }} />
                        </div>
                        <div>
                          <h3 className="text-base lg:text-lg font-bold" style={{ color: '#0E51A2' }}>Digital Prescription</h3>
                          <p className="text-xs text-gray-600">{prescription.prescriptionType}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Appointment Details */}
                      {appointment && (
                        <div className="pb-4 border-b border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Appointment Details</h4>
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <UserIcon className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#0F5FDC' }} />
                              <div>
                                <p className="text-base font-semibold text-gray-900">{prescription.doctorName}</p>
                                {prescription.doctorQualification && (
                                  <p className="text-sm text-gray-600">{prescription.doctorQualification}</p>
                                )}
                                <p className="text-sm text-gray-600">{appointment.specialty}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <CalendarIcon className="h-5 w-5 flex-shrink-0" style={{ color: '#0F5FDC' }} />
                              <span className="text-sm font-medium text-gray-900">{formatDate(appointment.appointmentDate)}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Clinical Information */}
                      {(prescription.chiefComplaint || prescription.diagnosis) && (
                        <div className="pb-4 border-b border-gray-200 space-y-3">
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
                        <div className="pb-4 border-b border-gray-200">
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
                        <div className="pb-4 border-b border-gray-200">
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
                        <div className="pb-4 border-b border-gray-200 space-y-3">
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
                        <div className="pb-4 border-b border-gray-200">
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
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-white rounded-xl font-semibold transition-all hover:shadow-lg"
                            style={{ background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)' }}
                          >
                            <CloudArrowDownIcon className="h-5 w-5" />
                            Download PDF
                          </button>
                        )}
                      </div>

                      {/* Prescription ID & Date */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 text-center">
                          ID: {prescription.prescriptionId} • Created: {formatDate(prescription.createdDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* PDF Prescriptions */}
              {filteredPrescriptions.map((prescription) => {
                const appointment = prescription.appointmentId
                return (
                  <div
                    key={prescription._id}
                    className="rounded-2xl p-5 lg:p-6 border-2 shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden"
                    style={{
                      background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
                      borderColor: '#86ACD8'
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                          style={{
                            background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                            border: '1px solid #A4BFFE7A',
                            boxShadow: '-2px 11px 46.1px 0px #0000000D'
                          }}
                        >
                          <DocumentTextIcon className="h-6 w-6" style={{ color: '#0F5FDC' }} />
                        </div>
                        <div>
                          <h3 className="text-base lg:text-lg font-bold" style={{ color: '#0E51A2' }}>PDF Prescription</h3>
                          <p className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium inline-block">Active</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Appointment Details Section */}
                      {appointment && (
                        <div className="pb-4 border-b border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Appointment Details</h4>

                          <div className="space-y-3">
                            {/* Doctor & Specialty */}
                            <div className="flex items-start gap-3">
                              <UserIcon className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#0F5FDC' }} />
                              <div>
                                <p className="text-base font-semibold text-gray-900">{appointment.doctorName || prescription.doctorName}</p>
                                <p className="text-sm text-gray-600">{appointment.specialty}</p>
                              </div>
                            </div>

                            {/* Date & Time */}
                            <div className="flex items-center gap-3">
                              <CalendarIcon className="h-5 w-5 flex-shrink-0" style={{ color: '#0F5FDC' }} />
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
                                  <VideoCameraIcon className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#0F5FDC' }} />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">Online Consultation</p>
                                    <p className="text-xs text-gray-500">Video Call</p>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <MapPinIcon className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#0F5FDC' }} />
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
                        <div className="pb-4 border-b border-gray-200 space-y-3">
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
                      <div className="pb-4 border-b border-gray-200">
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
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-white rounded-xl font-semibold transition-all hover:shadow-lg"
                          style={{ background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)' }}
                        >
                          <EyeIcon className="h-5 w-5" />
                          View PDF
                        </button>
                        <button
                          onClick={() => downloadPrescription(prescription.prescriptionId, prescription.fileName)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-gray-700 rounded-xl font-semibold border-2 transition-all hover:shadow-lg"
                          style={{ borderColor: '#86ACD8' }}
                        >
                          <CloudArrowDownIcon className="h-5 w-5" />
                          Download
                        </button>
                      </div>

                      {/* Prescription ID */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 text-center">
                          ID: {prescription.prescriptionId}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}

              {totalPrescriptions === 0 && !loading && (
                <div className="rounded-2xl p-8 lg:p-12 text-center border-2 shadow-md" style={{
                  background: 'linear-gradient(169.98deg, #EFF4FF 19.71%, #FEF3E9 66.63%, #FEF3E9 108.92%)',
                  borderColor: '#86ACD8'
                }}>
                  <div
                    className="w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{
                      background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                      border: '1px solid #A4BFFE7A',
                      boxShadow: '-2px 11px 46.1px 0px #0000000D'
                    }}
                  >
                    <DocumentTextIcon className="h-8 w-8 lg:h-10 lg:w-10" style={{ color: '#0F5FDC' }} />
                  </div>
                  <h3 className="text-xl lg:text-2xl font-bold mb-2" style={{ color: '#0E51A2' }}>No prescriptions found</h3>
                  <p className="text-gray-600 text-sm lg:text-base">
                    Prescriptions from your doctor will appear here
                  </p>
                </div>
              )}
            </div>
          )
        ) : (
          <div className="rounded-2xl p-8 lg:p-12 text-center border-2 shadow-md" style={{
            background: 'linear-gradient(169.98deg, #EFF4FF 19.71%, #FEF3E9 66.63%, #FEF3E9 108.92%)',
            borderColor: '#86ACD8'
          }}>
            <div
              className="w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{
                background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                border: '1px solid #A4BFFE7A',
                boxShadow: '-2px 11px 46.1px 0px #0000000D'
              }}
            >
              <DocumentTextIcon className="h-8 w-8 lg:h-10 lg:w-10" style={{ color: '#0F5FDC' }} />
            </div>
            <h3 className="text-xl lg:text-2xl font-bold mb-2" style={{ color: '#0E51A2' }}>Bills & Invoices</h3>
            <p className="text-gray-600 text-sm lg:text-base">Coming soon</p>
          </div>
        )}
      </div>
    </div>
  )
}
