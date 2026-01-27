'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { usePermissions } from '@/hooks/usePermissions'

interface Service {
  _id: string
  code: string
  name: string
  description?: string
  category: string
  isActive: boolean
}

interface ServiceManagementTabProps {
  categoryId: string
  categoryName: string
}

export function ServiceManagementTab({ categoryId, categoryName }: ServiceManagementTabProps) {
  const { canDelete } = usePermissions()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [toggleLoading, setToggleLoading] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
  })

  useEffect(() => {
    fetchServices()
  }, [categoryId])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const response = await apiFetch(`/api/services/types?category=${categoryId}&limit=100`)

      if (response.ok) {
        const data = await response.json()
        setServices(data.data || [])
      } else {
        toast.error('Failed to fetch services')
      }
    } catch (error) {
      console.error('Error fetching services:', error)
      toast.error('Failed to fetch services')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate code format
    const codePattern = /^[A-Z]{3}[0-9]{3}$/
    if (!codePattern.test(formData.code)) {
      toast.error('Service code must be in format: 3 letters + 3 numbers (e.g., DEN001)')
      return
    }

    try {
      const payload = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        description: formData.description,
        category: categoryId,
        isActive: true, // Always active by default
      }

      const url = editingService
        ? `/api/services/types/${editingService._id}`
        : '/api/services/types'

      const method = editingService ? 'PUT' : 'POST'

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.message || 'Failed to save service')
        return
      }

      toast.success(editingService ? 'Service updated successfully' : 'Service created successfully')
      setShowModal(false)
      setEditingService(null)
      resetForm()
      fetchServices()
    } catch (error) {
      console.error('Error saving service:', error)
      toast.error('Failed to save service. Please try again.')
    }
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setFormData({
      code: service.code,
      name: service.name,
      description: service.description || '',
    })
    setShowModal(true)
  }

  const handleToggleActive = async (serviceId: string) => {
    setToggleLoading(serviceId)
    try {
      const response = await apiFetch(`/api/services/types/${serviceId}/toggle-active`, {
        method: 'PUT',
      })

      if (response.ok) {
        toast.success('Service status updated')
        fetchServices()
      } else {
        toast.error('Failed to update service status')
      }
    } catch (error) {
      console.error('Error toggling service:', error)
      toast.error('Failed to update service status')
    } finally {
      setToggleLoading(null)
    }
  }

  const handleDelete = async (serviceId: string, serviceName: string) => {
    if (!confirm(`Are you sure you want to delete "${serviceName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await apiFetch(`/api/services/types/${serviceId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Service deleted successfully')
        fetchServices()
      } else {
        toast.error('Failed to delete service')
      }
    } catch (error) {
      console.error('Error deleting service:', error)
      toast.error('Failed to delete service')
    }
  }

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
    })
  }

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.code.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesActive =
      activeFilter === 'all' ||
      (activeFilter === 'active' && service.isActive) ||
      (activeFilter === 'inactive' && !service.isActive)

    return matchesSearch && matchesActive
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Service Configuration</h3>
            <p className="text-sm text-gray-600 mt-1">
              Manage services for {categoryName}
            </p>
          </div>
          <button
            onClick={() => {
              setEditingService(null)
              resetForm()
              setShowModal(true)
            }}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add Service</span>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Services</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Services Table */}
      <div className="overflow-x-auto">
        {filteredServices.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? 'No services found matching your search' : 'No services added yet'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name & Description
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
                      <div className="font-medium">{service.name}</div>
                      {service.description && (
                        <div className="text-gray-500 text-xs mt-1">{service.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={service.isActive}
                        onCheckedChange={() => handleToggleActive(service._id)}
                        disabled={toggleLoading === service._id}
                        id={`service-${service._id}`}
                      />
                      {toggleLoading === service._id && (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(service)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                      title="Edit"
                    >
                      <PencilIcon className="h-5 w-5 inline" />
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(service._id, service.name)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5 inline" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Service Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold">
                  {editingService ? 'Edit Service' : `Add New Service - ${categoryName}`}
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Basic Information</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
                        placeholder="e.g., DEN001"
                        pattern="[A-Z]{3}[0-9]{3}"
                        title="Format: 3 letters + 3 numbers (e.g., DEN001)"
                      />
                      <p className="text-xs text-gray-500 mt-1">Format: 3 letters + 3 numbers</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., Routine Cleaning"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Optional description"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingService(null)
                    resetForm()
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  {editingService ? 'Update Service' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
