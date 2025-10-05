'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  UserPlusIcon,
  ArrowPathIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

interface Claim {
  _id: string
  claimId: string
  userId: {
    name: { fullName: string }
    memberId: string
  }
  memberName: string
  category: string
  providerName: string
  billAmount: number
  status: string
  submittedAt: string
}

interface TPAUser {
  _id: string
  name: { fullName: string }
  email: string
  role: string
}

export default function UnassignedClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [tpaUsers, setTpaUsers] = useState<TPAUser[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClaim, setSelectedClaim] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState('')
  const [assignmentNotes, setAssignmentNotes] = useState('')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assigningClaim, setAssigningClaim] = useState(false)

  useEffect(() => {
    fetchUnassignedClaims()
    fetchTPAUsers()
  }, [])

  const fetchUnassignedClaims = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/tpa/claims/unassigned', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setClaims(data.claims || [])
      }
    } catch (error) {
      console.error('Error fetching unassigned claims:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTPAUsers = async () => {
    try {
      const response = await fetch('/api/tpa/users', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setTpaUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching TPA users:', error)
    }
  }

  const handleAssignClick = (claimId: string) => {
    setSelectedClaim(claimId)
    setSelectedUser('')
    setAssignmentNotes('')
    setShowAssignModal(true)
  }

  const handleAssign = async () => {
    if (!selectedClaim || !selectedUser) return

    setAssigningClaim(true)
    try {
      const response = await fetch(`/api/tpa/claims/${selectedClaim}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          assignedTo: selectedUser,
          notes: assignmentNotes,
        }),
      })

      if (response.ok) {
        // Remove assigned claim from list
        setClaims(claims.filter((c) => c.claimId !== selectedClaim))
        setShowAssignModal(false)
        setSelectedClaim(null)
        setSelectedUser('')
        setAssignmentNotes('')
      } else {
        const error = await response.json()
        alert(`Failed to assign claim: ${error.message}`)
      }
    } catch (error) {
      console.error('Error assigning claim:', error)
      alert('Failed to assign claim')
    } finally {
      setAssigningClaim(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/tpa/claims"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Unassigned Claims</h1>
            <p className="text-gray-500 mt-1">
              {claims.length} claims waiting for assignment
            </p>
          </div>
        </div>
        <button
          onClick={fetchUnassignedClaims}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
        >
          <ArrowPathIcon className="h-5 w-5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <UserPlusIcon className="h-5 w-5 text-red-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Action Required</h3>
            <p className="text-sm text-red-700 mt-1">
              These claims need to be assigned to TPA users for review. Assign them to start the review process.
            </p>
          </div>
        </div>
      </div>

      {/* Claims Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : claims.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <UserPlusIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Unassigned Claims</h3>
          <p className="text-gray-500">All claims have been assigned to TPA users</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {claims.map((claim) => (
            <div
              key={claim._id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Link
                    href={`/admin/tpa/claims/${claim.claimId}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    {claim.claimId}
                  </Link>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(claim.submittedAt)}
                  </p>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">
                  Unassigned
                </span>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Member</p>
                  <p className="text-sm font-medium text-gray-900">{claim.memberName}</p>
                  <p className="text-xs text-gray-500">{claim.userId?.memberId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Provider</p>
                  <p className="text-sm text-gray-900 truncate">{claim.providerName}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Category</p>
                    <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                      {claim.category}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="text-lg font-bold text-gray-900">
                      ₹{claim.billAmount?.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <button
                onClick={() => handleAssignClick(claim.claimId)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <UserPlusIcon className="h-4 w-4" />
                <span>Assign to TPA User</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Assign Claim</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Claim ID
                </label>
                <input
                  type="text"
                  value={selectedClaim || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign to TPA User *
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a TPA user...</option>
                  {tpaUsers.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name.fullName} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assignment Notes (Optional)
                </label>
                <textarea
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  placeholder="Add notes about this assignment..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedUser || assigningClaim}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {assigningClaim ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Assigning...
                  </>
                ) : (
                  'Assign Claim'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
