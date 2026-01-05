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
      className="flex flex-col bg-white transition-all duration-200 h-full"
      style={{
        border: '1.5px solid #0F5FDC',
        borderRadius: '16px',
        boxShadow: '0 1px 8px 0 rgba(3, 77, 162, 0.24)',
        minHeight: '123px',
        padding: '18px 11px 11px 11px'
      }}
    >
      {/* Title and Chevron */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-base font-semibold leading-tight flex-1 pr-2" style={{ color: '#034DA2', fontSize: '16px' }}>
          {title}
        </h3>
        <ChevronRightIcon className="w-[13.5px] h-[13.5px] flex-shrink-0" style={{ color: '#545454' }} />
      </div>

      {/* Amount Display */}
      <div style={{ marginBottom: '4px' }}>
        <span style={{ fontSize: '18px', fontWeight: 400, color: '#303030' }}>
          ₹{formatCurrency(current)}
        </span>
        <span style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.40)', marginLeft: '4px' }}>
          / ₹{formatCurrency(total)}
        </span>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '4px' }}>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#F6F6F6' }}>
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
      <div className="mt-auto" style={{ fontSize: '12px', fontWeight: 400, color: '#303030', lineHeight: '120%' }}>
        ₹{formatCurrency(amountLeft)} left
      </div>
    </Link>
  );
}
