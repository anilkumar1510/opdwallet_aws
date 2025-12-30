'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'

interface TestAlias {
  _id: string
  aliasId: string
  masterParameterId: {
    _id: string
    parameterId: string
    code: string
    standardName: string
  }
  vendorId: string
  vendorTestName: string
  vendorTestCode?: string
  createdAt: string
}

interface MasterTest {
  _id: string
  parameterId: string
  code: string
  standardName: string
  category: string
}

interface Vendor {
  vendorId: string
  name: string
  code: string
}

export default function VendorAliasesPage() {
  const params = useParams()
  const router = useRouter()
  const vendorId = params.vendorId as string

  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [aliases, setAliases] = useState<TestAlias[]>([])
  const [masterTests, setMasterTests] = useState<MasterTest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingAlias, setEditingAlias] = useState<TestAlias | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    masterParameterId: '',
    vendorTestName: '',
    vendorTestCode: '',
  })

  const fetchVendor = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/admin/lab/vendors/${vendorId}`)
      if (!response.ok) throw new Error('Failed to fetch vendor')
      const data = await response.json()
      setVendor(data.data)
    } catch (error) {
      console.error('Error fetching vendor:', error)
      toast.error('Failed to fetch vendor details')
    }
  }, [vendorId])

  const fetchAliases = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiFetch(`/api/admin/lab/test-aliases/vendor/${vendorId}`)

      if (!response.ok) throw new Error('Failed to fetch aliases')

      const data = await response.json()
      setAliases(data.data || [])
    } catch (error) {
      console.error('Error fetching aliases:', error)
      toast.error('Failed to fetch test aliases')
    } finally {
      setLoading(false)
    }
  }, [vendorId])

  const fetchMasterTests = useCallback(async () => {
    try {
      const response = await apiFetch('/api/admin/lab/master-tests')
      if (!response.ok) throw new Error('Failed to fetch master tests')
      const data = await response.json()
      setMasterTests(data.data || [])
    } catch (error) {
      console.error('Error fetching master tests:', error)
      toast.error('Failed to fetch master tests')
    }
  }, [])

  useEffect(() => {
    fetchVendor()
    fetchAliases()
    fetchMasterTests()
  }, [fetchVendor, fetchAliases, fetchMasterTests])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.masterParameterId || !formData.vendorTestName.trim()) {
      toast.error('Master test and vendor test name are required')
      return
    }

    setSubmitting(true)

    try {
      const url = editingAlias
        ? `/api/admin/lab/test-aliases/${editingAlias.aliasId}`
        : '/api/admin/lab/test-aliases'

      const method = editingAlias ? 'PATCH' : 'POST'

      const payload = {
        masterParameterId: formData.masterParameterId,
        vendorId,
        vendorTestName: formData.vendorTestName.trim(),
        vendorTestCode: formData.vendorTestCode.trim() || undefined,
      }

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to save alias')
      }

      const data = await response.json()
      toast.success(data.message || 'Test alias saved successfully')

      setShowModal(false)
      setEditingAlias(null)
      setFormData({
        masterParameterId: '',
        vendorTestName: '',
        vendorTestCode: '',
      })
      fetchAliases()
    } catch (error: any) {
      console.error('Error saving alias:', error)
      toast.error(error.message || 'Failed to save test alias')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (alias: TestAlias) => {
    setEditingAlias(alias)
    setFormData({
      masterParameterId: alias.masterParameterId._id,
      vendorTestName: alias.vendorTestName,
      vendorTestCode: alias.vendorTestCode || '',
    })
    setShowModal(true)
  }

  const handleDelete = async (aliasId: string) => {
    if (!confirm('Are you sure you want to delete this alias?')) return

    try {
      const response = await apiFetch(`/api/admin/lab/test-aliases/${aliasId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete alias')

      const data = await response.json()
      toast.success(data.message || 'Alias deleted successfully')
      fetchAliases()
    } catch (error) {
      console.error('Error deleting alias:', error)
      toast.error('Failed to delete alias')
    }
  }

  const filteredAliases = aliases.filter(
    (alias) =>
      alias.vendorTestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alias.vendorTestCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alias.masterParameterId.standardName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alias.masterParameterId.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => router.push('/lab/vendors')}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Vendors
        </button>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Test Name Aliases {vendor && `- ${vendor.name}`}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Map vendor-specific test names to master test parameters
            </p>
          </div>
          <button
            onClick={() => {
              setEditingAlias(null)
              setFormData({
                masterParameterId: '',
                vendorTestName: '',
                vendorTestCode: '',
              })
              setShowModal(true)
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Alias
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by vendor test name, code, or master test..."
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
        ) : filteredAliases.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? 'No aliases found matching search' : 'No test aliases created yet'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor Test Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Maps To (Master Test)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAliases.map((alias) => (
                  <tr key={alias._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <p className="font-medium">{alias.vendorTestName}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                      {alias.vendorTestCode || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>
                        <p className="font-medium">{alias.masterParameterId.standardName}</p>
                        <p className="text-xs text-gray-500 font-mono mt-1">
                          {alias.masterParameterId.code}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(alias)}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(alias.aliasId)}
                        className="inline-flex items-center px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">
                {editingAlias ? 'Edit Test Alias' : 'Create Test Alias'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Master Test Parameter <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.masterParameterId}
                    onChange={(e) =>
                      setFormData({ ...formData, masterParameterId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select master test</option>
                    {masterTests.map((test) => (
                      <option key={test._id} value={test._id}>
                        {test.code} - {test.standardName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor Test Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.vendorTestName}
                    onChange={(e) =>
                      setFormData({ ...formData, vendorTestName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., CBC Premium, Complete Blood Count Plus"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The test name as used by this vendor
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor Test Code
                  </label>
                  <input
                    type="text"
                    value={formData.vendorTestCode}
                    onChange={(e) =>
                      setFormData({ ...formData, vendorTestCode: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase font-mono"
                    placeholder="e.g., CBC001, CBCP"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional vendor-specific code for this test
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingAlias(null)
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
                  {submitting ? 'Saving...' : editingAlias ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
