'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { apiFetch, getActiveCugs, CugMaster } from '@/lib/api'
import { UserInfoCard } from './components/UserInfoCard'
import { UserEditForm } from './components/UserEditForm'
import { DependentsTable } from './components/DependentsTable'
import { PolicyAssignmentsTable } from './components/PolicyAssignmentsTable'
import { AssignPolicyModal } from './components/AssignPolicyModal'

// Helper functions
function validatePolicyAssignment(
  selectedPolicyId: string,
  selectedRelationshipId: string,
  effectiveFrom: string,
  effectiveTo: string,
  selectedPrimaryMemberId: string
): string | null {
  if (!selectedPolicyId || !selectedRelationshipId) {
    return 'Please select policy and relationship'
  }

  if (!effectiveFrom || !effectiveTo) {
    return 'Please provide both Effective From and Effective To dates'
  }

  if (new Date(effectiveTo) <= new Date(effectiveFrom)) {
    return 'Effective To date must be after Effective From date'
  }

  if (selectedRelationshipId !== 'REL001' && !selectedPrimaryMemberId) {
    return 'Primary Member ID is required for non-SELF relationships'
  }

  return null
}

function isInternalUserRole(role: string): boolean {
  return ['SUPER_ADMIN', 'ADMIN', 'TPA', 'OPS'].includes(role)
}

function buildAssignmentPayload(
  selectedPolicyId: string,
  userId: string | string[],
  selectedRelationshipId: string,
  effectiveFrom: string,
  effectiveTo: string,
  selectedPrimaryMemberId: string,
  selectedPlanConfigId: string
) {
  const payload: any = {
    policyId: selectedPolicyId,
    userId,
    relationshipId: selectedRelationshipId,
    effectiveFrom: new Date(effectiveFrom).toISOString(),
    effectiveTo: new Date(effectiveTo).toISOString(),
  }

  if (selectedRelationshipId !== 'REL001') {
    payload.primaryMemberId = selectedPrimaryMemberId
  }

  if (selectedPlanConfigId) {
    payload.planConfigId = selectedPlanConfigId
  }

  return payload
}

function buildUserUpdateData(editedUser: any) {
  const updateData: any = {
    name: {
      firstName: editedUser.name?.firstName || '',
      lastName: editedUser.name?.lastName || ''
    },
    email: editedUser.email,
    phone: editedUser.phone,
    dob: editedUser.dob,
    gender: editedUser.gender,
    status: editedUser.status,
    role: editedUser.role,
    relationship: editedUser.relationship,
    primaryMemberId: editedUser.primaryMemberId,
    memberId: editedUser.memberId,
    uhid: editedUser.uhid,
    employeeId: editedUser.employeeId,
    corporateName: editedUser.corporateName
  }

  if (editedUser.address) {
    updateData.address = {
      line1: editedUser.address.line1 || '',
      line2: editedUser.address.line2 || '',
      city: editedUser.address.city || '',
      state: editedUser.address.state || '',
      pincode: editedUser.address.pincode || ''
    }
  }

  return updateData
}

export default function UserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [user, setUser] = useState<any>(null)
  const [dependents, setDependents] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [policies, setPolicies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedPolicyId, setSelectedPolicyId] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editedUser, setEditedUser] = useState<any>(null)
  const [newPassword, setNewPassword] = useState('')
  const [showPasswordField, setShowPasswordField] = useState(false)
  const [cugs, setCugs] = useState<CugMaster[]>([])
  const [selectedCugId, setSelectedCugId] = useState('')
  const [relationships, setRelationships] = useState<any[]>([])
  const [selectedRelationshipId, setSelectedRelationshipId] = useState('')
  const [selectedPrimaryMemberId, setSelectedPrimaryMemberId] = useState('')
  const [members, setMembers] = useState<any[]>([])
  const [planConfigs, setPlanConfigs] = useState<any[]>([])
  const [selectedPlanConfigId, setSelectedPlanConfigId] = useState('')
  const [effectiveFrom, setEffectiveFrom] = useState('')
  const [effectiveTo, setEffectiveTo] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [unassigningId, setUnassigningId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchUserWithDependents = useCallback(async () => {
    try {
      const [userRes, dependentsRes] = await Promise.all([
        apiFetch(`/api/users/${params.id}`),
        apiFetch(`/api/users/${params.id}/dependents`)
      ])

      if (userRes.ok) {
        const userData = await userRes.json()
        setUser(userData)
        setEditedUser(userData)
      }

      if (dependentsRes.ok) {
        const depsData = await dependentsRes.json()
        setDependents(depsData.dependents || [])
      }
    } catch (error) {
      console.error('Failed to fetch user details')
    }
    setLoading(false)
  }, [params.id])

  const fetchAssignments = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/users/${params.id}/assignments`)
      if (!response.ok) return

      const data = await response.json()
      setAssignments(data)
    } catch (error) {
      console.error('Failed to fetch assignments')
    }
  }, [params.id])

  const fetchPolicies = useCallback(async () => {
    try {
      const response = await apiFetch('/api/policies?status=ACTIVE')
      if (!response.ok) return

      const data = await response.json()
      setPolicies(data.data || [])
    } catch (error) {
      console.error('Failed to fetch policies')
    }
  }, [])

  const fetchCugs = useCallback(async () => {
    try {
      const cugsData = await getActiveCugs()
      setCugs(cugsData)
    } catch (error) {
      console.error('Failed to fetch CUGs')
    }
  }, [])

  const fetchRelationships = useCallback(async () => {
    try {
      const response = await apiFetch('/api/relationships')
      if (!response.ok) return

      const data = await response.json()
      setRelationships(data)
    } catch (error) {
      console.error('Failed to fetch relationships')
    }
  }, [])

  const fetchAllMembers = useCallback(async () => {
    try {
      const response = await apiFetch('/api/users?limit=100')
      if (!response.ok) return

      const data = await response.json()
      setMembers(data.data || [])
    } catch (error) {
      console.error('Failed to fetch members')
    }
  }, [])

  useEffect(() => {
    if (!params.id) return

    fetchUserWithDependents()
    fetchAssignments()
    fetchPolicies()
    fetchCugs()
    fetchRelationships()
    fetchAllMembers()
  }, [params.id, fetchUserWithDependents, fetchAssignments, fetchPolicies, fetchCugs, fetchRelationships, fetchAllMembers])

  useEffect(() => {
    if (!user || cugs.length === 0 || !user.corporateName) return

    const matchingCug = cugs.find(cug => cug.name === user.corporateName)
    if (matchingCug) {
      setSelectedCugId(matchingCug._id)
    }
  }, [user, cugs])

  const fetchPlanConfigsForPolicy = async (policyId: string) => {
    try {
      const response = await apiFetch(`/api/policies/${policyId}/plan-configs`)
      if (!response.ok) return

      const data = await response.json()
      setPlanConfigs(data)
      const activeConfig = data.find((c: any) => c.status === 'PUBLISHED' && c.isCurrent)
      if (activeConfig) {
        setSelectedPlanConfigId(activeConfig._id)
      }
    } catch (error) {
      console.error('Failed to fetch plan configs')
    }
  }

  const resetAssignmentForm = () => {
    setShowAssignModal(false)
    setSelectedPolicyId('')
    setSelectedRelationshipId('')
    setSelectedPrimaryMemberId('')
    setSelectedPlanConfigId('')
    setEffectiveFrom('')
    setEffectiveTo('')
  }

  const handleAssignPolicy = async () => {
    const validationError = validatePolicyAssignment(
      selectedPolicyId,
      selectedRelationshipId,
      effectiveFrom,
      effectiveTo,
      selectedPrimaryMemberId
    )

    if (validationError) {
      toast.error(validationError)
      return
    }

    setAssigning(true)
    try {
      const payload = buildAssignmentPayload(
        selectedPolicyId,
        params.id as string,
        selectedRelationshipId,
        effectiveFrom,
        effectiveTo,
        selectedPrimaryMemberId,
        selectedPlanConfigId
      )

      const response = await apiFetch('/api/assignments', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.message || 'Failed to assign policy')
        return
      }

      toast.success('Policy assigned successfully')
      resetAssignmentForm()
      fetchAssignments()
    } catch (error) {
      console.error('Policy assignment error:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setAssigning(false)
    }
  }

  const handleUnassignPolicy = async (assignment: any) => {
    const policyName = assignment.policyId?.name || 'Unknown Policy'

    if (!confirm(`Are you sure you want to unassign "${policyName}" from this user? This action cannot be undone.`)) {
      return
    }

    setUnassigningId(assignment._id)
    try {
      const response = await apiFetch(`/api/assignments/user/${params.id}/policy/${assignment.policyId._id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Policy unassigned successfully')
        fetchAssignments()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to unassign policy')
      }
    } catch (error) {
      console.error('Policy unassignment error:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setUnassigningId(null)
    }
  }

  const updatePassword = async () => {
    if (!showPasswordField || !newPassword) {
      return
    }

    await apiFetch(`/api/users/${params.id}/set-password`, {
      method: 'POST',
      body: JSON.stringify({ password: newPassword }),
    })
  }

  const resetEditingState = () => {
    setIsEditing(false)
    setShowPasswordField(false)
    setNewPassword('')
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updateData = buildUserUpdateData(editedUser)

      const response = await apiFetch(`/api/users/${params.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.message || 'Failed to update user')
        return
      }

      await updatePassword()
      toast.success('User updated successfully')
      resetEditingState()
      fetchUserWithDependents()
    } catch (error) {
      console.error('User update error:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedUser(user)
    resetEditingState()
  }

  const updateRoleOrRelationship = (value: string, isInternal: boolean) => {
    if (isInternal) {
      setEditedUser({ ...editedUser, role: value })
    } else {
      setEditedUser({ ...editedUser, relationship: value })
    }
  }

  const renderRoleOrRelationshipSelector = () => {
    const isInternal = isInternalUserRole(user.role)
    const currentValue = isInternal ? editedUser.role : editedUser.relationship

    if (!isEditing) {
      return (
        <span className="badge-info">
          {isInternal ? user.role : user.relationship}
        </span>
      )
    }

    return (
      <select
        value={currentValue}
        onChange={(e) => updateRoleOrRelationship(e.target.value, isInternal)}
        className="input"
      >
        {isInternal ? (
          <>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            <option value="ADMIN">ADMIN</option>
            <option value="TPA">TPA</option>
            <option value="OPS">OPS</option>
            <option value="MEMBER">MEMBER</option>
          </>
        ) : (
          <>
            <option value="SELF">SELF</option>
            <option value="SPOUSE">SPOUSE</option>
            <option value="FATHER">FATHER</option>
            <option value="MOTHER">MOTHER</option>
            <option value="CHILD">CHILD</option>
            <option value="OTHER">OTHER</option>
          </>
        )}
      </select>
    )
  }

  const confirmUserDeletion = () => {
    return confirm(`Are you sure you want to delete "${user.name?.firstName} ${user.name?.lastName}"? This action cannot be undone.`)
  }

  const handleDeleteUser = async () => {
    if (!confirmUserDeletion()) {
      return
    }

    setDeleting(true)
    try {
      const response = await apiFetch(`/api/users/${params.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.message || 'Failed to delete user')
        return
      }

      toast.success('User deleted successfully')
      router.push('/users')
    } catch (error) {
      console.error('User deletion error:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const renderEditableField = (
    value: string,
    onChange: (value: string) => void,
    placeholder?: string,
    type: string = 'text'
  ) => {
    if (!isEditing) {
      return <p className="text-gray-900">{value || '-'}</p>
    }

    return (
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="input"
        placeholder={placeholder}
      />
    )
  }

  const renderMonoField = (value: string, editable: boolean = true) => {
    if (!isEditing || !editable) {
      return <p className="font-mono text-gray-900">{value}</p>
    }

    return (
      <input
        type="text"
        value={value || ''}
        onChange={(e) => setEditedUser({ ...editedUser, [value]: e.target.value })}
        className="input"
      />
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">User not found</p>
      </div>
    )
  }

  const isInternalUser = isInternalUserRole(user.role)

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push('/users')}
        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
      >
        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Users
      </button>

      {/* User Information Card */}
      <div className="card">
        <UserInfoCard
          user={user}
          isEditing={isEditing}
          editedUser={editedUser}
          onEdit={() => setIsEditing(true)}
          onDelete={handleDeleteUser}
          onFieldChange={(field, value) => setEditedUser({ ...editedUser, [field]: value })}
        />

        {isEditing && (
          <div className="flex items-center justify-end space-x-2 mb-6">
            <button onClick={handleCancel} disabled={saving} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        <UserEditForm
          user={user}
          editedUser={editedUser}
          isEditing={isEditing}
          isInternalUser={isInternalUser}
          cugs={cugs}
          selectedCugId={selectedCugId}
          showPasswordField={showPasswordField}
          newPassword={newPassword}
          onFieldChange={(field, value) => setEditedUser({ ...editedUser, [field]: value })}
          onCugChange={(cugId, cugName) => {
            setSelectedCugId(cugId);
            setEditedUser({ ...editedUser, corporateName: cugName });
          }}
          onPasswordToggle={() => setShowPasswordField(!showPasswordField)}
          onPasswordChange={setNewPassword}
          renderRoleOrRelationshipSelector={renderRoleOrRelationshipSelector}
        />
      </div>

      {/* Dependents Section (for primary members) */}
      {user.relationship === 'SELF' && (
        <DependentsTable
          dependents={dependents}
          onViewDependent={(dependentId) => router.push(`/users/${dependentId}`)}
        />
      )}

      {/* Policy Assignments */}
      <PolicyAssignmentsTable
        assignments={assignments}
        onAssignPolicy={() => setShowAssignModal(true)}
        onUnassignPolicy={handleUnassignPolicy}
      />

      {/* Assign Policy Modal */}
      <AssignPolicyModal
        showModal={showAssignModal}
        policies={policies}
        relationships={relationships}
        members={members}
        planConfigs={planConfigs}
        selectedPolicyId={selectedPolicyId}
        selectedRelationshipId={selectedRelationshipId}
        selectedPrimaryMemberId={selectedPrimaryMemberId}
        selectedPlanConfigId={selectedPlanConfigId}
        effectiveFrom={effectiveFrom}
        effectiveTo={effectiveTo}
        onPolicyChange={(policyId) => {
          setSelectedPolicyId(policyId);
          if (policyId) {
            fetchPlanConfigsForPolicy(policyId);
          }
        }}
        onRelationshipChange={setSelectedRelationshipId}
        onPrimaryMemberChange={setSelectedPrimaryMemberId}
        onPlanConfigChange={setSelectedPlanConfigId}
        onEffectiveFromChange={setEffectiveFrom}
        onEffectiveToChange={setEffectiveTo}
        onClose={resetAssignmentForm}
        onAssign={handleAssignPolicy}
      />
    </div>
  )
}