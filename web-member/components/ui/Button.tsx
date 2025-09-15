'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from '../LoadingSpinner'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

export const Button = React.memo(React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({
    children,
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    disabled,
    type = 'button',
    ...props
  }, ref) {
    const baseClasses = 'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transform'

    const variants = {
      primary: 'bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-600 shadow-sm',
      secondary: 'bg-surface-alt text-ink-900 hover:bg-ink-100 focus:ring-ink-500 border border-surface-border',
      outline: 'border border-brand-600 text-brand-600 hover:bg-brand-50 focus:ring-brand-600',
      ghost: 'text-ink-700 hover:bg-surface-alt focus:ring-ink-500',
      danger: 'bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-600 shadow-sm'
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm min-h-[32px]',
      md: 'px-4 py-2 text-base min-h-[40px]',
      lg: 'px-6 py-3 text-lg min-h-[48px]'
    }

    const isDisabled = disabled || loading
    const buttonId = React.useId()

    const buttonContent = (
      <>
        {loading ? (
          <LoadingSpinner size="sm" className="mr-2" />
        ) : (
          leftIcon && <span className="mr-2" aria-hidden="true">{leftIcon}</span>
        )}

        <span>{children}</span>

        {rightIcon && !loading && (
          <span className="ml-2" aria-hidden="true">{rightIcon}</span>
        )}

        {loading && (
          <span className="sr-only">Loading...</span>
        )}
      </>
    )

    // CSS transitions handle the animations now, no need for separate animate prop logic

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={isDisabled}
        type={type}
        aria-disabled={isDisabled}
        aria-describedby={loading ? `${buttonId}-loading` : undefined}
        {...props}
      >
        {buttonContent}
        {loading && (
          <span
            id={`${buttonId}-loading`}
            className="sr-only"
            aria-live="polite"
          >
            Please wait, processing your request
          </span>
        )}
      </button>
    )
  }
))

// Icon Button variant
export const IconButton = React.memo(React.forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, 'leftIcon' | 'rightIcon'> & { icon: React.ReactNode; label: string }
>(function IconButton({
  icon,
  label,
  className,
  size = 'md',
  variant = 'ghost',
  ...props
}, ref) {
  const sizes = {
    sm: 'w-8 h-8 p-1',
    md: 'w-10 h-10 p-2',
    lg: 'w-12 h-12 p-3'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  return (
    <Button
      ref={ref}
      className={cn(
        'rounded-full',
        sizes[size],
        className
      )}
      variant={variant}
      aria-label={label}
      title={label}
      {...props}
    >
      <span className={iconSizes[size]} aria-hidden="true">
        {icon}
      </span>
      <span className="sr-only">{label}</span>
    </Button>
  )
}))

// Button Group component for related actions
export function ButtonGroup({
  children,
  orientation = 'horizontal',
  className
}: {
  children: React.ReactNode
  orientation?: 'horizontal' | 'vertical'
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex',
        orientation === 'horizontal' ? 'flex-row space-x-2' : 'flex-col space-y-2',
        className
      )}
      role="group"
      aria-label="Button group"
    >
      {children}
    </div>
  )
}