'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronLeftIcon, BeakerIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

export default function PharmacyPage() {
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
              <h1 className="text-lg lg:text-xl font-bold" style={{ color: '#0E51A2' }}>Pharmacy Services</h1>
              <p className="text-xs lg:text-sm text-gray-600">Order medicines and manage prescriptions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-8 lg:py-12">
        {/* Coming Soon Card */}
        <div className="rounded-2xl p-8 lg:p-12 text-center border-2 shadow-md mb-6" style={{
          background: 'linear-gradient(169.98deg, #EFF4FF 19.71%, #FEF3E9 66.63%, #FEF3E9 108.92%)',
          borderColor: '#F7DCAF'
        }}>
          {/* Icon */}
          <div
            className="w-20 h-20 lg:w-24 lg:h-24 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{
              background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
              border: '1px solid #A4BFFE7A',
              boxShadow: '-2px 11px 46.1px 0px #0000000D'
            }}
          >
            <BeakerIcon className="w-10 h-10 lg:w-12 lg:h-12" style={{ color: '#0F5FDC' }} />
          </div>

          {/* Coming Soon Badge */}
          <div className="inline-block px-6 py-2 rounded-full text-sm font-semibold mb-6 shadow-md text-white" style={{
            background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)'
          }}>
            Coming Soon!
          </div>

          {/* Title */}
          <h2 className="text-2xl lg:text-3xl font-bold mb-4" style={{ color: '#0E51A2' }}>
            Pharmacy Services
          </h2>

          {/* Description */}
          <p className="text-base lg:text-lg text-gray-700 mb-8 max-w-md mx-auto leading-relaxed">
            We're working hard to bring you convenient pharmacy services. Soon you'll be able to order medicines, manage prescriptions, and get doorstep delivery.
          </p>

          {/* Features */}
          <div
            className="rounded-xl p-6 lg:p-8 max-w-md mx-auto border-2 mb-8"
            style={{
              background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
              borderColor: '#86ACD8'
            }}
          >
            <p className="text-sm lg:text-base font-bold mb-4" style={{ color: '#0E51A2' }}>What to expect:</p>
            <div className="space-y-3 text-left">
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="w-5 h-5 lg:w-6 lg:h-6 flex-shrink-0 mt-0.5" style={{ color: '#5FA171' }} />
                <span className="text-sm lg:text-base text-gray-900">Medicine ordering and tracking</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="w-5 h-5 lg:w-6 lg:h-6 flex-shrink-0 mt-0.5" style={{ color: '#5FA171' }} />
                <span className="text-sm lg:text-base text-gray-900">Easy prescription upload</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="w-5 h-5 lg:w-6 lg:h-6 flex-shrink-0 mt-0.5" style={{ color: '#5FA171' }} />
                <span className="text-sm lg:text-base text-gray-900">Fast home delivery service</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="w-5 h-5 lg:w-6 lg:h-6 flex-shrink-0 mt-0.5" style={{ color: '#5FA171' }} />
                <span className="text-sm lg:text-base text-gray-900">Insurance coverage support</span>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <Link href="/member">
            <button
              className="px-8 py-3 lg:px-10 lg:py-4 text-white rounded-xl font-semibold transition-all hover:shadow-lg active:scale-95"
              style={{ background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)' }}
            >
              Back to Dashboard
            </button>
          </Link>
        </div>

        {/* Additional Info */}
        <div
          className="rounded-xl p-5 lg:p-6 border-2 shadow-sm text-center"
          style={{
            background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
            borderColor: '#86ACD8'
          }}
        >
          <p className="text-sm lg:text-base text-gray-700">
            Have questions? Contact our support team at{' '}
            <a href="mailto:support@opdwallet.com" className="font-semibold hover:underline" style={{ color: '#0F5FDC' }}>
              support@opdwallet.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
