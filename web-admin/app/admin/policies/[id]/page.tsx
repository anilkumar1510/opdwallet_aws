'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'

function policyToEditForm(policy: any) {
  return {
    name: policy.name || '',
    description: policy.description || '',
    status: policy.status || '',
    effectiveFrom: policy.effectiveFrom ? new Date(policy.effectiveFrom).toISOString().split('T')[0] : '',
    effectiveTo: policy.effectiveTo ? new Date(policy.effectiveTo).toISOString().split('T')[0] : '',
    ownerPayer: policy.ownerPayer || '',
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

  useEffect(() => {
    if (!params.id) return
    fetchPolicy()
  }, [params.id])

  const fetchPolicy = async () => {
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
  }

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
        alert(`Failed to update policy: ${error.message || 'Unknown error'}`)
        return
      }

      const updatedPolicy = await response.json()
      setPolicy(updatedPolicy)
      setEditForm(policyToEditForm(updatedPolicy))
      setIsEditing(false)
    } catch (error) {
      console.error('Update error:', error)
      alert('Failed to update policy. Please check the console for details.')
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/admin/policies')}
            className="btn-ghost p-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{policy?.name}</h1>
            <p className="text-sm text-gray-500">Policy Number: {policy?.policyNumber}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={policy?.status === 'ACTIVE' ? 'badge-success' : policy?.status === 'DRAFT' ? 'badge-warning' : 'badge-default'}>
            {policy?.status}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-blue-500 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Policy Details
          </button>
          <button
            onClick={() => router.push(`/admin/policies/${params.id}/plan-config`)}
            className="py-2 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          >
            Plan Configuration
          </button>
          <button
            onClick={() => router.push(`/admin/policies/${params.id}/assignments`)}
            className="py-2 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          >
            Assignments
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && policy && (
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h3 className="card-title">Policy Information</h3>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn-secondary"
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {!isEditing ? (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Policy Number</label>
                  <p className="text-gray-900">{policy.policyNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
                  <p className="text-gray-900">{policy.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                  <span className={getStatusBadgeClass(policy.status)}>
                    {policy.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Owner/Payer</label>
                  <p className="text-gray-900">{policy.ownerPayer || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Effective From</label>
                  <p className="text-gray-900">{new Date(policy.effectiveFrom).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Effective To</label>
                  <p className="text-gray-900">{policy.effectiveTo ? new Date(policy.effectiveTo).toLocaleDateString() : 'Ongoing'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
                  <p className="text-gray-900">{policy.description || 'No description provided'}</p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Policy Name</label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="input"
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="RETIRED">Retired</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Effective From</label>
                  <input
                    type="date"
                    required
                    className="input"
                    value={editForm.effectiveFrom}
                    onChange={(e) => setEditForm({ ...editForm, effectiveFrom: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Effective To</label>
                  <input
                    type="date"
                    className="input"
                    value={editForm.effectiveTo}
                    onChange={(e) => setEditForm({ ...editForm, effectiveTo: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner/Payer</label>
                  <select
                    className="input"
                    value={editForm.ownerPayer}
                    onChange={(e) => setEditForm({ ...editForm, ownerPayer: e.target.value })}
                  >
                    <option value="">Select...</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Insurer">Insurer</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}