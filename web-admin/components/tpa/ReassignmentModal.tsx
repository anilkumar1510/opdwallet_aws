'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface ReassignmentModalProps {
  claimId: string
  currentAssignee?: {
    _id: string
    name: { fullName: string }
    email: string
  }
  onClose: () => void
  onSuccess: () => void
}

interface TPAUser {
  _id: string
  name: { fullName: string }
  email: string
  role: string
}

export default function ReassignmentModal({
  claimId,
  currentAssignee,
  onClose,
  onSuccess,
}: ReassignmentModalProps) {
  const [tpaUsers, setTpaUsers] = useState<TPAUser[]>([])
  const [selectedUser, setSelectedUser] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTPAUsers()
  }, [])

  const fetchTPAUsers = async () => {
    setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    // Validation
    if (!selectedUser) {
      setError('Please select a TPA user to reassign')
      return
    }

    if (currentAssignee && selectedUser === currentAssignee._id) {
      setError('Please select a different user than the current assignee')
      return
    }

    if (!reason.trim()) {
      setError('Please provide a reason for reassignment')
      return
    }

    setError('')
    setSubmitting(true)

    try {
      const response = await fetch(`/api/tpa/claims/${claimId}/reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          newAssignee: selectedUser,
          reason,
          notes,
        }),
      })

      if (response.ok) {
        onSuccess()
        onClose()
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to reassign claim')
      }
    } catch (err) {
      setError('Failed to reassign claim. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <ArrowPathIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Reassign Claim</h3>
              <p className="text-sm text-gray-500">{claimId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Current Assignment */}
        {currentAssignee && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-600 mb-2">Currently Assigned To</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {currentAssignee.name.fullName}
                </p>
                <p className="text-xs text-gray-500">{currentAssignee.email}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* TPA User Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reassign to TPA User *
            </label>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a TPA user...</option>
                {tpaUsers
                  .filter((user) => !currentAssignee || user._id !== currentAssignee._id)
                  .map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name.fullName} ({user.email})
                    </option>
                  ))}
              </select>
            )}
          </div>

          {/* Reassignment Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Reassignment *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this claim is being reassigned..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Common reasons: workload balancing, expertise required, leave of absence, etc.
            </p>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional context or instructions for the new assignee..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Note:</span> The new assignee will be notified of this
            claim assignment. The reassignment history will be tracked in the claim timeline.
          </p>
        </div>

        {/* Summary */}
        {selectedUser && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900">Reassignment Summary</p>
            <div className="mt-2 space-y-1">
              {currentAssignee && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-700">From:</span>
                  <span className="font-medium text-blue-900">
                    {currentAssignee.name.fullName}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700">To:</span>
                <span className="font-medium text-blue-900">
                  {tpaUsers.find((u) => u._id === selectedUser)?.name.fullName}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center space-x-3 mt-6">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedUser || !reason.trim() || loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Reassigning...
              </>
            ) : (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Reassign Claim
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
