'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'

// ==================== INTERFACES ====================

interface LabService {
  _id: string
  serviceId: string
  name: string
  code: string
  category: string
  isActive: boolean
}

interface DiagnosticService {
  _id: string
  serviceId: string
  name: string
  code: string
  category: string
  isActive: boolean
}

interface AhcPackage {
  _id: string
  packageId: string
  name: string
  effectiveFrom: string
  effectiveTo: string
  labServiceIds: string[]
  diagnosticServiceIds: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface FormData {
  name: string
  effectiveFrom: string
  effectiveTo: string
  labServiceIds: string[]
  diagnosticServiceIds: string[]
}

// ==================== INITIAL STATE ====================

const initialFormData: FormData = {
  name: '',
  effectiveFrom: '',
  effectiveTo: '',
  labServiceIds: [],
  diagnosticServiceIds: [],
}

// ==================== MAIN COMPONENT ====================

export default function AhcMasterPage() {
  const router = useRouter()

  // State
  const [packages, setPackages] = useState<AhcPackage[]>([])
  const [labServices, setLabServices] = useState<LabService[]>([])
  const [diagnosticServices, setDiagnosticServices] = useState<DiagnosticService[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [submitting, setSubmitting] = useState(false)

  // ==================== DATA FETCHING ====================

  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiFetch('/api/admin/ahc/packages')
      if (!response.ok) throw new Error('Failed to fetch AHC packages')
      const result = await response.json()
      setPackages(result.data || [])
    } catch (error) {
      console.error('Error fetching AHC packages:', error)
      toast.error('Failed to load AHC packages')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchLabServices = useCallback(async () => {
    try {
      const response = await apiFetch('/api/admin/lab/services')
      if (!response.ok) throw new Error('Failed to fetch lab services')
      const result = await response.json()
      setLabServices(result.data || [])
    } catch (error) {
      console.error('Error fetching lab services:', error)
      toast.error('Failed to load lab services')
    }
  }, [])

  const fetchDiagnosticServices = useCallback(async () => {
    try {
      const response = await apiFetch('/api/admin/diagnostics/services')
      if (!response.ok) throw new Error('Failed to fetch diagnostic services')
      const result = await response.json()
      setDiagnosticServices(result.data || [])
    } catch (error) {
      console.error('Error fetching diagnostic services:', error)
      toast.error('Failed to load diagnostic services')
    }
  }, [])

  useEffect(() => {
    fetchPackages()
    fetchLabServices()
    fetchDiagnosticServices()
  }, [fetchPackages, fetchLabServices, fetchDiagnosticServices])

  // ==================== SEARCH/FILTER ====================

  const filteredPackages = packages.filter(pkg => {
    const search = searchTerm.toLowerCase()
    return (
      pkg.packageId.toLowerCase().includes(search) ||
      pkg.name.toLowerCase().includes(search)
    )
  })

  // ==================== FORM HANDLERS ====================

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleLabServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      labServiceIds: prev.labServiceIds.includes(serviceId)
        ? prev.labServiceIds.filter(id => id !== serviceId)
        : [...prev.labServiceIds, serviceId]
    }))
  }

  const handleDiagnosticServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      diagnosticServiceIds: prev.diagnosticServiceIds.includes(serviceId)
        ? prev.diagnosticServiceIds.filter(id => id !== serviceId)
        : [...prev.diagnosticServiceIds, serviceId]
    }))
  }

  // ==================== MODAL HANDLERS ====================

  const openCreateModal = () => {
    setFormData(initialFormData)
    setIsEditMode(false)
    setEditingId(null)
    setIsModalOpen(true)
  }

  const openEditModal = (pkg: AhcPackage) => {
    setFormData({
      name: pkg.name,
      effectiveFrom: pkg.effectiveFrom.split('T')[0],
      effectiveTo: pkg.effectiveTo.split('T')[0],
      labServiceIds: pkg.labServiceIds,
      diagnosticServiceIds: pkg.diagnosticServiceIds,
    })
    setIsEditMode(true)
    setEditingId(pkg.packageId)
    setIsModalOpen(true)
  }

  // ==================== CRUD OPERATIONS ====================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation: Package name required
    if (!formData.name.trim()) {
      toast.error('Package name is required')
      return
    }

    // Validation: At least one service must be selected
    if (formData.labServiceIds.length === 0 && formData.diagnosticServiceIds.length === 0) {
      toast.error('Please select at least one lab test or diagnostic test')
      return
    }

    // Validation: Date range
    if (formData.effectiveTo <= formData.effectiveFrom) {
      toast.error('Effective To date must be after Effective From date')
      return
    }

    setSubmitting(true)

    try {
      const url = isEditMode
        ? `/api/admin/ahc/packages/${editingId}`
        : '/api/admin/ahc/packages'
      const method = isEditMode ? 'PATCH' : 'POST'

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Operation failed')
      }

      const result = await response.json()
      toast.success(result.message)
      setIsModalOpen(false)
      fetchPackages()
    } catch (error: any) {
      console.error('Error saving AHC package:', error)
      toast.error(error.message || 'Failed to save AHC package')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (packageId: string) => {
    try {
      const response = await apiFetch(`/api/admin/ahc/packages/${packageId}/toggle-active`, {
        method: 'PATCH',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to toggle status')
      }

      const result = await response.json()
      toast.success(result.message)
      fetchPackages()
    } catch (error: any) {
      console.error('Error toggling status:', error)
      toast.error(error.message || 'Failed to update status')
    }
  }

  const handleDelete = async (packageId: string) => {
    if (!confirm(`Are you sure you want to delete package ${packageId}?`)) return

    try {
      const response = await apiFetch(`/api/admin/ahc/packages/${packageId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete package')
      }

      toast.success('AHC Package deleted successfully')
      fetchPackages()
    } catch (error: any) {
      console.error('Error deleting package:', error)
      toast.error(error.message || 'Failed to delete package')
    }
  }

  // ==================== HELPER FUNCTIONS ====================

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  // ==================== RENDER ====================

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AHC Master</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage Annual Health Check packages
        </p>
      </div>

      {/* Search and Actions Bar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by package ID or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Create Package
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-500">Loading packages...</p>
        </div>
      ) : filteredPackages.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">
            {searchTerm ? 'No packages match your search.' : 'No AHC packages found. Create your first package to get started.'}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Package ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Package Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Validity Period
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
              {filteredPackages.map((pkg) => (
                <tr key={pkg._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {pkg.packageId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {pkg.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(pkg.effectiveFrom)} - {formatDate(pkg.effectiveTo)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        pkg.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {pkg.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(pkg)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(pkg.packageId)}
                      className="text-yellow-600 hover:text-yellow-900 mr-3"
                    >
                      {pkg.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(pkg.packageId)}
                      className="text-red-600 hover:text-red-900"
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

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {isEditMode ? 'Edit AHC Package' : 'Create New AHC Package'}
              </h2>

              <form onSubmit={handleSubmit}>
                {/* Package Name Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Package Details</h3>
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Package Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Executive Health Check 2026"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      A descriptive name to identify this package
                    </p>
                  </div>
                </div>

                {/* Validity Period Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Validity Period</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="effectiveFrom" className="block text-sm font-medium text-gray-700 mb-1">
                        Effective From <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="effectiveFrom"
                        name="effectiveFrom"
                        required
                        value={formData.effectiveFrom}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="effectiveTo" className="block text-sm font-medium text-gray-700 mb-1">
                        Effective To <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="effectiveTo"
                        name="effectiveTo"
                        required
                        value={formData.effectiveTo}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Lab Tests Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Lab Tests
                    {formData.labServiceIds.length > 0 && (
                      <span className="ml-2 text-sm font-normal text-blue-600">
                        ({formData.labServiceIds.length} selected)
                      </span>
                    )}
                  </h3>
                  <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto bg-gray-50">
                    {labServices.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No lab services available
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {labServices.map((service) => (
                          <label
                            key={service.serviceId}
                            className="flex items-center space-x-3 p-2 hover:bg-white rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.labServiceIds.includes(service.serviceId)}
                              onChange={() => handleLabServiceToggle(service.serviceId)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-900">{service.name}</span>
                              <span className="ml-2 text-xs text-gray-500 font-mono">({service.code})</span>
                              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                {service.category}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Diagnostic Tests Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Diagnostic Tests
                    {formData.diagnosticServiceIds.length > 0 && (
                      <span className="ml-2 text-sm font-normal text-green-600">
                        ({formData.diagnosticServiceIds.length} selected)
                      </span>
                    )}
                  </h3>
                  <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto bg-gray-50">
                    {diagnosticServices.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No diagnostic services available
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {diagnosticServices.map((service) => (
                          <label
                            key={service.serviceId}
                            className="flex items-center space-x-3 p-2 hover:bg-white rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.diagnosticServiceIds.includes(service.serviceId)}
                              onChange={() => handleDiagnosticServiceToggle(service.serviceId)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-900">{service.name}</span>
                              <span className="ml-2 text-xs text-gray-500 font-mono">({service.code})</span>
                              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                {service.category}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Validation Message */}
                {formData.labServiceIds.length === 0 && formData.diagnosticServiceIds.length === 0 && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      Please select at least one lab test or diagnostic test
                    </p>
                  </div>
                )}

                {/* Modal Actions */}
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={submitting}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : isEditMode ? 'Update Package' : 'Create Package'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
