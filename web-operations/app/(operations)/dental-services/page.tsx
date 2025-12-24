'use client'

import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'

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

interface DentalSlot {
  _id: string
  slotId: string
  clinicId: string
  date: string
  startTime: string
  endTime: string
  slotDuration: number
  maxAppointments: number
  isActive: boolean
}

export default function DentalServicesPage() {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedClinic, setExpandedClinic] = useState<string | null>(null)
  const [services, setServices] = useState<Record<string, Service[]>>({})
  const [slots, setSlots] = useState<Record<string, DentalSlot[]>>({})
  const [loadingServices, setLoadingServices] = useState<string | null>(null)
  const [loadingSlots, setLoadingSlots] = useState<string | null>(null)
  const [updatingService, setUpdatingService] = useState<string | null>(null)
  const [showSlotModal, setShowSlotModal] = useState(false)
  const [selectedClinicForSlot, setSelectedClinicForSlot] = useState<Clinic | null>(null)
  const [slotFormData, setSlotFormData] = useState({
    dates: [] as string[],
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 30,
    maxAppointments: 10,
  })

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

  // Fetch slots for a specific clinic
  const fetchSlotsForClinic = useCallback(async (clinicId: string) => {
    try {
      console.log(`[Dental Slots] Fetching slots for clinic ${clinicId}...`)
      setLoadingSlots(clinicId)
      const response = await apiFetch(`/api/ops/dental-services/clinics/${clinicId}/slots`)

      if (response.ok) {
        const result = await response.json()
        console.log(`[Dental Slots] Slots fetched for ${clinicId}:`, result)
        setSlots(prev => ({ ...prev, [clinicId]: result.data || [] }))
      } else {
        console.error(`[Dental Slots] Failed to fetch slots for ${clinicId}: HTTP`, response.status)
      }
    } catch (error) {
      console.error(`[Dental Slots] Error fetching slots for ${clinicId}:`, error)
    } finally {
      setLoadingSlots(null)
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

        setClinics(prev => prev.map(c =>
          c.clinicId === clinicId
            ? { ...c, dentalServicesEnabled: newState, hasEnabledServices: newState ? c.hasEnabledServices : false, enabledServicesCount: newState ? c.enabledServicesCount : 0 }
            : c
        ))

        if (!newState && services[clinicId]) {
          setServices(prev => ({
            ...prev,
            [clinicId]: prev[clinicId].map(s => ({ ...s, isEnabledForClinic: false })),
          }))
        }

        toast.success(`Dental services ${newState ? 'enabled' : 'disabled'} for clinic`)
        fetchClinics()
      } else {
        const error = await response.json()
        console.error(`[Dental Services] Failed to toggle clinic dental services:`, error)
        toast.error(`Failed to toggle dental services: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error(`[Dental Services] Error toggling clinic dental services:`, error)
      toast.error('Failed to toggle dental services. Please try again.')
    } finally {
      setUpdatingService(null)
    }
  }, [services, fetchClinics])

  // Toggle individual service enabled/disabled
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

        setServices(prev => ({
          ...prev,
          [clinicId]: prev[clinicId]?.map(s =>
            s.code === serviceCode ? { ...s, isEnabledForClinic: newState } : s
          ) || [],
        }))

        toast.success(`Service ${newState ? 'enabled' : 'disabled'} successfully`)
        fetchClinics()
      } else {
        const error = await response.json()
        console.error(`[Dental Services] Failed to toggle service:`, error)
        toast.error(`Failed to toggle service: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error(`[Dental Services] Error toggling service:`, error)
      toast.error('Failed to toggle service. Please try again.')
    } finally {
      setUpdatingService(null)
    }
  }, [fetchClinics])

  // Update service price
  const updatePrice = useCallback(async (
    clinicId: string,
    serviceCode: string,
    newPrice: number
  ) => {
    try {
      console.log(`[Dental Services] Updating price for ${serviceCode} at ${clinicId} to ${newPrice}`)

      const response = await apiFetch(
        `/api/ops/dental-services/clinics/${clinicId}/services/${serviceCode}/price`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ price: newPrice }),
        }
      )

      if (response.ok) {
        const result = await response.json()
        console.log(`[Dental Services] Price updated successfully:`, result)

        setServices(prev => ({
          ...prev,
          [clinicId]: prev[clinicId]?.map(s =>
            s.code === serviceCode ? { ...s, price: newPrice } : s
          ) || [],
        }))

        toast.success('Price updated successfully')
      } else {
        const error = await response.json()
        console.error(`[Dental Services] Failed to update price:`, error)
        toast.error(`Failed to update price: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error(`[Dental Services] Error updating price:`, error)
      toast.error('Failed to update price. Please try again.')
    }
  }, [])

  // Open slot creation modal
  const openSlotModal = (clinic: Clinic) => {
    console.log(`[Dental Slots] Opening slot modal for clinic ${clinic.clinicId}`)
    setSelectedClinicForSlot(clinic)
    setSlotFormData({
      dates: [],
      startTime: '09:00',
      endTime: '17:00',
      slotDuration: 30,
      maxAppointments: 10,
    })
    setShowSlotModal(true)
  }

  // Create slots
  const createSlots = async () => {
    if (!selectedClinicForSlot) return

    if (slotFormData.dates.length === 0) {
      toast.error('Please select at least one date')
      return
    }

    try {
      console.log(`[Dental Slots] Creating slots for clinic ${selectedClinicForSlot.clinicId}`, slotFormData)

      const response = await apiFetch(
        `/api/ops/dental-services/clinics/${selectedClinicForSlot.clinicId}/slots`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clinicId: selectedClinicForSlot.clinicId,
            ...slotFormData,
          }),
        }
      )

      if (response.ok) {
        const result = await response.json()
        console.log(`[Dental Slots] Slots created successfully:`, result)
        toast.success(result.message || 'Slots created successfully')
        setShowSlotModal(false)
        fetchSlotsForClinic(selectedClinicForSlot.clinicId)
      } else {
        const error = await response.json()
        console.error(`[Dental Slots] Failed to create slots:`, error)
        toast.error(`Failed to create slots: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error(`[Dental Slots] Error creating slots:`, error)
      toast.error('Failed to create slots. Please try again.')
    }
  }

  // Delete slot
  const deleteSlot = async (slotId: string, clinicId: string) => {
    if (!confirm('Are you sure you want to delete this slot?')) return

    try {
      console.log(`[Dental Slots] Deleting slot ${slotId}`)

      const response = await apiFetch(
        `/api/ops/dental-services/slots/${slotId}`,
        {
          method: 'DELETE',
        }
      )

      if (response.ok) {
        const result = await response.json()
        console.log(`[Dental Slots] Slot deleted successfully:`, result)
        toast.success('Slot deleted successfully')
        fetchSlotsForClinic(clinicId)
      } else {
        const error = await response.json()
        console.error(`[Dental Slots] Failed to delete slot:`, error)
        toast.error(`Failed to delete slot: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error(`[Dental Slots] Error deleting slot:`, error)
      toast.error('Failed to delete slot. Please try again.')
    }
  }

  // Toggle date selection
  const toggleDateSelection = (date: string) => {
    setSlotFormData(prev => ({
      ...prev,
      dates: prev.dates.includes(date)
        ? prev.dates.filter(d => d !== date)
        : [...prev.dates, date],
    }))
  }

  // Expand/collapse clinic
  const toggleClinicExpansion = useCallback((clinicId: string) => {
    setExpandedClinic(prev => {
      const newExpanded = prev === clinicId ? null : clinicId

      if (newExpanded === clinicId) {
        if (!services[clinicId]) {
          fetchServicesForClinic(clinicId)
        }
        if (!slots[clinicId]) {
          fetchSlotsForClinic(clinicId)
        }
      }

      return newExpanded
    })
  }, [services, slots, fetchServicesForClinic, fetchSlotsForClinic])

  useEffect(() => {
    fetchClinics()
  }, [fetchClinics])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading clinics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dental Services Management</h1>
        <p className="mt-2 text-gray-600">Manage dental services and time slots for clinics</p>
      </div>

      {/* Clinics List */}
      <div className="space-y-4">
        {clinics.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 text-5xl mb-4">🏥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No clinics found</h3>
            <p className="text-gray-500">No active clinics are available at the moment.</p>
          </div>
        ) : (
          clinics.map((clinic) => {
            const isExpanded = expandedClinic === clinic.clinicId
            const isTogglingClinic = updatingService === `clinic-${clinic.clinicId}`
            const clinicServices = services[clinic.clinicId] || []
            const clinicSlots = slots[clinic.clinicId] || []

            return (
              <div
                key={clinic.clinicId}
                className={`bg-white rounded-lg shadow-md border-2 transition-all duration-200 ${
                  clinic.dentalServicesEnabled
                    ? 'border-green-200 hover:shadow-lg'
                    : 'border-gray-200 hover:shadow-md bg-gray-50'
                }`}
              >
                {/* Clinic Header */}
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-gray-900">{clinic.name}</h2>
                        <span className="text-sm text-gray-500">({clinic.clinicId})</span>
                        {clinic.dentalServicesEnabled && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {clinic.address.city}, {clinic.address.state}
                      </p>
                      {clinic.dentalServicesEnabled && (
                        <p className="text-sm text-gray-500 mt-2">
                          {clinic.enabledServicesCount} service(s) enabled • {clinicSlots.length} slot(s) configured
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Clinic-Level Toggle */}
                      <div className="flex flex-col items-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleClinicDentalServices(clinic.clinicId, clinic.dentalServicesEnabled)
                          }}
                          disabled={isTogglingClinic}
                          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                            clinic.dentalServicesEnabled
                              ? 'bg-green-600'
                              : 'bg-gray-300'
                          } ${isTogglingClinic ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={clinic.dentalServicesEnabled ? 'Disable dental services' : 'Enable dental services'}
                        >
                          <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                              clinic.dentalServicesEnabled ? 'translate-x-7' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className="text-xs text-gray-600 mt-1 font-medium">
                          {clinic.dentalServicesEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>

                      {/* Expand Button */}
                      <button
                        onClick={() => toggleClinicExpansion(clinic.clinicId)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        <svg
                          className={`w-6 h-6 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-6 bg-gray-50">
                    {/* Slot Management Section */}
                    {clinic.dentalServicesEnabled && (
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">Time Slots</h3>
                          <button
                            onClick={() => openSlotModal(clinic)}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                          >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Slots
                          </button>
                        </div>

                        {loadingSlots === clinic.clinicId ? (
                          <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="mt-2 text-gray-600">Loading slots...</p>
                          </div>
                        ) : clinicSlots.length === 0 ? (
                          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                            <div className="text-gray-400 text-4xl mb-3">📅</div>
                            <p className="text-gray-600">No time slots configured</p>
                            <p className="text-sm text-gray-500 mt-1">Click "Create Slots" to add availability</p>
                          </div>
                        ) : (
                          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Range</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Appointments</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {clinicSlots.map((slot) => (
                                  <tr key={slot.slotId} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {new Date(slot.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                      {slot.startTime} - {slot.endTime}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                      {slot.slotDuration} min
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                      {slot.maxAppointments}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        slot.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                      }`}>
                                        {slot.isActive ? 'Active' : 'Inactive'}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                      <button
                                        onClick={() => deleteSlot(slot.slotId, clinic.clinicId)}
                                        className="text-red-600 hover:text-red-900 font-medium"
                                      >
                                        Delete
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Services Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Dental Services</h3>
                      {loadingServices === clinic.clinicId ? (
                        <div className="text-center py-8">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <p className="mt-2 text-gray-600">Loading services...</p>
                        </div>
                      ) : clinicServices.length === 0 ? (
                        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                          <p className="text-gray-600">No dental services found</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {clinicServices.map((service) => {
                            const isUpdating = updatingService === `${clinic.clinicId}-${service.code}`
                            const isDisabled = !clinic.dentalServicesEnabled

                            return (
                              <div
                                key={service.code}
                                className={`bg-white rounded-lg border p-4 transition-all ${
                                  service.isEnabledForClinic
                                    ? 'border-blue-200 shadow-sm'
                                    : 'border-gray-200'
                                } ${isDisabled ? 'opacity-50' : ''}`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold text-gray-900">{service.name}</h4>
                                      <span className="text-xs text-gray-500">({service.code})</span>
                                    </div>
                                    {service.description && (
                                      <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                                    )}
                                    {service.isEnabledForClinic && (
                                      <div className="mt-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Price (₹)
                                        </label>
                                        <input
                                          type="number"
                                          value={service.price || ''}
                                          onChange={(e) => {
                                            const newPrice = parseFloat(e.target.value)
                                            if (!isNaN(newPrice) && newPrice >= 0) {
                                              updatePrice(clinic.clinicId, service.code, newPrice)
                                            }
                                          }}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                          placeholder="Enter price"
                                          disabled={isDisabled}
                                        />
                                      </div>
                                    )}
                                  </div>

                                  <button
                                    onClick={() => toggleService(clinic.clinicId, service.code, service.isEnabledForClinic)}
                                    disabled={isDisabled || isUpdating}
                                    className={`ml-4 relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                      service.isEnabledForClinic
                                        ? 'bg-blue-600'
                                        : 'bg-gray-300'
                                    } ${isDisabled || isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title={isDisabled ? 'Enable clinic-level dental services first' : (service.isEnabledForClinic ? 'Disable service' : 'Enable service')}
                                  >
                                    <span
                                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                        service.isEnabledForClinic ? 'translate-x-6' : 'translate-x-1'
                                      }`}
                                    />
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Slot Creation Modal */}
      {showSlotModal && selectedClinicForSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Create Time Slots</h2>
                <button
                  onClick={() => setShowSlotModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 mt-1">
                {selectedClinicForSlot.name} ({selectedClinicForSlot.clinicId})
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Dates (multiple selection)
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      if (e.target.value) {
                        toggleDateSelection(e.target.value)
                      }
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-sm text-gray-500">
                    {slotFormData.dates.length} date(s) selected
                  </span>
                </div>
                {slotFormData.dates.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {slotFormData.dates.map((date) => (
                      <span
                        key={date}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        <button
                          onClick={() => toggleDateSelection(date)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={slotFormData.startTime}
                    onChange={(e) => setSlotFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={slotFormData.endTime}
                    onChange={(e) => setSlotFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Slot Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slot Duration (minutes)
                </label>
                <select
                  value={slotFormData.slotDuration}
                  onChange={(e) => setSlotFormData(prev => ({ ...prev, slotDuration: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>

              {/* Max Appointments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Appointments per Slot
                </label>
                <input
                  type="number"
                  min="1"
                  value={slotFormData.maxAppointments}
                  onChange={(e) => setSlotFormData(prev => ({ ...prev, maxAppointments: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowSlotModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createSlots}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Create Slots
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
