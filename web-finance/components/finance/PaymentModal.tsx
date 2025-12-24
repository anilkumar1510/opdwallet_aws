'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import {
  XMarkIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

interface Claim {
  _id: string
  claimId: string
  userId: {
    name: { fullName: string }
    memberId: string
    email: string
  }
  memberName: string
  category: string
  providerName: string
  billAmount: number
  approvedAmount: number
  status: string
  approvedAt?: string
  submittedAt: string
}

interface PaymentModalProps {
  claim: Claim
  onClose: () => void
  onSuccess: () => void
}

enum PaymentMode {
  BANK_TRANSFER = 'BANK_TRANSFER',
  UPI = 'UPI',
  CHEQUE = 'CHEQUE',
  CASH = 'CASH',
  NEFT = 'NEFT',
  RTGS = 'RTGS',
  IMPS = 'IMPS',
}

export default function PaymentModal({ claim, onClose, onSuccess }: PaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [claimDetails, setClaimDetails] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    paymentMode: PaymentMode.BANK_TRANSFER,
    paymentReference: '',
    amountPaid: claim.approvedAmount || 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentNotes: '',
  })

  const fetchClaimDetails = useCallback(async () => {
    setLoadingDetails(true)
    try {
      const response = await apiFetch(`/api/finance/claims/${claim.claimId}`)
      if (response.ok) {
        const data = await response.json()
        setClaimDetails(data.claim)
      } else {
        setError('Failed to fetch claim details')
      }
    } catch (err) {
      console.error('Error fetching claim details:', err)
      setError('Error loading claim details')
    } finally {
      setLoadingDetails(false)
    }
  }, [claim.claimId])

  // Fetch detailed claim information with bank details on mount
  useEffect(() => {
    fetchClaimDetails()
  }, [fetchClaimDetails])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation
    if (formData.amountPaid !== claim.approvedAmount) {
      setError(`Payment amount must match approved amount: ₹${claim.approvedAmount.toLocaleString()}`)
      setLoading(false)
      return
    }

    if (!formData.paymentReference.trim()) {
      setError('Payment reference is required')
      setLoading(false)
      return
    }

    try {
      const response = await apiFetch(`/api/finance/claims/${claim.claimId}/complete-payment`, {
        method: 'POST',
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1500)
      } else {
        setError(data.message || 'Failed to process payment')
      }
    } catch (err) {
      console.error('Error processing payment:', err)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <BanknotesIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Process Payment</h2>
              <p className="text-sm text-gray-500">Claim ID: {claim.claimId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-green-800">Payment Completed!</h3>
                  <p className="text-sm text-green-700 mt-1">
                    The payment has been processed successfully.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {loadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Claim Information */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  Claim Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Member Name</p>
                    <p className="text-sm font-medium text-gray-900">{claim.memberName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Member ID</p>
                    <p className="text-sm font-medium text-gray-900">
                      {claim.userId?.memberId || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Category</p>
                    <p className="text-sm font-medium text-gray-900">{claim.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Provider</p>
                    <p className="text-sm font-medium text-gray-900">{claim.providerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Bill Amount</p>
                    <p className="text-sm font-medium text-gray-900">
                      ₹{claim.billAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Approved Amount</p>
                    <p className="text-sm font-bold text-green-600">
                      ₹{claim.approvedAmount?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Member Bank Details */}
              {claimDetails?.userId?.bankDetails && (
                <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                    Member Bank Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Account Holder Name</p>
                      <p className="text-sm font-medium text-gray-900">
                        {claimDetails.userId.bankDetails.accountHolderName || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Bank Name</p>
                      <p className="text-sm font-medium text-gray-900">
                        {claimDetails.userId.bankDetails.bankName || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Account Number</p>
                      <p className="text-sm font-medium text-gray-900 font-mono">
                        {claimDetails.userId.bankDetails.accountNumber || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">IFSC Code</p>
                      <p className="text-sm font-medium text-gray-900 font-mono">
                        {claimDetails.userId.bankDetails.ifscCode || 'N/A'}
                      </p>
                    </div>
                    {claimDetails.userId.bankDetails.branchName && (
                      <div>
                        <p className="text-xs text-gray-500">Branch Name</p>
                        <p className="text-sm font-medium text-gray-900">
                          {claimDetails.userId.bankDetails.branchName}
                        </p>
                      </div>
                    )}
                    {claimDetails.userId.bankDetails.upiId && (
                      <div>
                        <p className="text-xs text-gray-500">UPI ID</p>
                        <p className="text-sm font-medium text-gray-900 font-mono">
                          {claimDetails.userId.bankDetails.upiId}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                    Payment Information
                  </h3>

                  {/* Payment Mode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Mode <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.paymentMode}
                      onChange={(e) =>
                        setFormData({ ...formData, paymentMode: e.target.value as PaymentMode })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value={PaymentMode.BANK_TRANSFER}>Bank Transfer</option>
                      <option value={PaymentMode.NEFT}>NEFT</option>
                      <option value={PaymentMode.RTGS}>RTGS</option>
                      <option value={PaymentMode.IMPS}>IMPS</option>
                      <option value={PaymentMode.UPI}>UPI</option>
                      <option value={PaymentMode.CHEQUE}>Cheque</option>
                      <option value={PaymentMode.CASH}>Cash</option>
                    </select>
                  </div>

                  {/* Payment Reference */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Reference / Transaction ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.paymentReference}
                      onChange={(e) =>
                        setFormData({ ...formData, paymentReference: e.target.value })
                      }
                      placeholder="e.g., TXN123456789, Cheque #12345"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Amount Paid */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount Paid <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        ₹
                      </span>
                      <input
                        type="number"
                        value={formData.amountPaid}
                        onChange={(e) =>
                          setFormData({ ...formData, amountPaid: Number(e.target.value) })
                        }
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Must match approved amount: ₹{claim.approvedAmount?.toLocaleString() || 0}
                    </p>
                  </div>

                  {/* Payment Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.paymentDate}
                      onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Payment Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Notes (Optional)
                    </label>
                    <textarea
                      value={formData.paymentNotes}
                      onChange={(e) => setFormData({ ...formData, paymentNotes: e.target.value })}
                      placeholder="Add any additional notes about this payment..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || success}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <BanknotesIcon className="h-5 w-5" />
                        <span>Complete Payment</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
