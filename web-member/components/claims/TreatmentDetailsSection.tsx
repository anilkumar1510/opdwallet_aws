'use client'

import { cn } from '@/lib/utils'
import {
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface Category {
  id: string
  name: string
  categoryId: string
  categoryCode: string
}

interface FamilyMember {
  userId: string
  name: string
  memberId: string
  isPrimary: boolean
  relationship: string
}

interface WalletRules {
  totalAnnualAmount?: number
  perClaimLimit?: number
  copay?: {
    mode: string
    value: number
  }
  partialPaymentEnabled?: boolean
  categoryLimits?: Record<string, { perClaimLimit: number }>
}

interface TreatmentDetailsSectionProps {
  formData: {
    category: string
    treatmentDate: string
    billAmount: string
    billNumber: string
    treatmentDescription: string
  }
  familyMembers: FamilyMember[]
  selectedUserId: string
  availableCategories: Category[]
  walletData: any
  walletRules: WalletRules | null
  errors: Record<string, string>
  onFormDataChange: (updates: Partial<TreatmentDetailsSectionProps['formData']>) => void
  onUserChange: (userId: string) => void
  getAvailableBalance: () => number
}

export function TreatmentDetailsSection({
  formData,
  familyMembers,
  selectedUserId,
  availableCategories,
  walletData,
  walletRules,
  errors,
  onFormDataChange,
  onUserChange,
  getAvailableBalance
}: TreatmentDetailsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-ink-900 mb-2">Treatment Details</h2>
        <p className="text-sm text-ink-500">Provide information about your treatment</p>
      </div>

      {/* Family Member Selection */}
      {familyMembers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <label className="block text-sm font-semibold text-ink-900 mb-2">
            Select Family Member *
          </label>
          <select
            value={selectedUserId}
            onChange={(e) => onUserChange(e.target.value)}
            className="w-full h-touch px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            {familyMembers.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.name} {member.isPrimary ? '(Self)' : `(${member.relationship})`}
              </option>
            ))}
          </select>
          <p className="text-xs text-blue-600 mt-1">
            Select who the treatment is for
          </p>
        </div>
      )}

      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-ink-900 mb-2">
          Claim Category *
        </label>
        <select
          value={formData.category}
          onChange={(e) => onFormDataChange({ category: e.target.value })}
          className={cn(
            "w-full h-touch px-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand-600 focus:border-transparent appearance-none bg-white",
            errors.category ? "border-danger" : "border-surface-border"
          )}
        >
          <option value="">Select a category</option>
          {availableCategories.map((category) => (
            <option key={category.id} value={category.categoryId}>
              {category.name}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="text-danger text-sm mt-1 flex items-center">
            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            {errors.category}
          </p>
        )}

        {/* Show available balance for selected category */}
        {formData.category && walletData && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">Available Balance:</span>
              <span className="text-lg font-bold text-blue-600">
                ₹{getAvailableBalance().toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Billing Date */}
      <div>
        <label className="block text-sm font-medium text-ink-900 mb-2">
          Billing Date *
        </label>
        <input
          type="date"
          value={formData.treatmentDate}
          onChange={(e) => onFormDataChange({ treatmentDate: e.target.value })}
          className={cn(
            "w-full h-touch px-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand-600 focus:border-transparent",
            errors.treatmentDate ? "border-danger" : "border-surface-border"
          )}
          max={new Date().toISOString().split('T')[0]}
        />
        {errors.treatmentDate && (
          <p className="text-danger text-sm mt-1 flex items-center">
            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            {errors.treatmentDate}
          </p>
        )}
      </div>

      {/* Amount and Bill Number */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-ink-900 mb-2">
            Bill Amount (₹) *
          </label>
          <input
            type="number"
            value={formData.billAmount}
            onChange={(e) => onFormDataChange({ billAmount: e.target.value })}
            placeholder="0"
            className={cn(
              "w-full h-touch px-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand-600 focus:border-transparent",
              errors.billAmount ? "border-danger" : "border-surface-border"
            )}
          />
          {errors.billAmount && (
            <p className="text-danger text-sm mt-1 flex items-center">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
              {errors.billAmount}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-900 mb-2">
            Bill Number
          </label>
          <input
            type="text"
            value={formData.billNumber}
            onChange={(e) => onFormDataChange({ billNumber: e.target.value })}
            placeholder="Invoice #"
            className="w-full h-touch px-4 py-3 border border-surface-border rounded-xl focus:ring-2 focus:ring-brand-600 focus:border-transparent"
          />
        </div>
      </div>

      {/* Per-Claim Limit Warning and Amount Submitted for Approval */}
      {formData.billAmount && walletRules?.categoryLimits && (() => {
        const categoryLimit = walletRules.categoryLimits[formData.category]?.perClaimLimit;
        const billAmount = parseFloat(formData.billAmount);

        if (categoryLimit && billAmount > categoryLimit) {
          const approvedAmount = Math.min(billAmount, categoryLimit);

          return (
            <>
              {/* Warning */}
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-900 mb-1">Amount will be capped</p>
                  <p className="text-amber-700">
                    Your bill amount (₹{billAmount.toLocaleString()})
                    exceeds the per-claim limit of ₹{categoryLimit.toLocaleString()}.
                    The claim will be automatically capped to ₹{categoryLimit.toLocaleString()}.
                  </p>
                </div>
              </div>

              {/* Amount Submitted for Approval Field */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-ink-900 mb-2">
                  Amount Submitted for Approval (₹)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={`₹${approvedAmount.toLocaleString()}`}
                    readOnly
                    className="w-full h-touch px-4 py-3 border-2 border-green-500 bg-green-50 rounded-xl font-semibold text-green-700 cursor-not-allowed"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  This is the maximum amount that will be processed for this claim.
                </p>
              </div>
            </>
          );
        }
        return null;
      })()}

      {/* Treatment Description */}
      <div>
        <label className="block text-sm font-medium text-ink-900 mb-2">
          Treatment Description
        </label>
        <textarea
          value={formData.treatmentDescription}
          onChange={(e) => onFormDataChange({ treatmentDescription: e.target.value })}
          placeholder="Brief description of treatment received"
          rows={3}
          className="w-full px-4 py-3 border border-surface-border rounded-xl focus:ring-2 focus:ring-brand-600 focus:border-transparent resize-none"
        />
      </div>
    </div>
  )
}
