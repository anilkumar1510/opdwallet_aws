'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'

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

  useEffect(() => {
    if (params.id) {
      fetchUserWithDependents()
      fetchAssignments()
      fetchPolicies()
    }
  }, [params.id])

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
    } finally {
      setLoading(false)
    }
  }

  const fetchAssignments = async () => {
    try {
      const response = await apiFetch(`/api/users/${params.id}/assignments`)
      if (response.ok) {
        const data = await response.json()
        setAssignments(data)
      }
    } catch (error) {
      console.error('Failed to fetch assignments')
    }
  }

  const fetchPolicies = async () => {
    try {
      const response = await apiFetch('/api/policies?status=ACTIVE')
      if (response.ok) {
        const data = await response.json()
        setPolicies(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch policies')
    }
  }

  const handleAssignPolicy = async () => {
    if (!selectedPolicyId) return

    try {
      const response = await apiFetch('/api/assignments', {
        method: 'POST',
        body: JSON.stringify({
          policyId: selectedPolicyId,
          userId: params.id,
        }),
      })

      if (response.ok) {
        alert('Policy assigned successfully')
        setShowAssignModal(false)
        setSelectedPolicyId('')
        fetchAssignments()
      }
    } catch (error) {
      alert('Failed to assign policy')
    }
  }

  const handleSave = async () => {
    try {
      // Update user data
      const updateData = {
        name: editedUser.name,
        email: editedUser.email,
        phone: editedUser.phone,
        dob: editedUser.dob,
        gender: editedUser.gender,
        address: editedUser.address,
        status: editedUser.status,
        role: editedUser.role,
        relationship: editedUser.relationship,
        primaryMemberId: editedUser.primaryMemberId,
        memberId: editedUser.memberId,
        uhid: editedUser.uhid,
        employeeId: editedUser.employeeId
      }

      const response = await apiFetch(`/api/users/${params.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        // If password needs to be updated
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
                  <p className="text-sm text-gray-500">{user.email}</p>
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
                    <option value="DAUGHTER">DAUGHTER</option>
                    <option value="SON">SON</option>
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
                  <th>Policy Name</th>
                  <th>Coverage Amount</th>
                  <th>Valid From</th>
                  <th>Valid Until</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment: any) => (
                  <tr key={assignment._id}>
                    <td className="font-medium">{assignment.policyName}</td>
                    <td>₹{assignment.coverageAmount?.toLocaleString()}</td>
                    <td>{new Date(assignment.validFrom).toLocaleDateString()}</td>
                    <td>{new Date(assignment.validUntil).toLocaleDateString()}</td>
                    <td>
                      <span className="badge-success">Active</span>
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
            <div className="modal-body">
              <label className="label">Select Policy</label>
              <select
                className="input"
                value={selectedPolicyId}
                onChange={(e) => setSelectedPolicyId(e.target.value)}
              >
                <option value="">Choose a policy...</option>
                {policies.map((policy) => (
                  <option key={policy._id} value={policy._id}>
                    {policy.name} - ₹{policy.coverageAmount?.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => {
                  setShowAssignModal(false)
                  setSelectedPolicyId('')
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignPolicy}
                disabled={!selectedPolicyId}
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