'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import { useDebounce } from '@/hooks/useDebounce'

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
  const [removingId, setRemovingId] = useState<string | null>(null)

  // Plan config state
  const [planConfig, setPlanConfig] = useState<any>(null)
  const [relationships, setRelationships] = useState<any[]>([])
  const [coveredRelationships, setCoveredRelationships] = useState<string[]>([])

  // Primary member search state
  const [primaryMemberSearch, setPrimaryMemberSearch] = useState('')
  const [primaryMemberResults, setPrimaryMemberResults] = useState<any[]>([])
  const [searchingPrimary, setSearchingPrimary] = useState(false)
  const [selectedPrimaryMember, setSelectedPrimaryMember] = useState<any>(null)

  const [newAssignment, setNewAssignment] = useState({
    userId: '',
    relationshipId: '',
    primaryMemberId: '',
    effectiveFrom: '',
    effectiveTo: '',
  })

  const fetchPolicy = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/policies/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setPolicy(data)
      }
    } catch (error) {
      console.error('Failed to fetch policy:', error)
    }
  }, [params.id])

  const fetchPlanConfig = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/policies/${params.id}/config`)
      if (response.ok) {
        const data = await response.json()
        console.log('🟢 [PLAN CONFIG] Fetched successfully:', data)
        console.log('🟢 [PLAN CONFIG] coveredRelationships:', data.coveredRelationships)
        setPlanConfig(data)
        setCoveredRelationships(data.coveredRelationships || [])
      } else {
        console.error('❌ [PLAN CONFIG] Failed to fetch:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('❌ [PLAN CONFIG] Error:', error)
    }
  }, [params.id])

  const fetchRelationships = useCallback(async () => {
    try {
      const response = await apiFetch('/api/relationships')
      if (response.ok) {
        const data = await response.json()
        setRelationships(data)
      }
    } catch (error) {
      console.error('Failed to fetch relationships:', error)
    }
  }, [])

  const fetchAssignments = useCallback(async () => {
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
  }, [params.id])

  const fetchUsers = useCallback(async () => {
    try {
      const response = await apiFetch('/api/users?limit=1000&role=MEMBER')
      if (response.ok) {
        const data = await response.json()
        // Handle different response structures: data.data, data.users, or data as array
        const usersList = data.data || data.users || (Array.isArray(data) ? data : [])
        setUsers(usersList)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
      setUsers([]) // Set empty array on error
    }
  }, [])

  useEffect(() => {
    if (!params.id) return
    fetchPolicy()
    fetchAssignments()
    fetchUsers()
    fetchPlanConfig()
    fetchRelationships()
  }, [params.id, fetchPolicy, fetchAssignments, fetchUsers, fetchPlanConfig, fetchRelationships])

  // Helper functions
  const isDependentRelationship = () => {
    const relationship = newAssignment.relationshipId
    return relationship && relationship !== 'REL001' && relationship !== 'SELF'
  }

  const isRelationshipCovered = () => {
    if (!newAssignment.relationshipId) return false
    return coveredRelationships.includes(newAssignment.relationshipId)
  }

  const canSubmit = () => {
    return (
      newAssignment.userId &&
      newAssignment.relationshipId &&
      isRelationshipCovered() &&
      newAssignment.effectiveFrom &&
      newAssignment.effectiveTo &&
      (isDependentRelationship() ? newAssignment.primaryMemberId : true)
    )
  }

  const handleRelationshipChange = (relationshipId: string) => {
    setNewAssignment({
      ...newAssignment,
      relationshipId,
      primaryMemberId: '',
    })
    setPrimaryMemberSearch('')
    setPrimaryMemberResults([])
    setSelectedPrimaryMember(null)
  }

  // Debounced search term (Google Maps-style autocomplete pattern)
  const debouncedSearchTerm = useDebounce(primaryMemberSearch, 300)

  // Effect to perform search when debounced term changes
  useEffect(() => {
    const searchPrimaryMembers = async () => {
      if (debouncedSearchTerm.length < 2) {
        setPrimaryMemberResults([])
        setSearchingPrimary(false)
        return
      }

      setSearchingPrimary(true)
      try {
        const response = await apiFetch(
          `/api/assignments/search-primary-members?policyId=${params.id}&search=${encodeURIComponent(debouncedSearchTerm)}`
        )
        if (response.ok) {
          const results = await response.json()
          setPrimaryMemberResults(results)
        } else {
          setPrimaryMemberResults([])
        }
      } catch (error) {
        console.error('Failed to search primary members:', error)
        setPrimaryMemberResults([])
      } finally {
        setSearchingPrimary(false)
      }
    }

    searchPrimaryMembers()
  }, [debouncedSearchTerm, params.id])

  const selectPrimaryMember = (member: any) => {
    setSelectedPrimaryMember(member)
    setNewAssignment({
      ...newAssignment,
      primaryMemberId: member.memberId,
    })
    const memberName = typeof member.name === 'string'
      ? member.name
      : member.name?.fullName || `${member.name?.firstName || ''} ${member.name?.lastName || ''}`.trim() || 'Unknown'
    setPrimaryMemberSearch(`${memberName} (${member.memberId})`)
    setPrimaryMemberResults([])
  }

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (creating || !canSubmit()) return

    setCreating(true)
    try {
      const response = await apiFetch('/api/assignments', {
        method: 'POST',
        body: JSON.stringify({
          userId: newAssignment.userId,
          policyId: params.id,
          relationshipId: newAssignment.relationshipId,
          primaryMemberId: newAssignment.primaryMemberId || undefined,
          effectiveFrom: newAssignment.effectiveFrom,
          effectiveTo: newAssignment.effectiveTo,
        }),
      })

      if (response.ok) {
        toast.success('Assignment created successfully')
        setShowCreateModal(false)
        resetForm()
        await fetchAssignments()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to create assignment')
      }
    } catch (error) {
      console.error('Create assignment error:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const resetForm = () => {
    setNewAssignment({
      userId: '',
      relationshipId: '',
      primaryMemberId: '',
      effectiveFrom: '',
      effectiveTo: ''
    })
    setPrimaryMemberSearch('')
    setPrimaryMemberResults([])
    setSelectedPrimaryMember(null)
  }

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this assignment?')) return

    setRemovingId(assignmentId)
    try {
      const response = await apiFetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Assignment removed successfully')
        await fetchAssignments()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to remove assignment')
      }
    } catch (error) {
      console.error('Remove assignment error:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setRemovingId(null)
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
            onClick={() => router.push(`/policies/${params.id}`)}
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
              {!Array.isArray(assignments) || assignments.length === 0 ? (
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
                        {(() => {
                          const user = assignment.userId;
                          if (!user) return 'Unknown';
                          if (typeof user.name === 'string') return user.name;
                          if (user.name && typeof user.name === 'object') {
                            return (user.name as any).fullName ||
                                   `${(user.name as any).firstName || ''} ${(user.name as any).lastName || ''}`.trim() ||
                                   'Unknown';
                          }
                          return 'Unknown';
                        })()}
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
                          disabled={removingId === assignment.assignmentId}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {removingId === assignment.assignmentId ? 'Removing...' : 'Remove'}
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
                <label htmlFor="assign-user-select" className="block text-sm font-medium text-gray-700 mb-1">
                  User *
                </label>
                <select
                  id="assign-user-select"
                  required
                  className="input w-full"
                  value={newAssignment.userId}
                  onChange={(e) =>
                    setNewAssignment({ ...newAssignment, userId: e.target.value })
                  }
                >
                  <option value="">Select a user...</option>
                  {Array.isArray(users) && users.map((user) => {
                    const userName = typeof user.name === 'string'
                      ? user.name
                      : user.name?.fullName || `${user.name?.firstName || ''} ${user.name?.lastName || ''}`.trim() || 'Unknown'
                    return (
                      <option key={user._id} value={user._id}>
                        {userName} ({user.memberId || user.email})
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* Relationship Selection */}
              <div>
                <label htmlFor="assign-relationship" className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship *
                </label>
                <select
                  id="assign-relationship"
                  required
                  className="input w-full"
                  value={newAssignment.relationshipId}
                  onChange={(e) => handleRelationshipChange(e.target.value)}
                >
                  <option value="">Select relationship...</option>
                  {Array.isArray(relationships) && relationships.map((rel) => {
                    const isCovered = coveredRelationships.includes(rel.relationshipCode)
                    const displayText = isCovered
                      ? rel.displayName
                      : `${rel.displayName} - Not Covered`
                    return (
                      <option key={rel._id} value={rel.relationshipCode}>
                        {displayText}
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* Warning Message for Uncovered Relationships */}
              {newAssignment.relationshipId && !isRelationshipCovered() && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-red-700">
                      <p className="font-medium">This relationship is not covered</p>
                      <p className="mt-1">The selected relationship is not included in this policy&apos;s plan configuration. Please select a covered relationship.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Primary Member Search (for dependent relationships) */}
              {isDependentRelationship() && isRelationshipCovered() && (
                <div>
                  <label htmlFor="primary-member-search" className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Member *
                  </label>
                  <div className="relative">
                    <input
                      id="primary-member-search"
                      type="text"
                      placeholder="Search by Member ID, Name, Employee ID, or UHID..."
                      className="input w-full"
                      value={primaryMemberSearch}
                      onChange={(e) => setPrimaryMemberSearch(e.target.value)}
                      autoComplete="off"
                    />
                    {searchingPrimary && (
                      <div className="absolute right-3 top-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent"></div>
                      </div>
                    )}
                    {Array.isArray(primaryMemberResults) && primaryMemberResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {primaryMemberResults.map((member) => (
                          <button
                            key={member._id}
                            type="button"
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                            onClick={() => selectPrimaryMember(member)}
                          >
                            <div className="font-medium text-gray-900">
                              {typeof member.name === 'string'
                                ? member.name
                                : member.name?.fullName || `${member.name?.firstName || ''} ${member.name?.lastName || ''}`.trim() || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {member.memberId} {member.employeeId && `• ${member.employeeId}`} {member.uhid && `• ${member.uhid}`}
                            </div>
                            <div className="text-xs text-gray-400">{member.email}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedPrimaryMember && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                      Selected: {typeof selectedPrimaryMember.name === 'string'
                        ? selectedPrimaryMember.name
                        : selectedPrimaryMember.name?.fullName || `${selectedPrimaryMember.name?.firstName || ''} ${selectedPrimaryMember.name?.lastName || ''}`.trim() || 'Unknown'} ({selectedPrimaryMember.memberId})
                    </div>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="assign-effective-from" className="block text-sm font-medium text-gray-700 mb-1">
                  Effective From *
                </label>
                <input
                  id="assign-effective-from"
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
                <label htmlFor="assign-effective-to" className="block text-sm font-medium text-gray-700 mb-1">
                  Effective To *
                </label>
                <input
                  id="assign-effective-to"
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
                    resetForm()
                  }}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !canSubmit()}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
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
