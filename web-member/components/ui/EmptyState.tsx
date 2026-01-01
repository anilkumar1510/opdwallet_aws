'use client'

import React from 'react'

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  message: string
  ctaText?: string
  onCtaClick?: () => void
}

export default function EmptyState({
  icon: Icon,
  title,
  message,
  ctaText,
  onCtaClick,
}: EmptyStateProps) {
  return (
    <div
      className="rounded-xl p-8 lg:p-12 text-center overflow-hidden break-words"
      style={{
        background: 'linear-gradient(169.98deg, #EFF4FF 19.71%, #FEF3E9 66.63%, #FEF3E9 108.92%)',
        border: '2px solid #F7DCAF',
      }}
    >
      {/* Icon Circle */}
      <div className="flex justify-center mb-4 lg:mb-6">
        <div
          className="w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
            border: '1px solid #A4BFFE7A',
            boxShadow: '-2px 11px 46.1px 0px #0000000D',
          }}
        >
          <Icon className="h-8 w-8 lg:h-10 lg:w-10" style={{ color: '#0F5FDC' }} />
        </div>
      </div>

      {/* Title */}
      <h3
        className="text-lg lg:text-xl font-bold mb-2 break-words"
        style={{ color: '#0E51A2' }}
      >
        {title}
      </h3>

      {/* Message */}
      <p className="text-sm lg:text-base text-gray-600 mb-6 break-words">
        {message}
      </p>

      {/* Optional CTA Button */}
      {ctaText && onCtaClick && (
        <button
          onClick={onCtaClick}
          className="px-6 py-3 lg:py-4 rounded-xl text-white text-sm lg:text-base font-semibold hover:shadow-lg transition-shadow"
          style={{
            background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)',
          }}
        >
          {ctaText}
        </button>
      )}
    </div>
  )
}
