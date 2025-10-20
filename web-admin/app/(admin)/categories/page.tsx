'use client'

import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'

interface Category {
  _id: string
  categoryId: string
  name: string
  description?: string
  isActive: boolean
  displayOrder: number
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    categoryId: '',
    name: '',
    description: '',
    isActive: true,
    displayOrder: 0,
  })

  const fetchCategories = useCallback(async () => {
    console.log('📡📡📡 [CategoriesPage.fetchCategories] START 📡📡📡')

    try {
      const url = '/api/categories?limit=100'
      console.log('[CategoriesPage] Fetching from URL:', url)

      const response = await apiFetch(url)
      console.log('[CategoriesPage] Response status:', response.status)
      console.log('[CategoriesPage] Response ok:', response.ok)
      console.log('[CategoriesPage] Response headers:', response.headers)

      if (response.ok) {
        const data = await response.json()
        console.log('[CategoriesPage] RAW API Response:', JSON.stringify(data, null, 2))
        console.log('[CategoriesPage] Response structure:', {
          hasData: !!data.data,
          dataIsArray: Array.isArray(data.data),
          dataLength: data.data?.length,
          total: data.total,
          page: data.page,
          pages: data.pages
        })

        if (data.data) {
          console.log('[CategoriesPage] Categories from API:')
          data.data.forEach((cat: any, idx: number) => {
            console.log(`  [${idx}] ID: ${cat._id}, CategoryID: ${cat.categoryId}, Name: ${cat.name}, Active: ${cat.isActive}`)
          })
        }

        console.log('[CategoriesPage] Setting categories state with:', data.data || [])
        setCategories(data.data || [])

        console.log('[CategoriesPage] State update triggered')
      } else {
        console.error('[CategoriesPage] Response not OK:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('[CategoriesPage] Error response body:', errorText)
      }
    } catch (error) {
      console.error('[CategoriesPage] Fetch error:', error)
      console.error('[CategoriesPage] Error stack:', (error as any).stack)
    } finally {
      console.log('[CategoriesPage] Setting loading to false')
      setLoading(false)
      console.log('📡📡📡 [CategoriesPage.fetchCategories] END 📡📡📡')
    }
  }, [])

  useEffect(() => {
    console.log('🌟🌟🌟 [CategoriesPage] Component mounted, calling fetchCategories 🌟🌟🌟')
    fetchCategories()
  }, [fetchCategories])

  // Add a useEffect to monitor state changes
  useEffect(() => {
    console.log('🔄🔄🔄 [CategoriesPage] Categories state updated 🔄🔄🔄')
    console.log('[CategoriesPage] New categories count:', categories.length)
    console.log('[CategoriesPage] New categories:', categories.map(c => ({
      id: c._id,
      categoryId: c.categoryId,
      name: c.name
    })))
  }, [categories])

  const handleCreate = async () => {
    if (!formData.categoryId || !formData.name) {
      alert('Category ID and Name are required')
      return
    }

    try {
      const response = await apiFetch('/api/categories', {
        method: 'POST',
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchCategories()
        setShowCreateModal(false)
        resetForm()
      } else {
        const error = await response.json()
        alert(`Failed to create category: ${error.message}`)
      }
    } catch (error) {
      alert('Failed to create category')
    }
  }

  const handleUpdate = async () => {
    if (!currentCategory) return

    try {
      // Remove categoryId from update as it cannot be changed
      const { categoryId, ...updateData } = formData

      const response = await apiFetch(`/api/categories/${currentCategory._id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        await fetchCategories()
        setShowEditModal(false)
        setCurrentCategory(null)
        resetForm()
      } else {
        const error = await response.json()
        alert(`Failed to update category: ${error.message}`)
      }
    } catch (error) {
      alert('Failed to update category')
    }
  }

  const handleToggleActive = async (category: Category) => {
    try {
      const response = await apiFetch(`/api/categories/${category._id}/toggle-active`, {
        method: 'PUT',
      })

      if (response.ok) {
        await fetchCategories()
      }
    } catch (error) {
      alert('Failed to toggle category status')
    }
  }

  const handleDelete = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete category "${category.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await apiFetch(`/api/categories/${category._id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchCategories()
        alert('Category deleted successfully')
      } else {
        const error = await response.json()
        alert(`Failed to delete category: ${error.message}`)
      }
    } catch (error) {
      alert('Failed to delete category')
    }
  }


  const resetForm = () => {
    setFormData({
      categoryId: '',
      name: '',
      description: '',
      isActive: true,
      displayOrder: 0,
      })
  }

  const openEditModal = (category: Category) => {
    setCurrentCategory(category)
    setFormData({
      categoryId: category.categoryId,
      name: category.name,
      description: category.description || '',
      isActive: category.isActive,
      displayOrder: category.displayOrder || 0,
    })
    setShowEditModal(true)
  }

  const filteredCategories = categories.filter(category =>
    category.categoryId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  console.log('🔍🔍🔍 [CategoriesPage] Filtering categories 🔍🔍🔍')
  console.log('[CategoriesPage] Search term:', searchTerm)
  console.log('[CategoriesPage] Categories before filter:', categories.length)
  console.log('[CategoriesPage] Categories after filter:', filteredCategories.length)
  console.log('[CategoriesPage] Filtered categories:', filteredCategories.map(c => ({
    categoryId: c.categoryId,
    name: c.name
  })))

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
          Add Category
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <input
          type="text"
          placeholder="Search categories..."
          className="input w-full md:w-1/3"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Categories Table */}
      <div className="table-container">
        {filteredCategories.length === 0 ? (
          <div className="empty-state">
            <h4 className="empty-state-title">No categories found</h4>
            <p className="empty-state-description">
              {searchTerm ? 'Try adjusting your search.' : 'Get started by creating your first category.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Category ID</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.sort((a, b) => a.displayOrder - b.displayOrder).map((category) => (
                  <tr key={category._id}>
                    <td className="text-center">{category.displayOrder}</td>
                    <td>
                      <span className="font-mono text-sm font-bold">{category.categoryId}</span>
                    </td>
                    <td className="font-medium">{category.name}</td>
                    <td className="text-sm text-gray-600">{category.description || '-'}</td>
                    <td>
                      <button
                        onClick={() => handleToggleActive(category)}
                        className={`badge cursor-pointer ${category.isActive ? 'badge-success' : 'badge-error'}`}
                      >
                        {category.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(category)}
                          className="btn-ghost text-sm"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
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
          <button
            type="button"
            className="fixed inset-0 bg-black bg-opacity-50 z-40 border-0 p-0 cursor-default"
            onClick={() => {
              setShowCreateModal(false)
              setShowEditModal(false)
              resetForm()
            }}
            aria-label="Close modal"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto pointer-events-auto">
              <div className="modal-header">
                <h3 className="text-lg font-semibold">
                  {showCreateModal ? 'Add New Category' : 'Edit Category'}
                </h3>
              </div>

              <div className="modal-body space-y-4">
                <div>
                  <label className="label">Category ID *</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value.toUpperCase() })}
                    disabled={showEditModal}
                    placeholder="e.g., CAT001, CAT002"
                    pattern="[A-Z]{3}[0-9]{3}"
                    title="Format: 3 uppercase letters followed by 3 digits"
                    required
                  />
                  {showEditModal && (
                    <p className="text-xs text-gray-500 mt-1">Category ID cannot be changed</p>
                  )}
                </div>

                <div>
                  <label className="label">Category Name *</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Dental Services"
                    required
                  />
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the category"
                  />
                </div>


                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Display Order</label>
                    <input
                      type="number"
                      className="input"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                      min="0"
                    />
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

                {showCreateModal && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Category ID cannot be changed after creation.
                    </p>
                  </div>
                )}

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