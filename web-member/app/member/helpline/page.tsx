'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PhoneIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function HelplinePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-500 to-brand-600 text-white px-4 py-4 lg:px-6 lg:py-6">
        <div className="max-w-[480px] mx-auto lg:max-w-full">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white hover:text-gray-100 transition-colors mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <h1 className="text-xl lg:text-2xl font-bold">24/7 Helpline</h1>
        </div>
      </div>

      {/* Coming Soon Content */}
      <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-8 lg:py-12">
        <div className="bg-white rounded-2xl p-8 lg:p-12 text-center shadow-sm border-2 border-gray-100">
          {/* Icon */}
          <div className="w-20 h-20 lg:w-24 lg:h-24 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <PhoneIcon className="w-10 h-10 lg:w-12 lg:h-12 text-brand-600" />
          </div>

          {/* Coming Soon Message */}
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
            Coming Soon
          </h2>
          <p className="text-base lg:text-lg text-gray-600 mb-6 max-w-md mx-auto">
            We're working on bringing you 24/7 helpline support. This feature will be available soon!
          </p>

          {/* Additional Info */}
          <div className="bg-blue-50 rounded-xl p-4 lg:p-6 max-w-md mx-auto">
            <p className="text-sm lg:text-base text-gray-700">
              In the meantime, you can reach out to us through your corporate HR or email us at{' '}
              <a href="mailto:support@opdwallet.com" className="text-brand-600 font-semibold hover:underline">
                support@opdwallet.com
              </a>
            </p>
          </div>

          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mt-8 px-6 py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors active:scale-95"
          >
            Go Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
