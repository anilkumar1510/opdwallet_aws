'use client'

import { Card } from '@/components/ui/Card'
import {
  ClockIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

interface Category {
  categoryId: string
  name: string
}

interface WalletRules {
  totalAnnualAmount?: number
  perClaimLimit?: number
  copay?: {
    mode: string
    value: number
  }
  partialPaymentEnabled?: boolean
}

interface ClaimReviewSectionProps {
  formData: {
    claimType: string
    category: string
    treatmentDate: string
    billAmount: string
  }
  availableCategories: Category[]
  walletRules: WalletRules | null
  estimatedReimbursement: number
  prescriptionFiles: any[]
  billFiles: any[]
  documentPreviews: any[]
}

export function ClaimReviewSection({
  formData,
  availableCategories,
  walletRules,
  estimatedReimbursement,
  prescriptionFiles,
  billFiles,
  documentPreviews
}: ClaimReviewSectionProps) {
  const isConsult = formData.category === 'CAT001' || formData.category === 'CAT005'
  const totalDocuments = isConsult
    ? prescriptionFiles.length + billFiles.length
    : documentPreviews.length

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-ink-900 mb-2">Review & Submit</h2>
        <p className="text-sm text-ink-500">Please verify all details before submitting</p>
      </div>

      {/* Wallet Rules Display */}
      {walletRules && (
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100 p-4">
          <h3 className="text-sm font-semibold text-ink-900 mb-3">Your OPD Wallet Details</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-ink-500">Annual Limit</p>
              <p className="font-bold text-indigo-700">₹{walletRules.totalAnnualAmount?.toLocaleString() || '0'}</p>
            </div>
            {walletRules.copay && (
              <div>
                <p className="text-ink-500">Your Co-pay</p>
                <p className="font-bold text-purple-700">
                  {walletRules.copay.mode === 'PERCENT'
                    ? `${walletRules.copay.value}%`
                    : `₹${walletRules.copay.value}`}
                </p>
              </div>
            )}
            {walletRules.perClaimLimit && (
              <div>
                <p className="text-ink-500">Per Claim Cap</p>
                <p className="font-bold text-blue-700">₹{walletRules.perClaimLimit.toLocaleString()}</p>
              </div>
            )}
            {walletRules.partialPaymentEnabled && (
              <div>
                <p className="text-ink-500">Partial Payment</p>
                <p className="font-bold text-green-700">Allowed</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Claim Summary */}
      <Card className="p-0">
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-sm text-ink-500">Claim Type</span>
            <span className="text-sm font-medium text-ink-900 capitalize">
              {formData.claimType.replace('-', ' ')}
            </span>
          </div>

          <div className="flex justify-between items-start">
            <span className="text-sm text-ink-500">Category</span>
            <span className="text-sm font-medium text-ink-900">
              {availableCategories.find(c => c.categoryId === formData.category)?.name || 'Not selected'}
            </span>
          </div>

          <div className="flex justify-between items-start">
            <span className="text-sm text-ink-500">Billing Date</span>
            <span className="text-sm font-medium text-ink-900">
              {new Date(formData.treatmentDate).toLocaleDateString()}
            </span>
          </div>

          <div className="flex justify-between items-start">
            <span className="text-sm text-ink-500">Bill Amount</span>
            <span className="text-lg font-bold text-ink-900">
              ₹{parseFloat(formData.billAmount || '0').toLocaleString()}
            </span>
          </div>

          {estimatedReimbursement > 0 && (
            <div className="flex justify-between items-start pt-2 border-t border-surface-border">
              <span className="text-sm text-brand-600">Estimated Reimbursement</span>
              <span className="text-lg font-bold text-brand-600">
                ₹{estimatedReimbursement.toLocaleString()}
              </span>
            </div>
          )}

          <div className="flex justify-between items-start">
            <span className="text-sm text-ink-500">Documents</span>
            <span className="text-sm font-medium text-ink-900">
              {totalDocuments} file{totalDocuments !== 1 ? 's' : ''} uploaded
            </span>
          </div>
        </div>
      </Card>

      {/* Terms Agreement */}
      <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <ShieldCheckIcon className="h-5 w-5 text-brand-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-brand-700">
            <p className="font-medium mb-1">Verification & Terms</p>
            <p>
              By submitting this claim, you confirm that all information provided is
              accurate and complete. False claims may result in policy termination.
            </p>
          </div>
        </div>
      </div>

      {/* Expected Processing Time */}
      <div className="flex items-center space-x-3 p-4 bg-surface-alt rounded-xl">
        <ClockIcon className="h-5 w-5 text-ink-400" />
        <div className="text-sm text-ink-600">
          <span className="font-medium">Expected processing time:</span> 3-5 business days
        </div>
      </div>
    </div>
  )
}
