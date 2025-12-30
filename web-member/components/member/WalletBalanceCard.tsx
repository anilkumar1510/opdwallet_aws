'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

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
      <Link
        href="/member/transactions"
        className="block bg-white border-2 border-surface-border rounded-xl lg:rounded-2xl p-4 lg:p-6 transition-all duration-300 hover:border-brand-300 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
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
            <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 text-brand-600" />
          </div>
        </div>
      </Link>
    </div>
  );
}
