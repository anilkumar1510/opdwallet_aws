'use client';

import React from 'react';
import Link from 'next/link';

interface WalletBalanceCardProps {
  currentBalance: number;
  totalLimit: number;
}

export default function WalletBalanceCard({
  currentBalance,
  totalLimit,
}: WalletBalanceCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="px-5 lg:px-6 max-w-[480px] mx-auto lg:max-w-full">
      {/* Desktop only header */}
      <h2 className="hidden lg:block text-xl font-bold text-black mb-6">Your Wallet Balance</h2>

      {/* Mobile View - Figma Design */}
      <Link
        href="/member/transactions"
        className="lg:hidden block relative overflow-hidden transition-all duration-300 active:scale-[0.98] w-full"
        style={{
          background: 'linear-gradient(180deg, #5CA3FA 0%, #2266B6 100%)',
          minHeight: '95px',
          borderRadius: '16px'
        }}
      >
        <div className="relative z-10 p-[15px]">
          {/* Text Content */}
          <div className="relative">
            {/* Title */}
            <p
              className="text-[14px] font-medium"
              style={{
                color: '#FFFFFF',
                fontFamily: 'SF Pro Display, system-ui, sans-serif',
                lineHeight: '120%'
              }}
            >
              Total Available Balance
            </p>

            {/* Balance Row */}
            <div className="flex items-center gap-[2px] mt-[2px]">
              <span
                className="text-[18px] font-semibold text-white"
                style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
              >
                ₹{formatCurrency(currentBalance)}
              </span>
              <span
                className="text-[16px]"
                style={{
                  color: 'rgba(255, 255, 255, 0.63)',
                  fontFamily: 'SF Pro Display, system-ui, sans-serif'
                }}
              >
                /
              </span>
              <span
                className="text-[14px]"
                style={{
                  color: '#FFFFFF',
                  fontFamily: 'SF Pro Display, system-ui, sans-serif',
                  lineHeight: '120%'
                }}
              >
                {formatCurrency(totalLimit)}
              </span>
              <span
                className="text-[12px] ml-[2px]"
                style={{
                  color: '#B1D2FC',
                  fontFamily: 'SF Pro Display, system-ui, sans-serif'
                }}
              >
                Left
              </span>
            </div>

            {/* Subtitle */}
            <p
              className="text-[12px] mt-[8px] whitespace-nowrap"
              style={{
                color: '#B1D2FC',
                fontFamily: 'SF Pro Display, system-ui, sans-serif',
                lineHeight: '120%'
              }}
            >
              Your total usage cannot exceed this amount
            </p>
          </div>
        </div>

        {/* Wallet Illustration from Figma */}
        <div
          className="absolute"
          style={{
            right: '15px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '80px',
            height: '70px',
            zIndex: 1
          }}
        >
          <img
            src="/images/icons/wallet-illustration.svg"
            alt="Wallet"
            width={80}
            height={70}
            className="object-contain opacity-90"
          />
        </div>
      </Link>

      {/* Desktop View - Original Design */}
      <Link
        href="/member/transactions"
        className="hidden lg:block bg-white border-2 border-surface-border rounded-xl lg:rounded-2xl p-4 lg:p-6 transition-all duration-300 hover:border-brand-300 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
      >
        <div className="flex items-center justify-between gap-4">
          {/* Left Section */}
          <div className="flex-1">
            {/* Label */}
            <div className="text-xs lg:text-sm text-ink-500 mb-2">Total Available Balance</div>

            {/* Amount Display */}
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-lg lg:text-2xl font-bold text-brand-600">₹</span>
              <span className="text-2xl lg:text-3xl font-bold text-brand-600">
                {formatCurrency(currentBalance)}
              </span>
              <span className="text-sm lg:text-base text-ink-500">/ {formatCurrency(totalLimit)}</span>
            </div>

            {/* Subtitle */}
            <p className="text-xs lg:text-sm text-ink-500">
              Your total usage cannot exceed this amount
            </p>
          </div>

          {/* Right Section - Arrow */}
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 lg:w-6 lg:h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Link>
    </div>
  );
}
