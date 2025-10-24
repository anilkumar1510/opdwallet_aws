'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'

function policyToEditForm(policy: any) {
  // Normalize ownerPayer to uppercase if it exists (handles any legacy data with incorrect casing)
  let normalizedOwnerPayer = ''
  if (policy.ownerPayer) {
    const upperValue = policy.ownerPayer.toUpperCase()
    // Only set if it's a valid enum value
    if (['CORPORATE', 'INSURER', 'HYBRID'].includes(upperValue)) {
      normalizedOwnerPayer = upperValue
    }
  }

  return {
    name: policy.name || '',
    description: policy.description || '',
    status: policy.status || '',
    effectiveFrom: policy.effectiveFrom ? new Date(policy.effectiveFrom).toISOString().split('T')[0] : '',
    effectiveTo: policy.effectiveTo ? new Date(policy.effectiveTo).toISOString().split('T')[0] : '',
    ownerPayer: normalizedOwnerPayer,
  }
}

function getStatusBadgeClass(status: string) {
  if (status === 'ACTIVE') return 'badge-success'
  if (status === 'DRAFT') return 'badge-warning'
  return 'badge-default'
}

export default function PolicyDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [policy, setPolicy] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('details')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    status: '',
    effectiveFrom: '',
    effectiveTo: '',
    ownerPayer: '',
  })

  const fetchPolicy = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/policies/${params.id}`)
      if (!response.ok) return

      const data = await response.json()
      setPolicy(data)
      setEditForm(policyToEditForm(data))
    } catch (error) {
      console.error('Failed to fetch policy')
    }
    setLoading(false)
  }, [params.id])

  useEffect(() => {
    if (!params.id) return
    fetchPolicy()
  }, [params.id, fetchPolicy])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSaving) return
    setIsSaving(true)

    try {
      const payload = {
        name: editForm.name,
        description: editForm.description,
        status: editForm.status,
        effectiveFrom: editForm.effectiveFrom,
        effectiveTo: editForm.effectiveTo || undefined,
        ownerPayer: editForm.ownerPayer || undefined,
      }

      const response = await apiFetch(`/api/policies/${params.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Failed to update policy:', error)
        toast.error(`Failed to update policy: ${error.message || 'Unknown error'}`)
        return
      }

      const updatedPolicy = await response.json()
      setPolicy(updatedPolicy)
      setEditForm(policyToEditForm(updatedPolicy))
      setIsEditing(false)
      toast.success('Policy updated successfully')
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Failed to update policy. Please check your connection and try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/policies')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{policy?.name}</h1>
            <p className="text-sm font-medium text-gray-600">Policy Number: <span className="font-mono text-gray-800">{policy?.policyNumber}</span></p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            policy?.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
            policy?.status === 'DRAFT' ? 'bg-amber-100 text-amber-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {policy?.status}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <nav className="flex space-x-0 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            Policy Details
          </button>
          <button
            onClick={() => router.push(`/policies/${params.id}/plan-config`)}
            className="px-6 py-3 font-medium text-sm border-b-2 border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors"
          >
            Plan Configuration
          </button>
          <button
            onClick={() => router.push(`/policies/${params.id}/assignments`)}
            className="px-6 py-3 font-medium text-sm border-b-2 border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors"
          >
            Assignments
          </button>
        </nav>

        {/* Tab Content */}
        {activeTab === 'details' && policy && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Policy Information</h3>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isEditing ? 'Cancel' : 'Edit Policy'}
              </button>
            </div>

            {!isEditing ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50 w-1/3">Policy Number</td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{policy.policyNumber}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50 w-1/3">Policy Name</td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{policy.name}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50 w-1/3">Status</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          policy.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                          policy.status === 'DRAFT' ? 'bg-amber-100 text-amber-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {policy.status}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50 w-1/3">Owner/Payer</td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{policy.ownerPayer || 'Not specified'}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50 w-1/3">Effective From</td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{new Date(policy.effectiveFrom).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50 w-1/3">Effective To</td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{policy.effectiveTo ? new Date(policy.effectiveTo).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'Ongoing'}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50 w-1/3 align-top">Description</td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{policy.description || 'No description provided'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Policy Name</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Status</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="ACTIVE">Active</option>
                      <option value="RETIRED">Retired</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Effective From</label>
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      value={editForm.effectiveFrom}
                      onChange={(e) => setEditForm({ ...editForm, effectiveFrom: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Effective To</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      value={editForm.effectiveTo}
                      onChange={(e) => setEditForm({ ...editForm, effectiveTo: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Owner/Payer</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      value={editForm.ownerPayer}
                      onChange={(e) => setEditForm({ ...editForm, ownerPayer: e.target.value })}
                    >
                      <option value="">Select...</option>
                      <option value="CORPORATE">Corporate</option>
                      <option value="INSURER">Insurer</option>
                      <option value="HYBRID">Hybrid</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Description</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      rows={3}
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}