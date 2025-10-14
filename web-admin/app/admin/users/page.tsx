'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { relationshipsApi, type Relationship } from '@/lib/api/relationships'

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'external' | 'internal'>('external')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [newPassword, setNewPassword] = useState('')
  const [relationships, setRelationships] = useState<Relationship[]>([])

  useEffect(() => {
    fetchUsers()
    fetchRelationships()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await apiFetch('/api/users?limit=100')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const fetchRelationships = async () => {
    try {
      const data = await relationshipsApi.getAll()
      setRelationships(data)
    } catch (error) {
      console.error('Failed to fetch relationships:', error)
    }
  }

  const getRelationshipName = (relationshipCode: string) => {
    if (!relationshipCode) {
      return 'Primary Member'
    }
    const relationship = relationships.find(rel => rel.relationshipCode === relationshipCode)
    return relationship?.displayName || relationshipCode
  }

  const handleResetPassword = async (userId: string) => {
    if (confirm('Reset password for this user? A temporary password will be generated.')) {
      try {
        const response = await apiFetch(`/api/users/${userId}/reset-password`, {
          method: 'POST',
        })
        if (response.ok) {
          const data = await response.json()
          alert(`Password reset. Temporary password: ${data.tempPassword}`)
        }
      } catch (error) {
        alert('Failed to reset password')
      }
    }
  }

  const handleSetPassword = async () => {
    if (!selectedUser || !newPassword) return

    try {
      const response = await apiFetch(`/api/users/${selectedUser._id}/set-password`, {
        method: 'POST',
        body: JSON.stringify({ password: newPassword }),
      })
      if (response.ok) {
        alert('Password set successfully')
        setShowPasswordModal(false)
        setSelectedUser(null)
        setNewPassword('')
      }
    } catch (error) {
      alert('Failed to set password')
    }
  }

  // Separate users by type
  const internalRoles = ['SUPER_ADMIN', 'ADMIN', 'TPA', 'OPS']
  const internalUsers = users.filter(user => internalRoles.includes(user.role))
  const externalUsers = users.filter(user => user.role === 'MEMBER')

  const currentUsers = activeTab === 'internal' ? internalUsers : externalUsers

  const filteredUsers = currentUsers.filter(user =>
    user.name?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase()) ||
    user.memberId?.toLowerCase().includes(search.toLowerCase()) ||
    user.uhid?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 max-w-md">
        <button
          onClick={() => setActiveTab('external')}
          className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors ${
            activeTab === 'external'
              ? 'bg-white text-brand-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          External Users ({externalUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('internal')}
          className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors ${
            activeTab === 'internal'
              ? 'bg-white text-brand-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Internal Users ({internalUsers.length})
        </button>
      </div>

      {/* Page Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 max-w-lg">
          <input
            type="text"
            placeholder="Search users by name, email, member ID, or UHID..."
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => router.push('/admin/users/new')}
          className="btn-primary"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </button>
      </div>

      {/* Users Table */}
      <div className="table-container">
        {filteredUsers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.196-2.121M9 12h6m-6 4h6m2 5H7a4 4 0 01-4-4V9a4 4 0 014-4h10a4 4 0 014 4v8a4 4 0 01-4 4z" />
              </svg>
            </div>
            <h4 className="empty-state-title">No users found</h4>
            <p className="empty-state-description">
              {search ? 'Try adjusting your search criteria.' : 'Get started by adding your first user.'}
            </p>
            {!search && (
              <button
                onClick={() => router.push('/admin/users/new')}
                className="btn-primary mt-4"
              >
                Add User
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Member ID</th>
                  <th>UHID</th>
                  <th className="hidden sm:table-cell">Employee ID</th>
                  <th>Name</th>
                  <th className="hidden md:table-cell">Email</th>
                  <th className="hidden lg:table-cell">
                    {activeTab === 'external' ? 'Relationship' : 'Role'}
                  </th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user._id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/admin/users/${user._id}`)}
                  >
                    <td>
                      <div className="font-mono text-sm font-semibold text-brand-600">
                        {user.userId || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <div className="font-mono text-sm font-semibold text-gray-900">
                        {user.memberId || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <div className="font-mono text-sm text-gray-900">
                        {user.uhid || 'N/A'}
                      </div>
                    </td>
                    <td className="hidden sm:table-cell">
                      <div className="font-mono text-sm text-gray-900">
                        {user.employeeId || '-'}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {user.name?.firstName?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.name?.fullName || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500 md:hidden">
                            {user.email}
                          </div>
                          {activeTab === 'external' && user.relationship && (
                            <div className="text-xs text-blue-600">
                              Primary: {user.primaryMemberId}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell">
                      <div className="text-gray-900">{user.email}</div>
                      <div className="text-xs text-gray-500">{user.phone}</div>
                    </td>
                    <td className="hidden lg:table-cell">
                      {activeTab === 'external' ? (
                        <span className={`badge ${
                          !user.relationship ? 'badge-info' : 'badge-warning'
                        }`}>
                          {getRelationshipName(user.relationship)}
                        </span>
                      ) : (
                        <span className="badge-info">
                          {user.role}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={user.status === 'ACTIVE' ? 'badge-success' : 'badge-default'}>
                        <span className={`status-dot mr-1 ${user.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}`}></span>
                        {user.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedUser(user)
                            setShowPasswordModal(true)
                          }}
                          className="btn-ghost p-1 text-xs"
                          title="Set Password"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleResetPassword(user._id)
                          }}
                          className="btn-ghost p-1 text-xs"
                          title="Reset Password"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/admin/users/${user._id}`)
                          }}
                          className="btn-ghost p-1 text-xs"
                          title="View Details"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="modal">
          <button
            type="button"
            className="modal-backdrop border-0 p-0 cursor-default"
            onClick={() => setShowPasswordModal(false)}
            aria-label="Close modal"
          />
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="text-lg font-semibold">Set Password</h3>
            </div>
            <div className="modal-body">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Setting password for: <strong>{selectedUser?.name?.fullName}</strong>
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Email: {selectedUser?.email}
                </p>
              </div>
              <div>
                <label className="label">New Password</label>
                <input
                  type="text"
                  className="input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2">
                  Password should be at least 8 characters long
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setNewPassword('')
                  setSelectedUser(null)
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSetPassword}
                disabled={!newPassword || newPassword.length < 8}
                className="btn-primary"
              >
                Set Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}