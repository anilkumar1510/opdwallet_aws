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
  corporate = 'Individual',
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
    <>
      {/* Mobile View - Responsive */}
      <Link
        href={href}
        className="lg:hidden flex-shrink-0 relative overflow-hidden transition-all duration-200 hover:scale-[1.02]"
        style={{
          width: 'calc(100vw - 60px)',
          maxWidth: '280px',
          minWidth: '220px',
          minHeight: '137px',
          borderRadius: '16px',
          background: 'linear-gradient(-3.81deg, rgba(228, 235, 254, 1) 0.81%, rgba(205, 220, 254, 1) 94.71%)',
          border: '1px solid rgba(164, 191, 254, 0.48)',
          boxShadow: '0px 4px 23.5px rgba(0, 0, 0, 0.05)',
          padding: '13px'
        }}
      >
        {/* User Info at Top */}
        <div className="flex items-center gap-2 mb-2">
          {/* User Icon */}
          <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 8C10.21 8 12 6.21 12 4C12 1.79 10.21 0 8 0C5.79 0 4 1.79 4 4C4 6.21 5.79 8 8 8ZM8 10C5.33 10 0 11.34 0 14V16H16V14C16 11.34 10.67 10 8 10Z" fill="#000000"/>
            </svg>
          </div>
          {/* User Name */}
          <span className="text-base font-medium leading-tight" style={{ color: '#000000', lineHeight: '1.2' }}>
            {policyHolder}
          </span>
        </div>

        {/* Horizontal Divider Line */}
        <div
          className="w-full mb-3"
          style={{
            height: '1px',
            background: 'rgba(164, 191, 254, 0.6)'
          }}
        />

        {/* Policy Content - Three Rows */}
        <div className="flex flex-col gap-2">
          {/* Policy Number Row */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-normal leading-none" style={{ color: '#3b3b3b' }}>
              Policy Number
            </span>
            <span className="text-xs font-semibold leading-none" style={{ color: '#3b3b3b' }}>
              {policyNumber}
            </span>
          </div>

          {/* Valid Till Row */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-normal leading-none" style={{ color: '#3b3b3b' }}>
              Valid Till
            </span>
            <span className="text-xs font-semibold leading-none" style={{ color: '#3b3b3b' }}>
              {formatDate(expiryDate)}
            </span>
          </div>

          {/* Corporate Row */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-normal leading-none" style={{ color: '#3b3b3b' }}>
              Corporate
            </span>
            <span className="text-xs font-semibold leading-none" style={{ color: '#3b3b3b' }}>
              {corporate}
            </span>
          </div>
        </div>
      </Link>

      {/* Desktop View - Original Design */}
      <Link
        href={href}
        className={`hidden lg:flex flex-shrink-0 lg:w-[340px] rounded-2xl p-6 transition-all duration-300 ${
          isActive
            ? 'opacity-100 scale-100'
            : 'opacity-60 scale-95'
        }`}
        style={{
          background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
          border: '1px solid #A4BFFE7A',
          boxShadow: '-2px 11px 46.1px 0px #0000000D'
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
    </>
  );
}
