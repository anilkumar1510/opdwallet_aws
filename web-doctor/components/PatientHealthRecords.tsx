'use client'

import { useState, useEffect } from 'react'
import { getPatientHealthRecords, PatientHealthRecords as HealthRecordsType } from '@/lib/api/health-records'
import {
  ExclamationTriangleIcon,
  HeartIcon,
  BeakerIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline'

interface PatientHealthRecordsProps {
  patientId: string
}

export default function PatientHealthRecords({ patientId }: PatientHealthRecordsProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [records, setRecords] = useState<HealthRecordsType | null>(null)
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    loadRecords()
  }, [patientId])

  const loadRecords = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getPatientHealthRecords(patientId)
      setRecords(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load patient health records')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="card">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card bg-red-50 border-red-200">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    )
  }

  if (!records) {
    return null
  }

  return (
    <div className="card">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-2">
          <ClipboardDocumentListIcon className="h-6 w-6 text-[#2B4D8C]" />
          <h3 className="text-lg font-semibold text-gray-900">Patient Health Records</h3>
        </div>
        <button type="button" className="text-gray-500 hover:text-gray-700">
          {expanded ? (
            <ChevronUpIcon className="h-5 w-5" />
          ) : (
            <ChevronDownIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Allergies */}
          {records.patient.allergies.length > 0 && (
            <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
              <div className="flex items-center space-x-2 mb-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                <h4 className="font-semibold text-red-900">Known Allergies</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {records.patient.allergies.map((allergy, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium"
                  >
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Chronic Conditions */}
          {records.patient.chronicConditions.length > 0 && (
            <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
              <div className="flex items-center space-x-2 mb-2">
                <HeartIcon className="h-5 w-5 text-orange-600" />
                <h4 className="font-semibold text-orange-900">Chronic Conditions</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {records.patient.chronicConditions.map((condition, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium"
                  >
                    {condition}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Current Medications */}
          {records.patient.currentMedications.length > 0 && (
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <div className="flex items-center space-x-2 mb-2">
                <BeakerIcon className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-blue-900">Current Medications</h4>
              </div>
              <ul className="list-disc list-inside space-y-1">
                {records.patient.currentMedications.map((medication, index) => (
                  <li key={index} className="text-sm text-blue-800">
                    {medication}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Past Prescriptions */}
          {records.prescriptions.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center space-x-2 mb-3">
                <ClipboardDocumentListIcon className="h-5 w-5 text-gray-700" />
                <h4 className="font-semibold text-gray-900">Past Prescriptions</h4>
                <span className="text-xs text-gray-600">
                  ({records.prescriptions.length} total)
                </span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {records.prescriptions.slice(0, 10).map((prescription, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {prescription.prescriptionId}
                          </span>
                          <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-600">
                            {formatDate(prescription.createdAt)}
                          </span>
                        </div>
                        {prescription.diagnosis && (
                          <p className="text-xs text-gray-600 mb-1">
                            <span className="font-medium">Diagnosis:</span> {prescription.diagnosis}
                          </p>
                        )}
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          <span>
                            {prescription.medicines?.length || 0} medicines
                          </span>
                          {prescription.labTests && prescription.labTests.length > 0 && (
                            <span>
                              {prescription.labTests.length} lab tests
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {records.prescriptions.length > 10 && (
                  <p className="text-xs text-gray-500 text-center pt-2">
                    Showing 10 of {records.prescriptions.length} prescriptions
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Consultation History */}
          {records.consultationHistory && records.consultationHistory.length > 0 && (
            <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
              <div className="flex items-center space-x-2 mb-3">
                <CalendarDaysIcon className="h-5 w-5 text-purple-600" />
                <h4 className="font-semibold text-purple-900">Consultation History</h4>
                <span className="text-xs text-purple-600">
                  ({records.consultationHistory.length} consultations)
                </span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {records.consultationHistory.slice(0, 5).map((consultation, index) => (
                  <div
                    key={index}
                    className="p-2 bg-white rounded border border-purple-200 text-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-purple-900">
                        {formatDate(consultation.consultationDate)}
                      </span>
                      {consultation.provisionalDiagnosis && (
                        <span className="text-xs text-purple-700">
                          {consultation.provisionalDiagnosis}
                        </span>
                      )}
                    </div>
                    {consultation.chiefComplaint && (
                      <p className="text-xs text-purple-600">
                        {consultation.chiefComplaint}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {records.patient.allergies.length === 0 &&
            records.patient.chronicConditions.length === 0 &&
            records.patient.currentMedications.length === 0 &&
            records.prescriptions.length === 0 &&
            records.consultationHistory.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No health records available for this patient.</p>
                <p className="text-xs mt-1">Records will appear here as you add prescriptions and notes.</p>
              </div>
            )}
        </div>
      )}
    </div>
  )
}
