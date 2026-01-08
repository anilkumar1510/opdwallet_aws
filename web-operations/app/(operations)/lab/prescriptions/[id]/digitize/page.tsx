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
  patientRelationship: string
  prescriptionDate: string
  pincode: string
  addressId?: string
  fileName: string
  filePath: string
  status: string
}

interface EligibleVendor {
  _id: string
  vendorId: string
  name: string
  code: string
  homeCollection: boolean
  centerVisit: boolean
  homeCollectionCharges: number
  pricing: Array<{
    serviceId: string
    serviceName: string
    serviceCode: string
    actualPrice: number
    discountedPrice: number
  }>
  totalActualPrice: number
  totalDiscountedPrice: number
  totalWithHomeCollection: number
}

export default function DigitizePrescriptionPage() {
  console.log('🔍 [COMPONENT] DigitizePrescriptionPage rendering')

  const router = useRouter()
  const params = useParams()
  const prescriptionId = params.id as string

  console.log('🔍 [COMPONENT] Params:', params)
  console.log('🔍 [COMPONENT] Prescription ID:', prescriptionId)

  // Helper function to convert API filePath to absolute URL
  const getAbsoluteFilePath = (filePath: string) => {
    if (!filePath) return ''
    // If filePath starts with 'uploads/', convert to '/operations/lab/uploads/' to match rewrite rule
    if (filePath.startsWith('uploads/')) {
      return `/operations/lab/${filePath}`
    }
    // If it already starts with '/operations/', return as is
    if (filePath.startsWith('/operations/')) {
      return filePath
    }
    // If it starts with '/', prepend basePath
    if (filePath.startsWith('/')) {
      return `/operations${filePath}`
    }
    // Otherwise, prepend '/operations/lab/'
    return `/operations/lab/${filePath}`
  }

  const [prescription, setPrescription] = useState<Prescription | null>(null)
  const [services, setServices] = useState<LabService[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTests, setSelectedTests] = useState<SelectedTest[]>([])
  const [eligibleVendors, setEligibleVendors] = useState<EligibleVendor[]>([])
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([])
  const [loadingVendors, setLoadingVendors] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  console.log('🔍 [COMPONENT] State - loading:', loading, 'error:', error, 'prescription:', !!prescription, 'services:', services.length)

  const fetchPrescription = useCallback(async () => {
    console.log('🔍 [FETCH PRESCRIPTION] Starting fetch for:', prescriptionId)
    try {
      const url = `/api/ops/lab/prescriptions/${prescriptionId}`
      console.log('🔍 [FETCH PRESCRIPTION] URL:', url)

      const response = await apiFetch(url)

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
    const newSelectedTests = selectedTests.filter((t) => t.serviceId !== serviceId)
    setSelectedTests(newSelectedTests)

    // Reset vendor selection when tests change
    setEligibleVendors([])
    setSelectedVendorIds([])
  }

  const fetchEligibleVendors = async () => {
    if (!prescription || selectedTests.length === 0) {
      toast.warning('Please select at least one test first')
      return
    }

    setLoadingVendors(true)

    try {
      const serviceIds = selectedTests.map(t => t.serviceId)
      const response = await apiFetch(`/api/ops/lab/prescriptions/${prescriptionId}/eligible-vendors`, {
        method: 'POST',
        body: JSON.stringify({ serviceIds }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch eligible vendors')
      }

      const data = await response.json()
      setEligibleVendors(data.data || [])

      if (data.data.length === 0) {
        toast.warning('No vendors available for selected tests in this pincode')
      } else {
        toast.success(`Found ${data.data.length} eligible vendors`)
      }
    } catch (error) {
      console.error('Error fetching eligible vendors:', error)
      toast.error('Failed to fetch eligible vendors')
    } finally {
      setLoadingVendors(false)
    }
  }

  const handleVendorToggle = (vendorId: string) => {
    setSelectedVendorIds(prev =>
      prev.includes(vendorId)
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    )
  }

  const handleSubmit = async (status: 'DIGITIZED' | 'DELAYED') => {
    if (status === 'DIGITIZED' && selectedTests.length === 0) {
      toast.error('Please add at least one test')
      return
    }

    if (status === 'DIGITIZED' && selectedVendorIds.length === 0) {
      toast.error('Please select at least one vendor to push to member')
      return
    }

    let delayReason = ''
    if (status === 'DELAYED') {
      delayReason = prompt('Please enter delay reason:') || ''
      if (!delayReason) return
    }

    setSubmitting(true)

    try {
      const response = await apiFetch(`/api/ops/lab/prescriptions/${prescriptionId}/digitize`, {
        method: 'POST',
        body: JSON.stringify({
          prescriptionId,
          items: selectedTests,
          status,
          selectedVendorIds: status === 'DIGITIZED' ? selectedVendorIds : undefined,
          delayReason: status === 'DELAYED' ? delayReason : undefined,
        }),
      })

      if (!response.ok) throw new Error('Failed to digitize prescription')

      const data = await response.json()
      toast.success(data.message)
      router.push('/prescriptions?tab=lab')
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
        <div className="mt-2 space-y-1">
          <p className="text-sm text-gray-600">
            <strong>ID:</strong> {prescription?.prescriptionId}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Patient:</strong> {prescription?.patientName} ({prescription?.patientRelationship})
          </p>
          <p className="text-sm text-gray-600">
            <strong>Prescription Date:</strong> {prescription?.prescriptionDate ? new Date(prescription.prescriptionDate).toLocaleDateString() : 'N/A'}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Pincode:</strong> {prescription?.pincode}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left: Prescription Image */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold mb-4">Prescription Image</h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {prescription?.fileName?.toLowerCase().endsWith('.pdf') ? (
              <iframe
                src={getAbsoluteFilePath(prescription?.filePath || '')}
                className="w-full h-[80vh] border-0"
                title="Prescription PDF"
              />
            ) : (
              <img
                src={getAbsoluteFilePath(prescription?.filePath || '')}
                alt="Prescription"
                className="w-full h-auto"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EPrescription Image%3C/text%3E%3C/svg%3E'
                }}
              />
            )}
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Selected Tests ({selectedTests.length})</h3>
              {selectedTests.length > 0 && (
                <button
                  onClick={fetchEligibleVendors}
                  disabled={loadingVendors}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingVendors ? 'Loading...' : 'Find Vendors'}
                </button>
              )}
            </div>

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

          {/* Eligible Vendors */}
          {eligibleVendors.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">
                  Eligible Vendors ({eligibleVendors.length}) - Select vendors to push to member
                </h3>
                <span className="text-sm text-gray-600">
                  {selectedVendorIds.length} selected
                </span>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {eligibleVendors.map((vendor) => (
                  <div
                    key={vendor._id}
                    className={`p-4 border-2 rounded-lg transition-colors cursor-pointer ${
                      selectedVendorIds.includes(vendor._id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => handleVendorToggle(vendor._id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedVendorIds.includes(vendor._id)}
                          onChange={() => handleVendorToggle(vendor._id)}
                          className="mt-1 h-5 w-5 text-blue-600 rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-lg">{vendor.name}</h4>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-blue-600">
                                ₹{vendor.totalDiscountedPrice}
                              </p>
                              <p className="text-xs text-gray-500 line-through">
                                ₹{vendor.totalActualPrice}
                              </p>
                            </div>
                          </div>

                          <div className="mb-2">
                            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded mr-2">
                              {vendor.code}
                            </span>
                            {vendor.homeCollection && (
                              <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded mr-2">
                                Home Collection (+₹{vendor.homeCollectionCharges})
                              </span>
                            )}
                            {vendor.centerVisit && (
                              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                Center Visit
                              </span>
                            )}
                          </div>

                          <div className="mt-2">
                            <p className="text-xs font-semibold text-gray-700 mb-1">Test Pricing:</p>
                            <div className="space-y-1">
                              {vendor.pricing.map((price, idx) => (
                                <div key={idx} className="flex justify-between text-xs text-gray-600">
                                  <span>{price.serviceName}</span>
                                  <span className="font-medium">₹{price.discountedPrice}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
