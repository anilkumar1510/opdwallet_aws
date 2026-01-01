'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface CTAButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'success' | 'danger'
  onClick?: () => void
  fullWidth?: boolean
  leftIcon?: React.ComponentType<{ className?: string }>
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  className?: string
}

export default function CTAButton({
  children,
  variant = 'primary',
  onClick,
  fullWidth = false,
  leftIcon: LeftIcon,
  disabled = false,
  type = 'button',
  className,
}: CTAButtonProps) {
  const variantStyles = {
    primary: {
      background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)',
    },
    success: {
      background: '#25A425',
    },
    danger: {
      background: '#E53535',
    },
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-6 py-3 lg:py-4 rounded-xl text-white text-sm lg:text-base font-semibold transition-shadow hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 break-words',
        fullWidth && 'w-full',
        className
      )}
      style={!disabled ? variantStyles[variant] : { background: '#9ca3af' }}
    >
      {LeftIcon && <LeftIcon className="h-5 w-5 lg:h-6 lg:w-6" />}
      {children}
    </button>
  )
}
