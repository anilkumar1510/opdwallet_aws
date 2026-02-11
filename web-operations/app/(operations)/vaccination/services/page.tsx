'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PlusIcon,
  PencilIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'

interface VaccinationService {
  _id: string
  serviceId: string
  name: string
  code: string
  category: string
  description?: string
  vaccineType?: string
  manufacturer?: string
  dosesRequired?: number
  doseIntervalDays?: number
  ageGroup?: string
  isActive: boolean
  createdAt: string
}

export default function VaccinationServicesPage() {
  const [services, setServices] = useState<VaccinationService[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState<VaccinationService | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    vaccineType: '',
    manufacturer: '',
    dosesRequired: 1,
    doseIntervalDays: 0,
    ageGroup: '',
  })

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiFetch('/api/admin/vaccination/services')

      if (!response.ok) {
        throw new Error('Failed to fetch services')
      }

      const data = await response.json()
      setServices(data.data || [])
    } catch (error) {
      console.error('Error fetching services:', error)
      toast.error('Failed to fetch services')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingService
        ? `/api/admin/vaccination/services/${editingService.serviceId}`
        : '/api/admin/vaccination/services'

      const method = editingService ? 'PATCH' : 'POST'

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        let errorMessage = 'Failed to save service'
        try {
          const errorData = await response.json()
          if (typeof errorData.message === 'string') {
            errorMessage = errorData.message
          }
        } catch {
          // Use default message
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      toast.success(data.message)

      setShowModal(false)
      setEditingService(null)
      resetForm()
      fetchServices()
    } catch (error) {
      console.error('Error saving service:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save service'
      toast.error(errorMessage)
    }
  }

  const handleEdit = (service: VaccinationService) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      code: service.code,
      description: service.description || '',
      vaccineType: service.vaccineType || '',
      manufacturer: service.manufacturer || '',
      dosesRequired: service.dosesRequired || 1,
      doseIntervalDays: service.doseIntervalDays || 0,
      ageGroup: service.ageGroup || '',
    })
    setShowModal(true)
  }

  const handleToggleStatus = async (service: VaccinationService) => {
    const action = service.isActive ? 'deactivate' : 'activate'

    try {
      const response = await apiFetch(`/api/admin/vaccination/services/${service.serviceId}/${action}`, {
        method: 'PATCH',
      })

      if (!response.ok) {
        throw new Error(`Failed to ${action} service`)
      }

      const data = await response.json()
      toast.success(data.message)
      fetchServices()
    } catch (error) {
      console.error(`Error ${action}ing service:`, error)
      toast.error(`Failed to ${action} service`)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      vaccineType: '',
      manufacturer: '',
      dosesRequired: 1,
      doseIntervalDays: 0,
      ageGroup: '',
    })
  }

  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vaccination Services</h1>
          <p className="text-sm text-gray-600 mt-1">Manage vaccination services (Category: Vaccination)</p>
        </div>
        <button
          onClick={() => {
            setEditingService(null)
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add Service</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium flex items-center">
              Category: VACCINATION (Locked)
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No vaccination services found
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vaccine Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredServices.map((service) => (
                  <tr key={service._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {service.code}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>
                        <p className="font-medium">{service.name}</p>
                        {service.manufacturer && (
                          <p className="text-gray-500 text-xs">{service.manufacturer}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {service.vaccineType || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {service.dosesRequired || 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {service.isActive ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(service)}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(service)}
                        className={`inline-flex items-center px-3 py-1 rounded-lg transition-colors ${
                          service.isActive
                            ? 'bg-red-100 hover:bg-red-200 text-red-700'
                            : 'bg-green-100 hover:bg-green-200 text-green-700'
                        }`}
                      >
                        {service.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg my-8">
            <h2 className="text-xl font-bold mb-4">
              {editingService ? 'Edit Vaccination Service' : 'Add New Vaccination Service'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., COVID-19 Vaccine"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    placeholder="e.g., COVID19"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value="VACCINATION"
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Category is locked to Vaccination</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vaccine Type
                  </label>
                  <input
                    type="text"
                    value={formData.vaccineType}
                    onChange={(e) => setFormData({ ...formData, vaccineType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., mRNA, Inactivated"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Pfizer, Moderna"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Doses Required
                  </label>
                  <input
                    type="number"
                    value={formData.dosesRequired}
                    onChange={(e) => setFormData({ ...formData, dosesRequired: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dose Interval (Days)
                  </label>
                  <input
                    type="number"
                    value={formData.doseIntervalDays}
                    onChange={(e) => setFormData({ ...formData, doseIntervalDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age Group
                </label>
                <input
                  type="text"
                  value={formData.ageGroup}
                  onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 18+ years, All ages"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optional description"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingService(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {editingService ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
