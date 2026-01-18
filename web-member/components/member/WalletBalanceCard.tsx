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
    <div className="px-4 lg:px-6 max-w-[480px] mx-auto lg:max-w-full">
      <h2 className="text-lg lg:text-xl font-bold text-black mb-4 lg:mb-6">Your Wallet Balance</h2>

      {/* Mobile View - New Design */}
      <Link
        href="/member/transactions"
        className="lg:hidden block relative overflow-hidden rounded-2xl transition-all duration-300 active:scale-[0.98]"
        style={{
          background: 'linear-gradient(180deg, #5ca3fa 50.07%, #2266b6 154.04%)',
          height: '95px'
        }}
      >
        <div className="relative z-10 p-4">
          {/* Text Content */}
          <div className="relative">
            <p className="text-sm font-medium mb-1" style={{ color: '#f4f9ff' }}>
              Total Available Balance
            </p>

            <div className="flex items-center gap-0.5 mb-2">
              <span className="text-lg font-semibold text-white">
                ₹{formatCurrency(currentBalance)}
              </span>
              <span className="text-base" style={{ color: 'rgba(255, 255, 255, 0.63)' }}>
                /
              </span>
              <span className="text-sm" style={{ color: '#f4f9ff' }}>
                {formatCurrency(totalLimit)}
              </span>
            </div>

            <span
              className="absolute text-xs"
              style={{
                color: '#b1d2fc',
                top: '24px',
                left: '145px'
              }}
            >
              Avail. Bal.
            </span>

            <p className="text-xs mt-2" style={{ color: '#d4e4f7' }}>
              Your total usage cannot exceed this amount
            </p>
          </div>
        </div>

        {/* Wallet Illustration */}
        <div
          className="absolute z-0"
          style={{
            right: '-10px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '120px',
            height: '80px'
          }}
        >
          {/* Main wallet */}
          <img
            src="/images/wallet/wallet-main.svg"
            alt=""
            className="absolute"
            style={{
              width: '96.5px',
              height: '55.4px',
              right: '0',
              top: '50%',
              transform: 'translateY(-50%) rotate(180deg) scaleY(-1)'
            }}
          />

          {/* Sparkle 1 */}
          <img
            src="/images/wallet/sparkle-1.svg"
            alt=""
            className="absolute"
            style={{
              width: '14.67px',
              height: '14.66px',
              top: '15px',
              right: '45px',
              transform: 'rotate(212.34deg) scaleY(-1)'
            }}
          />

          {/* Sparkle 2 */}
          <img
            src="/images/wallet/sparkle-2.svg"
            alt=""
            className="absolute"
            style={{
              width: '10.92px',
              height: '10.92px',
              top: '8px',
              right: '55px',
              transform: 'rotate(212.34deg) scaleY(-1)'
            }}
          />

          {/* Sparkle 3 */}
          <img
            src="/images/wallet/sparkle-3.svg"
            alt=""
            className="absolute"
            style={{
              width: '8.78px',
              height: '8.77px',
              top: '12px',
              right: '70px',
              transform: 'rotate(212.34deg) scaleY(-1)'
            }}
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
