'use client'

import { useState, useEffect } from 'react'
import { Modal } from './ui/Modal'
import { DocumentTextIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline'

interface Prescription {
  _id: string
  prescriptionId: string
  doctorName: string
  createdAt: string
  prescribedDate: string
  patientName: string
  type: 'digital' | 'pdf'
}

interface PrescriptionSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (prescription: Prescription) => void
  serviceType: 'lab' | 'diagnostic'
}

export default function PrescriptionSelectorModal({
  isOpen,
  onClose,
  onSelect,
  serviceType
}: PrescriptionSelectorModalProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchPrescriptions()
    }
  }, [isOpen])

  const fetchPrescriptions = async () => {
    try {
      setLoading(true)

      // Fetch digital prescriptions
      const digitalRes = await fetch('/api/member/digital-prescriptions', {
        credentials: 'include',
      })

      // Fetch PDF prescriptions
      const pdfRes = await fetch('/api/member/prescriptions', {
        credentials: 'include',
      })

      const allPrescriptions: Prescription[] = []

      if (digitalRes.ok) {
        const digitalData = await digitalRes.json()
        const digitalPrescriptions = (digitalData.prescriptions || []).map((p: any) => ({
          _id: p._id,
          prescriptionId: p.prescriptionId || p._id,
          doctorName: p.doctorName || 'Unknown Doctor',
          createdAt: p.createdAt,
          prescribedDate: p.prescribedDate || p.createdAt,
          patientName: p.patientName || '',
          type: 'digital' as const,
        }))
        allPrescriptions.push(...digitalPrescriptions)
      }

      if (pdfRes.ok) {
        const pdfData = await pdfRes.json()
        const pdfPrescriptions = (pdfData.prescriptions || []).map((p: any) => ({
          _id: p._id,
          prescriptionId: p.prescriptionId || p._id,
          doctorName: p.doctorName || 'Unknown Doctor',
          createdAt: p.createdAt,
          prescribedDate: p.prescriptionDate || p.createdAt,
          patientName: p.patientName || '',
          type: 'pdf' as const,
        }))
        allPrescriptions.push(...pdfPrescriptions)
      }

      // Sort by date (newest first)
      allPrescriptions.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      setPrescriptions(allPrescriptions)
    } catch (error) {
      console.error('Error fetching prescriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const handleSubmit = () => {
    if (selectedPrescription) {
      onSelect(selectedPrescription)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Prescription from Health Records"
      description={`Choose a prescription to book ${serviceType === 'lab' ? 'lab tests' : 'diagnostic services'}`}
      size="lg"
    >
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div
              className="h-10 w-10 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: '#0a529f', borderTopColor: 'transparent' }}
            />
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="text-center py-8">
            <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600">No prescriptions found in your health records</p>
            <p className="text-sm text-gray-500 mt-1">
              Upload a new prescription to get started
            </p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-3">
            {prescriptions.map((prescription) => (
              <div
                key={prescription._id}
                onClick={() => setSelectedPrescription(prescription)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelectedPrescription(prescription)
                  }
                }}
                role="button"
                tabIndex={0}
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  selectedPrescription?._id === prescription._id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <UserIcon className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-900">
                        Dr. {prescription.doctorName}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        {prescription.type === 'digital' ? 'Digital' : 'PDF'}
                      </span>
                    </div>
                    {prescription.patientName && (
                      <p className="text-sm text-gray-600 mb-1">
                        Patient: {prescription.patientName}
                      </p>
                    )}
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{formatDate(prescription.prescribedDate)}</span>
                    </div>
                  </div>
                  {selectedPrescription?._id === prescription._id && (
                    <div className="ml-3">
                      <div
                        className="h-6 w-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: '#0a529f' }}
                      >
                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedPrescription}
            className="flex-1 py-2.5 px-4 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: selectedPrescription ? '#0a529f' : '#94a3b8'
            }}
            onMouseEnter={(e) => selectedPrescription && (e.currentTarget.style.backgroundColor = '#084080')}
            onMouseLeave={(e) => selectedPrescription && (e.currentTarget.style.backgroundColor = '#0a529f')}
          >
            Continue
          </button>
        </div>
      </div>
    </Modal>
  )
}
