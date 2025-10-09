'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { apiFetch, getActiveCugs, CugMaster } from '@/lib/api'

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

  useEffect(() => {
    if (!params.id) return

    fetchUserWithDependents()
    fetchAssignments()
    fetchPolicies()
    fetchCugs()
    fetchRelationships()
    fetchAllMembers()
  }, [params.id])

  useEffect(() => {
    if (!user || cugs.length === 0 || !user.corporateName) return

    const matchingCug = cugs.find(cug => cug.name === user.corporateName)
    if (matchingCug) {
      setSelectedCugId(matchingCug._id)
    }
  }, [user, cugs])

  const fetchUserWithDependents = async () => {
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
  }

  const fetchAssignments = async () => {
    try {
      const response = await apiFetch(`/api/users/${params.id}/assignments`)
      if (!response.ok) return

      const data = await response.json()
      setAssignments(data)
    } catch (error) {
      console.error('Failed to fetch assignments')
    }
  }

  const fetchPolicies = async () => {
    try {
      const response = await apiFetch('/api/policies?status=ACTIVE')
      if (!response.ok) return

      const data = await response.json()
      setPolicies(data.data || [])
    } catch (error) {
      console.error('Failed to fetch policies')
    }
  }

  const fetchCugs = async () => {
    try {
      const cugsData = await getActiveCugs()
      setCugs(cugsData)
    } catch (error) {
      console.error('Failed to fetch CUGs')
    }
  }

  const fetchRelationships = async () => {
    try {
      const response = await apiFetch('/api/relationships')
      if (!response.ok) return

      const data = await response.json()
      setRelationships(data)
    } catch (error) {
      console.error('Failed to fetch relationships')
    }
  }

  const fetchAllMembers = async () => {
    try {
      const response = await apiFetch('/api/users?limit=100')
      if (!response.ok) return

      const data = await response.json()
      setMembers(data.data || [])
    } catch (error) {
      console.error('Failed to fetch members')
    }
  }

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

  const handleAssignPolicy = async () => {
    const validationError = validatePolicyAssignment(
      selectedPolicyId,
      selectedRelationshipId,
      effectiveFrom,
      effectiveTo,
      selectedPrimaryMemberId
    )

    if (validationError) {
      alert(validationError)
      return
    }

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

      if (response.ok) {
        alert('Policy assigned successfully')
        setShowAssignModal(false)
        setSelectedPolicyId('')
        setSelectedRelationshipId('')
        setSelectedPrimaryMemberId('')
        setSelectedPlanConfigId('')
        setEffectiveFrom('')
        setEffectiveTo('')
        fetchAssignments()
      } else {
        const error = await response.json()
        alert(`Failed to assign policy: ${error.message}`)
      }
    } catch (error) {
      alert('Failed to assign policy')
    }
  }

  const handleUnassignPolicy = async (assignment: any) => {
    const policyName = assignment.policyId?.name || 'Unknown Policy'

    if (!confirm(`Are you sure you want to unassign "${policyName}" from this user? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await apiFetch(`/api/assignments/user/${params.id}/policy/${assignment.policyId._id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Policy unassigned successfully')
        fetchAssignments()
      } else {
        const error = await response.json()
        alert(`Failed to unassign policy: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      alert('Failed to unassign policy')
    }
  }

  const handleSave = async () => {
    try {
      const updateData = buildUserUpdateData(editedUser)

      const response = await apiFetch(`/api/users/${params.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        if (showPasswordField && newPassword) {
          await apiFetch(`/api/users/${params.id}/set-password`, {
            method: 'POST',
            body: JSON.stringify({ password: newPassword }),
          })
        }

        alert('User updated successfully')
        setIsEditing(false)
        setShowPasswordField(false)
        setNewPassword('')
        fetchUserWithDependents()
      } else {
        const error = await response.json()
        alert(`Failed to update user: ${error.message}`)
      }
    } catch (error) {
      alert('Failed to update user')
    }
  }

  const handleCancel = () => {
    setEditedUser(user)
    setIsEditing(false)
    setShowPasswordField(false)
    setNewPassword('')
  }

  const handleDeleteUser = async () => {
    if (!confirm(`Are you sure you want to delete "${user.name?.firstName} ${user.name?.lastName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await apiFetch(`/api/users/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('User deleted successfully')
        router.push('/admin/users')
      } else {
        const error = await response.json()
        alert(`Failed to delete user: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      alert('Failed to delete user')
    }
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

  const isInternalUser = ['SUPER_ADMIN', 'ADMIN', 'TPA', 'OPS'].includes(user.role)

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push('/admin/users')}
        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
      >
        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Users
      </button>

      {/* User Information Card */}
      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-semibold text-brand-700">
                {user.name?.firstName?.charAt(0) || '?'}
              </span>
            </div>
            <div>
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={editedUser.name?.firstName || ''}
                      onChange={(e) => setEditedUser({
                        ...editedUser,
                        name: { ...editedUser.name, firstName: e.target.value }
                      })}
                      className="input w-32"
                      placeholder="First Name"
                    />
                    <input
                      type="text"
                      value={editedUser.name?.lastName || ''}
                      onChange={(e) => setEditedUser({
                        ...editedUser,
                        name: { ...editedUser.name, lastName: e.target.value }
                      })}
                      className="input w-32"
                      placeholder="Last Name"
                    />
                  </div>
                  <input
                    type="email"
                    value={editedUser.email || ''}
                    onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                    className="input w-64"
                    placeholder="Email"
                  />
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-gray-900">{user.name?.fullName}</h1>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">ID:</span>
                      <span className="font-mono text-sm font-semibold text-brand-600 bg-brand-50 px-2 py-1 rounded">
                        {user.memberId}
                      </span>
                    </div>
                  </div>
                  {user.relationship !== 'SELF' && (
                    <p className="text-sm text-blue-600 mt-1">
                      Primary Member: {user.primaryMemberId}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <button onClick={handleCancel} className="btn-secondary">
                  Cancel
                </button>
                <button onClick={handleSave} className="btn-primary">
                  Save Changes
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(true)} className="btn-primary">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit User
                </button>
                <button onClick={handleDeleteUser} className="btn-secondary text-red-600 hover:bg-red-50">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
                <span className={user.status === 'ACTIVE' ? 'badge-success' : 'badge-default'}>
                  {user.status}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">User ID</p>
            <p className="text-gray-900">{user.userId}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Member ID</p>
            {isEditing ? (
              <input
                type="text"
                value={editedUser.memberId || ''}
                onChange={(e) => setEditedUser({ ...editedUser, memberId: e.target.value })}
                className="input"
              />
            ) : (
              <p className="font-mono text-gray-900">{user.memberId}</p>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">UHID</p>
            {isEditing ? (
              <input
                type="text"
                value={editedUser.uhid || ''}
                onChange={(e) => setEditedUser({ ...editedUser, uhid: e.target.value })}
                className="input"
              />
            ) : (
              <p className="font-mono text-gray-900">{user.uhid}</p>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Employee ID</p>
            {isEditing ? (
              <input
                type="text"
                value={editedUser.employeeId || ''}
                onChange={(e) => setEditedUser({ ...editedUser, employeeId: e.target.value })}
                className="input"
                placeholder="Optional"
              />
            ) : (
              <p className="font-mono text-gray-900">{user.employeeId || '-'}</p>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Phone</p>
            {isEditing ? (
              <input
                type="tel"
                value={editedUser.phone || ''}
                onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
                className="input"
              />
            ) : (
              <p className="text-gray-900">{user.phone}</p>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">
              {isInternalUser ? 'Role' : 'Relationship'}
            </p>
            {isEditing ? (
              <select
                value={isInternalUser ? editedUser.role : editedUser.relationship}
                onChange={(e) => {
                  if (isInternalUser) {
                    setEditedUser({ ...editedUser, role: e.target.value })
                  } else {
                    setEditedUser({ ...editedUser, relationship: e.target.value })
                  }
                }}
                className="input"
              >
                {isInternalUser ? (
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
            ) : (
              <span className="badge-info">
                {isInternalUser ? user.role : user.relationship}
              </span>
            )}
          </div>
          {!isInternalUser && editedUser.relationship !== 'SELF' && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Primary Member ID</p>
              {isEditing ? (
                <input
                  type="text"
                  value={editedUser.primaryMemberId || ''}
                  onChange={(e) => setEditedUser({ ...editedUser, primaryMemberId: e.target.value })}
                  className="input"
                  placeholder="Required for dependents"
                />
              ) : (
                <p className="text-gray-900">{user.primaryMemberId || '-'}</p>
              )}
            </div>
          )}
          {!isInternalUser && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Corporate Name</p>
              {isEditing ? (
                <select
                  value={selectedCugId || ''}
                  onChange={(e) => {
                    const selectedCug = cugs.find(cug => cug._id === e.target.value)
                    setSelectedCugId(e.target.value)
                    setEditedUser({
                      ...editedUser,
                      corporateName: selectedCug ? selectedCug.name : ''
                    })
                  }}
                  className="input"
                >
                  <option value="">Select Corporate Group</option>
                  {cugs.map((cug) => (
                    <option key={cug._id} value={cug._id}>
                      {cug.name} ({cug.code})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-900">{user.corporateName || '-'}</p>
              )}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Date of Birth</p>
            {isEditing ? (
              <input
                type="date"
                value={editedUser.dob ? new Date(editedUser.dob).toISOString().split('T')[0] : ''}
                onChange={(e) => setEditedUser({ ...editedUser, dob: e.target.value })}
                className="input"
              />
            ) : (
              <p className="text-gray-900">{user.dob ? new Date(user.dob).toLocaleDateString() : '-'}</p>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Gender</p>
            {isEditing ? (
              <select
                value={editedUser.gender || ''}
                onChange={(e) => setEditedUser({ ...editedUser, gender: e.target.value })}
                className="input"
              >
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            ) : (
              <p className="text-gray-900">{user.gender || '-'}</p>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
            {isEditing ? (
              <select
                value={editedUser.status || 'ACTIVE'}
                onChange={(e) => setEditedUser({ ...editedUser, status: e.target.value })}
                className="input"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            ) : (
              <span className={user.status === 'ACTIVE' ? 'badge-success' : 'badge-default'}>
                {user.status}
              </span>
            )}
          </div>
        </div>

        {/* Password Section (Edit Mode Only) */}
        {isEditing && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-700">Password Management</p>
              <button
                type="button"
                onClick={() => setShowPasswordField(!showPasswordField)}
                className="text-sm text-brand-600 hover:text-brand-700"
              >
                {showPasswordField ? 'Cancel Password Change' : 'Change Password'}
              </button>
            </div>
            {showPasswordField && (
              <div className="max-w-md">
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input"
                  placeholder="Enter new password (min. 8 characters)"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Leave empty to keep current password
                </p>
              </div>
            )}
          </div>
        )}

        {/* Address Section */}
        {(user.address || isEditing) && (
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm font-medium text-gray-500 mb-2">Address</p>
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={editedUser.address?.line1 || ''}
                  onChange={(e) => setEditedUser({
                    ...editedUser,
                    address: { ...editedUser.address, line1: e.target.value }
                  })}
                  className="input"
                  placeholder="Address Line 1"
                />
                <input
                  type="text"
                  value={editedUser.address?.line2 || ''}
                  onChange={(e) => setEditedUser({
                    ...editedUser,
                    address: { ...editedUser.address, line2: e.target.value }
                  })}
                  className="input"
                  placeholder="Address Line 2 (Optional)"
                />
                <input
                  type="text"
                  value={editedUser.address?.city || ''}
                  onChange={(e) => setEditedUser({
                    ...editedUser,
                    address: { ...editedUser.address, city: e.target.value }
                  })}
                  className="input"
                  placeholder="City"
                />
                <input
                  type="text"
                  value={editedUser.address?.state || ''}
                  onChange={(e) => setEditedUser({
                    ...editedUser,
                    address: { ...editedUser.address, state: e.target.value }
                  })}
                  className="input"
                  placeholder="State"
                />
                <input
                  type="text"
                  value={editedUser.address?.pincode || ''}
                  onChange={(e) => setEditedUser({
                    ...editedUser,
                    address: { ...editedUser.address, pincode: e.target.value }
                  })}
                  className="input"
                  placeholder="Pincode"
                />
              </div>
            ) : (
              <p className="text-gray-900">
                {user.address?.line1}
                {user.address?.line2 && `, ${user.address.line2}`}
                <br />
                {user.address?.city}, {user.address?.state} - {user.address?.pincode}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Dependents Section (for primary members) */}
      {user.relationship === 'SELF' && dependents.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Dependents ({dependents.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Relationship</th>
                  <th>Member ID</th>
                  <th>UHID</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dependents.map((dep) => (
                  <tr
                    key={dep._id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/admin/users/${dep._id}`)}
                  >
                    <td>
                      <div>
                        <p className="font-medium text-gray-900">{dep.name?.fullName}</p>
                        <p className="text-sm text-gray-500">{dep.email}</p>
                      </div>
                    </td>
                    <td>
                      <span className="badge-warning">{dep.relationship}</span>
                    </td>
                    <td className="font-mono text-sm">{dep.memberId}</td>
                    <td className="font-mono text-sm">{dep.uhid}</td>
                    <td>
                      <span className={dep.status === 'ACTIVE' ? 'badge-success' : 'badge-default'}>
                        {dep.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/admin/users/${dep._id}`)
                        }}
                        className="btn-ghost p-1 text-xs"
                        title="View Details"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Policy Assignments */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Policy Assignments</h2>
          <button
            onClick={() => setShowAssignModal(true)}
            className="btn-primary text-sm"
          >
            Assign Policy
          </button>
        </div>

        {assignments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No policy assignments yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Assignment ID</th>
                  <th>Policy Name</th>
                  <th>Policy Number</th>
                  <th>Effective From</th>
                  <th>Effective To</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment: any) => (
                  <tr key={assignment._id}>
                    <td className="font-mono text-xs">{assignment.assignmentId}</td>
                    <td className="font-medium">
                      {assignment.policyId?.name || 'N/A'}
                      <div className="text-xs text-gray-500">
                        {assignment.policyId?.description || ''}
                      </div>
                    </td>
                    <td className="font-mono text-sm">
                      {assignment.policyId?.policyNumber || 'N/A'}
                    </td>
                    <td>
                      {assignment.effectiveFrom
                        ? new Date(assignment.effectiveFrom).toLocaleDateString()
                        : 'N/A'
                      }
                    </td>
                    <td>
                      {assignment.effectiveTo
                        ? new Date(assignment.effectiveTo).toLocaleDateString()
                        : 'Ongoing'
                      }
                    </td>
                    <td>
                      <span className={assignment.isActive ? 'badge-success' : 'badge-default'}>
                        {assignment.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {assignment.isActive && (
                        <button
                          onClick={() => handleUnassignPolicy(assignment)}
                          className="btn-ghost text-sm text-red-600 hover:text-red-700"
                          title="Unassign Policy"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Unassign
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Policy Modal */}
      {showAssignModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowAssignModal(false)} />
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="text-lg font-semibold">Assign Policy</h3>
            </div>
            <div className="modal-body space-y-4">
              <div>
                <label className="label">Select Policy</label>
                <select
                  className="input"
                  value={selectedPolicyId}
                  onChange={(e) => {
                    setSelectedPolicyId(e.target.value)
                    if (e.target.value) {
                      fetchPlanConfigsForPolicy(e.target.value)
                    }
                  }}
                >
                  <option value="">Choose a policy...</option>
                  {policies.map((policy) => (
                    <option key={policy._id} value={policy._id}>
                      {policy.name} - {policy.policyNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Relationship *</label>
                <select
                  className="input"
                  value={selectedRelationshipId}
                  onChange={(e) => setSelectedRelationshipId(e.target.value)}
                  required
                >
                  <option value="">Choose relationship...</option>
                  {relationships.map((rel) => (
                    <option key={rel.relationshipCode} value={rel.relationshipCode}>
                      {rel.displayName} ({rel.relationshipCode})
                    </option>
                  ))}
                </select>
              </div>

              {selectedRelationshipId && selectedRelationshipId !== 'REL001' && (
                <div>
                  <label className="label">Primary Member ID *</label>
                  <select
                    className="input"
                    value={selectedPrimaryMemberId}
                    onChange={(e) => setSelectedPrimaryMemberId(e.target.value)}
                    required
                  >
                    <option value="">Choose primary member...</option>
                    {members.filter(m => m.relationship === 'SELF').map((member) => (
                      <option key={member._id} value={member.memberId}>
                        {member.memberId} - {member.name?.fullName}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Required for dependents</p>
                </div>
              )}

              {planConfigs.length > 0 && (
                <div>
                  <label className="label">Plan Configuration</label>
                  <select
                    className="input"
                    value={selectedPlanConfigId}
                    onChange={(e) => setSelectedPlanConfigId(e.target.value)}
                  >
                    <option value="">Choose plan config...</option>
                    {planConfigs.map((config) => (
                      <option key={config._id} value={config._id}>
                        Version {config.version} - {config.status} {config.isCurrent ? '(Current)' : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Auto-selected active configuration</p>
                </div>
              )}

              <div>
                <label className="label">Effective From *</label>
                <input
                  type="date"
                  className="input"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Policy coverage start date</p>
              </div>

              <div>
                <label className="label">Effective To *</label>
                <input
                  type="date"
                  className="input"
                  value={effectiveTo}
                  onChange={(e) => setEffectiveTo(e.target.value)}
                  min={effectiveFrom}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Policy coverage end date</p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => {
                  setShowAssignModal(false)
                  setSelectedPolicyId('')
                  setSelectedRelationshipId('')
                  setSelectedPrimaryMemberId('')
                  setSelectedPlanConfigId('')
                  setEffectiveFrom('')
                  setEffectiveTo('')
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignPolicy}
                disabled={!selectedPolicyId || !effectiveFrom || !effectiveTo}
                className="btn-primary"
              >
                Assign Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}