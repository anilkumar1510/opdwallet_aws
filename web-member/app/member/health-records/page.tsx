'use client'

import { useState, useEffect } from 'react'
import { ArrowLeftIcon, DocumentTextIcon, CloudArrowDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { Card } from '@/components/Card'

interface Prescription {
  _id: string
  prescriptionId: string
  doctorName: string
  patientName: string
  uploadDate: string
  diagnosis?: string
  notes?: string
  fileName: string
}

export default function HealthRecordsPage() {
  const [activeTab, setActiveTab] = useState('prescriptions')
  const [searchTerm, setSearchTerm] = useState('')
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (activeTab === 'prescriptions') {
      fetchPrescriptions()
    }
  }, [activeTab])

  const fetchPrescriptions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/member/prescriptions', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch prescriptions')
      }

      const data = await response.json()
      setPrescriptions(data.prescriptions || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
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

  const filteredPrescriptions = prescriptions.filter(p =>
    p.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.diagnosis && p.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())) ||
    p.patientName.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
            <div className="space-y-4">
              {filteredPrescriptions.map((prescription) => (
                <Card key={prescription._id} className="hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{prescription.doctorName}</h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                          Active
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">Patient: {prescription.patientName}</p>
                      <p className="text-sm text-gray-500 mb-3">
                        {new Date(prescription.uploadDate).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>

                      {prescription.diagnosis && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Diagnosis:</p>
                          <p className="text-sm text-gray-900">{prescription.diagnosis}</p>
                        </div>
                      )}

                      {prescription.notes && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Doctor's Notes:</p>
                          <p className="text-sm text-gray-600">{prescription.notes}</p>
                        </div>
                      )}

                      <div className="mt-3">
                        <p className="text-xs text-gray-500">
                          Prescription ID: {prescription.prescriptionId}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => downloadPrescription(prescription.prescriptionId, prescription.fileName)}
                      className="ml-4 p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      title="Download Prescription"
                    >
                      <CloudArrowDownIcon className="h-5 w-5" />
                    </button>
                  </div>
                </Card>
              ))}

              {filteredPrescriptions.length === 0 && !loading && (
                <div className="text-center py-12">
                  <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No prescriptions found</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Prescriptions uploaded by your doctor will appear here
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
