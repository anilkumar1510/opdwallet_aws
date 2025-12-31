'use client'

import { SparklesIcon, ChevronLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function WellnessPage() {
  return (
    <div className="min-h-screen" style={{ background: '#f7f7fc' }}>
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm" style={{ borderColor: '#e5e7eb' }}>
        <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/member">
              <button className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                <ChevronLeftIcon className="h-6 w-6" style={{ color: '#0E51A2' }} />
              </button>
            </Link>
            <div className="flex-1">
              <h1 className="text-lg lg:text-xl font-bold" style={{ color: '#0E51A2' }}>Wellness Services</h1>
              <p className="text-xs lg:text-sm text-gray-600">Access wellness and preventive care services</p>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Card */}
      <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-8 lg:py-12">
        <div className="rounded-2xl p-8 lg:p-12 text-center border-2 shadow-md" style={{
          background: 'linear-gradient(169.98deg, #EFF4FF 19.71%, #FEF3E9 66.63%, #FEF3E9 108.92%)',
          borderColor: '#86ACD8'
        }}>
          {/* Icon */}
          <div
            className="w-20 h-20 lg:w-24 lg:h-24 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{
              background: 'linear-gradient(163.02deg, #90EAA9 -37.71%, #5FA171 117.48%)',
              border: '1px solid rgba(95, 161, 113, 0.3)',
              boxShadow: '-2px 11px 46.1px 0px #0000000D'
            }}
          >
            <SparklesIcon className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
          </div>

          {/* Coming Soon Message */}
          <h2 className="text-2xl lg:text-3xl font-bold mb-4" style={{ color: '#0E51A2' }}>
            Coming Soon
          </h2>
          <p className="text-base lg:text-lg text-gray-700 mb-6 max-w-md mx-auto">
            Wellness services are currently being set up. You'll be able to access wellness and preventive care benefits here soon.
          </p>

          {/* Additional Info */}
          <div
            className="rounded-xl p-4 lg:p-6 max-w-md mx-auto border-2"
            style={{
              background: 'linear-gradient(243.73deg, rgba(144, 234, 169, 0.15) -12.23%, rgba(95, 161, 113, 0.15) 94.15%)',
              borderColor: 'rgba(95, 161, 113, 0.3)'
            }}
          >
            <p className="text-sm lg:text-base text-gray-900">
              <strong className="font-bold" style={{ color: '#0E51A2' }}>What to expect:</strong> Access wellness programs, preventive care services, and health screenings.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
