'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users?limit=50', {
        credentials: 'include',
      })
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



  const handleResetPassword = async (userId: string) => {
    if (confirm('Reset password for this user?')) {
      try {
        const response = await fetch(`/api/users/${userId}/reset-password`, {
          method: 'POST',
          credentials: 'include',
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

  const filteredUsers = users.filter(user =>
    user.name?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase()) ||
    user.memberId?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 max-w-lg">
          <input
            type="text"
            placeholder="Search users by name, email, or member ID..."
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
                  <th>Name</th>
                  <th className="hidden sm:table-cell">Email</th>
                  <th>Member ID</th>
                  <th className="hidden lg:table-cell">Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {user.name?.fullName?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.name?.fullName || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500 sm:hidden">
                            {user.email}
                          </div>
                          <div className="text-xs text-gray-400">
                            {user.relationship}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell">
                      <div className="text-gray-900">{user.email}</div>
                    </td>
                    <td>
                      <div className="font-mono text-sm">{user.memberId}</div>
                    </td>
                    <td className="hidden lg:table-cell">
                      <span className="badge-info">
                        {user.role}
                      </span>
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
                          onClick={() => handleResetPassword(user._id)}
                          className="btn-ghost p-1 text-xs"
                          title="Reset Password"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v-2l-4.586-4.586A6 6 0 0117 9z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => router.push(`/admin/users/${user._id}`)}
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
    </div>
  )
}