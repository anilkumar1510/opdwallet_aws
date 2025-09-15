'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'shimmer' | 'pulse'
  width?: string | number
  height?: string | number
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

export function Skeleton({
  className,
  variant = 'shimmer',
  width,
  height,
  rounded = 'md',
  style,
  ...props
}: SkeletonProps) {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full'
  }

  const baseStyles: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    ...style
  }

  if (variant === 'shimmer') {
    return (
      <div
        className={cn(
          'bg-gradient-to-r from-surface-alt via-surface-border to-surface-alt bg-[length:200%_100%] animate-shimmer',
          roundedClasses[rounded],
          className
        )}
        style={baseStyles}
        {...props}
      />
    )
  }

  if (variant === 'pulse') {
    return (
      <div
        className={cn(
          'bg-surface-border animate-pulse',
          roundedClasses[rounded],
          className
        )}
        style={baseStyles}
        {...props}
      />
    )
  }

  return (
    <div
      className={cn(
        'bg-surface-border',
        roundedClasses[rounded],
        className
      )}
      style={baseStyles}
      {...props}
    />
  )
}

// Preset skeleton components for common use cases

export function SkeletonText({
  lines = 1,
  className,
  ...props
}: { lines?: number } & Omit<SkeletonProps, 'height'>) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={16}
          width={index === lines - 1 && lines > 1 ? '70%' : '100%'}
          {...props}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({
  showAvatar = false,
  showActions = false,
  className,
  ...props
}: {
  showAvatar?: boolean
  showActions?: boolean
} & SkeletonProps) {
  return (
    <div className={cn('p-6 bg-surface rounded-2xl border border-surface-border', className)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {showAvatar && (
            <Skeleton
              width={40}
              height={40}
              rounded="full"
              {...props}
            />
          )}
          <div className="space-y-2">
            <Skeleton width={120} height={16} {...props} />
            <Skeleton width={80} height={14} {...props} />
          </div>
        </div>
        {showActions && (
          <Skeleton width={24} height={24} rounded="sm" {...props} />
        )}
      </div>
      <div className="space-y-3">
        <SkeletonText lines={3} {...props} />
      </div>
    </div>
  )
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
  ...props
}: {
  rows?: number
  columns?: number
} & SkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex space-x-4 p-4 bg-surface-alt rounded-lg">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton
            key={index}
            height={16}
            width={`${100 / columns}%`}
            {...props}
          />
        ))}
      </div>

      {/* Rows */}
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex space-x-4 p-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                height={16}
                width={`${100 / columns}%`}
                {...props}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonList({
  items = 5,
  showAvatar = true,
  className,
  ...props
}: {
  items?: number
  showAvatar?: boolean
} & SkeletonProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3">
          {showAvatar && (
            <Skeleton
              width={32}
              height={32}
              rounded="full"
              {...props}
            />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton width="60%" height={16} {...props} />
            <Skeleton width="40%" height={14} {...props} />
          </div>
          <Skeleton width={60} height={32} rounded="lg" {...props} />
        </div>
      ))}
    </div>
  )
}

export function SkeletonChart({
  type = 'bar',
  className,
  ...props
}: {
  type?: 'bar' | 'line' | 'pie'
} & SkeletonProps) {
  if (type === 'pie') {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <Skeleton
          width={200}
          height={200}
          rounded="full"
          {...props}
        />
      </div>
    )
  }

  if (type === 'line') {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-end space-x-2 h-48">
          {Array.from({ length: 12 }).map((_, index) => (
            <Skeleton
              key={index}
              width={24}
              height={Math.random() * 120 + 40}
              className="flex-1"
              {...props}
            />
          ))}
        </div>
        <div className="flex justify-between">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} width={32} height={12} {...props} />
          ))}
        </div>
      </div>
    )
  }

  // Default bar chart
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-end space-x-2 h-48">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton
            key={index}
            width="100%"
            height={Math.random() * 160 + 40}
            className="flex-1"
            {...props}
          />
        ))}
      </div>
      <div className="flex justify-between">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} width={48} height={12} {...props} />
        ))}
      </div>
    </div>
  )
}

// Loading state wrapper component
export function SkeletonWrapper({
  isLoading,
  skeleton,
  children
}: {
  isLoading: boolean
  skeleton: React.ReactNode
  children: React.ReactNode
}) {
  return isLoading ? <>{skeleton}</> : <>{children}</>
}