'use client'

import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'

interface Clinic {
  _id: string
  clinicId: string
  name: string
  address: {
    city: string
    state: string
    street?: string
    zipCode?: string
  }
  dentalServicesEnabled: boolean
  hasEnabledServices: boolean
  enabledServicesCount: number
}

interface Service {
  _id: string
  code: string
  name: string
  description: string
  isActive: boolean
  isEnabledForClinic: boolean
  price: number | null
  currency: string
}

export default function DentalServicesPage() {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedClinic, setExpandedClinic] = useState<string | null>(null)
  const [services, setServices] = useState<Record<string, Service[]>>({})
  const [loadingServices, setLoadingServices] = useState<string | null>(null)
  const [updatingService, setUpdatingService] = useState<string | null>(null)

  // Fetch all clinics
  const fetchClinics = useCallback(async () => {
    try {
      console.log('[Dental Services] Fetching all clinics...')
      setLoading(true)
      const response = await apiFetch('/api/ops/dental-services/clinics')

      if (response.ok) {
        const result = await response.json()
        console.log('[Dental Services] Clinics fetched:', result)
        setClinics(result.data || [])
      } else {
        console.error('[Dental Services] Failed to fetch clinics: HTTP', response.status)
        setClinics([])
      }
    } catch (error) {
      console.error('[Dental Services] Error fetching clinics:', error)
      setClinics([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch services for a specific clinic
  const fetchServicesForClinic = useCallback(async (clinicId: string) => {
    try {
      console.log(`[Dental Services] Fetching services for clinic ${clinicId}...`)
      setLoadingServices(clinicId)
      const response = await apiFetch(`/api/ops/dental-services/clinics/${clinicId}/services`)

      if (response.ok) {
        const result = await response.json()
        console.log(`[Dental Services] Services fetched for ${clinicId}:`, result)
        setServices(prev => ({ ...prev, [clinicId]: result.data || [] }))
      } else {
        console.error(`[Dental Services] Failed to fetch services for ${clinicId}: HTTP`, response.status)
      }
    } catch (error) {
      console.error(`[Dental Services] Error fetching services for ${clinicId}:`, error)
    } finally {
      setLoadingServices(null)
    }
  }, [])

  // Toggle clinic-level dental services enabled/disabled
  const toggleClinicDentalServices = useCallback(async (
    clinicId: string,
    currentlyEnabled: boolean
  ) => {
    try {
      const newState = !currentlyEnabled
      const key = `clinic-${clinicId}`
      console.log(`[Dental Services] Toggling dental services for clinic ${clinicId} to ${newState}`)

      setUpdatingService(key)
      const response = await apiFetch(
        `/api/ops/dental-services/clinics/${clinicId}/toggle`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isEnabled: newState }),
        }
      )

      if (response.ok) {
        const result = await response.json()
        console.log(`[Dental Services] Clinic dental services toggled successfully:`, result)

        // Update local clinic state
        setClinics(prev => prev.map(c =>
          c.clinicId === clinicId
            ? { ...c, dentalServicesEnabled: newState, hasEnabledServices: newState ? c.hasEnabledServices : false, enabledServicesCount: newState ? c.enabledServicesCount : 0 }
            : c
        ))

        // If disabling, also update all services to disabled in local state
        if (!newState && services[clinicId]) {
          setServices(prev => ({
            ...prev,
            [clinicId]: prev[clinicId].map(s => ({ ...s, isEnabledForClinic: false })),
          }))
        }

        // Refresh clinics list to get latest data
        fetchClinics()
      } else {
        const error = await response.json()
        console.error(`[Dental Services] Failed to toggle clinic dental services:`, error)
        alert(`Failed to toggle dental services: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error(`[Dental Services] Error toggling clinic dental services:`, error)
      alert('Failed to toggle dental services. Please try again.')
    } finally {
      setUpdatingService(null)
    }
  }, [services, fetchClinics])

  // Toggle service enabled/disabled
  const toggleService = useCallback(async (
    clinicId: string,
    serviceCode: string,
    currentlyEnabled: boolean
  ) => {
    try {
      const newState = !currentlyEnabled
      const key = `${clinicId}-${serviceCode}`
      console.log(`[Dental Services] Toggling service ${serviceCode} for clinic ${clinicId} to ${newState}`)

      setUpdatingService(key)
      const response = await apiFetch(
        `/api/ops/dental-services/clinics/${clinicId}/services/${serviceCode}/toggle`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isEnabled: newState }),
        }
      )

      if (response.ok) {
        const result = await response.json()
        console.log(`[Dental Services] Service toggled successfully:`, result)

        // Update local state
        setServices(prev => ({
          ...prev,
          [clinicId]: prev[clinicId].map(s =>
            s.code === serviceCode
              ? { ...s, isEnabledForClinic: newState }
              : s
          ),
        }))

        // Refresh clinics list to update counts
        fetchClinics()
      } else {
        const error = await response.json()
        console.error(`[Dental Services] Failed to toggle service:`, error)
        alert(`Failed to toggle service: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error(`[Dental Services] Error toggling service:`, error)
      alert('Failed to toggle service. Please try again.')
    } finally {
      setUpdatingService(null)
    }
  }, [fetchClinics])

  // Update service price
  const updatePrice = useCallback(async (
    clinicId: string,
    serviceCode: string,
    price: number
  ) => {
    try {
      const key = `${clinicId}-${serviceCode}-price`
      console.log(`[Dental Services] Updating price for ${serviceCode} at clinic ${clinicId} to ${price}`)

      setUpdatingService(key)
      const response = await apiFetch(
        `/api/ops/dental-services/clinics/${clinicId}/services/${serviceCode}/price`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ price }),
        }
      )

      if (response.ok) {
        const result = await response.json()
        console.log(`[Dental Services] Price updated successfully:`, result)

        // Update local state
        setServices(prev => ({
          ...prev,
          [clinicId]: prev[clinicId].map(s =>
            s.code === serviceCode
              ? { ...s, price }
              : s
          ),
        }))

        alert(`Price updated successfully to ₹${price}`)
      } else {
        const error = await response.json()
        console.error(`[Dental Services] Failed to update price:`, error)
        alert(`Failed to update price: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error(`[Dental Services] Error updating price:`, error)
      alert('Failed to update price. Please try again.')
    } finally {
      setUpdatingService(null)
    }
  }, [])

  // Handle clinic expand/collapse
  const handleClinicToggle = useCallback((clinicId: string) => {
    if (expandedClinic === clinicId) {
      setExpandedClinic(null)
    } else {
      setExpandedClinic(clinicId)
      if (!services[clinicId]) {
        fetchServicesForClinic(clinicId)
      }
    }
  }, [expandedClinic, services, fetchServicesForClinic])

  // Handle price input change with validation
  const handlePriceChange = useCallback((
    clinicId: string,
    serviceCode: string,
    value: string
  ) => {
    const price = parseFloat(value)
    if (value === '' || (price >= 0 && !isNaN(price))) {
      updatePrice(clinicId, serviceCode, price)
    }
  }, [updatePrice])

  useEffect(() => {
    fetchClinics()
  }, [fetchClinics])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading clinics...</p>
        </div>
      </div>
    )
  }

  if (clinics.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Clinics Found</h3>
        <p className="text-gray-600">There are no active clinics in the system.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-blue-900 mb-1">
          Dental Services Management
        </h3>
        <p className="text-sm text-blue-700">
          Enable dental services for clinics and set pricing. Toggle services on/off and enter prices for enabled services.
        </p>
      </div>

      {clinics.map((clinic) => {
        const isTogglingClinic = updatingService === `clinic-${clinic.clinicId}`

        return (
          <div key={clinic._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Clinic Header */}
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex-1 flex items-center gap-4">
                {/* Clinic-Level Toggle */}
                <div className="flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleClinicDentalServices(clinic.clinicId, clinic.dentalServicesEnabled)
                    }}
                    disabled={isTogglingClinic}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      clinic.dentalServicesEnabled
                        ? 'bg-blue-600'
                        : 'bg-gray-200'
                    } ${isTogglingClinic ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={clinic.dentalServicesEnabled ? 'Disable dental services for this clinic' : 'Enable dental services for this clinic'}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        clinic.dentalServicesEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <div className="text-xs text-gray-500 mt-1 text-center">
                    {clinic.dentalServicesEnabled ? 'Enabled' : 'Disabled'}
                  </div>
                </div>

                {/* Clinic Info - Clickable */}
                <button
                  onClick={() => handleClinicToggle(clinic.clinicId)}
                  disabled={!clinic.dentalServicesEnabled}
                  className={`flex-1 text-left ${!clinic.dentalServicesEnabled ? 'opacity-50' : 'hover:bg-gray-50'} transition-colors rounded px-3 py-2`}
                >
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{clinic.name}</h3>
                    <span className="text-sm text-gray-500">({clinic.clinicId})</span>
                    {clinic.hasEnabledServices && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {clinic.enabledServicesCount} service{clinic.enabledServicesCount !== 1 ? 's' : ''} enabled
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {clinic.address.city}, {clinic.address.state}
                  </p>
                </button>

                {/* Expand Arrow */}
                {clinic.dentalServicesEnabled && (
                  <div className="flex-shrink-0">
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedClinic === clinic.clinicId ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

          {/* Services List (Expanded) */}
          {expandedClinic === clinic.clinicId && (
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              {loadingServices === clinic.clinicId ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading services...</span>
                </div>
              ) : services[clinic.clinicId]?.length > 0 ? (
                <div className="space-y-3">
                  {services[clinic.clinicId].map((service) => {
                    const toggleKey = `${clinic.clinicId}-${service.code}`
                    const priceKey = `${clinic.clinicId}-${service.code}-price`
                    const isTogglingService = updatingService === toggleKey
                    const isUpdatingPrice = updatingService === priceKey

                    return (
                      <div
                        key={service._id}
                        className="bg-white rounded-lg border border-gray-200 p-4"
                      >
                        <div className="flex items-start gap-4">
                          {/* Toggle Switch */}
                          <div className="flex-shrink-0 pt-1">
                            <button
                              onClick={() => toggleService(
                                clinic.clinicId,
                                service.code,
                                service.isEnabledForClinic
                              )}
                              disabled={isTogglingService || !clinic.dentalServicesEnabled}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                service.isEnabledForClinic
                                  ? 'bg-green-600'
                                  : 'bg-gray-200'
                              } ${(isTogglingService || !clinic.dentalServicesEnabled) ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={!clinic.dentalServicesEnabled ? 'Enable dental services at clinic level first' : ''}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  service.isEnabledForClinic ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>

                          {/* Service Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">
                                  {service.name}
                                </h4>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {service.code} · {service.description}
                                </p>
                              </div>
                            </div>

                            {/* Price Input (Only shown when enabled) */}
                            {service.isEnabledForClinic && (
                              <div className="mt-3 flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700">
                                  Price ({service.currency}):
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  defaultValue={service.price || ''}
                                  onBlur={(e) => {
                                    const value = e.target.value
                                    if (value && parseFloat(value) !== service.price) {
                                      handlePriceChange(clinic.clinicId, service.code, value)
                                    }
                                  }}
                                  disabled={isUpdatingPrice}
                                  className="w-32 px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                  placeholder="Enter price"
                                />
                                {isUpdatingPrice && (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                )}
                                {service.price !== null && service.price !== undefined && (
                                  <span className="text-sm text-gray-600">
                                    Current: ₹{service.price.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No dental services available</p>
                </div>
              )}
            </div>
          )}
          </div>
        )
      })}
    </div>
  )
}
