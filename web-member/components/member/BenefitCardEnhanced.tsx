'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

interface BenefitCardEnhancedProps {
  benefitId: string;
  title: string;
  currentAmount: number;
  totalAmount: number;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export default function BenefitCardEnhanced({
  benefitId,
  title,
  currentAmount = 0,
  totalAmount = 0,
  href,
  icon: Icon,
}: BenefitCardEnhancedProps) {
  // Ensure values are numbers
  const current = Number(currentAmount) || 0;
  const total = Number(totalAmount) || 0;

  // Calculate available percentage
  const availablePercentage = total > 0 ? (current / total) * 100 : 0;

  // Calculate consumed amount for display
  const consumed = total - current;

  // Color-coded progress bars based on remaining balance
  const getProgressColor = () => {
    // Green: Lots of balance left (> 60%)
    // Orange: Medium balance left (30-60%)
    // Red: Low balance left (< 30%)
    if (availablePercentage > 60) {
      return '#16a34a'; // Darker green - plenty left
    } else if (availablePercentage > 30) {
      return '#f97316'; // Orange - medium left
    } else {
      return '#ef4444'; // Red - low balance left
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const amountLeft = current;

  return (
    <Link
      href={href}
      className="block bg-white border-2 border-gray-200 rounded-xl lg:rounded-2xl p-4 lg:p-5 transition-all duration-200 hover:shadow-md"
      style={{
        ['--hover-border-color' as any]: '#0F5FDC'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#0F5FDC'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = ''
      }}
    >
      {/* Title and Chevron */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base lg:text-lg font-semibold" style={{ color: '#0E51A2' }}>
          {title}
        </h3>
        <ChevronRightIcon className="w-5 h-5 lg:w-6 lg:h-6 text-gray-400 flex-shrink-0" />
      </div>

      {/* Amount Display */}
      <div className="mb-2 lg:mb-3">
        <span className="text-xl lg:text-2xl font-bold" style={{ color: '#303030' }}>
          ₹{formatCurrency(current)}
        </span>
        <span className="text-sm lg:text-base text-gray-400 ml-1">
          / ₹{formatCurrency(total)}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${Math.min(availablePercentage, 100)}%`,
              backgroundColor: getProgressColor()
            }}
          />
        </div>
      </div>

      {/* Amount Left */}
      <div className="text-sm lg:text-base font-medium" style={{ color: '#303030' }}>
        ₹{formatCurrency(amountLeft)} left
      </div>
    </Link>
  );
}
