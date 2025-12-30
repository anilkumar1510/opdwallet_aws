'use client';

import React from 'react';
import Link from 'next/link';
import { UserIcon } from '@heroicons/react/24/outline';

interface PolicyCardEnhancedProps {
  policyId: string;
  policyNumber: string;
  policyHolder: string;
  age?: number;
  corporate?: string;
  coverageAmount: number;
  expiryDate: string;
  isActive?: boolean;
  href: string;
}

export default function PolicyCardEnhanced({
  policyId,
  policyNumber,
  policyHolder,
  age,
  corporate = 'N/A',
  coverageAmount,
  expiryDate,
  isActive = false,
  href,
}: PolicyCardEnhancedProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Link
      href={href}
      className={`flex-shrink-0 min-w-[320px] lg:w-[340px] border-2 border-blue-300 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg ${
        isActive
          ? 'opacity-100 scale-100 shadow-md'
          : 'opacity-60 scale-95'
      }`}
      style={{
        background: 'linear-gradient(135deg, #D4E4F7 0%, #B8D4F1 100%)',
      }}
    >
      {/* Top Section: User Icon + Name + Age */}
      <div className="flex items-start gap-4 mb-6">
        {/* User Icon */}
        <div className="flex-shrink-0 w-16 h-16 bg-white rounded-full flex items-center justify-center">
          <UserIcon className="w-8 h-8 text-brand-600" />
        </div>

        {/* Name and Age */}
        <div className="flex-1 pt-1">
          <h3 className="text-lg font-bold text-brand-600 mb-1">
            {policyHolder}
          </h3>
          {age && (
            <p className="text-sm text-gray-600">
              Age: {age} years
            </p>
          )}
        </div>
      </div>

      {/* Data Rows */}
      <div className="space-y-3">
        {/* Policy Number Row */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Policy Number</span>
          <span className="text-sm font-semibold text-brand-600">{policyNumber}</span>
        </div>

        {/* Valid Till Row */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Valid Till</span>
          <span className="text-sm font-semibold text-brand-600">{formatDate(expiryDate)}</span>
        </div>

        {/* Corporate Row */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Corporate</span>
          <span className="text-sm font-semibold text-brand-600">{corporate}</span>
        </div>
      </div>
    </Link>
  );
}
