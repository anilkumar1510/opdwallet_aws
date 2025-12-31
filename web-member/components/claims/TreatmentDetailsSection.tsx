'use client'

import { cn } from '@/lib/utils'
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserGroupIcon,
  TagIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  DocumentTextIcon,
  SparklesIcon,
  ShieldCheckIcon
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
    <div className="space-y-5 lg:space-y-6 animate-fadeIn">
      {/* Header with gradient */}
      <div className="text-center mb-6 lg:mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl lg:rounded-3xl shadow-lg mb-4 transform hover:scale-105 transition-transform">
          <SparklesIcon className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
        </div>
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Treatment Details</h2>
        <p className="text-sm lg:text-base text-gray-600">Provide information about your treatment</p>
      </div>

      {/* Family Member Selection - Beautiful gradient card */}
      {familyMembers.length > 0 && (
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
          <div className="relative bg-white rounded-2xl p-5 lg:p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl">
                <UserGroupIcon className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
              </div>
              <div>
                <label className="block text-base lg:text-lg font-bold text-gray-900">
                  Select Family Member
                </label>
                <p className="text-xs lg:text-sm text-gray-500">Who is the treatment for?</p>
              </div>
            </div>

            <select
              value={selectedUserId}
              onChange={(e) => onUserChange(e.target.value)}
              className="w-full px-4 py-4 lg:py-5 text-base lg:text-lg font-medium border-2 border-gray-200 rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-all cursor-pointer shadow-sm"
            >
              {familyMembers.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.name} {member.isPrimary ? '(Self)' : `(${member.relationship})`}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Category Selection - Stunning card */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
        <div className="relative bg-white rounded-2xl p-5 lg:p-6 shadow-lg border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
              <TagIcon className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600" />
            </div>
            <div>
              <label className="block text-base lg:text-lg font-bold text-gray-900">
                Claim Category <span className="text-red-500">*</span>
              </label>
              <p className="text-xs lg:text-sm text-gray-500">Select the type of treatment</p>
            </div>
          </div>

          <select
            value={formData.category}
            onChange={(e) => onFormDataChange({ category: e.target.value })}
            className={cn(
              "w-full px-4 py-4 lg:py-5 text-base lg:text-lg font-medium border-2 rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none bg-gray-50 hover:bg-white transition-all cursor-pointer shadow-sm",
              errors.category ? "border-red-400 bg-red-50" : "border-gray-200"
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
            <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl">
              <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">{errors.category}</p>
            </div>
          )}

          {/* Available Balance - Gradient display */}
          {formData.category && walletData && (
            <div className="mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl lg:rounded-2xl p-4 lg:p-5 shadow-lg transform hover:scale-102 transition-transform">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-lg backdrop-blur">
                    <ShieldCheckIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm lg:text-base font-medium text-white/90">Available Balance</span>
                </div>
                <span className="text-2xl lg:text-3xl font-black text-white">
                  ₹{getAvailableBalance().toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Billing Date - Beautiful input */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 to-teal-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
        <div className="relative bg-white rounded-2xl p-5 lg:p-6 shadow-lg border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-green-100 to-teal-100 rounded-xl">
              <CalendarIcon className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
            </div>
            <div>
              <label className="block text-base lg:text-lg font-bold text-gray-900">
                Billing Date <span className="text-red-500">*</span>
              </label>
              <p className="text-xs lg:text-sm text-gray-500">When did you receive treatment?</p>
            </div>
          </div>

          <input
            type="date"
            value={formData.treatmentDate}
            onChange={(e) => onFormDataChange({ treatmentDate: e.target.value })}
            className={cn(
              "w-full px-4 py-4 lg:py-5 text-base lg:text-lg font-medium border-2 rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 hover:bg-white transition-all shadow-sm",
              errors.treatmentDate ? "border-red-400 bg-red-50" : "border-gray-200"
            )}
            max={new Date().toISOString().split('T')[0]}
          />

          {errors.treatmentDate && (
            <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl">
              <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">{errors.treatmentDate}</p>
            </div>
          )}
        </div>
      </div>

      {/* Amount and Bill Number - Side by side beautiful cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        {/* Bill Amount */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
          <div className="relative bg-white rounded-2xl p-5 lg:p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl">
                <CurrencyRupeeIcon className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <label className="block text-sm lg:text-base font-bold text-gray-900">
                  Bill Amount <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500">Total bill value</p>
              </div>
            </div>

            <input
              type="number"
              value={formData.billAmount}
              onChange={(e) => onFormDataChange({ billAmount: e.target.value })}
              placeholder="0"
              className={cn(
                "w-full px-4 py-3 lg:py-4 text-lg lg:text-xl font-bold border-2 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-gray-50 hover:bg-white transition-all shadow-sm",
                errors.billAmount ? "border-red-400 bg-red-50" : "border-gray-200"
              )}
            />

            {errors.billAmount && (
              <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded-lg">
                <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
                <p className="text-xs font-medium">{errors.billAmount}</p>
              </div>
            )}
          </div>
        </div>

        {/* Bill Number */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-400 to-blue-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
          <div className="relative bg-white rounded-2xl p-5 lg:p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-xl">
                <DocumentTextIcon className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <label className="block text-sm lg:text-base font-bold text-gray-900">
                  Bill Number
                </label>
                <p className="text-xs text-gray-500">Invoice reference</p>
              </div>
            </div>

            <input
              type="text"
              value={formData.billNumber}
              onChange={(e) => onFormDataChange({ billNumber: e.target.value })}
              placeholder="INV-12345"
              className="w-full px-4 py-3 lg:py-4 text-base lg:text-lg font-medium border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 hover:bg-white transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Per-Claim Limit Warning */}
      {formData.billAmount && walletRules?.categoryLimits && (() => {
        const categoryLimit = walletRules.categoryLimits[formData.category]?.perClaimLimit;
        const billAmount = parseFloat(formData.billAmount);

        if (categoryLimit && billAmount > categoryLimit) {
          const approvedAmount = Math.min(billAmount, categoryLimit);

          return (
            <div className="space-y-4">
              {/* Warning Card */}
              <div className="relative overflow-hidden bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl p-5 lg:p-6 shadow-lg">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                <div className="relative flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-white rounded-xl shadow-lg flex-shrink-0">
                    <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="text-white">
                    <p className="font-black text-lg mb-2">Amount Will Be Capped</p>
                    <p className="text-sm font-medium text-white/90 leading-relaxed">
                      Your bill amount of ₹{billAmount.toLocaleString()} exceeds the per-claim limit.
                      The claim will be automatically capped to ₹{categoryLimit.toLocaleString()}.
                    </p>
                  </div>
                </div>
              </div>

              {/* Approved Amount Card */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 to-emerald-400 rounded-2xl blur opacity-40"></div>
                <div className="relative bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-5 lg:p-6 shadow-lg border-2 border-green-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                      <CheckCircleIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <label className="block text-base lg:text-lg font-bold text-gray-900">
                        Amount Submitted for Approval
                      </label>
                      <p className="text-xs lg:text-sm text-gray-600">Maximum claimable amount</p>
                    </div>
                  </div>

                  <div className="text-center py-4">
                    <div className="text-5xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      ₹{approvedAmount.toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-600 mt-2 font-medium">
                      This is the maximum amount that will be processed
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Treatment Description - Beautiful textarea */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-400 to-rose-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
        <div className="relative bg-white rounded-2xl p-5 lg:p-6 shadow-lg border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-pink-100 to-rose-100 rounded-xl">
              <DocumentTextIcon className="w-5 h-5 lg:w-6 lg:h-6 text-pink-600" />
            </div>
            <div>
              <label className="block text-base lg:text-lg font-bold text-gray-900">
                Treatment Description
              </label>
              <p className="text-xs lg:text-sm text-gray-500">Brief details about the treatment</p>
            </div>
          </div>

          <textarea
            value={formData.treatmentDescription}
            onChange={(e) => onFormDataChange({ treatmentDescription: e.target.value })}
            placeholder="Describe the treatment you received..."
            rows={4}
            className="w-full px-4 py-4 text-base font-medium border-2 border-gray-200 rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none bg-gray-50 hover:bg-white transition-all shadow-sm"
          />
        </div>
      </div>
    </div>
  )
}
