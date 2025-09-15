'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  noPadding?: boolean
  hover?: boolean
  clickable?: boolean
  loading?: boolean
  as?: 'div' | 'article' | 'section'
}

export const Card = React.memo(function Card({
  title,
  subtitle,
  actions,
  children,
  className,
  noPadding = false,
  hover = false,
  clickable = false,
  loading = false,
  as: Component = 'div',
  ...props
}: CardProps) {
  const cardId = React.useId()

  if (loading) {
    return (
      <div
        className={cn(
          "bg-surface rounded-2xl border border-surface-border animate-pulse",
          className
        )}
        role="region"
        aria-label="Loading content"
      >
        <div className="px-6 py-4 border-b border-surface-border">
          <div className="h-4 bg-surface-border rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-surface-border rounded w-1/2"></div>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            <div className="h-4 bg-surface-border rounded w-full"></div>
            <div className="h-4 bg-surface-border rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  const CardElement = Component as any

  return (
    <CardElement
      className={cn(
        "bg-surface rounded-2xl border border-surface-border transition-all duration-200",
        hover && "hover:shadow-soft hover:scale-[1.02]",
        clickable && "cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 active:scale-[0.98]",
        className
      )}
      role={clickable ? "button" : Component === 'article' ? 'article' : 'region'}
      tabIndex={clickable ? 0 : undefined}
      aria-labelledby={title ? `${cardId}-title` : undefined}
      aria-describedby={subtitle ? `${cardId}-subtitle` : undefined}
      onKeyDown={clickable ? (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          if (props.onClick) {
            props.onClick(e as any)
          }
        }
      } : undefined}
      {...props}
    >
      {(title || subtitle || actions) && (
        <div className="px-6 py-4 border-b border-surface-border">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h3
                  id={`${cardId}-title`}
                  className="text-base font-semibold text-ink-900"
                >
                  {title}
                </h3>
              )}
              {subtitle && (
                <p
                  id={`${cardId}-subtitle`}
                  className="text-sm text-ink-500 mt-1"
                >
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2" role="group" aria-label="Card actions">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}
      <div className={cn(!noPadding && "p-6")}>
        {children}
      </div>
    </CardElement>
  )
})