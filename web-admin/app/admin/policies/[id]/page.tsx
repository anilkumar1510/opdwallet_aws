'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'

interface PlanVersion {
  planVersion: number
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  effectiveFrom: string
  effectiveTo?: string
  copay?: number
  coinsurance?: number
  deductible?: number
  maxCoverage?: number
}

export default function PolicyDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [policy, setPolicy] = useState<any>(null)
  const [planVersions, setPlanVersions] = useState<PlanVersion[]>([])
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
    if (params.id) {
      fetchPolicy()
      fetchPlanVersions()
    }
  }, [params.id])

  const fetchPolicy = async () => {
    try {
      const response = await apiFetch(`/api/policies/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setPolicy(data)
        setEditForm({
          name: data.name || '',
          description: data.description || '',
          status: data.status || '',
          effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom).toISOString().split('T')[0] : '',
          effectiveTo: data.effectiveTo ? new Date(data.effectiveTo).toISOString().split('T')[0] : '',
          ownerPayer: data.ownerPayer || '',
        })
      }
    } catch (error) {
      console.error('Failed to fetch policy')
    } finally {
      setLoading(false)
    }
  }

  const fetchPlanVersions = async () => {
    try {
      const response = await apiFetch(`/api/admin/policies/${params.id}/plan-versions`)
      if (response.ok) {
        const data = await response.json()
        // Handle both direct array and nested data structure
        const versions = Array.isArray(data) ? data : (data.data || data.planVersions || [])
        setPlanVersions(versions)
      }
    } catch (error) {
      console.error('Failed to fetch plan versions')
      setPlanVersions([])
    }
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

      if (response.ok) {
        const updatedPolicy = await response.json()
        setPolicy(updatedPolicy)
        setEditForm({
          name: updatedPolicy.name || '',
          description: updatedPolicy.description || '',
          status: updatedPolicy.status || '',
          effectiveFrom: updatedPolicy.effectiveFrom ? new Date(updatedPolicy.effectiveFrom).toISOString().split('T')[0] : '',
          effectiveTo: updatedPolicy.effectiveTo ? new Date(updatedPolicy.effectiveTo).toISOString().split('T')[0] : '',
          ownerPayer: updatedPolicy.ownerPayer || '',
        })
        setIsEditing(false)
      } else {
        const error = await response.json()
        alert(`Failed to update policy: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Update error:', error)
      alert('Failed to update policy. Please check the console for details.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreatePlanVersion = async () => {
    try {
      console.log('Creating new plan version...')

      const response = await apiFetch(`/api/admin/policies/${params.id}/plan-versions`, {
        method: 'POST',
        body: JSON.stringify({
          effectiveFrom: new Date().toISOString()
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Plan version created:', result)
        alert('Plan version created successfully!')
        fetchPlanVersions()
      } else {
        const error = await response.text()
        console.error('API error:', error)
        alert(`Failed to create plan version: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error('Failed to create plan version:', error)
      alert(`Error creating plan version: ${error.message}`)
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
          {['details', 'plan-versions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-yellow-400 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'details' ? 'Policy Details' : 'Plan Versions'}
            </button>
          ))}
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
                  <span className={policy.status === 'ACTIVE' ? 'badge-success' : policy.status === 'DRAFT' ? 'badge-warning' : 'badge-default'}>
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

      {activeTab === 'plan-versions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Plan Versions</h3>
            <button
              onClick={handleCreatePlanVersion}
              className="btn-primary"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Version
            </button>
          </div>

          {planVersions.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a4 4 0 01-4-4V9a4 4 0 014-4h10a4 4 0 014 4v8a4 4 0 01-4 4z" />
                  </svg>
                </div>
                <h4 className="empty-state-title">No Plan Versions</h4>
                <p className="empty-state-description">Create your first plan version to configure benefits and coverage.</p>
                <button
                  onClick={handleCreatePlanVersion}
                  className="btn-primary mt-4"
                >
                  Create First Version
                </button>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Version</th>
                      <th>Status</th>
                      <th>Effective From</th>
                      <th>Effective To</th>
                      <th>Copay</th>
                      <th>Coinsurance</th>
                      <th>Deductible</th>
                      <th>Max Coverage</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(planVersions) ? planVersions : []).map((version) => (
                      <tr key={version.planVersion}>
                        <td className="font-medium">v{version.planVersion}</td>
                        <td>
                          <span className={
                            version.status === 'PUBLISHED'
                              ? 'badge-success'
                              : version.status === 'DRAFT'
                              ? 'badge-warning'
                              : 'badge-default'
                          }>
                            {version.status}
                          </span>
                        </td>
                        <td>{new Date(version.effectiveFrom).toLocaleDateString()}</td>
                        <td>{version.effectiveTo ? new Date(version.effectiveTo).toLocaleDateString() : 'Ongoing'}</td>
                        <td>${version.copay || 0}</td>
                        <td>{(version.coinsurance || 0) * 100}%</td>
                        <td>${version.deductible || 0}</td>
                        <td>${version.maxCoverage || 0}</td>
                        <td>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => router.push(`/admin/policies/${params.id}/plan-versions/${version.planVersion}/config`)}
                              className="btn-ghost p-1 text-xs"
                              title="Configure Benefits"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}