'use client'

import { useState } from 'react'
import { XMarkIcon, XCircleIcon } from '@heroicons/react/24/outline'

interface RejectionModalProps {
  claimId: string
  billAmount: number
  onClose: () => void
  onSuccess: () => void
}

const REJECTION_REASONS = [
  'Insufficient documentation',
  'Treatment not covered under policy',
  'Pre-existing condition exclusion',
  'Policy limit exceeded',
  'Invalid or expired policy',
  'Fraudulent claim detected',
  'Duplicate claim submission',
  'Non-network provider without pre-authorization',
  'Treatment not medically necessary',
  'Waiting period not completed',
  'Other (specify in notes)',
]

export default function RejectionModal({
  claimId,
  billAmount,
  onClose,
  onSuccess,
}: RejectionModalProps) {
  const [selectedReason, setSelectedReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    // Validation
    if (!selectedReason) {
      setError('Please select a rejection reason')
      return
    }

    if (selectedReason === 'Other (specify in notes)' && !customReason.trim()) {
      setError('Please provide a custom rejection reason')
      return
    }

    setError('')
    setSubmitting(true)

    const finalReason = selectedReason === 'Other (specify in notes)'
      ? customReason
      : selectedReason

    try {
      const response = await fetch(`/api/tpa/claims/${claimId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          reason: finalReason,
          notes,
        }),
      })

      if (response.ok) {
        onSuccess()
        onClose()
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to reject claim')
      }
    } catch (err) {
      setError('Failed to reject claim. Please try again.')
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
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <XCircleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Reject Claim</h3>
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

        <div className="space-y-4">
          {/* Warning */}
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <span className="font-medium">Warning:</span> Rejecting this claim will permanently
              mark it as rejected. This action cannot be undone. Please ensure you have reviewed
              all documents and information carefully.
            </p>
          </div>

          {/* Bill Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bill Amount (to be rejected)
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-medium">
                ₹{billAmount.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Rejection Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rejection Reason *
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            >
              <option value="">Select a reason...</option>
              {REJECTION_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Reason - only if "Other" selected */}
          {selectedReason === 'Other (specify in notes)' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Rejection Reason *
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Provide detailed custom rejection reason..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>
          )}

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes, explanations, or recommendations for the member..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              These notes will be visible to the member and other reviewers
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-900">Rejection Summary</p>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-red-700">Claim ID:</span>
              <span className="font-medium text-red-900">{claimId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-red-700">Rejected Amount:</span>
              <span className="font-bold text-red-900">
                ₹{billAmount.toLocaleString()}
              </span>
            </div>
            {selectedReason && selectedReason !== 'Other (specify in notes)' && (
              <div className="text-sm mt-2">
                <span className="text-red-700">Reason:</span>
                <p className="font-medium text-red-900 mt-1">{selectedReason}</p>
              </div>
            )}
            {selectedReason === 'Other (specify in notes)' && customReason && (
              <div className="text-sm mt-2">
                <span className="text-red-700">Reason:</span>
                <p className="font-medium text-red-900 mt-1">{customReason}</p>
              </div>
            )}
          </div>
        </div>

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
            disabled={submitting || !selectedReason || (selectedReason === 'Other (specify in notes)' && !customReason.trim())}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Rejecting...
              </>
            ) : (
              <>
                <XCircleIcon className="h-4 w-4 mr-2" />
                Reject Claim
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
