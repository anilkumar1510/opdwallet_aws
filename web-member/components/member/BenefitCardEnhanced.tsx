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
  isHighlighted?: boolean; // For first card blue border
}

export default function BenefitCardEnhanced({
  benefitId,
  title,
  currentAmount = 0,
  totalAmount = 0,
  href,
  icon: Icon,
  isHighlighted = false,
}: BenefitCardEnhancedProps) {
  // Ensure values are numbers
  const current = Number(currentAmount) || 0;
  const total = Number(totalAmount) || 0;

  // Calculate available percentage
  const availablePercentage = total > 0 ? (current / total) * 100 : 0;

  // Color-coded progress bars based on remaining balance
  const getProgressColor = () => {
    if (availablePercentage > 60) {
      return '#16a34a'; // Green - plenty left
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

  // Format total in short form (e.g., 20000 -> 20k)
  const formatShortCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `${(amount / 100000).toFixed(0)}L`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}k`;
    }
    return amount.toString();
  };

  const amountLeft = current;

  return (
    <>
      {/* Mobile View - Figma Design */}
      <Link
        href={href}
        className="lg:hidden flex flex-col justify-between overflow-hidden transition-all duration-200 border border-[rgba(217,217,217,0.48)] active:border-[#0366de] w-full p-[9px] pb-[10px]"
        style={{
          minHeight: '78px',
          borderRadius: '16px',
          boxShadow: '-2px 11px 46.1px 0px rgba(0, 0, 0, 0.08)',
          backgroundColor: '#ffffff'
        }}
      >
        {/* Benefit Name */}
        <span
          className="text-[14px] sm:text-[16px] font-normal leading-tight"
          style={{ color: '#034da2', fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
        >
          {title}
        </span>

        {/* Balance Info Row */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-baseline flex-wrap">
            <span className="text-[14px] sm:text-[16px] font-medium" style={{ color: '#0a3f93', fontFamily: 'SF Pro Display, system-ui, sans-serif' }}>
              ₹{formatCurrency(current)}
            </span>
            <span className="text-[14px] sm:text-[16px] font-normal ml-1" style={{ color: '#444444', fontFamily: 'SF Pro Display, system-ui, sans-serif' }}>
              /
            </span>
            <span className="text-[11px] sm:text-[12px] font-normal" style={{ color: '#444444', fontFamily: 'SF Pro Display, system-ui, sans-serif' }}>
              {formatShortCurrency(total)}
            </span>
            <span className="text-[12px] sm:text-[14px] font-normal ml-1" style={{ color: 'rgba(0, 0, 0, 0.4)', fontFamily: 'SF Pro Display, system-ui, sans-serif' }}>
              Left
            </span>
          </div>

          {/* Arrow Button */}
          <div
            className="w-[24px] h-[24px] sm:w-[27px] sm:h-[27px] rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: '#f6f6f6' }}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 2.5L9.5 7L5 11.5" stroke="#545454" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </Link>

      {/* Desktop View - Original Design */}
      <Link
        href={href}
        className="hidden lg:flex flex-col bg-white transition-all duration-200 h-full group"
        style={{
          border: '1.5px solid #E5E7EB',
          borderRadius: '16px',
          boxShadow: '0 1px 8px 0 rgba(3, 77, 162, 0.24)',
          minHeight: '123px',
          padding: '18px 11px 11px 11px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.border = '1.5px solid #0F5FDC'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.border = '1.5px solid #E5E7EB'
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
    </>
  );
}
