'use client'

import React from 'react'

interface SwitchProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
  id?: string
}

export function Switch({
  checked = false,
  onCheckedChange,
  disabled = false,
  className = '',
  id
}: SwitchProps) {
  const handleClick = () => {
    if (!disabled && onCheckedChange) {
      onCheckedChange(!checked)
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-state={checked ? 'checked' : 'unchecked'}
      disabled={disabled}
      id={id}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full
        transition-colors focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-offset-2 focus-visible:ring-green-500
        disabled:cursor-not-allowed disabled:opacity-50
        ${checked ? 'bg-green-600' : 'bg-gray-200'}
        ${className}
      `}
      onClick={handleClick}
    >
      <span
        className={`
          ${checked ? 'translate-x-6' : 'translate-x-1'}
          inline-block h-4 w-4 transform rounded-full
          bg-white transition-transform
        `}
      />
    </button>
  )
}