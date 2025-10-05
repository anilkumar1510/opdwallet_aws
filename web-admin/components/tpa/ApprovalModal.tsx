'use client'

import { useState } from 'react'
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

interface ApprovalModalProps {
  claimId: string
  billAmount: number
  onClose: () => void
  onSuccess: () => void
}

export default function ApprovalModal({
  claimId,
  billAmount,
  onClose,
  onSuccess,
}: ApprovalModalProps) {
  const [approvalType, setApprovalType] = useState<'full' | 'partial'>('full')
  const [approvedAmount, setApprovedAmount] = useState(billAmount)
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    // Validation
    if (approvalType === 'partial' && (!approvedAmount || approvedAmount <= 0)) {
      setError('Please enter a valid approved amount')
      return
    }

    if (approvalType === 'partial' && approvedAmount > billAmount) {
      setError('Approved amount cannot exceed bill amount')
      return
    }

    if (!reason.trim()) {
      setError('Please provide a reason for approval')
      return
    }

    setError('')
    setSubmitting(true)

    try {
      const response = await fetch(`/api/tpa/claims/${claimId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          approvalType,
          approvedAmount: approvalType === 'full' ? billAmount : approvedAmount,
          reason,
          notes,
        }),
      })

      if (response.ok) {
        onSuccess()
        onClose()
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to approve claim')
      }
    } catch (err) {
      setError('Failed to approve claim. Please try again.')
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
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Approve Claim</h3>
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
          {/* Approval Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Approval Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setApprovalType('full')
                  setApprovedAmount(billAmount)
                }}
                className={`p-3 border rounded-lg text-left transition-all ${
                  approvalType === 'full'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <p className="text-sm font-medium text-gray-900">Full Approval</p>
                <p className="text-xs text-gray-500 mt-1">
                  Approve entire amount
                </p>
              </button>
              <button
                onClick={() => setApprovalType('partial')}
                className={`p-3 border rounded-lg text-left transition-all ${
                  approvalType === 'partial'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <p className="text-sm font-medium text-gray-900">Partial Approval</p>
                <p className="text-xs text-gray-500 mt-1">
                  Approve specific amount
                </p>
              </button>
            </div>
          </div>

          {/* Bill Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bill Amount
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600">
                ₹{billAmount.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Approved Amount - only for partial */}
          {approvalType === 'partial' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Approved Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  ₹
                </span>
                <input
                  type="number"
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter approved amount"
                  min="1"
                  max={billAmount}
                />
              </div>
              {approvalType === 'partial' && approvedAmount > 0 && (
                <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700">
                    Rejected Amount: ₹{(billAmount - approvedAmount).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for {approvalType === 'full' ? 'Full' : 'Partial'} Approval *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide detailed reason for this approval decision..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes or comments..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-medium text-green-900">Approval Summary</p>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-green-700">Bill Amount:</span>
              <span className="font-medium text-green-900">
                ₹{billAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-700">Approved Amount:</span>
              <span className="font-bold text-green-900">
                ₹{(approvalType === 'full' ? billAmount : approvedAmount).toLocaleString()}
              </span>
            </div>
            {approvalType === 'partial' && (
              <div className="flex justify-between text-sm">
                <span className="text-green-700">Rejected Amount:</span>
                <span className="font-medium text-red-600">
                  ₹{(billAmount - approvedAmount).toLocaleString()}
                </span>
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
            disabled={submitting || !reason.trim()}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Approving...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Approve Claim
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
