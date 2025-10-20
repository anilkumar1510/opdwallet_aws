'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { MagnifyingGlassIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'

interface LabService {
  _id: string
  serviceId: string
  name: string
  code: string
  category: string
}

interface SelectedTest {
  serviceId: string
  serviceName: string
  serviceCode: string
  category: string
}

interface Prescription {
  prescriptionId: string
  patientName: string
  fileName: string
  filePath: string
  status: string
}

export default function DigitizePrescriptionPage() {
  const router = useRouter()
  const params = useParams()
  const prescriptionId = params.id as string

  const [prescription, setPrescription] = useState<Prescription | null>(null)
  const [services, setServices] = useState<LabService[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTests, setSelectedTests] = useState<SelectedTest[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const fetchPrescription = useCallback(async () => {
    try {
      const response = await fetch(`/api/ops/lab/prescriptions/${prescriptionId}`, {
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Failed to fetch prescription')

      const data = await response.json()
      setPrescription(data.data)
    } catch (error) {
      console.error('Error fetching prescription:', error)
      toast.error('Failed to fetch prescription')
    } finally {
      setLoading(false)
    }
  }, [prescriptionId])

  const fetchServices = async () => {
    try {
      const response = await apiFetch('/api/admin/lab/services')

      if (!response.ok) throw new Error('Failed to fetch services')

      const data = await response.json()
      setServices(data.data || [])
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  useEffect(() => {
    fetchPrescription()
    fetchServices()
  }, [fetchPrescription])

  const handleAddTest = (service: LabService) => {
    if (selectedTests.find((t) => t.serviceId === service.serviceId)) {
      toast.warning('Test already added')
      return
    }

    setSelectedTests([
      ...selectedTests,
      {
        serviceId: service.serviceId,
        serviceName: service.name,
        serviceCode: service.code,
        category: service.category,
      },
    ])
    setSearchQuery('')
  }

  const handleRemoveTest = (serviceId: string) => {
    setSelectedTests(selectedTests.filter((t) => t.serviceId !== serviceId))
  }

  const handleSubmit = async (status: 'DIGITIZED' | 'DELAYED') => {
    if (status === 'DIGITIZED' && selectedTests.length === 0) {
      toast.error('Please add at least one test')
      return
    }

    let delayReason = ''
    if (status === 'DELAYED') {
      delayReason = prompt('Please enter delay reason:') || ''
      if (!delayReason) return
    }

    setSubmitting(true)

    try {
      const response = await fetch(`/api/ops/lab/prescriptions/${prescriptionId}/digitize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          prescriptionId,
          items: selectedTests,
          status,
          delayReason: status === 'DELAYED' ? delayReason : undefined,
        }),
      })

      if (!response.ok) throw new Error('Failed to digitize prescription')

      const data = await response.json()
      toast.success(data.message)
      router.push('/ops/lab/prescriptions')
    } catch (error) {
      console.error('Error digitizing prescription:', error)
      toast.error('Failed to digitize prescription')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredServices = services.filter(
    (service) =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Digitize Prescription</h1>
        <p className="text-sm text-gray-600 mt-1">
          ID: {prescription?.prescriptionId} | Patient: {prescription?.patientName}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left: Prescription Image */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold mb-4">Prescription Image</h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <img
              src={prescription?.filePath}
              alt="Prescription"
              className="w-full h-auto"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EPrescription Image%3C/text%3E%3C/svg%3E'
              }}
            />
          </div>
        </div>

        {/* Right: Test Selection */}
        <div className="space-y-4">
          {/* Search Tests */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold mb-4">Search & Add Tests</h3>
            <div className="relative mb-4">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by test name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {searchQuery && (
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                {filteredServices.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">No tests found</p>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredServices.slice(0, 10).map((service) => (
                      <button
                        key={service._id}
                        type="button"
                        className="p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center w-full text-left border-0"
                        onClick={() => handleAddTest(service)}
                      >
                        <div>
                          <p className="font-medium text-sm">{service.name}</p>
                          <p className="text-xs text-gray-500">
                            {service.code} | {service.category}
                          </p>
                        </div>
                        <PlusIcon className="h-5 w-5 text-blue-600" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected Tests */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold mb-4">Selected Tests ({selectedTests.length})</h3>

            {selectedTests.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No tests added yet</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {selectedTests.map((test) => (
                  <div
                    key={test.serviceId}
                    className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{test.serviceName}</p>
                      <p className="text-xs text-gray-600">
                        {test.serviceCode} | {test.category}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveTest(test.serviceId)}
                      className="ml-2 p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={() => router.back()}
              disabled={submitting}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSubmit('DELAYED')}
              disabled={submitting}
              className="flex-1 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              Mark Delayed
            </button>
            <button
              onClick={() => handleSubmit('DIGITIZED')}
              disabled={submitting || selectedTests.length === 0}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating Cart...' : 'Create Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
