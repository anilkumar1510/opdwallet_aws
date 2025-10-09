'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'

interface Assignment {
  _id: string
  assignmentId: string
  userId: {
    _id: string
    memberId: string
    name: string
    email: string
  }
  policyId: string
  effectiveFrom: string
  effectiveTo: string
  isActive: boolean
  relationshipId?: string
  primaryMemberId?: string
  createdAt: string
}

export default function PolicyAssignmentsPage() {
  const router = useRouter()
  const params = useParams()
  const [policy, setPolicy] = useState<any>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newAssignment, setNewAssignment] = useState({
    userId: '',
    effectiveFrom: '',
    effectiveTo: '',
  })

  useEffect(() => {
    if (!params.id) return
    fetchPolicy()
    fetchAssignments()
    fetchUsers()
  }, [params.id])

  const fetchPolicy = async () => {
    try {
      const response = await apiFetch(`/api/policies/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setPolicy(data)
      }
    } catch (error) {
      console.error('Failed to fetch policy:', error)
    }
  }

  const fetchAssignments = async () => {
    try {
      const response = await apiFetch(`/api/assignments/policy/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setAssignments(data)
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await apiFetch('/api/users?limit=1000')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || data)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (creating) return

    setCreating(true)
    try {
      const response = await apiFetch('/api/assignments', {
        method: 'POST',
        body: JSON.stringify({
          userId: newAssignment.userId,
          policyId: params.id,
          effectiveFrom: newAssignment.effectiveFrom,
          effectiveTo: newAssignment.effectiveTo,
          relationshipId: 'REL001', // Default to SELF
        }),
      })

      if (response.ok) {
        setShowCreateModal(false)
        setNewAssignment({ userId: '', effectiveFrom: '', effectiveTo: '' })
        await fetchAssignments()
      } else {
        const error = await response.json()
        alert(`Failed to create assignment: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Create assignment error:', error)
      alert('Failed to create assignment')
    } finally {
      setCreating(false)
    }
  }

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this assignment?')) return

    try {
      const response = await apiFetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchAssignments()
      } else {
        const error = await response.json()
        alert(`Failed to remove assignment: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Remove assignment error:', error)
      alert('Failed to remove assignment')
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push(`/admin/policies/${params.id}`)}
            className="btn-ghost p-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Policy Assignments</h1>
            <p className="text-sm text-gray-500">
              {policy?.name} ({policy?.policyNumber})
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          + Assign User
        </button>
      </div>

      {/* Assignments Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Assignment ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Member ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Effective From
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Effective To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No assignments found for this policy
                  </td>
                </tr>
              ) : (
                assignments.map((assignment) => (
                  <tr key={assignment._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {assignment.assignmentId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {assignment.userId?.name || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {assignment.userId?.email || 'No email'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {assignment.userId?.memberId || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(assignment.effectiveFrom).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(assignment.effectiveTo).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          assignment.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {assignment.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {assignment.isActive && (
                        <button
                          onClick={() => handleRemoveAssignment(assignment.assignmentId)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Assign User to Policy
            </h3>
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User *
                </label>
                <select
                  required
                  className="input w-full"
                  value={newAssignment.userId}
                  onChange={(e) =>
                    setNewAssignment({ ...newAssignment, userId: e.target.value })
                  }
                >
                  <option value="">Select a user...</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.memberId || user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Effective From *
                </label>
                <input
                  type="date"
                  required
                  className="input w-full"
                  value={newAssignment.effectiveFrom}
                  onChange={(e) =>
                    setNewAssignment({ ...newAssignment, effectiveFrom: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Effective To *
                </label>
                <input
                  type="date"
                  required
                  className="input w-full"
                  value={newAssignment.effectiveTo}
                  onChange={(e) =>
                    setNewAssignment({ ...newAssignment, effectiveTo: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewAssignment({ userId: '', effectiveFrom: '', effectiveTo: '' })
                  }}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="btn-primary">
                  {creating ? 'Creating...' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
