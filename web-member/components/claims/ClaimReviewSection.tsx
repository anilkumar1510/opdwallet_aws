'use client'

import {
  ClockIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  DocumentCheckIcon,
  CurrencyRupeeIcon,
  CalendarIcon,
  TagIcon,
  SparklesIcon
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
    <div className="space-y-5 lg:space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="text-center mb-6 lg:mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 lg:w-20 lg:h-20 bg-green-600 rounded-xl shadow-md mb-4">
          <DocumentCheckIcon className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
        </div>
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Review & Submit</h2>
        <p className="text-sm lg:text-base text-gray-600">Please verify all details before submitting</p>
      </div>

      {/* Wallet Rules Card */}
      {walletRules && (
        <div className="bg-brand-500 rounded-xl p-6 lg:p-8 shadow-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 bg-white/20 rounded-lg">
              <ShieldCheckIcon className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
            </div>
            <h3 className="text-lg lg:text-xl font-bold text-white">Your OPD Wallet Details</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:gap-5">
            {walletRules.totalAnnualAmount && (
              <div className="bg-white/10 rounded-xl p-4 lg:p-5 border border-white/20">
                <p className="text-xs lg:text-sm text-white/70 font-medium mb-2">Annual Limit</p>
                <p className="text-xl lg:text-2xl font-bold text-white">₹{walletRules.totalAnnualAmount.toLocaleString()}</p>
              </div>
            )}

            {walletRules.copay && (
              <div className="bg-white/10 rounded-xl p-4 lg:p-5 border border-white/20">
                <p className="text-xs lg:text-sm text-white/70 font-medium mb-2">Your Co-pay</p>
                <p className="text-xl lg:text-2xl font-bold text-white">
                  {walletRules.copay.mode === 'PERCENT'
                    ? `${walletRules.copay.value}%`
                    : `₹${walletRules.copay.value}`}
                </p>
              </div>
            )}

            {walletRules.perClaimLimit && (
              <div className="bg-white/10 rounded-xl p-4 lg:p-5 border border-white/20">
                <p className="text-xs lg:text-sm text-white/70 font-medium mb-2">Per Claim Cap</p>
                <p className="text-xl lg:text-2xl font-bold text-white">₹{walletRules.perClaimLimit.toLocaleString()}</p>
              </div>
            )}

            {walletRules.partialPaymentEnabled && (
              <div className="bg-white/10 rounded-xl p-4 lg:p-5 border border-white/20">
                <p className="text-xs lg:text-sm text-white/70 font-medium mb-2">Partial Payment</p>
                <p className="text-xl lg:text-2xl font-bold text-white">Allowed ✓</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Claim Summary */}
      <div className="bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
            <SparklesIcon className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl lg:text-2xl font-bold text-gray-900">Claim Summary</h3>
        </div>

        <div className="space-y-4">
          {/* Claim Type */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                <TagIcon className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm lg:text-base text-gray-600 font-medium">Claim Type</span>
            </div>
            <span className="text-sm lg:text-base font-semibold text-gray-900 capitalize">
              {formData.claimType.replace('-', ' ')}
            </span>
          </div>

          {/* Category */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                <TagIcon className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm lg:text-base text-gray-600 font-medium">Category</span>
            </div>
            <span className="text-sm lg:text-base font-semibold text-gray-900">
              {availableCategories.find(c => c.categoryId === formData.category)?.name || 'Not selected'}
            </span>
          </div>

          {/* Billing Date */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm lg:text-base text-gray-600 font-medium">Billing Date</span>
            </div>
            <span className="text-sm lg:text-base font-semibold text-gray-900">
              {new Date(formData.treatmentDate).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>

          {/* Bill Amount */}
          <div className="bg-brand-500 rounded-xl p-5 lg:p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-lg">
                  <CurrencyRupeeIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-base lg:text-lg text-white font-semibold">Bill Amount</span>
              </div>
              <span className="text-3xl lg:text-4xl font-bold text-white">
                ₹{parseFloat(formData.billAmount || '0').toLocaleString()}
              </span>
            </div>
          </div>

          {/* Estimated Reimbursement */}
          {estimatedReimbursement > 0 && (
            <div className="bg-green-600 rounded-xl p-5 lg:p-6 shadow-md border-2 border-green-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-lg">
                    <CheckCircleIcon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-base lg:text-lg text-white font-semibold">Estimated Reimbursement</span>
                </div>
                <span className="text-3xl lg:text-4xl font-bold text-white">
                  ₹{estimatedReimbursement.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Documents */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                <DocumentCheckIcon className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm lg:text-base text-gray-600 font-medium">Documents</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <span className="text-sm lg:text-base font-semibold text-gray-900">
                {totalDocuments} file{totalDocuments !== 1 ? 's' : ''} uploaded
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Terms Agreement */}
      <div className="bg-blue-50 rounded-xl p-5 lg:p-6 shadow-sm border border-blue-100">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 bg-brand-500 rounded-lg flex-shrink-0">
            <ShieldCheckIcon className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
          </div>
          <div>
            <p className="font-semibold text-base lg:text-lg text-gray-900 mb-2">Verification & Terms</p>
            <p className="text-sm lg:text-base text-gray-700 leading-relaxed">
              By submitting this claim, you confirm that all information provided is
              accurate and complete. False claims may result in policy termination.
            </p>
          </div>
        </div>
      </div>

      {/* Expected Processing Time */}
      <div className="flex items-center gap-4 p-5 lg:p-6 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg flex-shrink-0">
          <ClockIcon className="w-6 h-6 text-blue-600" />
        </div>
        <div className="text-sm lg:text-base text-gray-700">
          <span className="font-semibold text-gray-900">Expected processing time:</span>
          <span className="ml-2 text-brand-600 font-semibold">3-5 business days</span>
        </div>
      </div>
    </div>
  )
}
