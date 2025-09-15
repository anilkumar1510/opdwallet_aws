import React from 'react'

interface CardProps {
  title?: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  actions?: React.ReactNode
}

export function Card({ title, subtitle, children, className = '', actions }: CardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
      {(title || subtitle || actions) && (
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
              {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </div>
            {actions && <div>{actions}</div>}
          </div>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  )
}

export function CardGrid({ children, columns = 3 }: { children: React.ReactNode, columns?: number }) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[columns] || 'grid-cols-1 md:grid-cols-3'

  return (
    <div className={`grid ${gridCols} gap-4`}>
      {children}
    </div>
  )
}