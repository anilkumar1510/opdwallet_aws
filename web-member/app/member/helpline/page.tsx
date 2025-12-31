'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PhoneIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function HelplinePage() {
  const router = useRouter();

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
              <h1 className="text-lg lg:text-xl font-bold" style={{ color: '#0E51A2' }}>24/7 Helpline</h1>
              <p className="text-xs lg:text-sm text-gray-600">Get support anytime you need</p>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Content */}
      <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-8 lg:py-12">
        <div className="rounded-2xl p-8 lg:p-12 text-center border-2 shadow-md" style={{
          background: 'linear-gradient(169.98deg, #EFF4FF 19.71%, #FEF3E9 66.63%, #FEF3E9 108.92%)',
          borderColor: '#86ACD8'
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
            <PhoneIcon className="w-10 h-10 lg:w-12 lg:h-12" style={{ color: '#0F5FDC' }} />
          </div>

          {/* Coming Soon Message */}
          <h2 className="text-2xl lg:text-3xl font-bold mb-4" style={{ color: '#0E51A2' }}>
            Coming Soon
          </h2>
          <p className="text-base lg:text-lg text-gray-700 mb-6 max-w-md mx-auto">
            We're working on bringing you 24/7 helpline support. This feature will be available soon!
          </p>

          {/* Additional Info */}
          <div
            className="rounded-xl p-4 lg:p-6 max-w-md mx-auto mb-8 border-2"
            style={{
              background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
              borderColor: '#86ACD8'
            }}
          >
            <p className="text-sm lg:text-base text-gray-900">
              In the meantime, you can reach out to us through your corporate HR or email us at{' '}
              <a href="mailto:support@opdwallet.com" className="font-semibold hover:underline" style={{ color: '#0F5FDC' }}>
                support@opdwallet.com
              </a>
            </p>
          </div>

          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="px-6 py-3 text-white rounded-xl font-semibold transition-all hover:shadow-lg active:scale-95"
            style={{ background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)' }}
          >
            Go Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
