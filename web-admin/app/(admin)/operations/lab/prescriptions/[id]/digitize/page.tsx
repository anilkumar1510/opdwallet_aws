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
  console.log('🔍 [COMPONENT] DigitizePrescriptionPage rendering')

  const router = useRouter()
  const params = useParams()
  const prescriptionId = params.id as string

  console.log('🔍 [COMPONENT] Params:', params)
  console.log('🔍 [COMPONENT] Prescription ID:', prescriptionId)

  const [prescription, setPrescription] = useState<Prescription | null>(null)
  const [services, setServices] = useState<LabService[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTests, setSelectedTests] = useState<SelectedTest[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  console.log('🔍 [COMPONENT] State - loading:', loading, 'error:', error, 'prescription:', !!prescription, 'services:', services.length)

  const fetchPrescription = useCallback(async () => {
    console.log('🔍 [FETCH PRESCRIPTION] Starting fetch for:', prescriptionId)
    try {
      const url = `/api/ops/lab/prescriptions/${prescriptionId}`
      console.log('🔍 [FETCH PRESCRIPTION] URL:', url)

      const response = await fetch(url, {
        credentials: 'include',
      })

      console.log('🔍 [FETCH PRESCRIPTION] Response status:', response.status)
      console.log('🔍 [FETCH PRESCRIPTION] Response ok:', response.ok)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ [FETCH PRESCRIPTION] Error response:', errorData)
        throw new Error(errorData.message || `Failed to fetch prescription (${response.status})`)
      }

      const data = await response.json()
      console.log('✅ [FETCH PRESCRIPTION] Success:', data)
      setPrescription(data.data)
    } catch (error: any) {
      console.error('❌ [FETCH PRESCRIPTION] Exception:', error)
      setError(error.message || 'Failed to fetch prescription')
      toast.error(error.message || 'Failed to fetch prescription')
    } finally {
      console.log('🔍 [FETCH PRESCRIPTION] Setting loading to false')
      setLoading(false)
    }
  }, [prescriptionId])

  const fetchServices = async () => {
    console.log('🔍 [FETCH SERVICES] Starting fetch')
    try {
      const url = '/api/admin/lab/services'
      console.log('🔍 [FETCH SERVICES] URL:', url)

      const response = await apiFetch(url)
      console.log('🔍 [FETCH SERVICES] Response status:', response.status)
      console.log('🔍 [FETCH SERVICES] Response ok:', response.ok)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ [FETCH SERVICES] Error response:', errorData)
        throw new Error(errorData.message || `Failed to fetch lab services (${response.status})`)
      }

      const data = await response.json()
      console.log('✅ [FETCH SERVICES] Success, services count:', data.data?.length || 0)
      console.log('✅ [FETCH SERVICES] Data:', data)
      setServices(data.data || [])
    } catch (error: any) {
      console.error('❌ [FETCH SERVICES] Exception:', error)
      setError(error.message || 'Failed to fetch lab services')
      toast.error(error.message || 'Failed to fetch lab services. Please refresh the page.')
    }
  }

  useEffect(() => {
    console.log('🔍 [USE EFFECT] Component mounted, prescriptionId:', prescriptionId)
    console.log('🔍 [USE EFFECT] Calling fetchPrescription and fetchServices')
    fetchPrescription()
    fetchServices()
  }, [fetchPrescription])

  const handleAddTest = (service: LabService) => {
    if (selectedTests.find((t) => t.serviceId === service._id)) {
      toast.warning('Test already added')
      return
    }

    setSelectedTests([
      ...selectedTests,
      {
        serviceId: service._id,
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
      router.push('/operations/lab/prescriptions')
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

  console.log('🔍 [RENDER] Checking render conditions - loading:', loading, 'error:', error)

  if (loading) {
    console.log('🔍 [RENDER] Showing loading spinner')
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
      </div>
    )
  }

  if (error) {
    console.log('🔍 [RENDER] Showing error screen:', error)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-4">
            <svg className="h-16 w-16 text-red-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Page</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setError(null)
                setLoading(true)
                fetchPrescription()
                fetchServices()
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
            <button
              onClick={() => router.back()}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  console.log('🔍 [RENDER] Rendering main content')
  console.log('🔍 [RENDER] Prescription data:', prescription)
  console.log('🔍 [RENDER] Services count:', services.length)

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
