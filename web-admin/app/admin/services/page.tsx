'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

interface ServiceType {
  _id: string
  code: string
  name: string
  description?: string
  category: string
  categoryName?: string
  isActive: boolean
}

export default function ServicesPage() {
  const router = useRouter()
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterActive, setFilterActive] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [currentService, setCurrentService] = useState<ServiceType | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    category: '',
    isActive: true,
  })

  useEffect(() => {
    fetchServiceTypes()
    fetchCategories()
  }, [])

  const fetchServiceTypes = async () => {
    try {
      const response = await apiFetch('/api/services/types?limit=100')
      if (response.ok) {
        const data = await response.json()
        setServiceTypes(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch service types')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await apiFetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        const activeCategories = data.data
          .filter((cat: any) => cat.isActive)
          .map((cat: any) => cat.categoryId)
        setCategories(activeCategories)

        // Set first category as default if form category is empty
        if (activeCategories.length > 0 && !formData.category) {
          setFormData(prev => ({
            ...prev,
            category: activeCategories[0]
          }))
        }
      }
    } catch (error) {
      console.error('Failed to fetch categories')
    }
  }

  const handleCreate = async () => {
    try {
      // Include default values for required fields that are being removed from UI
      const payload = {
        ...formData,
        coveragePercentage: 100,
        copayAmount: 0,
        requiresPreAuth: false,
        requiresReferral: false,
      }

      const response = await apiFetch('/api/services/types', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        await fetchServiceTypes()
        setShowCreateModal(false)
        resetForm()
      } else {
        const error = await response.json()
        alert(`Failed to create service type: ${error.message}`)
      }
    } catch (error) {
      alert('Failed to create service type')
    }
  }

  const handleUpdate = async () => {
    if (!currentService) return

    try {
      // Remove code field from update payload since codes are immutable
      const { code, ...updateData } = formData

      const response = await apiFetch(`/api/services/types/${currentService._id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        await fetchServiceTypes()
        setShowEditModal(false)
        setCurrentService(null)
        resetForm()
      } else {
        const error = await response.json()
        alert(`Failed to update service type: ${error.message}`)
      }
    } catch (error) {
      alert('Failed to update service type')
    }
  }

  const handleToggleActive = async (service: ServiceType) => {
    try {
      const response = await apiFetch(`/api/services/types/${service._id}/toggle-active`, {
        method: 'PUT',
      })

      if (response.ok) {
        await fetchServiceTypes()
      }
    } catch (error) {
      alert('Failed to toggle service status')
    }
  }

  const handleDelete = async (service: ServiceType) => {
    if (!confirm(`Are you sure you want to delete "${service.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await apiFetch(`/api/services/types/${service._id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchServiceTypes()
        alert('Service type deleted successfully')
      } else {
        const error = await response.json()
        alert(`Failed to delete service type: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      alert('Failed to delete service type')
    }
  }

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      category: categories.length > 0 ? categories[0] : '',
      isActive: true,
    })
  }

  const openEditModal = (service: ServiceType) => {
    setCurrentService(service)
    setFormData({
      code: service.code,
      name: service.name,
      description: service.description || '',
      category: service.category,
      isActive: service.isActive,
    })
    setShowEditModal(true)
  }

  const filteredServices = serviceTypes.filter(service => {
    const matchesSearch =
      service.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !filterCategory || service.category === filterCategory
    const matchesActive = filterActive === '' || service.isActive === (filterActive === 'true')
    return matchesSearch && matchesCategory && matchesActive
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          Add Service Type
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search by code or name..."
            className="input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="input"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            className="input"
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Service Types Table */}
      <div className="table-container">
        {filteredServices.length === 0 ? (
          <div className="empty-state">
            <h4 className="empty-state-title">No service types found</h4>
            <p className="empty-state-description">
              {searchTerm || filterCategory || filterActive ? 'Try adjusting your filters.' : 'Get started by creating your first service type.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Category ID</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((service) => (
                  <tr key={service._id}>
                    <td>
                      <span className="font-mono text-sm font-medium">
                        {service.code}
                      </span>
                    </td>
                    <td>
                      <div className="font-medium text-gray-900">{service.name}</div>
                    </td>
                    <td>
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {service.description || '-'}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-default">{service.categoryName || service.category}</span>
                    </td>
                    <td>
                      <span className="font-mono text-sm text-gray-600">{service.category}</span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleActive(service)}
                        className={`badge cursor-pointer ${service.isActive ? 'badge-success' : 'badge-error'}`}
                      >
                        {service.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(service)}
                          className="btn-ghost text-sm"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(service)}
                          className="btn-ghost text-sm text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => {
            setShowCreateModal(false)
            setShowEditModal(false)
            resetForm()
          }} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto pointer-events-auto">
              <div className="modal-header">
                <h3 className="text-lg font-semibold">
                  {showCreateModal ? 'Add New Service Type' : 'Edit Service Type'}
                </h3>
              </div>

              <div className="modal-body space-y-4">
                <div>
                  <label className="label">Service Code *</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    disabled={showEditModal}
                    placeholder="e.g., CON001"
                    required
                  />
                  {showEditModal && (
                    <p className="text-xs text-gray-500 mt-1">Service code cannot be changed</p>
                  )}
                </div>

                <div>
                  <label className="label">Service Name *</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., General Consultation"
                    required
                  />
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the service"
                  />
                </div>

                <div>
                  <label className="label">Category *</label>
                  <select
                    className="input"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Status</label>
                  <select
                    className="input"
                    value={formData.isActive.toString()}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setShowEditModal(false)
                    resetForm()
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={showCreateModal ? handleCreate : handleUpdate}
                  className="btn-primary"
                >
                  {showCreateModal ? 'Create' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}