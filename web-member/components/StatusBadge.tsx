'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  size?: 'xs' | 'sm' | 'md'
  className?: string
}

export const StatusBadge = React.memo(function StatusBadge({
  status,
  size = 'sm',
  className
}: StatusBadgeProps) {
  const sizeClasses = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-1 text-sm',
    md: 'px-3 py-1.5 text-base'
  }

  const statusColors: Record<string, { bg: string; text: string; dot?: string }> = {
    active: { bg: 'bg-success-50', text: 'text-success-700', dot: 'bg-success-500' },
    approved: { bg: 'bg-success-50', text: 'text-success-700', dot: 'bg-success-500' },
    completed: { bg: 'bg-success-50', text: 'text-success-700', dot: 'bg-success-500' },
    pending: { bg: 'bg-warning-50', text: 'text-warning-700', dot: 'bg-warning-500' },
    processing: { bg: 'bg-brand-50', text: 'text-brand-700', dot: 'bg-brand-600' },
    upcoming: { bg: 'bg-brand-50', text: 'text-brand-700', dot: 'bg-brand-600' },
    rejected: { bg: 'bg-danger-50', text: 'text-danger-700', dot: 'bg-danger-500' },
    cancelled: { bg: 'bg-danger-50', text: 'text-danger-700', dot: 'bg-danger-500' },
    expired: { bg: 'bg-surface-alt', text: 'text-ink-500', dot: 'bg-ink-300' },
    inactive: { bg: 'bg-surface-alt', text: 'text-ink-500', dot: 'bg-ink-300' },
  }

  const colors = statusColors[status.toLowerCase()] || {
    bg: 'bg-surface-alt',
    text: 'text-ink-500',
    dot: 'bg-ink-300'
  }

  const statusIndicatorId = `status-${status.toLowerCase()}-${Math.random().toString(36).substring(2, 9)}`

  return (
    <>
      <span
        className={cn(
          'inline-flex items-center rounded-full font-medium transition-all duration-200 opacity-0 scale-75',
          sizeClasses[size],
          colors.bg,
          colors.text,
          className
        )}
        style={{ animation: 'scale-fade-in 0.2s cubic-bezier(0.4, 0.0, 0.2, 1) forwards' }}
        role="status"
        aria-label={`Status: ${status}`}
        aria-describedby={statusIndicatorId}
      >
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full mr-1.5',
            colors.dot
          )}
          aria-hidden="true"
        />
        {status}
      </span>
      <span id={statusIndicatorId} className="sr-only">
        Current status is {status}
      </span>
    </>
  )
})