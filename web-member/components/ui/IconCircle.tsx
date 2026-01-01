'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface IconCircleProps {
  icon: React.ComponentType<{ className?: string }>
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function IconCircle({
  icon: Icon,
  size = 'md',
  className,
}: IconCircleProps) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12 lg:w-14 lg:h-14',
    lg: 'w-16 h-16 lg:w-20 lg:h-20',
  }

  const iconSizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6 lg:h-7 lg:w-7',
    lg: 'h-8 w-8 lg:h-10 lg:w-10',
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center',
        sizeClasses[size],
        className
      )}
      style={{
        background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
        border: '1px solid #A4BFFE7A',
        boxShadow: '-2px 11px 46.1px 0px #0000000D',
      }}
    >
      <Icon className={iconSizeClasses[size]} style={{ color: '#0F5FDC' }} />
    </div>
  )
}
