'use client'

import { cn } from '@/lib/utils'

export function LoadingSpinner({
  size = 'md',
  className
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div className="flex items-center justify-center" role="status" aria-label="Loading">
      <div
        className={cn(
          'rounded-full border-2 border-brand-600/20 border-t-brand-600 animate-spin',
          sizeClasses[size],
          className
        )}
        aria-hidden="true"
      />
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-surface-alt">
      <div
        className="text-center opacity-0 translate-y-5 animate-fade-in"
        style={{ animation: 'slide-up-fade 0.3s ease-out forwards' }}
      >
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-ink-500" role="status" aria-live="polite">
          Loading your dashboard...
        </p>
      </div>
    </div>
  )
}