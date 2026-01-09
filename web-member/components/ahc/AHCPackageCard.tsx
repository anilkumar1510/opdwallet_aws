'use client'

import { SparklesIcon, BeakerIcon, CheckCircleIcon, CalendarIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

interface AHCPackage {
  _id: string
  packageId: string
  name: string
  effectiveFrom: string
  effectiveTo: string
  labServices: Array<{
    _id: string
    name: string
    code: string
    category?: string
  }>
  diagnosticServices: Array<{
    _id: string
    name: string
    code: string
    category?: string
  }>
  totalLabTests: number
  totalDiagnosticTests: number
  totalTests: number
}

interface AHCPackageCardProps {
  package: AHCPackage
  canBook: boolean
  lastBooking?: {
    orderId: string
    bookedAt: string
  }
  onBookClick: () => void
}

export function AHCPackageCard({ package: pkg, canBook, lastBooking, onBookClick }: AHCPackageCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="rounded-2xl overflow-hidden border-2 shadow-lg" style={{
      background: 'linear-gradient(169.98deg, #EFF4FF 19.71%, #FEF3E9 66.63%, #FEF3E9 108.92%)',
      borderColor: '#86ACD8'
    }}>
      {/* Header */}
      <div className="p-6 lg:p-8" style={{ background: 'linear-gradient(163.02deg, #90EAA9 -37.71%, #5FA171 117.48%)' }}>
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            <SparklesIcon className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl lg:text-2xl font-bold text-white mb-1">{pkg.name}</h2>
            <p className="text-sm text-white/90">Annual Health Check Package</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 lg:p-8 space-y-6">
        {/* Package Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Total Tests */}
          <div className="rounded-xl p-4 border-2" style={{
            background: 'linear-gradient(243.73deg, rgba(144, 234, 169, 0.15) -12.23%, rgba(95, 161, 113, 0.15) 94.15%)',
            borderColor: 'rgba(95, 161, 113, 0.3)'
          }}>
            <div className="flex items-center gap-3">
              <BeakerIcon className="w-6 h-6" style={{ color: '#5FA171' }} />
              <div>
                <div className="text-2xl font-bold" style={{ color: '#0E51A2' }}>{pkg.totalTests}</div>
                <div className="text-sm text-gray-600">Total Tests</div>
              </div>
            </div>
          </div>

          {/* Validity */}
          <div className="rounded-xl p-4 border-2" style={{
            background: 'linear-gradient(243.73deg, rgba(14, 81, 162, 0.1) -12.23%, rgba(14, 81, 162, 0.05) 94.15%)',
            borderColor: 'rgba(14, 81, 162, 0.2)'
          }}>
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-6 h-6" style={{ color: '#0E51A2' }} />
              <div>
                <div className="text-xs font-medium text-gray-600">Valid Until</div>
                <div className="text-sm font-semibold" style={{ color: '#0E51A2' }}>
                  {formatDate(pkg.effectiveTo)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Test Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Lab Tests */}
          {pkg.totalLabTests > 0 && (
            <div className="rounded-xl p-4 bg-white border border-gray-200">
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#0E51A2' }}>
                Lab Tests ({pkg.totalLabTests})
              </h3>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {pkg.labServices.slice(0, 5).map((service) => (
                  <div key={service._id} className="flex items-start gap-2 text-xs text-gray-700">
                    <CheckCircleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#5FA171' }} />
                    <span>{service.name}</span>
                  </div>
                ))}
                {pkg.labServices.length > 5 && (
                  <div className="text-xs text-gray-500 italic">
                    +{pkg.labServices.length - 5} more tests
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Diagnostic Tests */}
          {pkg.totalDiagnosticTests > 0 && (
            <div className="rounded-xl p-4 bg-white border border-gray-200">
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#0E51A2' }}>
                Diagnostic Tests ({pkg.totalDiagnosticTests})
              </h3>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {pkg.diagnosticServices.slice(0, 5).map((service) => (
                  <div key={service._id} className="flex items-start gap-2 text-xs text-gray-700">
                    <CheckCircleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#5FA171' }} />
                    <span>{service.name}</span>
                  </div>
                ))}
                {pkg.diagnosticServices.length > 5 && (
                  <div className="text-xs text-gray-500 italic">
                    +{pkg.diagnosticServices.length - 5} more tests
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Warning if already booked */}
        {!canBook && lastBooking && (
          <div className="rounded-xl p-4 border-2" style={{
            background: 'linear-gradient(243.73deg, rgba(255, 193, 7, 0.1) -12.23%, rgba(255, 152, 0, 0.1) 94.15%)',
            borderColor: 'rgba(255, 193, 7, 0.3)'
          }}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Already Booked This Year
                </p>
                <p className="text-xs text-gray-600 mb-2">
                  You have already booked your annual health check for this policy year.
                </p>
                <Link
                  href={`/member/bookings?tab=ahc`}
                  className="text-xs font-medium hover:underline"
                  style={{ color: '#0E51A2' }}
                >
                  View Your Booking →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Book Button */}
        <button
          onClick={onBookClick}
          disabled={!canBook}
          className="w-full py-3 px-6 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: canBook
              ? 'linear-gradient(163.02deg, #90EAA9 -37.71%, #5FA171 117.48%)'
              : '#9CA3AF',
            boxShadow: canBook ? '-2px 11px 46.1px 0px #0000000D' : 'none'
          }}
        >
          {canBook ? 'Book Your Annual Health Check Today' : 'Cannot Book - Already Booked This Year'}
        </button>

        {/* Info Note */}
        <div className="text-xs text-center text-gray-600">
          <p>
            This package can be booked <strong>once per policy year</strong>.
            {canBook && ' Book now to avail your wellness benefit!'}
          </p>
        </div>
      </div>
    </div>
  )
}
