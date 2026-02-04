'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import { usePermissions } from '@/hooks/usePermissions'

interface CUG {
  _id: string
  cugId: string
  shortCode?: string
  companyName: string
  employeeCount: string
  description?: string
  isActive: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
}

interface FormData {
  shortCode: string
  companyName: string
  employeeCount: string
  description: string
  isActive: boolean
  displayOrder: number
}

const EMPLOYEE_COUNT_OPTIONS = [
  { value: '0-500', label: '0-500' },
  { value: '500-1000', label: '500-1000' },
  { value: '1000-5000', label: '1,000-5,000' },
  { value: '5000-10000', label: '5,000-10,000' },
  { value: '10000+', label: '10,000+' },
]

const initialFormData: FormData = {
  shortCode: '',
  companyName: '',
  employeeCount: '0-500',
  description: '',
  isActive: true,
  displayOrder: 0,
}

export default function CugsPage() {
  const router = useRouter()
  const { canDeactivate, canDelete } = usePermissions()
  const [cugs, setCugs] = useState<CUG[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [submitting, setSubmitting] = useState(false)

  const fetchCugs = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiFetch('/api/cugs?limit=100')
      if (!response.ok) throw new Error('Failed to fetch CUGs')
      const result = await response.json()
      setCugs(result.data || [])
    } catch (error) {
      console.error('Error fetching CUGs:', error)
      toast.error('Failed to load CUGs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCugs()
  }, [fetchCugs])

  const filteredCugs = cugs.filter(cug => {
    const search = searchTerm.toLowerCase()
    return (
      cug.cugId.toLowerCase().includes(search) ||
      (cug.shortCode?.toLowerCase() || '').includes(search) ||
      cug.companyName.toLowerCase().includes(search) ||
      (cug.description?.toLowerCase() || '').includes(search)
    )
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const openCreateModal = () => {
    setFormData(initialFormData)
    setIsEditMode(false)
    setEditingId(null)
    setIsModalOpen(true)
  }

  const openEditModal = (cug: CUG) => {
    setFormData({
      shortCode: cug.shortCode || '',
      companyName: cug.companyName,
      employeeCount: cug.employeeCount,
      description: cug.description || '',
      isActive: cug.isActive,
      displayOrder: cug.displayOrder,
    })
    setIsEditMode(true)
    setEditingId(cug._id)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const url = isEditMode ? `/api/cugs/${editingId}` : '/api/cugs'
      const method = isEditMode ? 'PUT' : 'POST'

      // For both create and update, send the same payload structure
      // cugId is auto-generated on the backend for new CUGs
      const payload = {
        shortCode: formData.shortCode || undefined, // Optional field
        companyName: formData.companyName,
        employeeCount: formData.employeeCount,
        description: formData.description || undefined,
        isActive: formData.isActive,
        displayOrder: formData.displayOrder,
      }

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Operation failed')
      }

      toast.success(isEditMode ? 'CUG updated successfully' : 'CUG created successfully')
      setIsModalOpen(false)
      fetchCugs()
    } catch (error: any) {
      console.error('Error saving CUG:', error)
      toast.error(error.message || 'Failed to save CUG')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (id: string) => {
    try {
      const response = await apiFetch(`/api/cugs/${id}/toggle-active`, {
        method: 'PATCH',
      })

      if (!response.ok) {
        const errorData = await response.json()
        // Handle nested message structure: errorData.message.message or errorData.message
        const errorMessage = typeof errorData.message === 'object'
          ? errorData.message.message || JSON.stringify(errorData.message)
          : errorData.message || 'Failed to toggle status'
        throw new Error(errorMessage)
      }

      toast.success('CUG status updated')
      fetchCugs()
    } catch (error: any) {
      console.error('Error toggling status:', error)
      toast.error(error.message || 'Failed to update status')
    }
  }

  const handleDelete = async (id: string, cugId: string) => {
    if (!confirm(`Are you sure you want to delete CUG ${cugId}?`)) return

    try {
      const response = await apiFetch(`/api/cugs/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        // Handle nested message structure: errorData.message.message or errorData.message
        const errorMessage = typeof errorData.message === 'object'
          ? errorData.message.message || JSON.stringify(errorData.message)
          : errorData.message || 'Failed to delete CUG'
        throw new Error(errorMessage)
      }

      toast.success('CUG deleted successfully')
      fetchCugs()
    } catch (error: any) {
      console.error('Error deleting CUG:', error)
      toast.error(error.message || 'Failed to delete CUG')
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">CUG Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage Corporate User Groups (CUGs)
        </p>
      </div>

      {/* Actions Bar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by CUG ID, short code, or company name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Create CUG
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-500">Loading CUGs...</p>
        </div>
      ) : filteredCugs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">
            {searchTerm ? 'No CUGs match your search' : 'No CUGs found'}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CUG ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Short Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee Count
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
              {filteredCugs.map((cug) => (
                <tr key={cug._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cug.displayOrder}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {cug.cugId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cug.shortCode || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cug.companyName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cug.employeeCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        cug.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {cug.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(cug)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Edit
                    </button>
                    {canDeactivate && (
                      <button
                        onClick={() => handleToggleActive(cug._id)}
                        className="text-yellow-600 hover:text-yellow-900 mr-3"
                      >
                        {cug.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(cug._id, cug.cugId)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    )}
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
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {isEditMode ? 'Edit CUG' : 'Create New CUG'}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  {/* Company Name */}
                  <div className="col-span-2">
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      id="companyName"
                      name="companyName"
                      required
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="Google Inc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      CUG ID will be auto-generated by the system
                    </p>
                  </div>

                  {/* Short Code */}
                  <div>
                    <label htmlFor="shortCode" className="block text-sm font-medium text-gray-700 mb-1">
                      Short Code (Optional)
                    </label>
                    <input
                      type="text"
                      id="shortCode"
                      name="shortCode"
                      value={formData.shortCode}
                      onChange={handleInputChange}
                      placeholder="GOOGLE"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Optional identifier for quick reference
                    </p>
                  </div>

                  {/* Employee Count */}
                  <div>
                    <label htmlFor="employeeCount" className="block text-sm font-medium text-gray-700 mb-1">
                      Employee Count *
                    </label>
                    <select
                      id="employeeCount"
                      name="employeeCount"
                      required
                      value={formData.employeeCount}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {EMPLOYEE_COUNT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Display Order */}
                  <div>
                    <label htmlFor="displayOrder" className="block text-sm font-medium text-gray-700 mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      id="displayOrder"
                      name="displayOrder"
                      min="0"
                      value={formData.displayOrder}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Description */}
                  <div className="col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Google corporate group"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

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
                    {submitting ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
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
