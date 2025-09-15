import React from 'react'

interface ResponsiveWrapperProps {
  children: React.ReactNode
  className?: string
}

export const ResponsiveWrapper: React.FC<ResponsiveWrapperProps> = ({ children, className = '' }) => {
  return (
    <div className={`p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto overflow-x-hidden ${className}`}>
      {children}
    </div>
  )
}

export const ResponsiveGrid: React.FC<{
  children: React.ReactNode
  cols?: 1 | 2 | 3 | 4
  className?: string
}> = ({ children, cols = 3, className = '' }) => {
  const gridClass = {
    1: 'grid grid-cols-1 gap-4 sm:gap-6',
    2: 'grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6',
    3: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6',
    4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6'
  }

  return (
    <div className={`${gridClass[cols]} ${className}`}>
      {children}
    </div>
  )
}

export const ResponsiveTable: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          {children}
        </div>
      </div>
    </div>
  )
}

export const ResponsiveButtonGroup: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className = '' }) => {
  return (
    <div className={`flex flex-col sm:flex-row gap-2 sm:gap-3 ${className}`}>
      {children}
    </div>
  )
}

export const ResponsiveHeader: React.FC<{
  title: string
  subtitle?: string
  actions?: React.ReactNode
}> = ({ title, subtitle, actions }) => {
  return (
    <div className="mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm sm:text-base text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {actions && (
          <ResponsiveButtonGroup className="w-full sm:w-auto">
            {actions}
          </ResponsiveButtonGroup>
        )}
      </div>
    </div>
  )
}