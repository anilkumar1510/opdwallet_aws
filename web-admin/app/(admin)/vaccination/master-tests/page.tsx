'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PlusIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'

interface VaccinationMasterParameter {
  _id: string
  parameterId: string
  code: string
  standardName: string
  category: string
  description?: string
  synonyms: string[]
  vaccineType?: string
  targetDisease?: string
  isActive: boolean
  createdAt: string
}

export default function VaccinationMasterTestsPage() {
  const [tests, setTests] = useState<VaccinationMasterParameter[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingTest, setEditingTest] = useState<VaccinationMasterParameter | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    code: '',
    standardName: '',
    description: '',
    synonyms: '',
    vaccineType: '',
    targetDisease: '',
  })

  const fetchTests = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)

      const response = await apiFetch(`/api/admin/vaccination/master-tests?${params}`)

      if (!response.ok) throw new Error('Failed to fetch master vaccines')

      const data = await response.json()
      setTests(data.data || [])
    } catch (error) {
      console.error('Error fetching master vaccines:', error)
      toast.error('Failed to fetch master vaccines')
    } finally {
      setLoading(false)
    }
  }, [searchQuery])

  useEffect(() => {
    fetchTests()
  }, [fetchTests])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.code.trim() || !formData.standardName.trim()) {
      toast.error('Code and Standard Name are required')
      return
    }

    setSubmitting(true)

    try {
      const url = editingTest
        ? `/api/admin/vaccination/master-tests/${editingTest.parameterId}`
        : '/api/admin/vaccination/master-tests'

      const method = editingTest ? 'PATCH' : 'POST'

      const payload = {
        code: formData.code.trim().toUpperCase(),
        standardName: formData.standardName.trim(),
        description: formData.description.trim() || undefined,
        synonyms: formData.synonyms
          .split(',')
          .map(s => s.trim())
          .filter(s => s.length > 0),
        vaccineType: formData.vaccineType.trim() || undefined,
        targetDisease: formData.targetDisease.trim() || undefined,
      }

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to save master vaccine')
      }

      const data = await response.json()
      toast.success(data.message || 'Master vaccine saved successfully')

      setShowModal(false)
      setEditingTest(null)
      setFormData({
        code: '',
        standardName: '',
        description: '',
        synonyms: '',
        vaccineType: '',
        targetDisease: '',
      })
      fetchTests()
    } catch (error: any) {
      console.error('Error saving master vaccine:', error)
      toast.error(error.message || 'Failed to save master vaccine')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (test: VaccinationMasterParameter) => {
    setEditingTest(test)
    setFormData({
      code: test.code,
      standardName: test.standardName,
      description: test.description || '',
      synonyms: test.synonyms.join(', '),
      vaccineType: test.vaccineType || '',
      targetDisease: test.targetDisease || '',
    })
    setShowModal(true)
  }

  const handleToggleStatus = async (test: VaccinationMasterParameter) => {
    try {
      const response = await apiFetch(`/api/admin/vaccination/master-tests/${test.parameterId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !test.isActive }),
      })

      if (!response.ok) throw new Error('Failed to update status')

      const data = await response.json()
      toast.success(data.message)
      fetchTests()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const filteredTests = tests.filter(
    (test) =>
      test.standardName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.synonyms.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Master Vaccines</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage standardized vaccine parameters for vendor mapping
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTest(null)
            setFormData({
              code: '',
              standardName: '',
              description: '',
              synonyms: '',
              vaccineType: '',
              targetDisease: '',
            })
            setShowModal(true)
          }}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Master Vaccine
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, code, or synonyms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? 'No vaccines found matching filters' : 'No master vaccines created yet'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Standard Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target Disease
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Synonyms
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
                {filteredTests.map((test) => (
                  <tr key={test._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-semibold text-gray-900">
                      {test.code}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>
                        <p className="font-medium">{test.standardName}</p>
                        {test.vaccineType && (
                          <p className="text-gray-500 text-xs">{test.vaccineType}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {test.targetDisease || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {test.synonyms.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {test.synonyms.slice(0, 3).map((synonym, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                            >
                              {synonym}
                            </span>
                          ))}
                          {test.synonyms.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              +{test.synonyms.length - 3} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">No synonyms</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleToggleStatus(test)}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          test.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {test.isActive ? (
                          <>
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(test)}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">
                {editingTest ? 'Edit Master Vaccine' : 'Create Master Vaccine'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value.toUpperCase() })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase font-mono"
                      placeholder="e.g., COVID19, FLU"
                      required
                    />
                  </div>

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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Standard Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.standardName}
                    onChange={(e) => setFormData({ ...formData, standardName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., COVID-19 Vaccine, Influenza Vaccine"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Disease
                  </label>
                  <input
                    type="text"
                    value={formData.targetDisease}
                    onChange={(e) => setFormData({ ...formData, targetDisease: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., COVID-19, Influenza, Hepatitis B"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Optional description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Synonyms
                  </label>
                  <input
                    type="text"
                    value={formData.synonyms}
                    onChange={(e) => setFormData({ ...formData, synonyms: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter synonyms separated by commas"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Alternative names for this vaccine (comma-separated)
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingTest(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : editingTest ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
