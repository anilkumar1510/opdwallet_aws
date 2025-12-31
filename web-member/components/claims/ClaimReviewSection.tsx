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
      <div className="rounded-2xl p-6 lg:p-8 text-center border-2 shadow-md" style={{
        background: 'linear-gradient(169.98deg, #EFF4FF 19.71%, #FEF3E9 66.63%, #FEF3E9 108.92%)',
        borderColor: '#F7DCAF'
      }}>
        <div
          className="w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{
            background: 'linear-gradient(163.02deg, #90EAA9 -37.71%, #5FA171 117.48%)',
            border: '1px solid rgba(95, 161, 113, 0.3)',
            boxShadow: '-2px 11px 46.1px 0px #0000000D'
          }}
        >
          <DocumentCheckIcon className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
        </div>
        <h2 className="text-xl lg:text-2xl font-bold mb-2" style={{ color: '#0E51A2' }}>Review & Submit</h2>
        <p className="text-sm lg:text-base text-gray-700">Please verify all details before submitting</p>
      </div>

      {/* Wallet Rules Card */}
      {walletRules && (
        <div className="rounded-2xl p-6 lg:p-8 border-2 shadow-md" style={{
          background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
          borderColor: '#86ACD8'
        }}>
          <div className="flex items-center gap-3 mb-6">
            <div
              className="flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-full"
              style={{
                background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                border: '1px solid #A4BFFE7A',
                boxShadow: '-2px 11px 46.1px 0px #0000000D'
              }}
            >
              <ShieldCheckIcon className="w-6 h-6 lg:w-7 lg:h-7" style={{ color: '#0F5FDC' }} />
            </div>
            <h3 className="text-lg lg:text-xl font-bold" style={{ color: '#0E51A2' }}>Your OPD Wallet Details</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:gap-5">
            {walletRules.totalAnnualAmount && (
              <div className="rounded-xl p-4 lg:p-5 border-2 bg-white/50" style={{ borderColor: '#86ACD8' }}>
                <p className="text-xs lg:text-sm text-gray-600 font-medium mb-2">Annual Limit</p>
                <p className="text-xl lg:text-2xl font-bold" style={{ color: '#0E51A2' }}>₹{walletRules.totalAnnualAmount.toLocaleString()}</p>
              </div>
            )}

            {walletRules.copay && (
              <div className="rounded-xl p-4 lg:p-5 border-2 bg-white/50" style={{ borderColor: '#86ACD8' }}>
                <p className="text-xs lg:text-sm text-gray-600 font-medium mb-2">Your Co-pay</p>
                <p className="text-xl lg:text-2xl font-bold" style={{ color: '#0E51A2' }}>
                  {walletRules.copay.mode === 'PERCENT'
                    ? `${walletRules.copay.value}%`
                    : `₹${walletRules.copay.value}`}
                </p>
              </div>
            )}

            {walletRules.perClaimLimit && (
              <div className="rounded-xl p-4 lg:p-5 border-2 bg-white/50" style={{ borderColor: '#86ACD8' }}>
                <p className="text-xs lg:text-sm text-gray-600 font-medium mb-2">Per Claim Cap</p>
                <p className="text-xl lg:text-2xl font-bold" style={{ color: '#0E51A2' }}>₹{walletRules.perClaimLimit.toLocaleString()}</p>
              </div>
            )}

            {walletRules.partialPaymentEnabled && (
              <div className="rounded-xl p-4 lg:p-5 border-2 bg-white/50" style={{ borderColor: '#86ACD8' }}>
                <p className="text-xs lg:text-sm text-gray-600 font-medium mb-2">Partial Payment</p>
                <p className="text-xl lg:text-2xl font-bold" style={{ color: '#0E51A2' }}>Allowed ✓</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Claim Summary */}
      <div className="rounded-2xl p-6 lg:p-8 border-2 shadow-md" style={{
        background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
        borderColor: '#86ACD8'
      }}>
        <div className="flex items-center gap-3 mb-6 pb-4 border-b" style={{ borderColor: '#86ACD8' }}>
          <div
            className="flex items-center justify-center w-12 h-12 rounded-full"
            style={{
              background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
              border: '1px solid #A4BFFE7A',
              boxShadow: '-2px 11px 46.1px 0px #0000000D'
            }}
          >
            <SparklesIcon className="w-6 h-6" style={{ color: '#0F5FDC' }} />
          </div>
          <h3 className="text-xl lg:text-2xl font-bold" style={{ color: '#0E51A2' }}>Claim Summary</h3>
        </div>

        <div className="space-y-4">
          {/* Claim Type */}
          <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl border" style={{ borderColor: '#86ACD8' }}>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-full"
                style={{
                  background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                  border: '1px solid #A4BFFE7A'
                }}
              >
                <TagIcon className="w-5 h-5" style={{ color: '#0F5FDC' }} />
              </div>
              <span className="text-sm lg:text-base text-gray-700 font-medium">Claim Type</span>
            </div>
            <span className="text-sm lg:text-base font-semibold capitalize" style={{ color: '#0E51A2' }}>
              {formData.claimType.replace('-', ' ')}
            </span>
          </div>

          {/* Category */}
          <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl border" style={{ borderColor: '#86ACD8' }}>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-full"
                style={{
                  background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                  border: '1px solid #A4BFFE7A'
                }}
              >
                <TagIcon className="w-5 h-5" style={{ color: '#0F5FDC' }} />
              </div>
              <span className="text-sm lg:text-base text-gray-700 font-medium">Category</span>
            </div>
            <span className="text-sm lg:text-base font-semibold" style={{ color: '#0E51A2' }}>
              {availableCategories.find(c => c.categoryId === formData.category)?.name || 'Not selected'}
            </span>
          </div>

          {/* Billing Date */}
          <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl border" style={{ borderColor: '#86ACD8' }}>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-full"
                style={{
                  background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                  border: '1px solid #A4BFFE7A'
                }}
              >
                <CalendarIcon className="w-5 h-5" style={{ color: '#0F5FDC' }} />
              </div>
              <span className="text-sm lg:text-base text-gray-700 font-medium">Billing Date</span>
            </div>
            <span className="text-sm lg:text-base font-semibold" style={{ color: '#0E51A2' }}>
              {new Date(formData.treatmentDate).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>

          {/* Bill Amount */}
          <div className="rounded-xl p-5 lg:p-6 border-2 shadow-md" style={{
            background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
            borderColor: '#86ACD8'
          }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-12 h-12 rounded-full"
                  style={{
                    background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                    border: '1px solid #A4BFFE7A',
                    boxShadow: '-2px 11px 46.1px 0px #0000000D'
                  }}
                >
                  <CurrencyRupeeIcon className="w-6 h-6" style={{ color: '#0F5FDC' }} />
                </div>
                <span className="text-base lg:text-lg font-semibold" style={{ color: '#0E51A2' }}>Bill Amount</span>
              </div>
              <span className="text-2xl lg:text-3xl font-bold" style={{ color: '#0E51A2' }}>
                ₹{parseFloat(formData.billAmount || '0').toLocaleString()}
              </span>
            </div>
          </div>

          {/* Estimated Reimbursement */}
          {estimatedReimbursement > 0 && (
            <div className="rounded-xl p-5 lg:p-6 border-2 shadow-md" style={{
              background: 'linear-gradient(243.73deg, rgba(144, 234, 169, 0.15) -12.23%, rgba(95, 161, 113, 0.15) 94.15%)',
              borderColor: 'rgba(95, 161, 113, 0.3)'
            }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center w-12 h-12 rounded-full"
                    style={{
                      background: 'linear-gradient(163.02deg, #90EAA9 -37.71%, #5FA171 117.48%)',
                      border: '1px solid rgba(95, 161, 113, 0.3)',
                      boxShadow: '-2px 11px 46.1px 0px #0000000D'
                    }}
                  >
                    <CheckCircleIcon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-base lg:text-lg font-semibold" style={{ color: '#0E51A2' }}>Estimated Reimbursement</span>
                </div>
                <span className="text-2xl lg:text-3xl font-bold" style={{ color: '#0E51A2' }}>
                  ₹{estimatedReimbursement.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Documents */}
          <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl border" style={{ borderColor: '#86ACD8' }}>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-full"
                style={{
                  background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                  border: '1px solid #A4BFFE7A'
                }}
              >
                <DocumentCheckIcon className="w-5 h-5" style={{ color: '#0F5FDC' }} />
              </div>
              <span className="text-sm lg:text-base text-gray-700 font-medium">Documents</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5" style={{ color: '#5FA171' }} />
              <span className="text-sm lg:text-base font-semibold" style={{ color: '#0E51A2' }}>
                {totalDocuments} file{totalDocuments !== 1 ? 's' : ''} uploaded
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Terms Agreement */}
      <div className="rounded-2xl p-5 lg:p-6 border-2 shadow-md" style={{
        background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
        borderColor: '#86ACD8'
      }}>
        <div className="flex items-start gap-4">
          <div
            className="flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-full flex-shrink-0"
            style={{
              background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
              border: '1px solid #A4BFFE7A',
              boxShadow: '-2px 11px 46.1px 0px #0000000D'
            }}
          >
            <ShieldCheckIcon className="w-6 h-6 lg:w-7 lg:h-7" style={{ color: '#0F5FDC' }} />
          </div>
          <div>
            <p className="font-semibold text-base lg:text-lg mb-2" style={{ color: '#0E51A2' }}>Verification & Terms</p>
            <p className="text-sm lg:text-base text-gray-700 leading-relaxed">
              By submitting this claim, you confirm that all information provided is
              accurate and complete. False claims may result in policy termination.
            </p>
          </div>
        </div>
      </div>

      {/* Expected Processing Time */}
      <div className="flex items-center gap-4 p-5 lg:p-6 rounded-2xl border-2 shadow-md" style={{
        background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
        borderColor: '#86ACD8'
      }}>
        <div
          className="flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0"
          style={{
            background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
            border: '1px solid #A4BFFE7A',
            boxShadow: '-2px 11px 46.1px 0px #0000000D'
          }}
        >
          <ClockIcon className="w-6 h-6" style={{ color: '#0F5FDC' }} />
        </div>
        <div className="text-sm lg:text-base text-gray-700">
          <span className="font-semibold" style={{ color: '#0E51A2' }}>Expected processing time:</span>
          <span className="ml-2 font-semibold" style={{ color: '#0F5FDC' }}>3-5 business days</span>
        </div>
      </div>
    </div>
  )
}
