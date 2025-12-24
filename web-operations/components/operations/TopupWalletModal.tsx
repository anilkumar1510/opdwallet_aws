'use client'

import { useState } from 'react'
import {
  XMarkIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { apiFetch } from '@/lib/api'

interface TopupWalletModalProps {
  memberId: string
  memberName: string
  wallet: any
  onClose: () => void
  onSuccess: () => void
}

export default function TopupWalletModal({
  memberId,
  memberName,
  wallet,
  onClose,
  onSuccess,
}: TopupWalletModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    categoryCode: '',
    amount: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation
    if (!formData.categoryCode) {
      setError('Please select a category')
      setLoading(false)
      return
    }

    const amount = parseFloat(formData.amount)
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount greater than 0')
      setLoading(false)
      return
    }

    if (!formData.notes.trim()) {
      setError('Please provide notes for this top-up')
      setLoading(false)
      return
    }

    try {
      const response = await apiFetch(`/api/ops/members/${memberId}/wallet/topup`, {
        method: 'POST',
        body: JSON.stringify({
          categoryCode: formData.categoryCode,
          amount: amount,
          notes: formData.notes,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          onSuccess()
        }, 1500)
      } else {
        setError(data.message || 'Failed to top-up wallet')
      }
    } catch (err) {
      console.error('Error topping up wallet:', err)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <BanknotesIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Top-up Wallet</h2>
              <p className="text-sm text-gray-500">{memberName}</p>
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
                  <h3 className="text-sm font-medium text-green-800">Wallet Topped Up!</h3>
                  <p className="text-sm text-green-700 mt-1">
                    The wallet has been topped up successfully.
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

          {/* Current Wallet Balance */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Current Wallet Balance</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-blue-600">Allocated</p>
                <p className="text-lg font-bold text-blue-900">
                  ₹{wallet.totalBalance.allocated?.toLocaleString() || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-blue-600">Current</p>
                <p className="text-lg font-bold text-blue-900">
                  ₹{wallet.totalBalance.current?.toLocaleString() || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-blue-600">Consumed</p>
                <p className="text-lg font-bold text-blue-900">
                  ₹{wallet.totalBalance.consumed?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Top-up Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                Top-up Information
              </h3>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.categoryCode}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryCode: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                  disabled={loading || success}
                >
                  <option value="">Select a category</option>
                  {wallet.categoryBalances.map((category: any) => (
                    <option key={category.categoryCode} value={category.categoryCode}>
                      {category.categoryName} (Current: ₹{category.current?.toLocaleString() || 0})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select the category to top-up
                </p>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Top-up Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    placeholder="Enter amount"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                    min="1"
                    step="0.01"
                    disabled={loading || success}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter the amount to add to the wallet
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes / Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g., Emergency medical expenses, Corporate policy adjustment, etc."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  required
                  disabled={loading || success}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Provide a reason for this wallet top-up
                </p>
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
                    <span>Confirm Top-up</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
