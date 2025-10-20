'use client'

import { useEffect, useState } from 'react'
import { specialtiesApi, type Specialty } from '@/lib/api'
import { toast } from 'sonner'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'

interface FormData {
  code: string
  name: string
  description: string
  icon: string
  isActive: boolean
  displayOrder: number
}

export default function SpecialtiesMasters() {
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    code: '',
    name: '',
    description: '',
    icon: '',
    isActive: true,
    displayOrder: 1,
  })
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchSpecialties()
  }, [])

  const fetchSpecialties = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await specialtiesApi.getAllForAdmin()
      setSpecialties(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch specialties')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingId(null)
    setFormData({
      code: '',
      name: '',
      description: '',
      icon: '',
      isActive: true,
      displayOrder: 1,
    })
    setSubmitError('')
    setShowModal(true)
  }

  const handleEdit = (specialty: Specialty) => {
    setEditingId(specialty._id)
    setFormData({
      code: specialty.code,
      name: specialty.name,
      description: specialty.description || '',
      icon: specialty.icon || '',
      isActive: specialty.isActive,
      displayOrder: specialty.displayOrder || 1,
    })
    setSubmitError('')
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError('')

    try {
      if (editingId) {
        await specialtiesApi.update(editingId, formData)
      } else {
        await specialtiesApi.create(formData)
      }
      await fetchSpecialties()
      setShowModal(false)
      setEditingId(null)
      toast.success(`Specialty ${editingId ? 'updated' : 'created'} successfully`)
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to save specialty')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this specialty? This action cannot be undone.')) {
      return
    }

    try {
      await specialtiesApi.delete(id)
      await fetchSpecialties()
      toast.success('Specialty deleted successfully')
    } catch (err: any) {
      console.error('Error deleting specialty:', err)
      toast.error(err.message || 'Failed to delete specialty. Please try again.')
    }
  }

  const handleToggleActive = async (id: string) => {
    try {
      await specialtiesApi.toggleActive(id)
      await fetchSpecialties()
      toast.success('Status updated successfully')
    } catch (err: any) {
      console.error('Error toggling status:', err)
      toast.error(err.message || 'Failed to toggle status. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Doctor Specialties</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage medical specialties for doctors
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="btn-primary inline-flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Specialty
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Specialty ID</th>
                <th className="table-header">Code</th>
                <th className="table-header">Name</th>
                <th className="table-header">Description</th>
                <th className="table-header">Icon</th>
                <th className="table-header">Display Order</th>
                <th className="table-header">Status</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {specialties.map((specialty) => (
                <tr key={specialty._id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <span className="font-mono text-xs text-gray-500">
                      {specialty.specialtyId}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className="font-mono text-sm font-medium text-gray-900">
                      {specialty.code}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className="font-medium text-gray-900">
                      {specialty.name}
                    </span>
                  </td>
                  <td className="table-cell text-gray-600">
                    {specialty.description || '-'}
                  </td>
                  <td className="table-cell text-gray-600">
                    {specialty.icon || '-'}
                  </td>
                  <td className="table-cell text-gray-600">
                    {specialty.displayOrder || 1}
                  </td>
                  <td className="table-cell">
                    <button
                      onClick={() => handleToggleActive(specialty._id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        specialty.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {specialty.isActive ? (
                        <>
                          <CheckCircleIcon className="h-3.5 w-3.5" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="h-3.5 w-3.5" />
                          Inactive
                        </>
                      )}
                    </button>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(specialty)}
                        className="btn-ghost text-sm inline-flex items-center gap-1"
                      >
                        <PencilIcon className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(specialty._id)}
                        className="btn-ghost-danger text-sm inline-flex items-center gap-1"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {specialties.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No specialties found</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit Specialty' : 'Add New Specialty'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {submitError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                  <p className="text-sm text-red-600">{submitError}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code *
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingId}
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., CARDIO"
                  className="input-field"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Unique code for the specialty (uppercase, cannot be changed after creation)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Cardiology"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the specialty"
                  rows={3}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="e.g., 🫀 or heart-icon"
                  className="input-field"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Emoji or icon identifier for the specialty
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 1 })}
                  className="input-field"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lower numbers appear first in lists
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-yellow-400 focus:ring-yellow-400 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Active
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-ghost"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
