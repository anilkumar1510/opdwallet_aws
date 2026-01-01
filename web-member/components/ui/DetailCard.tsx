'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface DetailCardProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  className?: string
}

export default function DetailCard({
  children,
  variant = 'primary',
  className,
}: DetailCardProps) {
  const variantStyles = {
    primary: {
      background: 'linear-gradient(169.98deg, #EFF4FF 19.71%, #FEF3E9 66.63%, #FEF3E9 108.92%)',
      border: '2px solid #F7DCAF',
    },
    secondary: {
      background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
      border: '2px solid #86ACD8',
    },
  }

  return (
    <div
      className={cn('rounded-xl p-4 lg:p-5', className)}
      style={variantStyles[variant]}
    >
      {children}
    </div>
  )
}
