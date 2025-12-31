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
      {/* Header with gradient */}
      <div className="text-center mb-6 lg:mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl lg:rounded-3xl shadow-lg mb-4 transform hover:scale-105 transition-transform">
          <DocumentCheckIcon className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
        </div>
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Review & Submit</h2>
        <p className="text-sm lg:text-base text-gray-600">Please verify all details before submitting</p>
      </div>

      {/* Wallet Rules Card - Beautiful gradient */}
      {walletRules && (
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-xl">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>

            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 bg-white/20 rounded-xl backdrop-blur-sm">
                  <ShieldCheckIcon className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                </div>
                <h3 className="text-lg lg:text-xl font-black text-white">Your OPD Wallet Details</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 lg:gap-5">
                <div className="bg-white/10 backdrop-blur-md rounded-xl lg:rounded-2xl p-4 lg:p-5 border border-white/20">
                  <p className="text-xs lg:text-sm text-white/70 font-medium mb-2">Annual Limit</p>
                  <p className="text-xl lg:text-2xl font-black text-white">₹{walletRules.totalAnnualAmount?.toLocaleString() || '0'}</p>
                </div>

                {walletRules.copay && (
                  <div className="bg-white/10 backdrop-blur-md rounded-xl lg:rounded-2xl p-4 lg:p-5 border border-white/20">
                    <p className="text-xs lg:text-sm text-white/70 font-medium mb-2">Your Co-pay</p>
                    <p className="text-xl lg:text-2xl font-black text-white">
                      {walletRules.copay.mode === 'PERCENT'
                        ? `${walletRules.copay.value}%`
                        : `₹${walletRules.copay.value}`}
                    </p>
                  </div>
                )}

                {walletRules.perClaimLimit && (
                  <div className="bg-white/10 backdrop-blur-md rounded-xl lg:rounded-2xl p-4 lg:p-5 border border-white/20">
                    <p className="text-xs lg:text-sm text-white/70 font-medium mb-2">Per Claim Cap</p>
                    <p className="text-xl lg:text-2xl font-black text-white">₹{walletRules.perClaimLimit.toLocaleString()}</p>
                  </div>
                )}

                {walletRules.partialPaymentEnabled && (
                  <div className="bg-white/10 backdrop-blur-md rounded-xl lg:rounded-2xl p-4 lg:p-5 border border-white/20">
                    <p className="text-xs lg:text-sm text-white/70 font-medium mb-2">Partial Payment</p>
                    <p className="text-xl lg:text-2xl font-black text-white">Allowed ✓</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Claim Summary - Beautiful cards */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
        <div className="relative bg-white rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-xl border-2 border-gray-100">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-100">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl lg:text-2xl font-black text-gray-900">Claim Summary</h3>
          </div>

          <div className="space-y-5">
            {/* Claim Type */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                  <TagIcon className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm lg:text-base text-gray-600 font-medium">Claim Type</span>
              </div>
              <span className="text-sm lg:text-base font-bold text-gray-900 capitalize">
                {formData.claimType.replace('-', ' ')}
              </span>
            </div>

            {/* Category */}
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-all">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                  <TagIcon className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm lg:text-base text-gray-600 font-medium">Category</span>
              </div>
              <span className="text-sm lg:text-base font-bold text-gray-900">
                {availableCategories.find(c => c.categoryId === formData.category)?.name || 'Not selected'}
              </span>
            </div>

            {/* Billing Date */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-all">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                  <CalendarIcon className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm lg:text-base text-gray-600 font-medium">Billing Date</span>
              </div>
              <span className="text-sm lg:text-base font-bold text-gray-900">
                {new Date(formData.treatmentDate).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </div>

            {/* Bill Amount - Highlighted */}
            <div className="relative overflow-hidden bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-5 lg:p-6 shadow-lg">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl backdrop-blur-sm">
                    <CurrencyRupeeIcon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-base lg:text-lg text-white/90 font-bold">Bill Amount</span>
                </div>
                <span className="text-3xl lg:text-4xl font-black text-white">
                  ₹{parseFloat(formData.billAmount || '0').toLocaleString()}
                </span>
              </div>
            </div>

            {/* Estimated Reimbursement */}
            {estimatedReimbursement > 0 && (
              <div className="relative overflow-hidden bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-5 lg:p-6 shadow-lg border-2 border-green-200">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl backdrop-blur-sm">
                      <CheckCircleIcon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-base lg:text-lg text-white/90 font-bold">Estimated Reimbursement</span>
                  </div>
                  <span className="text-3xl lg:text-4xl font-black text-white">
                    ₹{estimatedReimbursement.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Documents */}
            <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-all">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg">
                  <DocumentCheckIcon className="w-5 h-5 text-indigo-600" />
                </div>
                <span className="text-sm lg:text-base text-gray-600 font-medium">Documents</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <span className="text-sm lg:text-base font-bold text-gray-900">
                  {totalDocuments} file{totalDocuments !== 1 ? 's' : ''} uploaded
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terms Agreement - Important notice */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
        <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl lg:rounded-3xl p-5 lg:p-6 shadow-lg border-2 border-blue-100">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg flex-shrink-0">
              <ShieldCheckIcon className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
            </div>
            <div>
              <p className="font-black text-base lg:text-lg text-gray-900 mb-2">Verification & Terms</p>
              <p className="text-sm lg:text-base text-gray-700 leading-relaxed">
                By submitting this claim, you confirm that all information provided is
                accurate and complete. False claims may result in policy termination.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Expected Processing Time */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 to-teal-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
        <div className="relative flex items-center gap-4 p-5 lg:p-6 bg-white rounded-2xl shadow-lg border-2 border-gray-100">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-cyan-100 to-teal-100 rounded-xl flex-shrink-0">
            <ClockIcon className="w-6 h-6 text-cyan-600" />
          </div>
          <div className="text-sm lg:text-base text-gray-700">
            <span className="font-bold text-gray-900">Expected processing time:</span>
            <span className="ml-2 text-cyan-600 font-bold">3-5 business days</span>
          </div>
        </div>
      </div>
    </div>
  )
}
