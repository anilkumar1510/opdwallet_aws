'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'

interface RelationshipMaster {
  _id: string
  relationshipCode: string
  relationshipName: string
  displayName: string
  description?: string
  isActive: boolean
  sortOrder?: number
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
}

interface FormData {
  relationshipCode: string
  relationshipName: string
  displayName: string
  description: string
  isActive: boolean
  sortOrder: number
}

export default function MastersPage() {
  const [relationships, setRelationships] = useState<RelationshipMaster[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    relationshipCode: '',
    relationshipName: '',
    displayName: '',
    description: '',
    isActive: true,
    sortOrder: 1,
  })
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchRelationships()
  }, [])

  const fetchRelationships = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await apiFetch('/api/relationships/all')
      if (response.ok) {
        const data = await response.json()
        setRelationships(data)
      } else {
        setError('Failed to fetch relationships')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch relationships')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingId(null)
    setFormData({
      relationshipCode: '',
      relationshipName: '',
      displayName: '',
      description: '',
      isActive: true,
      sortOrder: 1,
    })
    setSubmitError('')
    setShowModal(true)
  }

  const handleEdit = (relationship: RelationshipMaster) => {
    setEditingId(relationship._id)
    setFormData({
      relationshipCode: relationship.relationshipCode,
      relationshipName: relationship.relationshipName,
      displayName: relationship.displayName,
      description: relationship.description || '',
      isActive: relationship.isActive,
      sortOrder: relationship.sortOrder || 1,
    })
    setSubmitError('')
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError('')

    try {
      const url = editingId
        ? `/api/relationships/${editingId}`
        : '/api/relationships'

      const method = editingId ? 'PUT' : 'POST'

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchRelationships()
        setShowModal(false)
        setEditingId(null)
      } else {
        const errorData = await response.json()
        setSubmitError(errorData.message || 'Failed to save relationship')
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to save relationship')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this relationship? This action cannot be undone.')) {
      return
    }

    try {
      const response = await apiFetch(`/api/relationships/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchRelationships()
        toast.success('Relationship deleted successfully')
      } else {
        const errorData = await response.json()
        console.error('Failed to delete relationship:', errorData)
        toast.error(errorData.message || 'Failed to delete relationship')
      }
    } catch (err: any) {
      console.error('Error deleting relationship:', err)
      toast.error(err.message || 'Failed to delete relationship. Please try again.')
    }
  }

  const handleToggleActive = async (id: string) => {
    try {
      const response = await apiFetch(`/api/relationships/${id}/toggle-active`, {
        method: 'PATCH',
      })

      if (response.ok) {
        await fetchRelationships()
        toast.success('Status updated successfully')
      } else {
        const errorData = await response.json()
        console.error('Failed to toggle status:', errorData)
        toast.error(errorData.message || 'Failed to toggle status')
      }
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
          <h3 className="text-lg font-semibold text-gray-900">Relationship Masters</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage relationship types for family members
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="btn-primary inline-flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Relationship
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Code</th>
                <th className="table-header">Name</th>
                <th className="table-header">Display Name</th>
                <th className="table-header">Description</th>
                <th className="table-header">Sort Order</th>
                <th className="table-header">Status</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {relationships.map((relationship) => (
                <tr key={relationship._id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <span className="font-mono text-sm font-medium text-gray-900">
                      {relationship.relationshipCode}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className="font-medium text-gray-900">
                      {relationship.relationshipName}
                    </span>
                  </td>
                  <td className="table-cell text-gray-600">
                    {relationship.displayName}
                  </td>
                  <td className="table-cell text-gray-600">
                    {relationship.description || '-'}
                  </td>
                  <td className="table-cell text-gray-600">
                    {relationship.sortOrder || 1}
                  </td>
                  <td className="table-cell">
                    <button
                      onClick={() => handleToggleActive(relationship._id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        relationship.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {relationship.isActive ? (
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
                        onClick={() => handleEdit(relationship)}
                        className="btn-ghost text-sm inline-flex items-center gap-1"
                      >
                        <PencilIcon className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(relationship._id)}
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

          {relationships.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No relationships found</p>
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
                {editingId ? 'Edit Relationship' : 'Add New Relationship'}
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
                  Relationship Code *
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingId}
                  value={formData.relationshipCode}
                  onChange={(e) => setFormData({ ...formData, relationshipCode: e.target.value.toUpperCase() })}
                  placeholder="e.g., REL006"
                  className="input-field"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Unique code for the relationship (uppercase, cannot be changed after creation)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relationship Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.relationshipName}
                  onChange={(e) => setFormData({ ...formData, relationshipName: e.target.value })}
                  placeholder="e.g., Sibling"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="e.g., Brother/Sister"
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
                  placeholder="Brief description of the relationship"
                  rows={3}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort Order
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 1 })}
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
