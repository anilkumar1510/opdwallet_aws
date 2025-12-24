'use client'

import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { apiFetch } from '@/lib/api'

interface StatusUpdateModalProps {
  claimId: string
  currentStatus: string
  onClose: () => void
  onSuccess: () => void
}

const CLAIM_STATUSES = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'UNASSIGNED', label: 'Unassigned' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'DOCUMENTS_REQUIRED', label: 'Documents Required' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'PARTIALLY_APPROVED', label: 'Partially Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'PAYMENT_PENDING', label: 'Payment Pending' },
  { value: 'PAYMENT_PROCESSING', label: 'Payment Processing' },
  { value: 'PAYMENT_COMPLETED', label: 'Payment Completed' },
]

export default function StatusUpdateModal({
  claimId,
  currentStatus,
  onClose,
  onSuccess,
}: StatusUpdateModalProps) {
  const [status, setStatus] = useState(currentStatus)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (status === currentStatus) {
      setError('Please select a different status')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await apiFetch(`/api/tpa/claims/${claimId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          notes: notes || undefined,
        }),
      })

      if (response.ok) {
        onSuccess()
        onClose()
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to update status')
      }
    } catch (err) {
      setError('An error occurred while updating status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <button
          type="button"
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 border-0 p-0 cursor-default"
          onClick={onClose}
          aria-label="Close modal"
        ></button>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Update Claim Status</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 py-5 sm:p-6">
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Status
                  </label>
                  <div className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                    {CLAIM_STATUSES.find(s => s.value === currentStatus)?.label || currentStatus}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select new status...</option>
                    {CLAIM_STATUSES.map((s) => (
                      <option
                        key={s.value}
                        value={s.value}
                        disabled={s.value === currentStatus}
                      >
                        {s.label} {s.value === currentStatus ? '(Current)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add any notes about this status change..."
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading || status === currentStatus}
                className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Status'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
