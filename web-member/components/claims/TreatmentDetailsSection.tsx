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
      {/* Header */}
      <div className="rounded-2xl p-6 lg:p-8 text-center border-2 shadow-md" style={{
        background: 'linear-gradient(169.98deg, #EFF4FF 19.71%, #FEF3E9 66.63%, #FEF3E9 108.92%)',
        borderColor: '#F7DCAF'
      }}>
        <div
          className="w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{
            background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
            border: '1px solid #A4BFFE7A',
            boxShadow: '-2px 11px 46.1px 0px #0000000D'
          }}
        >
          <SparklesIcon className="w-8 h-8 lg:w-10 lg:h-10" style={{ color: '#0F5FDC' }} />
        </div>
        <h2 className="text-xl lg:text-2xl font-bold mb-2" style={{ color: '#0E51A2' }}>Treatment Details</h2>
        <p className="text-sm lg:text-base text-gray-700">Provide information about your treatment</p>
      </div>

      {/* Family Member Selection */}
      {familyMembers.length > 0 && (
        <div className="bg-white rounded-xl p-5 lg:p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg">
              <UserGroupIcon className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
            </div>
            <div>
              <label className="block text-base lg:text-lg font-semibold text-gray-900">
                Select Family Member
              </label>
              <p className="text-xs lg:text-sm text-gray-600">Who is the treatment for?</p>
            </div>
          </div>

          <select
            value={selectedUserId}
            onChange={(e) => onUserChange(e.target.value)}
            className="w-full px-4 py-3 lg:py-4 text-base font-medium border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-gray-50 hover:bg-white transition-all cursor-pointer"
          >
            {familyMembers.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.name} {member.isPrimary ? '(Self)' : `(${member.relationship})`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Category Selection */}
      <div className="bg-white rounded-xl p-5 lg:p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg">
            <TagIcon className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
          </div>
          <div>
            <label className="block text-base lg:text-lg font-semibold text-gray-900">
              Claim Category <span className="text-red-500">*</span>
            </label>
            <p className="text-xs lg:text-sm text-gray-600">Select the type of treatment</p>
          </div>
        </div>

        <select
          value={formData.category}
          onChange={(e) => onFormDataChange({ category: e.target.value })}
          className={cn(
            "w-full px-4 py-3 lg:py-4 text-base font-medium border rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 appearance-none bg-gray-50 hover:bg-white transition-all cursor-pointer",
            errors.category ? "border-red-300 bg-red-50" : "border-gray-200"
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
          <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">{errors.category}</p>
          </div>
        )}

        {/* Available Balance */}
        {formData.category && walletData && (
          <div className="mt-4 rounded-xl p-4 border-2 shadow-md" style={{
            background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
            borderColor: '#86ACD8'
          }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-full"
                  style={{
                    background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                    border: '1px solid #A4BFFE7A',
                    boxShadow: '-2px 11px 46.1px 0px #0000000D'
                  }}
                >
                  <ShieldCheckIcon className="w-5 h-5" style={{ color: '#0F5FDC' }} />
                </div>
                <span className="text-sm lg:text-base font-semibold" style={{ color: '#0E51A2' }}>Available Balance</span>
              </div>
              <span className="text-xl lg:text-2xl font-bold" style={{ color: '#0E51A2' }}>
                ₹{getAvailableBalance().toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Billing Date */}
      <div className="bg-white rounded-xl p-5 lg:p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg">
            <CalendarIcon className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
          </div>
          <div>
            <label className="block text-base lg:text-lg font-semibold text-gray-900">
              Billing Date <span className="text-red-500">*</span>
            </label>
            <p className="text-xs lg:text-sm text-gray-600">When did you receive treatment?</p>
          </div>
        </div>

        <input
          type="date"
          value={formData.treatmentDate}
          onChange={(e) => onFormDataChange({ treatmentDate: e.target.value })}
          className={cn(
            "w-full px-4 py-3 lg:py-4 text-base font-medium border rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-gray-50 hover:bg-white transition-all",
            errors.treatmentDate ? "border-red-300 bg-red-50" : "border-gray-200"
          )}
          max={new Date().toISOString().split('T')[0]}
        />

        {errors.treatmentDate && (
          <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">{errors.treatmentDate}</p>
          </div>
        )}
      </div>

      {/* Amount and Bill Number - Side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        {/* Bill Amount */}
        <div className="bg-white rounded-xl p-5 lg:p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-lg">
              <CurrencyRupeeIcon className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <label className="block text-sm lg:text-base font-semibold text-gray-900">
                Bill Amount <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-600">Total bill value</p>
            </div>
          </div>

          <input
            type="number"
            value={formData.billAmount}
            onChange={(e) => onFormDataChange({ billAmount: e.target.value })}
            placeholder="0"
            className={cn(
              "w-full px-4 py-3 lg:py-4 text-lg lg:text-xl font-semibold border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50 hover:bg-white transition-all",
              errors.billAmount ? "border-red-300 bg-red-50" : "border-gray-200"
            )}
          />

          {errors.billAmount && (
            <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded-lg">
              <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
              <p className="text-xs font-medium">{errors.billAmount}</p>
            </div>
          )}
        </div>

        {/* Bill Number */}
        <div className="bg-white rounded-xl p-5 lg:p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
              <DocumentTextIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <label className="block text-sm lg:text-base font-semibold text-gray-900">
                Bill Number
              </label>
              <p className="text-xs text-gray-600">Invoice reference</p>
            </div>
          </div>

          <input
            type="text"
            value={formData.billNumber}
            onChange={(e) => onFormDataChange({ billNumber: e.target.value })}
            placeholder="INV-12345"
            className="w-full px-4 py-3 lg:py-4 text-base font-medium border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-gray-50 hover:bg-white transition-all"
          />
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
              <div className="bg-orange-500 rounded-xl p-5 lg:p-6 shadow-md">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-white rounded-lg flex-shrink-0">
                    <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="text-white">
                    <p className="font-bold text-lg mb-2">Amount Will Be Capped</p>
                    <p className="text-sm font-medium leading-relaxed">
                      Your bill amount of ₹{billAmount.toLocaleString()} exceeds the per-claim limit.
                      The claim will be automatically capped to ₹{categoryLimit.toLocaleString()}.
                    </p>
                  </div>
                </div>
              </div>

              {/* Approved Amount Card */}
              <div className="bg-green-50 rounded-xl p-5 lg:p-6 shadow-sm border-2 border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-600 rounded-lg">
                    <CheckCircleIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <label className="block text-base lg:text-lg font-semibold text-gray-900">
                      Amount Submitted for Approval
                    </label>
                    <p className="text-xs lg:text-sm text-gray-600">Maximum claimable amount</p>
                  </div>
                </div>

                <div className="text-center py-4">
                  <div className="text-5xl font-bold text-green-600">
                    ₹{approvedAmount.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600 mt-2 font-medium">
                    This is the maximum amount that will be processed
                  </p>
                </div>
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Treatment Description */}
      <div className="bg-white rounded-xl p-5 lg:p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg">
            <DocumentTextIcon className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
          </div>
          <div>
            <label className="block text-base lg:text-lg font-semibold text-gray-900">
              Treatment Description
            </label>
            <p className="text-xs lg:text-sm text-gray-600">Brief details about the treatment</p>
          </div>
        </div>

        <textarea
          value={formData.treatmentDescription}
          onChange={(e) => onFormDataChange({ treatmentDescription: e.target.value })}
          placeholder="Describe the treatment you received..."
          rows={4}
          className="w-full px-4 py-4 text-base font-medium border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none bg-gray-50 hover:bg-white transition-all"
        />
      </div>
    </div>
  )
}
