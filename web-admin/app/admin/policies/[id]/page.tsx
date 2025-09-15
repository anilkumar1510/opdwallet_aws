'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function PolicyDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [policy, setPolicy] = useState<any>(null)
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
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
      fetchPolicyAssignments()
    }
  }, [params.id])

  const fetchPolicy = async () => {
    try {
      const response = await fetch(`/api/policies/${params.id}`, {
        credentials: 'include',
      })
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

  const fetchPolicyAssignments = async () => {
    try {
      // This endpoint would need to be added to get assignments by policy
      // For now, we'll just show the policy details
      setAssignments([])
    } catch (error) {
      console.error('Failed to fetch assignments')
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSaving) return // Prevent duplicate submissions
    setIsSaving(true)

    try {
      // Clean up the data before sending
      const payload = {
        name: editForm.name,
        description: editForm.description,
        status: editForm.status,
        effectiveFrom: editForm.effectiveFrom,
        effectiveTo: editForm.effectiveTo || undefined,
        ownerPayer: editForm.ownerPayer || undefined,
      }

      const response = await fetch(`/api/policies/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
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
        alert('Policy updated successfully!')
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

  const handleLogout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold">OPD Wallet Admin</h1>
              <button
                onClick={() => router.push('/admin/policies')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to Policies
              </button>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {policy && (
            <>
              <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Policy Information
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      Policy Number: {policy.policyNumber}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                  >
                    {isEditing ? 'Cancel' : 'Edit Policy'}
                  </button>
                </div>

                {!isEditing ? (
                  <div className="border-t border-gray-200">
                    <dl>
                      <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Policy Number</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {policy.policyNumber}
                          <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            Immutable
                          </span>
                        </dd>
                      </div>
                      <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Name</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {policy.name}
                        </dd>
                      </div>
                      <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Status</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            policy.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : policy.status === 'DRAFT'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {policy.status}
                          </span>
                        </dd>
                      </div>
                      <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Description</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {policy.description || 'No description provided'}
                        </dd>
                      </div>
                      <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Effective From</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {new Date(policy.effectiveFrom).toLocaleDateString()}
                        </dd>
                      </div>
                      <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Effective To</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {policy.effectiveTo
                            ? new Date(policy.effectiveTo).toLocaleDateString()
                            : 'No end date'}
                        </dd>
                      </div>
                      <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Owner/Payer</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {policy.ownerPayer || 'Not specified'}
                        </dd>
                      </div>
                      <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Created By</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {policy.createdBy || 'System'}
                        </dd>
                      </div>
                      <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Created At</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {new Date(policy.createdAt).toLocaleString()}
                        </dd>
                      </div>
                      {policy.updatedAt && (
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {new Date(policy.updatedAt).toLocaleString()}
                            {policy.updatedBy && ` by ${policy.updatedBy}`}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                ) : (
                  <form onSubmit={handleUpdate} className="border-t border-gray-200 p-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Policy Name
                        </label>
                        <input
                          type="text"
                          required
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm({ ...editForm, name: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Description
                        </label>
                        <textarea
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border"
                          rows={3}
                          value={editForm.description}
                          onChange={(e) =>
                            setEditForm({ ...editForm, description: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Status
                        </label>
                        <select
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border"
                          value={editForm.status}
                          onChange={(e) =>
                            setEditForm({ ...editForm, status: e.target.value })
                          }
                        >
                          <option value="DRAFT">Draft</option>
                          <option value="ACTIVE">Active</option>
                          <option value="RETIRED">Retired</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Effective From
                        </label>
                        <input
                          type="date"
                          required
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border"
                          value={editForm.effectiveFrom}
                          onChange={(e) =>
                            setEditForm({ ...editForm, effectiveFrom: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Effective To (Optional)
                        </label>
                        <input
                          type="date"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border"
                          value={editForm.effectiveTo}
                          onChange={(e) =>
                            setEditForm({ ...editForm, effectiveTo: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Owner/Payer
                        </label>
                        <select
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border"
                          value={editForm.ownerPayer}
                          onChange={(e) =>
                            setEditForm({ ...editForm, ownerPayer: e.target.value })
                          }
                        >
                          <option value="">Select...</option>
                          <option value="Corporate">Corporate</option>
                          <option value="Insurer">Insurer</option>
                          <option value="Hybrid">Hybrid</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Policy Statistics */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Policy Statistics
                  </h3>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div className="bg-gray-50 overflow-hidden rounded-lg px-4 py-5">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Assignments
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">
                        {assignments.length}
                      </dd>
                    </div>
                    <div className="bg-gray-50 overflow-hidden rounded-lg px-4 py-5">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Active Assignments
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">
                        {assignments.filter(a => a.status === 'ACTIVE').length}
                      </dd>
                    </div>
                    <div className="bg-gray-50 overflow-hidden rounded-lg px-4 py-5">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Coverage Period
                      </dt>
                      <dd className="mt-1 text-lg font-semibold text-gray-900">
                        {policy && policy.effectiveFrom && policy.effectiveTo
                          ? `${Math.ceil((new Date(policy.effectiveTo).getTime() - new Date(policy.effectiveFrom).getTime()) / (1000 * 60 * 60 * 24))} days`
                          : 'Ongoing'}
                      </dd>
                    </div>
                  </div>
                </div>
              </div>

              {/* Future Enhancement: List of users assigned to this policy */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Assigned Users
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    List of users currently assigned to this policy
                  </p>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <p className="text-sm text-gray-500">
                    This feature will show users assigned to this policy in a future update.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}